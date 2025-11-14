import { randomUUID } from "crypto";
import { SessionState, UserScopeConfig } from "../domain/types";

export class SessionService {
  private sessions = new Map<string, SessionState>();

  createSession(topic?: string): SessionState {
    const session: SessionState = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (topic) {
      session.topic = topic;
    }
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(id: string): SessionState | undefined {
    return this.sessions.get(id);
  }

  setScope(id: string, scope: UserScopeConfig): SessionState {
    const existing = this.sessions.get(id);
    if (!existing) {
      throw new Error("Session not found");
    }
    const updated: SessionState = {
      ...existing,
      scope,
      updatedAt: new Date().toISOString()
    };
    this.sessions.set(id, updated);
    return updated;
  }

  setClarifyingQuestions(id: string, questions: NonNullable<SessionState["clarifyingQuestions"]>): SessionState {
    const existing = this.sessions.get(id);
    if (!existing) {
      throw new Error("Session not found");
    }
    const updated: SessionState = {
      ...existing,
      clarifyingQuestions: questions,
      updatedAt: new Date().toISOString()
    };
    this.sessions.set(id, updated);
    return updated;
  }

  setOutline(id: string, outline: NonNullable<SessionState["outline"]>): SessionState {
    const existing = this.sessions.get(id);
    if (!existing) {
      throw new Error("Session not found");
    }
    const updated: SessionState = {
      ...existing,
      outline,
      updatedAt: new Date().toISOString()
    };
    this.sessions.set(id, updated);
    return updated;
  }
}
