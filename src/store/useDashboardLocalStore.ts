import { createStore, StoreApi, useStore } from "zustand";
import { createContext, useContext } from "react";
import { FilterScheme, SearchFilterSchemeID, DefaultFilterSchemeID, getDefaultFilterScheme } from "src/models/FilterScheme";
import { ViewScheme } from "src/models/ViewScheme";
import { FileInfo } from "src/models/FileInfo";
import { isOKWithTagFilter } from "src/models/TagFilter";
import { withinDateRange } from "src/models/DateRange";
import { stripMarkdown } from "src/utils/markdownUtils";
import BanyanPlugin from "src/BanyanPlugin";
import { useCombineStore } from "./index";

export interface DashboardLocalState {
    curScheme: FilterScheme | ViewScheme;
    curSchemeFiles: FileInfo[];
    randomSeed: string;

    setCurScheme: (scheme: FilterScheme | ViewScheme) => void;
    regenerateRandomSeed: () => void;
    requestData: () => Promise<void>;
    pinFile: (f: FileInfo, isPinned: boolean) => void;
}

function hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0;
}

export type DashboardLocalStore = StoreApi<DashboardLocalState>;

export const createDashboardLocalStore = (plugin: BanyanPlugin) => {
    const store = createStore<DashboardLocalState>()((set, get) => ({
        curScheme: getDefaultFilterScheme(plugin.appData.filterSchemes),
        curSchemeFiles: [],
        randomSeed: Math.random().toString(),

        setCurScheme: (scheme: FilterScheme | ViewScheme) => {
            set({ curScheme: scheme, randomSeed: Math.random().toString() });
            get().requestData();
        },

        regenerateRandomSeed: () => {
            set({ randomSeed: Math.random().toString() });
            get().requestData();
        },

        requestData: async () => {
            const globalState = useCombineStore.getState();
            const sortType = globalState.appData.sortType || 'created';
            const randomBrowse = globalState.appData.randomBrowse;
            const allFiles = globalState.allFiles || [];

            const curScheme = get().curScheme;
            let filtered = [...allFiles];

            if (curScheme.type === 'FilterScheme') {
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
            } else if (curScheme.type === 'ViewScheme') {
                const fileSet = new Set(curScheme.files);
                filtered = filtered.filter(fileInfo => fileSet.has(fileInfo.file.path));
            }

            // sort
            if (randomBrowse) {
                const seed = get().randomSeed;
                filtered.sort((a, b) => hashString(a.file.path + seed) - hashString(b.file.path + seed));
            } else {
                filtered.sort((a, b) => {
                    switch (sortType) {
                        case 'created':
                            return b.file.stat.ctime - a.file.stat.ctime;
                        case 'modified':
                            return b.file.stat.mtime - a.file.stat.mtime;
                        case 'earliestCreated':
                            return a.file.stat.ctime - b.file.stat.ctime;
                        case 'earliestModified':
                            return a.file.stat.mtime - b.file.stat.mtime;
                        default:
                            return b.file.stat.ctime - a.file.stat.ctime;
                    }
                });
            }

            set({ curSchemeFiles: filtered });
        },

        pinFile: (f: FileInfo, isPinned: boolean) => {
            const curScheme = get().curScheme;
            const globalState = useCombineStore.getState();
            const viewSchemes = globalState.viewSchemes;
            const filterSchemes = globalState.filterSchemes;

            const newPinned = [...curScheme.pinned.filter((p: string) => p !== f.file.path)].concat(isPinned ? [f.file.path] : []);
            const newScheme = { ...curScheme, pinned: newPinned };

            set({ curScheme: newScheme });
            get().requestData();

            if (newScheme.type === 'ViewScheme') {
                const newSchemes = viewSchemes.map(scheme => scheme.id === newScheme.id ? newScheme : scheme);
                globalState.updateViewSchemeList(newSchemes);
            } else {
                const newSchemes = filterSchemes.map(scheme => {
                    if (scheme.id === newScheme.id) return newScheme;
                    if (newScheme.id === SearchFilterSchemeID && scheme.id === DefaultFilterSchemeID) {
                        return { ...getDefaultFilterScheme(filterSchemes), pinned: newPinned };
                    }
                    return scheme;
                });
                globalState.updateFilterSchemeList(newSchemes);
            }
        }
    }));

    let prevAllFiles = useCombineStore.getState().allFiles;
    let prevSortType = useCombineStore.getState().appData.sortType;
    let prevRandomBrowse = useCombineStore.getState().appData.randomBrowse;
    let prevViewSchemes = useCombineStore.getState().viewSchemes;
    let prevFilterSchemes = useCombineStore.getState().filterSchemes;

    // Subscribe to global store changes to trigger local updates
    useCombineStore.subscribe((state) => {
        const { allFiles, appData, viewSchemes, filterSchemes } = state;
        const sortType = appData.sortType;
        const randomBrowse = appData.randomBrowse;

        if (
            allFiles !== prevAllFiles ||
            sortType !== prevSortType ||
            randomBrowse !== prevRandomBrowse ||
            viewSchemes !== prevViewSchemes ||
            filterSchemes !== prevFilterSchemes
        ) {
            prevAllFiles = allFiles;
            prevSortType = sortType;
            prevRandomBrowse = randomBrowse;
            prevViewSchemes = viewSchemes;
            prevFilterSchemes = filterSchemes;

            const curScheme = store.getState().curScheme;
            let updatedScheme = curScheme;
            if (curScheme.type === 'ViewScheme') {
                const newScheme = viewSchemes.find(s => s.id === curScheme.id);
                if (newScheme) {
                    updatedScheme = newScheme;
                } else {
                    updatedScheme = getDefaultFilterScheme(filterSchemes);
                }
            } else if (curScheme.type === 'FilterScheme') {
                const newScheme = filterSchemes.find(s => s.id === curScheme.id);
                if (newScheme) {
                    updatedScheme = newScheme;
                } else if (curScheme.id !== SearchFilterSchemeID) {
                    updatedScheme = getDefaultFilterScheme(filterSchemes);
                }
            }

            store.setState({ curScheme: updatedScheme });
            store.getState().requestData();
        }
    });

    return store;
};

export const DashboardStoreContext = createContext<DashboardLocalStore | null>(null);

export const useDashboardLocalStore = <T,>(selector: (state: DashboardLocalState) => T): T => {
    const store = useContext(DashboardStoreContext);
    if (!store) {
        throw new Error("useDashboardLocalStore must be used within DashboardStoreContext.Provider");
    }
    return useStore(store, selector);
};
