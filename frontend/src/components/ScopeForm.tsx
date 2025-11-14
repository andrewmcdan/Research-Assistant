import { useState } from "react";
import type { ClarifyingQuestion, DepthLevel, ScopePayload } from "../api/types";

interface Props {
  defaultTopic: string;
  questions?: ClarifyingQuestion[];
  onSubmit: (payload: ScopePayload) => Promise<void>;
  isSubmitting: boolean;
}

const depthOptions: { label: string; value: DepthLevel }[] = [
  { label: "Overview", value: "overview" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Expert (step-by-step)", value: "expert" }
];

export const ScopeForm = ({ defaultTopic, questions, onSubmit, isSubmitting }: Props) => {
  const [topic, setTopic] = useState(defaultTopic);
  const [depthLevel, setDepthLevel] = useState<DepthLevel>("overview");
  const [breadthInput, setBreadthInput] = useState("");
  const [includeHumaneKill, setIncludeHumaneKill] = useState(false);
  const [includePreservation, setIncludePreservation] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!topic.trim()) {
      setError("Please describe the topic.");
      return;
    }
    const breadth = breadthInput
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    setError(null);
    await onSubmit({
      topic: topic.trim(),
      depthLevel,
      breadth,
      optionalFlags: {
        include_humane_handling: includeHumaneKill,
        include_preservation: includePreservation
      }
    });
  };

  return (
    <section className="scope-form">
      <header>
        <h3>Scope your manual</h3>
        <p>Answer the clarifying questions so I can design research and writing steps.</p>
      </header>
      {questions && questions.length > 0 && (
        <div className="question-list">
          {questions.map((question) => (
            <div key={question.id}>
              <strong>{question.prompt}</strong>
              {question.options && (
                <ul>
                  {question.options.map((option) => (
                    <li key={option}>{option}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <label>
          Topic
          <input value={topic} onChange={(event) => setTopic(event.target.value)} />
        </label>
        <label>
          Depth level
          <select value={depthLevel} onChange={(event) => setDepthLevel(event.target.value as DepthLevel)}>
            {depthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Breadth focus
          <input
            placeholder="Separate items with commas"
            value={breadthInput}
            onChange={(event) => setBreadthInput(event.target.value)}
          />
          <span className="input-hint">Example: cows, pigs, safety, storage</span>
        </label>
        <div className="toggle-row">
          <label>
            <input
              type="checkbox"
              checked={includeHumaneKill}
              onChange={(event) => setIncludeHumaneKill(event.target.checked)}
            />
            Include humane handling
          </label>
          <label>
            <input
              type="checkbox"
              checked={includePreservation}
              onChange={(event) => setIncludePreservation(event.target.checked)}
            />
            Include preservation/storage
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save scope"}
        </button>
      </form>
    </section>
  );
};
