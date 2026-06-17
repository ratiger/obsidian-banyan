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

    requestGlobalData: () => Promise<void>;

    needRefresh: boolean;
    editingFilesPath: string[]; // 改为存储文件路径
    hasEditingFiles: () => boolean;
    addEditingFile: (path: string) => void;
    deleteEditingFile: (path: string) => Promise<void>;
    resetEditingFiles: () => void;
}

export const useDashBoardStore: StateCreator<CombineState, [], [], DashBoardState> = (set, get) => ({

    sortType: 'created',
    allFiles: [],
    allTags: [],

    requestGlobalData: async () => {
        const plugin = get().plugin;
        const allFiles = plugin.fileUtils.getAllFiles();
        const allTags = plugin.fileUtils.getAllFilesTags();
        set({ allFiles, allTags });
    },

    needRefresh: false,
    editingFilesPath: [],
    hasEditingFiles: () => get().editingFilesPath.length > 0,
    addEditingFile: (path: string) => set(state => ({ editingFilesPath: [...state.editingFilesPath, path] })),
    deleteEditingFile: async (path: string) => {
        const res = get().editingFilesPath.filter(i => i !== path);
        set({ editingFilesPath: res });
        if (res.length === 0) {
            await get().requestGlobalData();
        }
    },
    resetEditingFiles: () => set({ editingFilesPath: [], needRefresh: false }),
});

