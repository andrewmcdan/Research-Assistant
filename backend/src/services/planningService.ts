import { ChatMessageInput, ClarifyingQuestion, OutlineNode, UserScopeConfig } from "../domain/types";
import { LlmService } from "./llmService";

export class PlanningService {
  constructor(private readonly llm: LlmService) {}

  async createClarifyingQuestions(topic: string): Promise<ClarifyingQuestion[]> {
    return this.llm.generateClarifyingQuestions(topic);
  }

  async createOutline(topic: string, scope: UserScopeConfig): Promise<OutlineNode[]> {
    return this.llm.createOutline(topic, scope);
  }

  async deriveScopeFromConversation(
    topic: string,
    messages: ChatMessageInput[]
  ): Promise<UserScopeConfig> {
    return this.llm.deriveScopeFromConversation(topic, messages);
  }
}
