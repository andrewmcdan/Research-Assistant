import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const ensureDir = async (dirPath: string) => {
  await mkdir(dirPath, { recursive: true });
};

export const writeMarkdown = async (dirPath: string, filename: string, content: string) => {
  await ensureDir(dirPath);
  await writeFile(path.join(dirPath, filename), content, "utf-8");
};

export const writeJson = async <T>(dirPath: string, filename: string, data: T) => {
  await ensureDir(dirPath);
  await writeFile(path.join(dirPath, filename), JSON.stringify(data, null, 2), "utf-8");
};
