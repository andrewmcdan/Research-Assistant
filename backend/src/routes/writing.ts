import { Router } from "express";
import { z } from "zod";
import { SessionWorkflow } from "../workflows/sessionWorkflow";

const researchMetadataSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  sourceQuery: z.string(),
  capturedAt: z.string(),
  tags: z.array(z.string()).default([]),
  storagePath: z.string().optional().default("")
});

const writeSectionSchema = z.object({
  sectionId: z.string(),
  sectionTitle: z.string(),
  outlinePath: z.array(z.string()).nonempty(),
  supportingResearch: z.array(researchMetadataSchema).default([])
});

export const createWritingRouter = (workflow: SessionWorkflow) => {
  const router = Router({ mergeParams: true });

  router.post("/:sessionId/sections", async (req, res, next) => {
    try {
      const payload = writeSectionSchema.parse(req.body);
      const job = await workflow.queueSectionDraft(req.params.sessionId, payload);
      res.status(202).json(job);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:sessionId/sections", (req, res, next) => {
    try {
      const jobs = workflow.listSectionDrafts(req.params.sessionId);
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
