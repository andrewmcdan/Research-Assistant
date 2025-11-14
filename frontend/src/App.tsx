import { useMemo, useState } from "react";
import "./App.css";
import { createSession, fetchResearchPlan, setScope } from "./api/client";
import type { ScopePayload, Session } from "./api/types";
import { ChatMessageBubble } from "./components/ChatMessage";
import type { ChatMessage } from "./components/ChatMessage";
import { ScopeForm } from "./components/ScopeForm";

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

function App() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [session, setSession] = useState<Session | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSubmittingScope, setIsSubmittingScope] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
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
            content: "Here are some clarifying questions—use the scope form below to answer them.",
            timestamp: now()
          });
        }
      } else if (!session.scope) {
        addMessage({
          id: makeId(),
          role: "assistant",
          kind: "text",
          content: "I'm waiting for the scope form so I can plan research. Fill it out below.",
          timestamp: now()
        });
      } else {
        addMessage({
          id: makeId(),
          role: "assistant",
          kind: "text",
          content:
            "Scope already locked. Use the Plan Research button to fetch queries or capture new instructions in the scope if needed.",
          timestamp: now()
        });
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

  const handleScopeSubmit = async (payload: ScopePayload) => {
    if (!session) {
      return;
    }
    setIsSubmittingScope(true);
    setError(null);
    try {
      const updated = await setScope(session.id, payload);
      setSession(updated);
      addMessage({
        id: makeId(),
        role: "assistant",
        kind: "text",
        content: `Perfect. I'll produce an outline for "${payload.topic}" at ${payload.depthLevel} depth covering ${
          payload.breadth.length ? payload.breadth.join(", ") : "the focus areas you selected"
        }. Whenever you're ready, ask me to plan research.`,
        timestamp: now()
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save scope";
      setError(message);
    } finally {
      setIsSubmittingScope(false);
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

  const canSend = useMemo(() => {
    if (!session) return inputValue.trim().length > 0 && !isSending;
    if (waitingForScope) return false;
    return inputValue.trim().length > 0 && !isSending;
  }, [inputValue, isSending, session, waitingForScope]);

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
                  ? "Fill the scope form to continue"
                  : "Ask for more actions or context"
                : "Describe the topic you need a guide for"
            }
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            disabled={waitingForScope}
          />
          <button onClick={handleSend} disabled={!canSend}>
            {isSending ? "Sending..." : session ? "Send" : "Start"}
          </button>
        </div>
        {session?.scope && (
          <div className="actions-bar">
            <button className="primary" onClick={handlePlanResearch} disabled={isPlanning}>
              {isPlanning ? "Planning..." : "Plan Research"}
            </button>
          </div>
        )}
      </section>
      {waitingForScope && session && (
        <ScopeForm
          defaultTopic={session.topic ?? ""}
          questions={session.clarifyingQuestions}
          onSubmit={handleScopeSubmit}
          isSubmitting={isSubmittingScope}
        />
      )}
    </div>
  );
}

export default App;
