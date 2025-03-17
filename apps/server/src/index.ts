import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import { createApp } from "./create-app";
import "reflect-metadata";

async function createExpressApp() {
  const app = await createApp();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.use(async (_req, _res, next) => {
    if (process.env.NODE_ENV === "prod") {
      app.use(express.static(path.join(__dirname, "../../dist/client")));
      app.get("/*", (_req1, res1) => {
        res1.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
        res1.sendFile(path.resolve(__dirname, "../../dist/client", "index.html"));
      });
    }
    next();
  });
  const PORT = process.env.PORT;

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

createExpressApp();
