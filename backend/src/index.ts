import { createApp } from "./app";
import { env, paths } from "./config/env";
import { logger } from "./config/logger";
import { LlmService } from "./services/llmService";
import { PlanningService } from "./services/planningService";
import { StorageService } from "./services/storageService";
import { SessionService } from "./services/sessionService";
import { ResearchService } from "./services/researchService";
import { WritingService } from "./services/writingService";
import { SessionWorkflow } from "./workflows/sessionWorkflow";
import { ensureDir } from "./utils/fileSystem";

const bootstrap = async () => {
  await Promise.all(
    [paths.researchRawDir, paths.researchExtractDir, paths.outlinesDir, paths.documentsDir].map(
      (dir) => ensureDir(dir)
    )
  );

  const llmService = new LlmService();
  const planningService = new PlanningService(llmService);
  const storageService = new StorageService();
  const sessionService = new SessionService();
  const researchService = new ResearchService(llmService, storageService);
  const writingService = new WritingService(llmService, storageService);
  const workflow = new SessionWorkflow(
    sessionService,
    planningService,
    researchService,
    writingService,
    storageService
  );

  const app = createApp(workflow);

  app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`);
  });
};

bootstrap().catch((error) => {
  logger.error("Failed to bootstrap backend", { error });
  process.exit(1);
});
