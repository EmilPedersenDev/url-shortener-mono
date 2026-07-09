import * as crypto from "crypto";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

interface ShortUrlRequest {
  originalUrl: string;
}

interface ShortUrl {
  hash: string;
  originalUrl: string;
  createdAt: string;
}

const TABLE_NAME = process.env.TABLE_NAME ?? "url";

let client: DynamoDBClient;

if (process.env.NODE_ENV === "development") {
  client = new DynamoDBClient({
    endpoint: "http://localhost:8000",
  });
} else {
  client = new DynamoDBClient();
}

const docClient = DynamoDBDocumentClient.from(client);

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

const validateBody = (body: any): ShortUrl => {
  if (typeof body.originalUrl !== "string" && !isValidUrl(body.originalUrl)) {
    throw new Error("Original URL must be a string");
  }
  return body;
};

const generateHash = (originalUrl: string): string => {
  return crypto
    .createHash("sha256")
    .update(originalUrl)
    .digest("hex")
    .substring(0, 6);
};

const shortUrlExists = async (
  originalUrl: string,
): Promise<ShortUrl | undefined> => {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: "originalUrl",
    KeyConditionExpression: "originalUrl = :url",
    ExpressionAttributeValues: {
      ":url": { S: originalUrl },
    },
  });

  const result = await docClient.send(command);
  return result.Items?.[0] as ShortUrl | undefined;
};

const createShortUrlRecord = async (originalUrl: string): Promise<ShortUrl> => {
  const existingShortUrl = await shortUrlExists(originalUrl);
  if (existingShortUrl) {
    return existingShortUrl;
  }
  const shortUrlRecord: ShortUrl = {
    hash: generateHash(originalUrl),
    originalUrl: originalUrl,
    createdAt: new Date().toISOString(),
  };
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: shortUrlRecord,
  });
  await docClient.send(command);
  return shortUrlRecord;
};

const generateShortUrl = (hash: string): string => {
  return `${process.env.DOMAIN}/${hash}`;
};

export const handler = async (
  event: any,
): Promise<{ statusCode: number; body: string }> => {
  try {
    validateBody(event.body);
    const { originalUrl } = event.body;
    const shortUrlRecord = await createShortUrlRecord(originalUrl);
    return {
      statusCode: 200,
      body: JSON.stringify({ shortUrl: generateShortUrl(shortUrlRecord.hash) }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Invalid body" }),
    };
  }
};
