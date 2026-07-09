import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

/** Creates the HTTP API and default stage (no routes). Use this first so you can pass api.apiEndpoint to Lambdas. */
export function createApi() {
  const api = new aws.apigatewayv2.Api("url-shortener-api", {
    protocolType: "HTTP",
    name: "url-shortener-api",
  });
  new aws.apigatewayv2.Stage("default", {
    apiId: api.id,
    name: "$default",
    autoDeploy: true,
  });
  return { api };
}

export interface ApiGatewayRoutesInput {
  api: aws.apigatewayv2.Api;
  createShortUrlLambda: aws.lambda.Function;
  getShortUrlLambda: aws.lambda.Function;
}

export function createApiGatewayRoutes(input: ApiGatewayRoutesInput) {
  const { api } = input;

  const createShortUrlIntegration = new aws.apigatewayv2.Integration(
    "create-short-url-integration",
    {
      apiId: api.id,
      integrationType: "AWS_PROXY",
      integrationUri: input.createShortUrlLambda.invokeArn,
      payloadFormatVersion: "2.0",
    },
  );

  const getShortUrlIntegration = new aws.apigatewayv2.Integration(
    "get-short-url-integration",
    {
      apiId: api.id,
      integrationType: "AWS_PROXY",
      integrationUri: input.getShortUrlLambda.invokeArn,
      payloadFormatVersion: "2.0",
    },
  );

  new aws.apigatewayv2.Route("create-route", {
    apiId: api.id,
    routeKey: "POST /api",
    target: pulumi.interpolate`integrations/${createShortUrlIntegration.id}`,
  });

  new aws.apigatewayv2.Route("get-route", {
    apiId: api.id,
    routeKey: "GET /api/{proxy+}",
    target: pulumi.interpolate`integrations/${getShortUrlIntegration.id}`,
  });

  new aws.lambda.Permission("create-short-url-apigw", {
    action: "lambda:InvokeFunction",
    function: input.createShortUrlLambda.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
  });

  new aws.lambda.Permission("get-short-url-apigw", {
    action: "lambda:InvokeFunction",
    function: input.getShortUrlLambda.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
  });
}
