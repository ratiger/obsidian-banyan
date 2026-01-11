import { create } from "zustand";
import { FilterSchemeState, useFilterSchemeStore } from "./useFilterSchemeStore";
import { useViewSchemeStore, ViewSchemeState } from "./useViewSchemeStore";
import { DashBoardState, useDashBoardStore } from "./useDashBoardStore";
import { RandomReviewState, useRandomReviewStore } from "./useRandomReviewStore";
import { SettingsState, useSettingsStore } from "./useSettingsStore";
import { FileStoreState, useFileStore } from "./useFileStore";
import BanyanPlugin from "src/BanyanPlugin";
import { getDefaultFilterScheme } from "src/models/FilterScheme";

interface BaseState {
    plugin: BanyanPlugin;
    setupPlugin: (plugin: BanyanPlugin) => void;
    backlinksMap: { [key: string]: string[] };
    setBacklinksMap: (map: { [key: string]: string[] }) => void;
}

export type CombineState = DashBoardState & FilterSchemeState & ViewSchemeState & RandomReviewState & SettingsState & FileStoreState & BaseState;

export const useCombineStore = create<CombineState>()((...a) => ({
    plugin: {} as BanyanPlugin,
    backlinksMap: {},
    setBacklinksMap: (map) => { const [set] = a; set({ backlinksMap: map }); },
    setupPlugin: (plugin: BanyanPlugin) => {
        const [set] = a;
        set({
            plugin: plugin,
            settings: { ...plugin.settings },
            appData: { ...plugin.appData },
            viewSchemes: [...plugin.appData.viewSchemes],
            filterSchemes: [...plugin.appData.filterSchemes],
            randomReviewFilters: [...plugin.appData.randomReviewFilters],
            curScheme: getDefaultFilterScheme(plugin.appData.filterSchemes),
        });
    },
    ...useDashBoardStore(...a),
    ...useFilterSchemeStore(...a),
    ...useViewSchemeStore(...a),
    ...useRandomReviewStore(...a),
    ...useSettingsStore(...a),
    ...useFileStore(...a),
}));