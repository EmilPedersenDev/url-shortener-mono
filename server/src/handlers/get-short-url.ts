import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

interface ShortUrlRequest {
  hash: string;
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

const validateBody = (body: ShortUrlRequest): never | true => {
  if (typeof body.hash !== "string") {
    throw new Error("Hash must be a string");
  }
  return true;
};

const getOriginalUrl = async (hash: string): Promise<string> => {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { hash },
  });
  const result = await docClient.send(command);
  if (!result.Item?.originalUrl) {
    throw new Error("Original URL not found");
  }
  return result.Item?.originalUrl as string;
};

export const handler = async (
  event: any,
): Promise<{
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}> => {
  try {
    validateBody(event.body);
    const { hash } = event.body;
    const originalUrl = await getOriginalUrl(hash);
    return {
      statusCode: 302,
      body: JSON.stringify({ originalUrl: originalUrl }),
      headers: {
        "Cache-Control": "public, max-age=31536000", // 1 year
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Original URL not found" }),
    };
  }
};
