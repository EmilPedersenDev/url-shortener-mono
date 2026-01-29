export const handler = async (
  event: any,
): Promise<{ statusCode: number; body: string }> => {
  console.log("Original URL:", event.body.originalUrl);
  return {
    statusCode: 200,
    body: JSON.stringify({ shortUrl: generateShortUrl(event.body.url) }),
  };
};

function generateShortUrl(originalUrl: string) {
  return `http://localhost:3000/${Math.random().toString(36).substring(2, 7)}`;
}
