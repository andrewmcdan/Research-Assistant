import { randomUUID } from "crypto";
import { SectionDraftJob, SectionWriteRequest } from "../domain/types";
import { WritingService } from "./writingService";
import { logger } from "../config/logger";

export class SectionDraftService {
  private jobs = new Map<string, SectionDraftJob[]>();

  constructor(private readonly writingService: WritingService) {}

  getJobs(sessionId: string): SectionDraftJob[] {
    return this.jobs.get(sessionId) ?? [];
  }

  queueJob(sessionId: string, request: SectionWriteRequest): SectionDraftJob {
    const job: SectionDraftJob = {
      id: randomUUID(),
      sessionId,
      request,
      status: "queued",
      requestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const list = this.jobs.get(sessionId) ?? [];
    list.unshift(job);
    this.jobs.set(sessionId, list);

    setImmediate(() => this.runJob(job));
    return job;
  }

  private async runJob(job: SectionDraftJob): Promise<void> {
    job.status = "in_progress";
    job.updatedAt = new Date().toISOString();

    try {
      const outputPath = await this.writingService.writeSection(job.request);
      job.status = "completed";
      job.outputPath = outputPath;
    } catch (error) {
      job.status = "failed";
      job.error = error instanceof Error ? error.message : "Unknown error";
      logger.error("Section draft failed", { error: job.error, sectionId: job.request.sectionId });
    } finally {
      job.updatedAt = new Date().toISOString();
    }
  }
}
