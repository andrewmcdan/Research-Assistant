import { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  captureResearch,
  createSession,
  deriveScopeFromChat,
  fetchResearchPlan,
  fetchSectionDrafts,
  requestSectionDraft
} from "./api/client";
import type {
  Session,
  ResearchQueryPlan,
  ResearchDocumentMetadata,
  SectionDraftJob,
  ChatMessageInput,
  ClarifyingQuestion
} from "./api/types";
import { ChatMessageBubble } from "./components/ChatMessage";
import type { ChatMessage } from "./components/ChatMessage";
import { ResearchCaptureForm } from "./components/ResearchCaptureForm";
import { OutlinePanel } from "./components/OutlinePanel";
import { DraftStatusPanel } from "./components/DraftStatusPanel";

const makeId = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
const now = () => new Date().toISOString();

const initialMessages: ChatMessage[] = [
  {
    id: makeId(),
    role: "assistant",
    kind: "text",
    content: "Tell me what you need a manual or guide about, and I will orchestrate research, outlining, and writing.",
    timestamp: now()
  }
];

const serializeMessageForScope = (message: ChatMessage): ChatMessageInput => {
  if (message.kind === "text") {
    return {
      role: message.role,
      content: message.content
    };
  }
  const planSummary =
    message.summary ??
    `Research plan with ${message.plan.length} queries for this topic.`;
  const entries = message.plan
    .map(
      (item) =>
        `${item.query} (priority ${item.priority}): ${item.rationale}. Expected artifacts: ${item.expectedArtifacts.join(", ")}`
    )
    .join("\n");
  return {
    role: message.role,
    content: `${planSummary}\n${entries}`
  };
};

const formatClarifyingQuestions = (questions: ClarifyingQuestion[]) => {
  return questions
    .map((question, index) => {
      const base = `${index + 1}. ${question.prompt} (${question.type})`;
      if (question.options?.length) {
        return `${base}\n   Options: ${question.options.join(", ")}`;
      }
      return base;
    })
    .join("\n");
};

function App() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [session, setSession] = useState<Session | null>(null);
  const [latestPlan, setLatestPlan] = useState<ResearchQueryPlan[] | null>(null);
  const [researchDocs, setResearchDocs] = useState<ResearchDocumentMetadata[]>([]);
  const [draftJobs, setDraftJobs] = useState<SectionDraftJob[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isDerivingScope, setIsDerivingScope] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isCapturingResearch, setIsCapturingResearch] = useState(false);
  const [isDraftingSection, setIsDraftingSection] = useState(false);
  const [isRefreshingDrafts, setIsRefreshingDrafts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waitingForScope = Boolean(session && !session.scope);
  const sessionLabel = session ? `Session ${session.id.slice(0, 6)}` : "No session";

  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      kind: "text",
      content: trimmed,
      timestamp: now()
    };

    addMessage(userMessage);
    setInputValue("");
    setError(null);
    setIsSending(true);

    try {
      if (!session) {
        const newSession = await createSession(trimmed);
        setSession(newSession);
        setLatestPlan(null);
        setResearchDocs([]);
        setDraftJobs([]);
        addMessage({
          id: makeId(),
          role: "assistant",
          kind: "text",
          content: `Great! Let's scope the "${newSession.topic ?? trimmed}" manual so I know how deep to research.`,
          timestamp: now()
        });
        if (newSession.clarifyingQuestions?.length) {
          addMessage({
            id: makeId(),
            role: "assistant",
            kind: "text",
            content: [
              "Here are clarifying questions to guide the scope:",
              formatClarifyingQuestions(newSession.clarifyingQuestions)
            ].join("\n\n"),
            timestamp: now()
          });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      addMessage({
        id: makeId(),
        role: "assistant",
        kind: "text",
        content: `I ran into an error: ${message}`,
        timestamp: now()
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDeriveScope = async () => {
    if (!session) {
      return;
    }
    setIsDerivingScope(true);
    setError(null);
    try {
      const transcript = messages.map((message) => serializeMessageForScope(message));
      const updated = await deriveScopeFromChat(session.id, transcript);
      setSession(updated);
      setLatestPlan(null);
      setResearchDocs([]);
      setDraftJobs([]);
      addMessage({
        id: makeId(),
        role: "assistant",
        kind: "text",
        content: `Scope locked for "${updated.scope?.topic}". Depth set to ${updated.scope?.depthLevel}.`,
        timestamp: now()
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to derive scope";
      setError(message);
    } finally {
      setIsDerivingScope(false);
    }
  };

  const handlePlanResearch = async () => {
    if (!session?.scope) {
      setError("Scope is required before planning research.");
      return;
    }
    setIsPlanning(true);
    setError(null);
    try {
      const plan = await fetchResearchPlan(session.id);
      setLatestPlan(plan);
      addMessage({
        id: makeId(),
        role: "assistant",
        kind: "plan",
        plan,
        summary: `Proposed search strategy for "${session.scope.topic}".`,
        timestamp: now()
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not retrieve research plan";
      setError(message);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleCaptureResearch = async (payload: { plan: ResearchQueryPlan; url: string }) => {
    if (!session) {
      setError("Start a session before capturing research.");
      return;
    }
    setIsCapturingResearch(true);
    setError(null);

    try {
      const metadata = await captureResearch(session.id, payload);
      setResearchDocs((prev) => [...prev, metadata]);
      addMessage({
        id: makeId(),
        role: "assistant",
        kind: "text",
        content: `Captured research for "${payload.plan.query}" from ${metadata.url}.`,
        timestamp: now()
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to capture research";
      setError(message);
    } finally {
      setIsCapturingResearch(false);
    }
  };

  const handleDraftSection = async (request: {
    sectionId: string;
    sectionTitle: string;
    outlinePath: string[];
    researchDocIds: string[];
  }) => {
    if (!session?.scope) {
      setError("Scope and outline are required before drafting.");
      return;
    }

    setIsDraftingSection(true);
    setError(null);

    try {
      const supportingResearch = researchDocs.filter((doc) => request.researchDocIds.includes(doc.id));
      const job = await requestSectionDraft(session.id, {
        sectionId: request.sectionId,
        sectionTitle: request.sectionTitle,
        outlinePath: request.outlinePath,
        supportingResearch
      });
      setDraftJobs((prev) => [job, ...prev.filter((item) => item.id !== job.id)]);
      addMessage({
        id: makeId(),
        role: "assistant",
        kind: "text",
        content: `Queued drafting for "${request.sectionTitle}" using ${supportingResearch.length} research sources.`,
        timestamp: now()
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not draft section";
      setError(message);
    } finally {
      setIsDraftingSection(false);
    }
  };

  useEffect(() => {
    if (!session) {
      return;
    }
    let isMounted = true;
    const poll = async () => {
      try {
        const jobs = await fetchSectionDrafts(session.id);
        if (isMounted) {
          setDraftJobs(jobs);
        }
      } catch (pollError) {
        console.error("Failed to refresh draft jobs", pollError);
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [session?.id]);

  const handleRefreshDrafts = async () => {
    if (!session) {
      return;
    }
    setIsRefreshingDrafts(true);
    try {
      const jobs = await fetchSectionDrafts(session.id);
      setDraftJobs(jobs);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to refresh drafting queue";
      setError(message);
    } finally {
      setIsRefreshingDrafts(false);
    }
  };

  const canSend = useMemo(() => {
    return inputValue.trim().length > 0 && !isSending;
  }, [inputValue, isSending]);

  return (
    <div className="app-shell">
      <section className="chat-panel">
        <div className="chat-header">
          <div>
            <h1>Research Assistant Studio</h1>
            <p>Plan, research, and write high-quality manuals through a structured chat workflow.</p>
          </div>
          <span className="status-pill">{sessionLabel}</span>
        </div>
        <div className="message-list">
          {messages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} />
          ))}
        </div>
        {error && <p className="error-banner">{error}</p>}
        <div className="composer">
          <input
            placeholder={
              session
                ? waitingForScope
                  ? "Answer the clarifying questions here"
                  : "Ask for more actions or context"
                : "Describe the topic you need a guide for"
            }
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
          />
          <button onClick={handleSend} disabled={!canSend}>
            {isSending ? "Sending..." : session ? "Send" : "Start"}
          </button>
        </div>
        {session && !session.scope && (
          <div className="actions-bar">
            <button className="primary" onClick={handleDeriveScope} disabled={isDerivingScope}>
              {isDerivingScope ? "Deriving..." : "Derive Scope from Chat"}
            </button>
          </div>
        )}
        {session?.scope && (
          <div className="actions-bar">
            <button className="primary" onClick={handlePlanResearch} disabled={isPlanning}>
              {isPlanning ? "Planning..." : "Plan Research"}
            </button>
          </div>
        )}
      </section>
      {session?.scope && (
        <div className="workspace-grid">
          <ResearchCaptureForm
            planOptions={latestPlan}
            onCapture={handleCaptureResearch}
            isCapturing={isCapturingResearch}
          />
          <OutlinePanel
            outline={session.outline}
            researchDocs={researchDocs}
            onDraft={handleDraftSection}
            isDrafting={isDraftingSection}
          />
          <DraftStatusPanel
            jobs={draftJobs}
            onRefresh={handleRefreshDrafts}
            isRefreshing={isRefreshingDrafts}
          />
        </div>
      )}
    </div>
  );
}

export default App;
