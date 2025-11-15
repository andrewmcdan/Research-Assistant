import { PlanningService } from "../services/planningService";
import { SessionService } from "../services/sessionService";
import { StorageService } from "../services/storageService";
import { ResearchService } from "../services/researchService";
import {
  SessionState,
  UserScopeConfig,
  SectionWriteRequest,
  ResearchQueryPlan,
  ResearchDocumentMetadata,
  SectionDraftJob,
  ChatMessageInput
} from "../domain/types";
import { SectionDraftService } from "../services/sectionDraftService";
import { logger } from "../config/logger";

export class SessionWorkflow {
  constructor(
    private readonly sessionService: SessionService,
    private readonly planningService: PlanningService,
    private readonly researchService: ResearchService,
    private readonly storageService: StorageService,
    private readonly sectionDraftService: SectionDraftService
  ) {}

  async createSession(topic: string): Promise<SessionState> {
    const session = this.sessionService.createSession(topic);
    const questions = await this.planningService.createClarifyingQuestions(topic);
    this.sessionService.setClarifyingQuestions(session.id, questions);
    logger.info("Session created", { sessionId: session.id, topic });
    return this.sessionService.getSession(session.id)!;
  }

  async setScope(sessionId: string, scope: UserScopeConfig): Promise<SessionState> {
    const updated = this.sessionService.setScope(sessionId, scope);
    const outline = await this.planningService.createOutline(scope.topic, scope);
    this.sessionService.setOutline(sessionId, outline);
    await this.storageService.persistOutline(sessionId, outline);
    await this.storageService.persistSession(this.sessionService.getSession(sessionId)!);
    logger.info("Scope captured", {
      sessionId,
      depthLevel: scope.depthLevel,
      breadthCount: scope.breadth.length
    });
    return this.sessionService.getSession(sessionId)!;
  }

  getSession(sessionId: string): SessionState {
    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    return session;
  }

  async buildResearchPlan(sessionId: string) {
    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    logger.info("Building research plan", { sessionId });
    return this.researchService.getQueryPlan(session);
  }

  async captureResearchArtifact(
    sessionId: string,
    url: string,
    plan: ResearchQueryPlan
  ): Promise<ResearchDocumentMetadata> {
    this.getSession(sessionId);
    logger.info("Capturing research artifact", { sessionId, url, query: plan.query });
    return this.researchService.captureQueryResult(plan, url);
  }

  async queueSectionDraft(
    sessionId: string,
    request: Omit<SectionWriteRequest, "scope">
  ): Promise<SectionDraftJob> {
    const session = this.sessionService.getSession(sessionId);
    if (!session?.scope) {
      throw new Error("Session scope missing");
    }
    logger.info("Queueing section draft", {
      sessionId,
      sectionId: request.sectionId,
      researchRefs: request.supportingResearch.length
    });
    return this.sectionDraftService.queueJob(sessionId, {
      ...request,
      scope: session.scope
    });
  }

  listSectionDrafts(sessionId: string): SectionDraftJob[] {
    this.getSession(sessionId);
    const jobs = this.sectionDraftService.getJobs(sessionId);
    logger.info("Listing section drafts", { sessionId, jobCount: jobs.length });
    return jobs;
  }

  async deriveScopeFromConversation(
    sessionId: string,
    messages: ChatMessageInput[]
  ): Promise<SessionState> {
    const session = this.getSession(sessionId);
    const topic = session.topic ?? session.scope?.topic ?? "General topic";
    const scope = await this.planningService.deriveScopeFromConversation(topic, messages);
    scope.topic = topic;
    return this.setScope(sessionId, scope);
  }
}
