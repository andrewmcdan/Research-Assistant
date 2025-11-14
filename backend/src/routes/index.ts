import { Router } from "express";
import { SessionWorkflow } from "../workflows/sessionWorkflow";
import { createSessionRouter } from "./sessions";
import { createResearchRouter } from "./research";
import { createWritingRouter } from "./writing";

export const createApiRouter = (workflow: SessionWorkflow) => {
  const router = Router();
  router.use("/sessions", createSessionRouter(workflow));
  router.use("/sessions", createResearchRouter(workflow));
  router.use("/sessions", createWritingRouter(workflow));
  return router;
};
