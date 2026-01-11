import { App, TFile, normalizePath, Notice } from "obsidian";
import BanyanPlugin from "src/main";
import { createFileInfo, FileInfo } from "src/models/FileInfo";
import { TagFilter, isOKWithTagFilter } from "src/models/TagFilter";
import { i18n } from "./i18n";
import moment from "moment";
import { legalFileName } from "./utils";

const PlaceholderFileName = "editor_placeholder.md";
const PlaceholderDirectory = "banyan_config";
const PlaceholderFilePath = `${PlaceholderDirectory}/${PlaceholderFileName}`;

export class FileUtils {

  app: App;
  plugin: BanyanPlugin;
  constructor(app: App, plugin: BanyanPlugin) {
    this.app = app;
    this.plugin = plugin;
  }

  get dir() {
    return this.plugin.settings.cardsDirectory;
  }

  //#region 文件获取

  isLegalFile(file: TFile) {
    const path = this.getFullPlaceholderFilePath();
    // 根目录的情况
    if (this.dir === "/") {
      return file.path !== path;
    }
    return file.path.startsWith(this.dir + '/') && file.path !== path;
  }

  isLegalMarkdownFile(file: TFile) {
    return file.extension === 'md' && this.isLegalFile(file);
  }

  getAllRawFiles(): TFile[] {
    const files = this.app.vault.getMarkdownFiles()
      .filter((file: TFile) => this.isLegalFile(file));
    return files;
  }

  getAllFiles(): FileInfo[] {
    const files = this.getAllRawFiles()
      .map(f => createFileInfo(f, this.app))
      .filter(f => f !== null)
      .map(f => f!);
    return files;
  }

  getFullPlaceholderFilePath() {
    return normalizePath(`${this.dir}/${PlaceholderFilePath}`);
  }

  async getPlaceholderFile() {
    const path = this.getFullPlaceholderFilePath();
    const file = this.app.vault.getFileByPath(path);
    if (file) return file;
    await this.ensureDirectoryExists(`${this.dir}/${PlaceholderDirectory}`);
    const exists1 = await this.app.vault.adapter.exists(path);
    console.log('占位文件', exists1, "创建", path);
    try {
      const res = await this.app.vault.create(path, "");
      const exists2 = await this.app.vault.adapter.exists(path);
      console.log('占位文件创建后', exists2);
      return res;
    } catch (e) {
      console.error('创建占位文件失败', e);
      throw e;
    }
  }

  public getZkPrefixerFormat(): string | undefined {
    if (!this.plugin.settings.useZkPrefixerFormat) return undefined;
    const internalPlugins = (this.app as any).internalPlugins;
    if (!internalPlugins) return undefined;
    const zk = internalPlugins.getPluginById("zk-prefixer");
    if (!zk || !zk.enabled) return undefined;
    const format = zk.instance.options.format;
    if (format && format.trim() === "") return undefined;
    return format;
  }

  private sanitizeFileName(rawTitle: string) {
    // 移除/替换常见非法字符，保留与插件一致的校验
    let name = rawTitle.trim();
    // 替换文件路径分隔符及常见非法字符
    name = name
      .replace(/[\\/:*?"<>]/g, "-")
      .replace(/[\n\r\t]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!legalFileName(name)) {
      name = name.replace(/[\[\]#^|]/g, "-");
    }
    // 避免空文件名
    if (name.length === 0) name = "untitled";
    return name;
  }

  private getSiblingUniquePath(file: TFile, baseName: string) {
    // 在同目录下确保唯一文件名，添加 (n) 后缀
    const parentPath = file.parent?.path ?? this.dir;
    let candidate = normalizePath(`${parentPath}/${baseName}.md`);
    if (!this.app.vault.getAbstractFileByPath(candidate)) return candidate;
    let index = 1;
    while (true) {
      const tryPath = normalizePath(`${parentPath}/${baseName} (${index}).md`);
      if (!this.app.vault.getAbstractFileByPath(tryPath)) return tryPath;
      index += 1;
    }
  }

  private async getNewNoteFilePath(title?: string) {
    const now = new Date();
    const year = now.getFullYear().toString();
    const quarter = Math.floor((now.getMonth() + 3) / 3).toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0').toString();
    const day = now.getDate().toString().padStart(2, '0').toString();
    const folderPath = `${this.dir}/${i18n.t('create_note_folder_path', { year, quarter, month, day })}`;
    await this.ensureDirectoryExists(folderPath);
    const formatStr = this.getZkPrefixerFormat();
    let fileName: string = "";

    // 如果有标题且标题合法，使用标题作为文件名
    if (title && title.trim() && legalFileName(title.trim())) {
      fileName = `${title.trim()}.md`;
    } else if (formatStr) {
      const name = `${moment().format(formatStr)}.md`;
      if (legalFileName(name)) {
        fileName = name;
        console.log("formated file name:", fileName);
      } else {
        // 不赋值filename，则会使用默认格式
        new Notice(i18n.t('illegal_unique_prefix_format'));
        console.log("formated illegal:", formatStr);
      }
    }

    if (fileName === "") {
      const defaultFormatStr = "YYYY-MM-DD HH-mm-ss";
      fileName = `${moment().format(defaultFormatStr)}.md`;
    }
    const filePath = normalizePath(`${folderPath}/${fileName}`);
    return filePath;
  }

  private async ensureDirectoryExists(directoryPath: string) {
    const normalizedPath = normalizePath(directoryPath);
    if (!this.app.vault.getAbstractFileByPath(normalizedPath)) {
      await this.app.vault.createFolder(normalizedPath);
    }
  }
  //#endregion

  //#region 打开、增删文件
  openFile(file: TFile) {
    this.app.workspace.openLinkText(file.path, '', false);
  }

  openRandomFile(tagFilter: TagFilter) {
    const files = this.getAllFiles();
    const filteredFiles = this.getTagsFilterdFiles(files, tagFilter);
    if (!files || filteredFiles.length === 0) {
      new Notice(i18n.t('random_reivew_no_match'));
      return;
    }

    // 随机选择一个笔记
    const randomIndex = getRandomNumber(filteredFiles.length - 1);
    const randomFile = filteredFiles[randomIndex];

    // 打开笔记
    const leaf = this.app.workspace.getLeaf(false);
    leaf.openFile(randomFile.file, { active: true }).then(() => this.app.workspace.setActiveLeaf(leaf, { focus: true }));
    // this.app.workspace.openLinkText(randomFile.path, '', false);
  }

  async addFile(title?: string, content?: string, tags: string[] = [], open: boolean = true) {
    const finalTitle = title?.trim();
    const filePath = await this.getNewNoteFilePath(finalTitle);
    const file = await this.app.vault.create(filePath, content ?? '');

    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter.tags = tags;
    });

    if (!open) return;
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.openFile(file, { active: true, state: { mode: 'source' }, });
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
  }

  async trashFile(file: TFile) {
    await this.app.fileManager.trashFile(file);
  }
  //#endregion

  //#region 文件内容操作
  async readFileContent(file: TFile) {
    return await this.app.vault.read(file);
  }

  async readCachedFileContent(file: TFile) {
    return await this.app.vault.cachedRead(file);
  }

  async modifyFileContent(file: TFile, content: string) {
    await this.app.vault.modify(file, content);
  }

  async emptyFileContent(file: TFile) {
    await this.app.vault.modify(file, "");
  }
  //#endregion

  //#region 标签操作
  getFilesTags(files: FileInfo[]) {
    const rawTags = files
      .map(f => f.tags)
      .reduce((pre, cur) => pre.concat(cur), []);
    const tagSet = new Set(rawTags);
    // 多级标签的初级标签也要添加，如 a/b/c 也要添加 a/b 和 a
    tagSet.forEach((tag) => {
      const subs = tag.split("/");
      if (subs.length == 1) return;
      subs.forEach((_sub, index) => {
        if (index == 0) return;
        tagSet.add(subs.slice(0, index).join("/"));
      });
    });
    const res = Array.from(tagSet);
    res.sort((a, b) => a.length - b.length);
    return res;
  }

  getAllFilesTags() {
    const files = this.getAllFiles();
    return this.getFilesTags(files);
  }

  getTagsFilterdFiles(files: FileInfo[], filter: TagFilter) {
    return files.filter(({ tags }) => isOKWithTagFilter(tags, filter));
  }

  //#endregion

  //#region 迁移：FrontMatter.title -> 文件名
  getFilesWithFrontmatterTitle(): { file: TFile; title: string }[] {
    const res: { file: TFile; title: string }[] = [];
    const files = this.getAllRawFiles();
    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      const title = (cache as any)?.frontmatter?.title;
      if (typeof title === 'string' && title.trim().length > 0) {
        res.push({ file, title: title.trim() });
      }
    }
    return res;
  }

  async migrateFrontmatterTitleToFilename(targets?: { file: TFile; title: string }[], onProgress?: (originalPath: string, file: TFile, ok: boolean) => void) {
    const list = targets ?? this.getFilesWithFrontmatterTitle();
    let success = 0;
    for (const { file, title } of list) {
      try {
        const originalMtime = file.stat.mtime;
        const originalCtime = file.stat.ctime;
        const originalPath = file.path;
        const sanitized = this.sanitizeFileName(title);
        const currentBase = file.basename;
        // 目标路径（同目录）
        let targetPath: string | null = null;
        if (sanitized !== currentBase) {
          targetPath = this.getSiblingUniquePath(file, sanitized);
          await this.app.fileManager.renameFile(file, targetPath);
        }
        // 获取最新文件引用
        const newFile = targetPath ? (this.app.vault.getFileByPath(targetPath) as TFile | null) : file;
        if (!newFile) throw new Error('file not found after rename');
        // 删除frontmatter中的title，并恢复原始ctime/mtime
        await this.app.fileManager.processFrontMatter(newFile, (fm) => {
          if (fm.title !== undefined) delete fm.title;
        }, { mtime: originalMtime, ctime: originalCtime });
        success += 1;
        onProgress && onProgress(originalPath, newFile, true);
      } catch (e) {
        console.error('迁移失败', file.path, e);
        onProgress && onProgress(file.path, file, false);
      }
    }
    return { success, total: list.length };
  }
  //#endregion
}

function getRandomNumber(max: number) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * max);
  return (timestamp + random) % (max + 1);
}