import type { SectionDraftJob } from "../api/types";

interface Props {
  jobs: SectionDraftJob[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

const statusLabels: Record<SectionDraftJob["status"], string> = {
  queued: "Queued",
  in_progress: "In progress",
  completed: "Completed",
  failed: "Failed"
};

export const DraftStatusPanel = ({ jobs, onRefresh, isRefreshing }: Props) => {
  return (
    <section className="panel-card">
      <header className="draft-status-header">
        <div>
          <h3>Writing queue</h3>
          <p>Monitor drafting tasks and view their outputs.</p>
        </div>
        <button onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>
      {jobs.length === 0 && <p className="hint">No drafting requests yet.</p>}
      {jobs.length > 0 && (
        <ul className="job-list">
          {jobs.map((job) => (
            <li key={job.id} className="job-item">
              <div>
                <strong>{job.request.sectionTitle}</strong>
                <p>{job.request.outlinePath.join(" › ")}</p>
                <span className={`status-chip ${job.status}`}>{statusLabels[job.status]}</span>
              </div>
              <div className="job-meta">
                <span>{new Date(job.updatedAt).toLocaleTimeString()}</span>
                {job.outputPath && job.status === "completed" && (
                  <code>{job.outputPath.replace(/.*documents\//, "docs/")}</code>
                )}
                {job.error && <p className="error">{job.error}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
