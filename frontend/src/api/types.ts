export type DepthLevel = "overview" | "intermediate" | "expert";

export interface ClarifyingQuestion {
  id: string;
  prompt: string;
  type: "breadth" | "depth" | "toggle" | "open";
  options?: string[];
}

export interface UserScopeConfig {
  topic: string;
  depthLevel: DepthLevel;
  breadth: string[];
  optionalFlags: Record<string, boolean>;
}

export interface OutlineNode {
  id: string;
  title: string;
  includeIf?: string;
  children?: OutlineNode[];
}

export interface Session {
  id: string;
  topic?: string;
  scope?: UserScopeConfig;
  clarifyingQuestions?: ClarifyingQuestion[];
  outline?: OutlineNode[];
  createdAt: string;
  updatedAt: string;
}

export interface ResearchQueryPlan {
  query: string;
  rationale: string;
  priority: number;
  expectedArtifacts: ("article" | "paper" | "statistic" | "manual")[];
}

export interface ResearchDocumentMetadata {
  id: string;
  url: string;
  sourceQuery: string;
  capturedAt: string;
  tags: string[];
  storagePath: string;
}

export interface ChatMessageInput {
  role: "assistant" | "user";
  content: string;
}

export type SectionDraftStatus = "queued" | "in_progress" | "completed" | "failed";

export interface SectionDraftJob {
  id: string;
  sessionId: string;
  request: {
    sectionId: string;
    sectionTitle: string;
    outlinePath: string[];
    scope: UserScopeConfig;
    supportingResearch: ResearchDocumentMetadata[];
  };
  status: SectionDraftStatus;
  requestedAt: string;
  updatedAt: string;
  outputPath?: string;
  error?: string;
}
