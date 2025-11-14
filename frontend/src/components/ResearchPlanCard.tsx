import type { ResearchQueryPlan } from "../api/types";

interface Props {
  plan: ResearchQueryPlan;
}

export const ResearchPlanCard = ({ plan }: Props) => {
  return (
    <article className="plan-card">
      <header>
        <div className="pill">Priority {plan.priority}</div>
        <span>{plan.expectedArtifacts.join(", ")}</span>
      </header>
      <h4>{plan.query}</h4>
      <p>{plan.rationale}</p>
    </article>
  );
};
