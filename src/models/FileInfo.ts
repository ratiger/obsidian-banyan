import { App, getAllTags, TFile } from "obsidian";
import { TagFilter } from "./TagFilter";

export interface FileInfo {
  file: TFile;
  tags: string[];
}

export const createFileInfo = (file: TFile, app: App): FileInfo | null => {
  const cache = app.metadataCache.getFileCache(file);
  if (!cache) return null;
  const fileTags = getAllTags(cache)?.map((tag) => tag.slice(1)) ?? [];
  const tags = Array.from(new Set(fileTags));
  return { file, tags };
}
