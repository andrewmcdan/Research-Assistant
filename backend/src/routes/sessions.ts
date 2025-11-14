import { Router } from "express";
import { z } from "zod";
import { SessionWorkflow } from "../workflows/sessionWorkflow";

const topicSchema = z.object({
  topic: z.string().min(3)
});

const scopeSchema = z.object({
  topic: z.string().min(3),
  depthLevel: z.enum(["overview", "intermediate", "expert"]),
  breadth: z.array(z.string()).default([]),
  optionalFlags: z.record(z.string(), z.boolean()).default({})
});

export const createSessionRouter = (workflow: SessionWorkflow) => {
  const router = Router();

  router.post("/", async (req, res, next) => {
    try {
      const { topic } = topicSchema.parse(req.body);
      const session = await workflow.createSession(topic);
      res.json(session);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:sessionId/scope", async (req, res, next) => {
    try {
      const scope = scopeSchema.parse(req.body);
      const session = await workflow.setScope(req.params.sessionId, scope);
      res.json(session);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:sessionId/research-plan", async (req, res, next) => {
    try {
      const plan = await workflow.buildResearchPlan(req.params.sessionId);
      res.json(plan);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
