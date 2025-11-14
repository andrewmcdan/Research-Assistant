import { PlanningService } from "../services/planningService";
import { SessionService } from "../services/sessionService";
import { StorageService } from "../services/storageService";
import { ResearchService } from "../services/researchService";
import { WritingService } from "../services/writingService";
import {
  SessionState,
  UserScopeConfig,
  SectionWriteRequest,
  ResearchQueryPlan,
  ResearchDocumentMetadata
} from "../domain/types";

export class SessionWorkflow {
  constructor(
    private readonly sessionService: SessionService,
    private readonly planningService: PlanningService,
    private readonly researchService: ResearchService,
    private readonly writingService: WritingService,
    private readonly storageService: StorageService
  ) {}

  async createSession(topic: string): Promise<SessionState> {
    const session = this.sessionService.createSession(topic);
    const questions = await this.planningService.createClarifyingQuestions(topic);
    this.sessionService.setClarifyingQuestions(session.id, questions);
    return this.sessionService.getSession(session.id)!;
  }

  async setScope(sessionId: string, scope: UserScopeConfig): Promise<SessionState> {
    const updated = this.sessionService.setScope(sessionId, scope);
    const outline = await this.planningService.createOutline(scope.topic, scope);
    this.sessionService.setOutline(sessionId, outline);
    await this.storageService.persistOutline(sessionId, outline);
    await this.storageService.persistSession(this.sessionService.getSession(sessionId)!);
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
    return this.researchService.getQueryPlan(session);
  }

  async captureResearchArtifact(
    sessionId: string,
    url: string,
    plan: ResearchQueryPlan
  ): Promise<ResearchDocumentMetadata> {
    this.getSession(sessionId);
    return this.researchService.captureQueryResult(plan, url);
  }

  async writeSectionFromSession(
    sessionId: string,
    request: Omit<SectionWriteRequest, "scope">
  ): Promise<void> {
    const session = this.sessionService.getSession(sessionId);
    if (!session?.scope) {
      throw new Error("Session scope missing");
    }
    await this.writingService.writeSection({
      ...request,
      scope: session.scope
    });
  }
}
