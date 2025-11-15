import OpenAI from "openai";
import { env } from "../config/env";
import {
  ClarifyingQuestion,
  OutlineNode,
  ResearchQueryPlan,
  SectionWriteRequest,
  UserScopeConfig,
  ChatMessageInput
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
      logger.debug("LLM mock response used", { preview: prompt.slice(0, 200) });
      return `MOCK_RESPONSE::${prompt.slice(0, 24)}`;
    }

    logger.debug("LLM request", {
      model: env.MODEL_NAME,
      prompt
    });

    const response = await this.client.responses.create({
      model: env.MODEL_NAME,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You are a JSON-only assistant. Respond with strictly valid JSON and no commentary."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt
            }
          ]
        }
      ],
      temperature: 1.0
    });

    const text = Array.isArray(response.output_text)
      ? response.output_text.join("\n")
      : response.output_text ?? "";
    logger.debug("LLM response", {
      model: env.MODEL_NAME,
      raw: text
    });
    console.log("LLM response:", text);

    return text;
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
      [
        `Topic: "${topic}".`,
        "Generate clarifying questions to better define scope and depth.",
        "Return a JSON array. Each entry must match:",
        `{"id": string, "prompt": string, "type": "breadth"|"depth"|"toggle"|"open", "options"?: string[]}`,
        "The entire response must be valid JSON with double quotes."
      ].join("\n")
    );
    try {
      const parsed = JSON.parse(raw) as ClarifyingQuestion[];
      logger.debug("Parsed clarifying questions", { count: parsed.length });
      return parsed;
    } catch (error) {
      logger.error("Failed to parse clarifying question response", {
        error,
        raw
      });
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
      [
        `Scope description: ${scopeDescription}.`,
        "Plan search queries and return JSON array where each element is:",
        `{"query": string, "rationale": string, "priority": integer >= 1, "expectedArtifacts": ["article"|"paper"|"statistic"|"manual", ...]}`,
        "Respond only with valid JSON."
      ].join("\n")
    );
    try {
      const parsed = JSON.parse(raw) as ResearchQueryPlan[];
      logger.debug("Parsed research plan", { count: parsed.length });
      return parsed;
    } catch (error) {
      logger.error("Failed to parse research plan response", {
        error,
        raw
      });
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
      [
        `Create a hierarchical outline for topic "${topic}". Scope config JSON: ${JSON.stringify(scope)}.`,
        "Return strictly valid JSON array of outline nodes.",
        `Outline node schema: {"id": string, "title": string, "includeIf"?: string, "children"?: OutlineNode[]}`,
        "Do not include explanations or markdown."
      ].join("\n")
    );
    try {
      const parsed = JSON.parse(raw) as OutlineNode[];
      logger.debug("Parsed outline", { topLevel: parsed.length });
      return parsed;
    } catch (error) {
      logger.error("Failed to parse outline response", {
        error,
        raw
      });
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

  async deriveScopeFromConversation(
    topic: string,
    messages: ChatMessageInput[]
  ): Promise<UserScopeConfig> {
    if (!this.client) {
      return {
        topic,
        depthLevel: "overview",
        breadth: [],
        optionalFlags: {}
      };
    }

    const transcript = messages
      .map((message) => `[${message.role}] ${message.content}`)
      .join("\n");

    const raw = await this.callModel(
      [
        `You are structuring scope information for a research assistant manual.`,
        `Topic: "${topic}".`,
        `Conversation transcript:\n${transcript}`,
        `Return JSON exactly matching: {"topic": string, "depthLevel": "overview"|"intermediate"|"expert", "breadth": string[], "optionalFlags": Record<string, boolean>}`,
        "Use double quotes and ensure breadth is a unique list.",
        "Respond ONLY with JSON."
      ].join("\n\n")
    );

    try {
      const parsed = JSON.parse(raw) as UserScopeConfig;
      if (!parsed.topic) {
        parsed.topic = topic;
      }
      if (!parsed.optionalFlags) {
        parsed.optionalFlags = {};
      }
      logger.debug("Parsed scope from conversation", {
        depthLevel: parsed.depthLevel,
        breadthCount: parsed.breadth.length
      });
      return parsed;
    } catch (error) {
      logger.error("Failed to parse scope summary", { error, raw });
      return {
        topic,
        depthLevel: "overview",
        breadth: [],
        optionalFlags: {}
      };
    }
  }
}
