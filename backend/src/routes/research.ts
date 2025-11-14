import { Router } from "express";
import { z } from "zod";
import { SessionWorkflow } from "../workflows/sessionWorkflow";

const planSchema = z.object({
  query: z.string(),
  rationale: z.string(),
  priority: z.number().int().min(1),
  expectedArtifacts: z.array(z.enum(["article", "paper", "statistic", "manual"]))
});

const captureSchema = z.object({
  url: z.string().url(),
  plan: planSchema
});

export const createResearchRouter = (workflow: SessionWorkflow) => {
  const router = Router({ mergeParams: true });

  router.post("/:sessionId/research", async (req, res, next) => {
    try {
      const payload = captureSchema.parse(req.body);
      const metadata = await workflow.captureResearchArtifact(
        req.params.sessionId,
        payload.url,
        payload.plan
      );
      res.status(201).json(metadata);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
