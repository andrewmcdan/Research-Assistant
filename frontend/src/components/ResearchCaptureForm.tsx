import { useMemo, useState } from "react";
import type { ResearchQueryPlan } from "../api/types";

interface Props {
  planOptions?: ResearchQueryPlan[] | null;
  onCapture: (payload: { plan: ResearchQueryPlan; url: string }) => Promise<void>;
  isCapturing: boolean;
}

export const ResearchCaptureForm = ({ planOptions, onCapture, isCapturing }: Props) => {
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [overrideQuery, setOverrideQuery] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activePlan = useMemo(() => {
    const selected = planOptions?.[selectedPlanIndex];
    const customQuery = overrideQuery.trim();

    if (customQuery) {
      if (selected) {
        return {
          ...selected,
          query: customQuery,
          rationale: `Custom override for ${selected.query}`
        };
      }

      return {
        query: customQuery,
        rationale: "Custom research capture",
        priority: 5,
        expectedArtifacts: ["article"] as ResearchQueryPlan["expectedArtifacts"]
      };
    }

    return selected;
  }, [planOptions, selectedPlanIndex, overrideQuery]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!url.trim()) {
      setError("Provide a URL to capture.");
      return;
    }
    if (!activePlan) {
      setError("Fetch or specify a research plan before capturing.");
      return;
    }

    setError(null);
    await onCapture({ plan: activePlan, url: url.trim() });
    setUrl("");
  };

  return (
    <section className="panel-card">
      <header>
        <div>
          <h3>Research capture</h3>
          <p>Execute a search result with Puppeteer and save its content + metadata.</p>
        </div>
      </header>
      <form className="vertical-form" onSubmit={handleSubmit}>
        {planOptions?.length ? (
          <label>
            Choose planned query
            <select
              value={selectedPlanIndex}
              onChange={(event) => setSelectedPlanIndex(Number(event.target.value))}
            >
              {planOptions.map((plan, index) => (
                <option key={`${plan.query}-${plan.priority}`} value={index}>
                  {plan.query} (priority {plan.priority})
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="hint">Plan research first to populate recommended queries.</p>
        )}
        <label>
          Override query (optional)
          <input
            placeholder="Custom search query"
            value={overrideQuery}
            onChange={(event) => setOverrideQuery(event.target.value)}
          />
        </label>
        <label>
          Target URL
          <input
            placeholder="https://example.com/article"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={isCapturing}>
          {isCapturing ? "Capturing..." : "Capture page"}
        </button>
      </form>
    </section>
  );
};
