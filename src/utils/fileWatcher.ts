import { TFile, Vault, MetadataCache } from 'obsidian';
import BanyanPlugin from 'src/main';
import { createFileInfo, FileInfo } from 'src/models/FileInfo';
import { useCombineStore } from 'src/store';

export type FileChangeType = 'create' | 'delete' | 'modify' | 'rename' | 'meta-change';
export interface FileChange {
  type: FileChangeType;
  fileInfo: FileInfo | TFile;
}

export type FileChangeCallback = (change: FileChange) => void;

// 节流和内容对比缓存（放在文件顶部，类外部，保证全局唯一）
let backlinksUpdateTimer: ReturnType<typeof setTimeout> | null = null;
let lastResolvedLinksStr = '';

export class FileWatcher {
  private plugin: BanyanPlugin;
  private vault: Vault;
  private metadataCache: MetadataCache;
  private callbacks: Set<FileChangeCallback> = new Set();
  // 引用 store 中的 rename 处理函数
  private updateWhenRenameFile = useCombineStore.getState().updateWhenRenameFile;

  constructor(plugin: BanyanPlugin) {
    this.plugin = plugin;
    this.vault = plugin.app.vault;
    this.metadataCache = plugin.app.metadataCache;
    this.handleCreate = this.handleCreate.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleModify = this.handleModify.bind(this);
    this.handleRename = this.handleRename.bind(this); // 绑定 rename
    this.handleMetaChange = this.handleMetaChange.bind(this);
    this.registerEvents();
    this.updateBacklinksMapIfNeeded();
  }

  private registerEvents() {
    this.plugin.registerEvent(this.vault.on('create', this.handleCreate));
    this.plugin.registerEvent(this.vault.on('delete', this.handleDelete));
    this.plugin.registerEvent(this.vault.on('modify', this.handleModify));
    this.plugin.registerEvent(this.vault.on('rename', this.handleRename));
    this.plugin.registerEvent(this.metadataCache.on('changed', this.handleMetaChange));
  }

  private async handleCreate(file: TFile) {
    if (!this || !this.plugin.fileUtils.isLegalMarkdownFile(file)) return;
    const fileInfo = createFileInfo(file, this.plugin.app);
    if (!fileInfo) return;
    this.emit({ type: 'create', fileInfo });
  }

  private handleDelete(file: TFile) {
    if (!this || !this.plugin.fileUtils.isLegalMarkdownFile(file)) return;
    this.emit({ type: 'delete', fileInfo: file });
  }

  private handleModify(file: TFile) {
    if (!this || !this.plugin.fileUtils.isLegalMarkdownFile(file)) return;
    const fileInfo = createFileInfo(file, this.plugin.app);
    if (!fileInfo) return;
    this.emit({ type: 'modify', fileInfo });
  }

  private handleRename(file: TFile, oldPath: string) {
    if (!this || !this.plugin.fileUtils.isLegalMarkdownFile(file)) return;

    // 触发全局重命名更新
    this.updateWhenRenameFile(oldPath, file.path);

    const fileInfo = createFileInfo(file, this.plugin.app);
    if (!fileInfo) return;
    this.emit({ type: 'rename', fileInfo });
  }

  private async handleMetaChange(file: TFile) {
    if (!this || !this.plugin.fileUtils.isLegalMarkdownFile(file)) return;
    const fileInfo = createFileInfo(file, this.plugin.app);
    if (!fileInfo) return;
    this.emit({ type: 'meta-change', fileInfo });
  }

  public onChange(cb: FileChangeCallback) {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  private emit(change: FileChange) {
    this.callbacks.forEach(cb => cb(change));
    this.updateBacklinksMapIfNeeded();
  }
  // ...

  private updateBacklinksMapIfNeeded() {
    // 节流+内容对比，避免无效重建
    if (backlinksUpdateTimer) clearTimeout(backlinksUpdateTimer);
    backlinksUpdateTimer = setTimeout(() => {
      const resolvedLinks = this.metadataCache.resolvedLinks;
      const resolvedLinksStr = JSON.stringify(resolvedLinks);
      if (resolvedLinksStr === lastResolvedLinksStr) return;
      lastResolvedLinksStr = resolvedLinksStr;
      const backlinksMap: { [key: string]: string[] } = {};
      Object.entries(resolvedLinks).forEach(([key, dictonary]) => {
        for (const link in dictonary) {
          if (!backlinksMap[link]) backlinksMap[link] = [];
          backlinksMap[link].push(key);
        }
      });
      useCombineStore.getState().setBacklinksMap(backlinksMap);
    }, 200);
  }

  public dispose() {
    this.vault.off('create', this.handleCreate);
    this.vault.off('delete', this.handleDelete);
    this.vault.off('modify', this.handleModify);
    this.vault.off('rename', this.handleRename);
    this.metadataCache.off('changed', this.handleMetaChange);
    this.callbacks.clear();
  }
}

export const createFileWatcher = (plugin: BanyanPlugin) => {
  return new FileWatcher(plugin);
}