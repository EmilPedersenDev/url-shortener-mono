import * as path from "path";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { lambdaRole } from "./iam";
import { createLambdas } from "./lambdas";
import { createApi, createApiGatewayRoutes } from "./apiGateway";
import { urlTable } from "./dynamodb";
import { createStaticSite } from "./staticSite";

// Paths (run from infra directory; build server first: npm run build -w @url-shortener/server)
const serverDistPath = path.join(__dirname, "..", "server", "dist");
const clientPath = path.join(__dirname, "..", "client");

const lambdaCode = new pulumi.asset.FileArchive(serverDistPath);

// API + stage first so we can pass endpoint to Lambdas as DOMAIN
const { api } = createApi();

// Lambda role needs DynamoDB access to the url table
const dynamoPolicy = urlTable.arn.apply((arn) =>
  JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:ConditionCheckItem",
        ],
        Resource: [arn, `${arn}/index/*`],
      },
    ],
  }),
);
new aws.iam.RolePolicy("lambda-dynamodb", {
  role: lambdaRole.name,
  policy: dynamoPolicy,
});

const { createShortUrlLambda, getShortUrlLambda } = createLambdas({
  roleArn: lambdaRole.arn,
  code: lambdaCode,
  tableName: urlTable.name,
  domain: pulumi.interpolate`${api.apiEndpoint}/api`,
});

createApiGatewayRoutes({
  api,
  createShortUrlLambda,
  getShortUrlLambda,
});

const staticSite = createStaticSite({ clientPath });

// Re-export all stack outputs
export const createShortUrlLambdaArn = createShortUrlLambda.arn;
export const getShortUrlLambdaArn = getShortUrlLambda.arn;
export const apiEndpoint = pulumi.interpolate`${api.apiEndpoint}`;
export const shortenUrl = pulumi.interpolate`${api.apiEndpoint}/api`;

export const cloudFrontUrl = staticSite.cloudFrontUrl;
export const distributionId = staticSite.distributionId;
export const bucketName = staticSite.bucketName;
