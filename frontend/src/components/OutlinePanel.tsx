import { useMemo, useState } from "react";
import type { OutlineNode, ResearchDocumentMetadata } from "../api/types";

interface OutlineEntry {
  node: OutlineNode;
  depth: number;
  pathIds: string[];
  pathTitles: string[];
}

interface DraftRequest {
  sectionId: string;
  sectionTitle: string;
  outlinePath: string[];
  researchDocIds: string[];
}

interface Props {
  outline?: OutlineNode[];
  researchDocs: ResearchDocumentMetadata[];
  onDraft: (request: DraftRequest) => Promise<void>;
  isDrafting: boolean;
}

const flattenOutline = (
  nodes: OutlineNode[],
  parentIds: string[] = [],
  parentTitles: string[] = []
): OutlineEntry[] => {
  return nodes.flatMap((node) => {
    const currentIds = [...parentIds, node.id];
    const currentTitles = [...parentTitles, node.title];
    const self: OutlineEntry = {
      node,
      depth: parentIds.length,
      pathIds: currentIds,
      pathTitles: currentTitles
    };
    const children = node.children ? flattenOutline(node.children, currentIds, currentTitles) : [];
    return [self, ...children];
  });
};

export const OutlinePanel = ({ outline, researchDocs, onDraft, isDrafting }: Props) => {
  const [selectedResearchIds, setSelectedResearchIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const flattened = useMemo(() => {
    if (!outline) {
      return [];
    }
    return flattenOutline(outline);
  }, [outline]);

  const toggleResearchSelection = (next: string[]) => {
    setSelectedResearchIds(next);
  };

  const handleDraft = async (entry: OutlineEntry) => {
    setError(null);
    try {
      await onDraft({
        sectionId: entry.node.id,
        sectionTitle: entry.node.title,
        outlinePath: entry.pathIds,
        researchDocIds: selectedResearchIds
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to draft section";
      setError(message);
    }
  };

  return (
    <section className="panel-card">
      <header>
        <div>
          <h3>Outline</h3>
          <p>Select a section to have the assistant draft it using captured research.</p>
        </div>
      </header>
      {!outline?.length && <p className="hint">Provide scope details to generate an outline.</p>}
      {outline?.length && (
        <>
          <label>
            Attach research
            <select
              multiple
              value={selectedResearchIds}
              onChange={(event) =>
                toggleResearchSelection(
                  Array.from(event.target.selectedOptions).map((option) => option.value)
                )
              }
            >
              {researchDocs.length === 0 && (
                <option value="" disabled>
                  (No research captured yet)
                </option>
              )}
              {researchDocs.map((doc) => {
                let hostname = doc.url;
                try {
                  hostname = new URL(doc.url).hostname;
                } catch (error) {
                  // leave hostname as url
                }
                return (
                  <option key={doc.id} value={doc.id}>
                    {doc.sourceQuery} → {hostname}
                  </option>
                );
              })}
            </select>
            <span className="input-hint">Hold Cmd/Ctrl to select multiple sources.</span>
          </label>
          {error && <p className="error">{error}</p>}
          <ul className="outline-list">
            {flattened.map((entry) => (
              <li key={entry.node.id} style={{ paddingLeft: `${entry.depth * 16}px` }}>
                <div className="outline-item">
                  <div>
                    <strong>{entry.node.title}</strong>
                    <p>{entry.pathTitles.join(" › ")}</p>
                  </div>
                  <button onClick={() => handleDraft(entry)} disabled={isDrafting}>
                    {isDrafting ? "Drafting..." : "Draft section"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
};
