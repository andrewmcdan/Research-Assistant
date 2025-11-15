import { writeFile } from "fs/promises";
import path from "path";
import { paths } from "../config/env";
import { ensureDir, writeJson, writeMarkdown } from "../utils/fileSystem";
import { ResearchDocumentMetadata, OutlineNode, SessionState } from "../domain/types";

export class StorageService {
  async persistResearchArtifact(
    metadata: ResearchDocumentMetadata,
    rawContent: string,
    extract?: string
  ): Promise<void> {
    const artifactDir = path.join(paths.researchRawDir, metadata.id);
    await ensureDir(artifactDir);

    metadata.storagePath = artifactDir;
    await writeMarkdown(artifactDir, "source.md", rawContent);
    if (extract) {
      await writeMarkdown(artifactDir, "extract.md", extract);
    }
    await writeJson(artifactDir, "metadata.json", metadata);
  }

  async persistOutline(sessionId: string, outline: OutlineNode[]): Promise<void> {
    const filename = `${sessionId}.json`;
    await writeJson(paths.outlinesDir, filename, outline);
  }

  async persistSession(session: SessionState): Promise<void> {
    const filename = `${session.id}.json`;
    await writeJson(path.join(paths.documentsDir, "sessions"), filename, session);
  }

  async writeSection(pathSegments: string[], content: string): Promise<string> {
    const filename = pathSegments.pop();
    if (!filename) {
      throw new Error("Invalid section path");
    }
    const dir = path.join(paths.documentsDir, ...pathSegments);
    await writeMarkdown(dir, `${filename}.md`, content);
    return path.join(dir, `${filename}.md`);
  }

  async writeCombinedDocument(name: string, content: string): Promise<void> {
    await writeFile(path.join(paths.documentsDir, `${name}.md`), content, "utf-8");
  }
}
