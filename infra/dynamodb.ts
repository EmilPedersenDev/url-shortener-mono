import * as aws from "@pulumi/aws";

const urlTable = new aws.dynamodb.Table("url", {
  name: "url",
  billingMode: "PAY_PER_REQUEST",
  hashKey: "hash",
  attributes: [
    { name: "hash", type: "S" },
    { name: "originalUrl", type: "S" },
    { name: "createdAt", type: "S" },
  ],
  globalSecondaryIndexes: [
    {
      name: "originalUrl",
      hashKey: "originalUrl",
      projectionType: "ALL",
    },
  ],
});

export { urlTable };
