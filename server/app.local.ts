import express from "express";
import cors from "cors";
import { handler as createShortUrlHandler } from "./src/handlers/create-short-url";
import { handler as getShortUrlHandler } from "./src/handlers/get-short-url";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const api = express.Router();

api.post("/", async (req, res) => {
  try {
    const { originalUrl } = req.body;
    const response = await createShortUrlHandler({ body: { originalUrl } });
    if (response.statusCode !== 200) {
      throw new Error("Failed to create short URL");
    }
    res.status(response.statusCode).json(JSON.parse(response.body));
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      statusCode: 500,
    });
  }
});

api.get("/:hash", async (req, res) => {
  try {
    const { hash } = req.params;
    const response = await getShortUrlHandler({ body: { hash } });
    if (response.statusCode !== 302) {
      throw new Error("Original URL not found");
    }
    const { originalUrl } = JSON.parse(response.body);
    res.set(response.headers);
    res.redirect(response.statusCode, originalUrl);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      statusCode: 500,
    });
  }
});

app.use("/api", api);

app.listen(8080, () => {
  console.log("Server is running on port 3000");
});
