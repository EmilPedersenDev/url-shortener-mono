import express from "express";
import cors from "cors";
import { handler as createShortUrlHandler } from "./src/handlers/create-short-url";
import { handler as getShortUrlHandler } from "./src/handlers/get-short-url";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.post("/", async (req, res) => {
  const { originalUrl } = req.body;
  const response = await createShortUrlHandler({ body: { originalUrl } });
  res.status(response.statusCode).json(JSON.parse(response.body));
});

app.get("/:hash", async (req, res) => {
  const { hash } = req.params;
  const response = await getShortUrlHandler({ body: { hash } });
  const { originalUrl } = JSON.parse(response.body);
  res.redirect(response.statusCode, originalUrl);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
