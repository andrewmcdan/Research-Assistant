import type { ReactNode } from "react";
import type { ResearchQueryPlan } from "../api/types";
import { ResearchPlanCard } from "./ResearchPlanCard";

export type ChatMessage =
  | {
      id: string;
      role: "assistant" | "user";
      kind: "text";
      content: string;
      timestamp: string;
    }
  | {
      id: string;
      role: "assistant";
      kind: "plan";
      plan: ResearchQueryPlan[];
      summary?: string;
      timestamp: string;
    };

interface ChatMessageProps {
  message: ChatMessage;
}

export const ChatMessageBubble = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const containerClass = isUser ? "message user" : "message assistant";

  let body: ReactNode | null = null;

  if (message.kind === "text") {
    body = <p>{message.content}</p>;
  } else {
    body = (
      <div className="plan-group">
        {message.summary && <p className="plan-summary">{message.summary}</p>}
        <div className="plan-grid">
          {message.plan.map((item) => (
            <ResearchPlanCard key={`${item.query}-${item.priority}`} plan={item} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="avatar">{isUser ? "You" : "RA"}</div>
      <div className="bubble">
        {body}
        <span className="timestamp">{new Date(message.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};
