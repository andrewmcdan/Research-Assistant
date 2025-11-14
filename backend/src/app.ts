import express from "express";
import { createApiRouter } from "./routes";
import { SessionWorkflow } from "./workflows/sessionWorkflow";
import { logger } from "./config/logger";

export const createApp = (workflow: SessionWorkflow) => {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api", createApiRouter(workflow));

  app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error("Request failed", { error: error.message });
    res.status(400).json({ error: error.message });
  });

  return app;
};
