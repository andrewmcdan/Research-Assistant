export type DepthLevel = "overview" | "intermediate" | "expert";

export interface UserScopeConfig {
  topic: string;
  depthLevel: DepthLevel;
  breadth: string[];
  optionalFlags: Record<string, boolean>;
}

export interface ClarifyingQuestion {
  id: string;
  prompt: string;
  type: "breadth" | "depth" | "toggle" | "open";
  options?: string[];
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

export interface OutlineNode {
  id: string;
  title: string;
  includeIf?: string;
  children?: OutlineNode[];
}

export interface SectionWriteRequest {
  sectionId: string;
  sectionTitle: string;
  outlinePath: string[];
  scope: UserScopeConfig;
  supportingResearch: ResearchDocumentMetadata[];
}

export interface SessionState {
  id: string;
  topic?: string;
  scope?: UserScopeConfig;
  clarifyingQuestions?: ClarifyingQuestion[];
  outline?: OutlineNode[];
  createdAt: string;
  updatedAt: string;
}
