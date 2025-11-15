import express from "express";
import cors from "cors";
import { createApiRouter } from "./routes";
import { SessionWorkflow } from "./workflows/sessionWorkflow";
import { logger } from "./config/logger";
import { env } from "./config/env";

export const createApp = (workflow: SessionWorkflow) => {
  const app = express();
  const allowedOrigins = env.CORS_ORIGIN.split(",").map((entry) => entry.trim());
  app.use(
    cors({
      origin: allowedOrigins.includes("*") ? true : allowedOrigins,
      credentials: false
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      logger.info("HTTP request", {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - start
      });
    });
    next();
  });

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api", createApiRouter(workflow));

  app.use((req, res) => {
    logger.warn("Unhandled route", { path: req.originalUrl });
    res.status(404).json({ error: "Not Found" });
  });

  app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error("Request failed", { error: error.message });
    res.status(400).json({ error: error.message });
  });

  return app;
};
