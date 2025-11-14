import { LlmService } from "./llmService";
import { SectionWriteRequest } from "../domain/types";
import { StorageService } from "./storageService";

export class WritingService {
  constructor(
    private readonly llm: LlmService,
    private readonly storage: StorageService
  ) {}

  async writeSection(request: SectionWriteRequest): Promise<void> {
    const content = await this.llm.writeSection(request);
    const filePath = [...request.outlinePath, request.sectionId];
    await this.storage.writeSection(filePath, content);
  }
}
