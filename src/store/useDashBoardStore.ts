import { createEmptyFilterScheme, DefaultFilterSchemeID, FilterScheme, getDefaultFilterScheme, SearchFilterSchemeID } from "src/models/FilterScheme";
import { ViewScheme } from "src/models/ViewScheme";
import { StateCreator } from "zustand";
import { withinDateRange } from "src/models/DateRange";
import { CombineState } from ".";
import { FileInfo } from "src/models/FileInfo";
import { isOKWithTagFilter } from "src/models/TagFilter";
import { stripMarkdown } from "src/utils/markdownUtils";

export interface DashBoardState {
    allFiles: FileInfo[];
    allTags: string[];
    curSchemeFiles: FileInfo[];
    curScheme: FilterScheme | ViewScheme;

    setCurScheme: (scheme: FilterScheme | ViewScheme) => void;
    requestData: () => Promise<void>;
    pinFile: (f: FileInfo, isPinned: boolean) => void;


    needRefresh: boolean;
    editingFilesPath: string[]; // 改为存储文件路径
    hasEditingFiles: () => boolean;
    addEditingFile: (path: string) => void;
    deleteEditingFile: (path: string) => Promise<void>;
    resetEditingFiles: () => void;
    randomSeed: string;
    regenerateRandomSeed: () => void;
}

function hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0;
}


export const useDashBoardStore: StateCreator<CombineState, [], [], DashBoardState> = (set, get) => ({

    sortType: 'created',
    allFiles: [],
    allTags: [],
    curSchemeFiles: [],
    curScheme: createEmptyFilterScheme(),
    randomSeed: "",


    setCurScheme(scheme: FilterScheme | ViewScheme) {
        set({ curScheme: scheme, editingFilesPath: [], needRefresh: false, randomSeed: Math.random().toString() });
    },
    requestData: async () => {
        const plugin = get().plugin;
        const appData = get().appData;
        const sortType = appData.sortType;
        const randomBrowse = appData.randomBrowse;
        const allFiles = plugin.fileUtils.getAllFiles();
        const allTags = plugin.fileUtils.getAllFilesTags();
        const curScheme = get().curScheme;
        let filtered = allFiles;
        if (curScheme.type == 'FilterScheme') {
            // date range
            filtered = filtered.filter(({ file }) => {
                const timeToCheck = (sortType === 'created' || sortType === 'earliestCreated') ? file.stat.ctime : file.stat.mtime;
                return withinDateRange(timeToCheck, curScheme.dateRange);
            });
            // key word
            if (curScheme.keyword.trim().length > 0) {
                const keyword = curScheme.keyword.trim().toLowerCase();
                const allLoadedContents = await Promise.all(filtered.map(async (fileInfo) => {
                    let content = await plugin.fileUtils.readCachedFileContent(fileInfo.file);
                    content = stripMarkdown(content);
                    return { fileInfo, content };
                }));
                filtered = allLoadedContents
                    .filter(({ content, fileInfo }) => content.toLowerCase().includes(keyword) || fileInfo.file.basename.toLowerCase().includes(keyword))
                    .map(({ fileInfo }) => fileInfo);
            }
            // tag filter
            filtered = filtered.filter((fileInfo) => {
                return isOKWithTagFilter(fileInfo.tags, curScheme.tagFilter);
            });
        } else if (curScheme.type == 'ViewScheme') {
            // 现在的 files 存储的是 path string
            const fileSet = new Set(curScheme.files);
            filtered = filtered.filter(fileInfo => fileSet.has(fileInfo.file.path));
        }

        // 根据乱序浏览设置决定排序方式
        if (randomBrowse) {
            let seed = get().randomSeed;
            if (!seed) {
                seed = Math.random().toString();
                set({ randomSeed: seed });
            }
            filtered.sort((a, b) => hashString(a.file.path + seed) - hashString(b.file.path + seed));
        } else {
            // 按排序类型排序
            filtered.sort((a, b) => {
                switch (sortType) {
                    case 'created':
                        return b.file.stat.ctime - a.file.stat.ctime; // 最近创建
                    case 'modified':
                        return b.file.stat.mtime - a.file.stat.mtime; // 最近更新
                    case 'earliestCreated':
                        return a.file.stat.ctime - b.file.stat.ctime; // 最早创建
                    case 'earliestModified':
                        return a.file.stat.mtime - b.file.stat.mtime; // 最早更新
                    default:
                        return b.file.stat.ctime - a.file.stat.ctime;
                }
            });
        }
        set({ allFiles, allTags, curSchemeFiles: filtered });
    },

    pinFile: (f: FileInfo, isPinned: boolean) => {
        const curScheme = get().curScheme;
        const viewSchemes = get().viewSchemes;
        const filterSchemes = get().filterSchemes;
        // 使用 file.path
        const newPinned = [...curScheme.pinned.filter(p => p !== f.file.path)].concat(isPinned ? [f.file.path] : []);
        const newScheme = { ...curScheme, pinned: newPinned };
        set({ curScheme: newScheme });
        if (newScheme.type === 'ViewScheme') {
            const newSchemes = viewSchemes.map(scheme => scheme.id == newScheme.id ? newScheme : scheme);
            get().updateViewSchemeList(newSchemes);
        } else {
            const newSchemes = filterSchemes.map(scheme => {
                if (scheme.id == newScheme.id) return newScheme;
                if (newScheme.id == SearchFilterSchemeID && scheme.id == DefaultFilterSchemeID) { // 「搜索」的置顶其实要给到「默认」
                    return { ...getDefaultFilterScheme(filterSchemes), pinned: newPinned };
                }
                return scheme;
            });
            get().updateFilterSchemeList(newSchemes);
        }
    },


    needRefresh: false,
    editingFilesPath: [],
    hasEditingFiles: () => get().editingFilesPath.length > 0,
    addEditingFile: (path: string) => set(state => ({ editingFilesPath: [...state.editingFilesPath, path] })),
    deleteEditingFile: async (path: string) => {
        const res = get().editingFilesPath.filter(i => i !== path);
        set({ editingFilesPath: res });
        if (res.length === 0) {
            await get().requestData();
        }
    },
    resetEditingFiles: () => set({ editingFilesPath: [], needRefresh: false }),
    regenerateRandomSeed: () => set({ randomSeed: Math.random().toString() }),
});

