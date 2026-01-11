import { ViewScheme } from "src/models/ViewScheme";
import { StateCreator } from "zustand";
import { CombineState } from ".";

export interface ViewSchemeState {

    viewSchemes: ViewScheme[];

    reorderViewSchemes: (viewSchemes: ViewScheme[]) => void;
    createViewScheme: (viewScheme: ViewScheme) => void;
    updateViewScheme: (viewScheme: ViewScheme) => void;
    deleteViewScheme: (id: number) => void;

    updateViewSchemeList: (viewSchemes: ViewScheme[]) => void;
}

export const useViewSchemeStore: StateCreator<CombineState, [], [], ViewSchemeState> = (set, get) => ({
    viewSchemes: [],

    reorderViewSchemes: (viewSchemes: ViewScheme[]) => {
        get().updateViewSchemeList(viewSchemes);
    },
    createViewScheme: (viewScheme: ViewScheme) => {
        get().updateViewSchemeList([...get().viewSchemes, viewScheme]);
    },
    updateViewScheme: (viewScheme: ViewScheme) => {
        get().updateViewSchemeList(get().viewSchemes.map((scheme) => scheme.id === viewScheme.id ? viewScheme : scheme));
    },
    deleteViewScheme: (id: number) => {
        get().updateViewSchemeList(get().viewSchemes.filter((scheme) => scheme.id !== id));
    },

    updateViewSchemeList: (viewSchemes: ViewScheme[]) => {
        get().updateSettings({ viewSchemes });
        set({ viewSchemes });
    },
});