import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface LambdasInput {
  roleArn: pulumi.Output<string>;
  code: pulumi.asset.Archive;
  /** DynamoDB table name (e.g. "url"). */
  tableName: pulumi.Output<string>;
  /** Base URL for short links (e.g. https://api-id.execute-api.region.amazonaws.com/api). */
  domain: pulumi.Output<string> | string;
}

export function createLambdas(input: LambdasInput) {
  const environment = {
    variables: {
      TABLE_NAME: input.tableName,
      DOMAIN: typeof input.domain === "string" ? input.domain : input.domain,
    },
  };

  const createShortUrlLambda = new aws.lambda.Function("create-short-url", {
    runtime: aws.lambda.Runtime.NodeJS20dX,
    handler: "src/handlers/create-short-url.handler",
    role: input.roleArn,
    code: input.code,
    environment,
  });

  const getShortUrlLambda = new aws.lambda.Function("get-short-url", {
    runtime: aws.lambda.Runtime.NodeJS20dX,
    handler: "src/handlers/get-short-url.handler",
    role: input.roleArn,
    code: input.code,
    environment,
  });

  return { createShortUrlLambda, getShortUrlLambda };
}
