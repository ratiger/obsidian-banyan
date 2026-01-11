import { BanyanPluginSettings } from "src/BanyanPluginSettings";
import { StateCreator } from "zustand";
import { CombineState } from ".";
import { CardContentMaxHeightType, SortType, TitleDisplayMode, FontTheme, NewNoteLocationMode } from "src/models/Enum";
import { BanyanAppData } from "src/BanyanAppData";
import moment from "moment";

export interface SettingsState {
    settings: BanyanPluginSettings;
    appData: BanyanAppData;

    // 设置更新方法
    updateSettings: (settings: Partial<BanyanPluginSettings>) => void;
    updateAppData: (appData: Partial<BanyanAppData>) => void;

    // 单个设置项的更新方法
    updateCardsDirectory: (directory: string) => void;
    updateOpenWhenStartObsidian: (open: boolean) => void;
    updateTitleDisplayMode: (mode: TitleDisplayMode) => void;
    updateCardsColumns: (columns: number) => void;
    updateSortType: (sortType: SortType) => void;
    updateFirstUseDate: (date: string) => void;
    updateShowBacklinksInCardNote: (show: boolean) => void;
    updateUseCardNote2: (use: boolean) => void;
    updateRandomBrowse: (randomBrowse: boolean) => void;
    updateUseZkPrefixerFormat: (use: boolean) => void;
    updateShowAddNoteRibbonIcon: (show: boolean) => void;
    updateCardContentMaxHeight: (height: CardContentMaxHeightType) => void; // 新增：卡片内容最大高度
    updateFontTheme: (theme: FontTheme) => void;
    updateNewNoteLocationMode: (mode: NewNoteLocationMode) => void;
    updateCustomNewNoteLocation: (directory: string) => void;

    // UI state updates
    updateFilterSchemesExpanded: (expanded: boolean) => void;
    updateRandomReviewExpanded: (expanded: boolean) => void;
    updateViewSchemesExpanded: (expanded: boolean) => void;

    // 业务逻辑：是否显示卡片标题（基于当前设置与文件名）
    shouldShowTitle: (basename: string) => boolean;
}

export const useSettingsStore: StateCreator<CombineState, [], [], SettingsState> = (set, get) => ({
    settings: {} as BanyanPluginSettings,
    appData: {} as BanyanAppData,

    updateSettings: (newSettings: Partial<BanyanPluginSettings>) => {
        const plugin = get().plugin;
        const updatedSettings = { ...get().settings, ...newSettings };
        plugin.settings = { ...updatedSettings }; // Sync back to plugin
        plugin.saveSettings();
        set({ settings: updatedSettings });
    },

    updateAppData: (newAppData: Partial<BanyanAppData>) => {
        const plugin = get().plugin;
        const updatedAppData = { ...get().appData, ...newAppData };
        plugin.appData = { ...updatedAppData }; // Sync back to plugin
        plugin.saveAppData();

        const newState: Partial<CombineState> = { appData: updatedAppData };
        if (newAppData.viewSchemes) newState.viewSchemes = newAppData.viewSchemes;
        if (newAppData.filterSchemes) newState.filterSchemes = newAppData.filterSchemes;
        if (newAppData.randomReviewFilters) newState.randomReviewFilters = newAppData.randomReviewFilters;

        set(newState);
    },

    updateCardsDirectory: (directory: string) => {
        get().updateSettings({ cardsDirectory: directory });
    },

    updateOpenWhenStartObsidian: (open: boolean) => {
        get().updateSettings({ openWhenStartObsidian: open });
    },

    updateTitleDisplayMode: (mode: TitleDisplayMode) => {
        get().updateSettings({ titleDisplayMode: mode });
    },

    updateCardsColumns: (columns: number) => {
        get().updateSettings({ cardsColumns: columns });
    },

    updateSortType: (sortType: SortType) => {
        get().updateAppData({ sortType });
    },

    updateFirstUseDate: (date: string) => {
        get().updateAppData({ firstUseDate: date });
    },

    updateShowBacklinksInCardNote: (show: boolean) => {
        get().updateSettings({ showBacklinksInCardNote: show });
    },
    updateUseCardNote2: (use: boolean) => {
        get().updateSettings({ useCardNote2: use });
    },
    updateRandomBrowse: (randomBrowse: boolean) => {
        get().updateAppData({ randomBrowse });
    },
    updateUseZkPrefixerFormat: (use: boolean) => {
        get().updateSettings({ useZkPrefixerFormat: use });
    },
    updateShowAddNoteRibbonIcon: (show: boolean) => {
        get().updateSettings({ showAddNoteRibbonIcon: show });
    },
    updateCardContentMaxHeight: (height: CardContentMaxHeightType) => {
        get().updateSettings({ cardContentMaxHeight: height });
    },
    updateFontTheme: (theme: FontTheme) => {
        get().updateSettings({ fontTheme: theme });
    },
    updateNewNoteLocationMode: (mode: NewNoteLocationMode) => {
        get().updateSettings({ newNoteLocationMode: mode });
    },
    updateCustomNewNoteLocation: (directory: string) => {
        get().updateSettings({ customNewNoteLocation: directory });
    },

    // UI state updates
    updateFilterSchemesExpanded: (expanded: boolean) => {
        get().updateAppData({ filterSchemesExpanded: expanded });
    },
    updateRandomReviewExpanded: (expanded: boolean) => {
        get().updateAppData({ randomReviewExpanded: expanded });
    },
    updateViewSchemesExpanded: (expanded: boolean) => {
        get().updateAppData({ viewSchemesExpanded: expanded });
    },

    shouldShowTitle: (basename: string) => {
        const mode = get().settings.titleDisplayMode;
        if (mode === 'none') return false;
        const formatStr = get().plugin.fileUtils.getZkPrefixerFormat() || "YYYY-MM-DD HH-mm-ss";
        return !moment(basename, formatStr, true).isValid();
    },
});