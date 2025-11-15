import type {
  Session,
  ResearchQueryPlan,
  ResearchDocumentMetadata,
  SectionDraftJob,
  ChatMessageInput
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const message = await response
      .json()
      .catch(() => ({ error: `Request failed with ${response.status}` }));
    throw new Error(message.error ?? `Request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export const createSession = (topic: string) =>
  request<Session>("/sessions", {
    method: "POST",
    body: JSON.stringify({ topic })
  });

export const deriveScopeFromChat = (sessionId: string, messages: ChatMessageInput[]) =>
  request<Session>(`/sessions/${sessionId}/scope/from-chat`, {
    method: "POST",
    body: JSON.stringify({ messages })
  });

export const fetchResearchPlan = (sessionId: string) =>
  request<ResearchQueryPlan[]>(`/sessions/${sessionId}/research-plan`, {
    method: "GET"
  });

export const captureResearch = (sessionId: string, payload: { url: string; plan: ResearchQueryPlan }) =>
  request<ResearchDocumentMetadata>(`/sessions/${sessionId}/research`, {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const requestSectionDraft = (
  sessionId: string,
  payload: {
    sectionId: string;
    sectionTitle: string;
    outlinePath: string[];
    supportingResearch: ResearchDocumentMetadata[];
  }
) =>
  request<SectionDraftJob>(`/sessions/${sessionId}/sections`, {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const fetchSectionDrafts = (sessionId: string) =>
  request<SectionDraftJob[]>(`/sessions/${sessionId}/sections`, {
    method: "GET"
  });
