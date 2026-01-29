export const handler = async (
  event: any,
): Promise<{ statusCode: number; body: string }> => {
  return {
    statusCode: 302,
    body: JSON.stringify({ originalUrl: "https://www.google.com" }),
  };
};
