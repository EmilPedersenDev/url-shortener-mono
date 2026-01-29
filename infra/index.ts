import * as path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Path to the server's compiled Lambda handlers (run `npm run build -w @url-shortener/server` first)
const serverDistPath = path.join(__dirname, "..", "server", "dist");
const lambdaCode = new pulumi.asset.FileArchive(serverDistPath);

// IAM role for Lambda execution (logs + optional future DynamoDB etc.)
const lambdaRole = new aws.iam.Role("lambda-role", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Principal: { Service: "lambda.amazonaws.com" },
        Effect: "Allow",
      },
    ],
  }),
});

new aws.iam.RolePolicyAttachment("lambda-basic", {
  role: lambdaRole.name,
  policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
});

// Lambda: create short URL (e.g. POST /shorten)
const createShortUrlLambda = new aws.lambda.Function("create-short-url", {
  runtime: aws.lambda.Runtime.NodeJS20dX,
  handler: "src/handlers/create-short-url.handler",
  role: lambdaRole.arn,
  code: lambdaCode,
});

// Lambda: get short URL / redirect (e.g. GET /{id})
const getShortUrlLambda = new aws.lambda.Function("get-short-url", {
  runtime: aws.lambda.Runtime.NodeJS20dX,
  handler: "src/handlers/get-short-url.handler",
  role: lambdaRole.arn,
  code: lambdaCode,
});

// API Gateway REST API
const api = new aws.apigatewayv2.Api("url-shortener-api", {
  protocolType: "HTTP",
  name: "url-shortener-api",
});

const createShortUrlIntegration = new aws.apigatewayv2.Integration(
  "create-short-url-integration",
  {
    apiId: api.id,
    integrationType: "AWS_PROXY",
    integrationUri: createShortUrlLambda.invokeArn,
    payloadFormatVersion: "2.0",
  },
);

const getShortUrlIntegration = new aws.apigatewayv2.Integration(
  "get-short-url-integration",
  {
    apiId: api.id,
    integrationType: "AWS_PROXY",
    integrationUri: getShortUrlLambda.invokeArn,
    payloadFormatVersion: "2.0",
  },
);

// POST /shorten -> create-short-url
const createRoute = new aws.apigatewayv2.Route("create-route", {
  apiId: api.id,
  routeKey: "POST /",
  target: pulumi.interpolate`integrations/${createShortUrlIntegration.id}`,
});

// GET /{proxy+} -> get-short-url (e.g. GET /abc123)
const getRoute = new aws.apigatewayv2.Route("get-route", {
  apiId: api.id,
  routeKey: "GET /{proxy+}",
  target: pulumi.interpolate`integrations/${getShortUrlIntegration.id}`,
});

const defaultStage = new aws.apigatewayv2.Stage("default", {
  apiId: api.id,
  name: "$default",
  autoDeploy: true,
});

// Grant API Gateway permission to invoke the Lambdas
new aws.lambda.Permission("create-short-url-apigw", {
  action: "lambda:InvokeFunction",
  function: createShortUrlLambda.name,
  principal: "apigateway.amazonaws.com",
  sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
});

new aws.lambda.Permission("get-short-url-apigw", {
  action: "lambda:InvokeFunction",
  function: getShortUrlLambda.name,
  principal: "apigateway.amazonaws.com",
  sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
});

// Exports
export const createShortUrlLambdaArn = createShortUrlLambda.arn;
export const getShortUrlLambdaArn = getShortUrlLambda.arn;
export const apiEndpoint = pulumi.interpolate`${api.apiEndpoint}`;
export const shortenUrl = pulumi.interpolate`${api.apiEndpoint}/shorten`;
