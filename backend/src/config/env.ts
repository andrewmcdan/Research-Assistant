import { config as loadEnv } from "dotenv";
import path from "path";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  LOG_LEVEL: z.string().default("info"),
  OPENAI_API_KEY: z.string().min(1).optional(),
  MODEL_NAME: z.string().default("gpt-5.1"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  RESEARCH_OUTPUT_DIR: z
    .string()
    .default(path.resolve(process.cwd(), "../data/research")),
  OUTLINE_OUTPUT_DIR: z.string().default(path.resolve(process.cwd(), "../data/outlines")),
  DOCUMENT_OUTPUT_DIR: z.string().default(path.resolve(process.cwd(), "../data/documents"))
});

export const env = envSchema.parse({
  PORT: process.env.PORT,
  LOG_LEVEL: process.env.LOG_LEVEL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  MODEL_NAME: process.env.MODEL_NAME,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  RESEARCH_OUTPUT_DIR: process.env.RESEARCH_OUTPUT_DIR,
  OUTLINE_OUTPUT_DIR: process.env.OUTLINE_OUTPUT_DIR,
  DOCUMENT_OUTPUT_DIR: process.env.DOCUMENT_OUTPUT_DIR
});

export const paths = {
  researchRawDir: path.join(env.RESEARCH_OUTPUT_DIR, "raw"),
  researchExtractDir: path.join(env.RESEARCH_OUTPUT_DIR, "extracts"),
  outlinesDir: env.OUTLINE_OUTPUT_DIR,
  documentsDir: env.DOCUMENT_OUTPUT_DIR
};
