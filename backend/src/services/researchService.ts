import puppeteer, { Browser } from "puppeteer";
import { logger } from "../config/logger";
import { LlmService } from "./llmService";
import { ResearchDocumentMetadata, ResearchQueryPlan, SessionState } from "../domain/types";
import { StorageService } from "./storageService";
import { randomUUID } from "crypto";

export class ResearchService {
  private browser: Browser | undefined;

  constructor(
    private readonly llm: LlmService,
    private readonly storage: StorageService
  ) {}

  async getQueryPlan(session: SessionState): Promise<ResearchQueryPlan[]> {
    const scopeDescription = session.scope
      ? `${session.scope.topic} with depth ${session.scope.depthLevel}`
      : session.id;
    const plan = await this.llm.planResearchQueries(scopeDescription);
    logger.info("Generated research plan", {
      sessionId: session.id,
      totalQueries: plan.length
    });
    return plan;
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({ headless: true });
    }
    return this.browser!;
  }

  async captureQueryResult(plan: ResearchQueryPlan, url: string): Promise<ResearchDocumentMetadata> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    logger.info("Capturing research page", { url, plan });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const content = await page.content();

    const metadata: ResearchDocumentMetadata = {
      id: randomUUID(),
      url,
      sourceQuery: plan.query,
      capturedAt: new Date().toISOString(),
      tags: plan.expectedArtifacts,
      storagePath: ""
    };

    await this.storage.persistResearchArtifact(metadata, content);

    await page.close();
    return metadata;
  }

  async shutdownBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
    }
  }
}
