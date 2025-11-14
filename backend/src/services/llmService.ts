import OpenAI from "openai";
import { env } from "../config/env";
import {
  ClarifyingQuestion,
  OutlineNode,
  ResearchQueryPlan,
  SectionWriteRequest,
  UserScopeConfig
} from "../domain/types";
import { logger } from "../config/logger";

export class LlmService {
  private client?: OpenAI;

  constructor() {
    if (env.OPENAI_API_KEY) {
      this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    } else {
      logger.warn("OPENAI_API_KEY is not set. Falling back to mock responses.");
    }
  }

  private async callModel(prompt: string): Promise<string> {
    if (!this.client) {
      return `MOCK_RESPONSE::${prompt.slice(0, 24)}`;
    }

    const response = await this.client.responses.create({
      model: env.MODEL_NAME,
      input: prompt,
      temperature: 0.2
    });

    return response.output_text?.[0] ?? "";
  }

  async generateClarifyingQuestions(topic: string): Promise<ClarifyingQuestion[]> {
    if (!this.client) {
      return [
        {
          id: "scope",
          prompt: `What is the desired scope for "${topic}"?`,
          type: "breadth",
          options: [
            `Cover the entire ${topic} lifecycle`,
            "Limit to planning and setup",
            "Focus on day-to-day operations"
          ]
        },
        {
          id: "depth",
          prompt: "How technical should the manual be?",
          type: "depth",
          options: ["Overview", "Intermediate", "Expert step-by-step"]
        }
      ];
    }

    const raw = await this.callModel(
      `Generate JSON with clarifying questions to scope a guide about ${topic}.`
    );
    try {
      return JSON.parse(raw) as ClarifyingQuestion[];
    } catch (error) {
      logger.error("Failed to parse clarifying question response", { error });
      return [];
    }
  }

  async planResearchQueries(scopeDescription: string): Promise<ResearchQueryPlan[]> {
    if (!this.client) {
      return [
        {
          query: `${scopeDescription} best practices`,
          rationale: "Baseline orientation research",
          priority: 1,
          expectedArtifacts: ["article", "manual"]
        },
        {
          query: `${scopeDescription} troubleshooting`,
          rationale: "Collect failure modes and diagnostics",
          priority: 2,
          expectedArtifacts: ["article", "statistic"]
        }
      ];
    }

    const raw = await this.callModel(
      `Produce JSON array of {query,rationale,priority,expectedArtifacts[]} for ${scopeDescription}.`
    );
    try {
      return JSON.parse(raw) as ResearchQueryPlan[];
    } catch (error) {
      logger.error("Failed to parse research plan response", { error });
      return [];
    }
  }

  async createOutline(topic: string, scope: UserScopeConfig): Promise<OutlineNode[]> {
    if (!this.client) {
      return [
        {
          id: "introduction",
          title: `Introduction to ${topic}`
        },
        {
          id: "planning",
          title: "Planning the work",
          children: [
            { id: "requirements", title: "Gather requirements" },
            { id: "tooling", title: "Tools and environment" }
          ]
        }
      ];
    }

    const raw = await this.callModel(
      `Create JSON outline for topic ${topic}. Scope: ${JSON.stringify(scope)}`
    );
    try {
      return JSON.parse(raw) as OutlineNode[];
    } catch (error) {
      logger.error("Failed to parse outline response", { error });
      return [];
    }
  }

  async writeSection(request: SectionWriteRequest): Promise<string> {
    if (!this.client) {
      const citationList = request.supportingResearch.map((doc) => `- ${doc.url}`).join("\n");
      return `# ${request.sectionTitle}

This section is a placeholder generated without the LLM. Incorporate research findings once the LLM API key is configured.

## Supporting Sources
${citationList}
`;
    }

    const prompt = [
      `Write the section "${request.sectionTitle}" for the topic ${request.scope.topic}.`,
      `Depth: ${request.scope.depthLevel}. Breadth: ${request.scope.breadth.join(", ")}`,
      `Use the following sources: ${request.supportingResearch.map((doc) => doc.url).join(", ")}`
    ].join("\n");

    return this.callModel(prompt);
  }
}
