import { StateCreator } from "zustand";
import { CombineState } from ".";

export interface FileStoreState {
    updateWhenDeleteFile: (path: string) => void;
    updateWhenRenameFile: (oldPath: string, newPath: string) => void;
}

export const useFileStore: StateCreator<CombineState, [], [], FileStoreState> = (set, get) => ({
    updateWhenDeleteFile: (path: string) => {
        const viewSchemes = get().viewSchemes;
        const curScheme = get().curScheme;
        const setCurScheme = get().setCurScheme;

        // 更新 ViewSchemes：移除文件和移除置顶
        const newSchemes = viewSchemes.map(scheme => {
            const newFiles = scheme.files.filter((id) => id !== path);
            const newPinned = scheme.pinned.filter((id) => id !== path);
            return { ...scheme, files: newFiles, pinned: newPinned };
        });
        get().updateViewSchemeList(newSchemes);

        // 如果当前是 ViewScheme，需要立即更新当前 scheme 状态
        if (curScheme.type == 'ViewScheme') {
            const newScheme = newSchemes.filter(scheme => scheme.id == curScheme.id).first();
            if (newScheme) {
                setCurScheme(newScheme);
            }
        }

        // FilterSchemes 里的 pinned 也要移除
        const filterSchemes = get().filterSchemes;
        const newFilterSchemes = filterSchemes.map(scheme => {
            const newPinned = scheme.pinned.filter(p => p !== path);
            return { ...scheme, pinned: newPinned };
        });
        // 只有当数据真正发生变化时才更新，避免不必要的渲染
        if (JSON.stringify(newFilterSchemes) !== JSON.stringify(filterSchemes)) {
            get().updateFilterSchemeList(newFilterSchemes);
            if (curScheme.type === 'FilterScheme') {
                const newScheme = newFilterSchemes.find(s => s.id === curScheme.id);
                if (newScheme) setCurScheme(newScheme);
            }
        }
    },

    updateWhenRenameFile: (oldPath: string, newPath: string) => {
        const viewSchemes = get().viewSchemes;
        const curScheme = get().curScheme;
        const setCurScheme = get().setCurScheme;
        const filterSchemes = get().filterSchemes;

        // 更新 ViewSchemes
        const newViewSchemes = viewSchemes.map(scheme => {
            const newFiles = scheme.files.map(f => f === oldPath ? newPath : f);
            const newPinned = scheme.pinned.map(p => p === oldPath ? newPath : p);
            return { ...scheme, files: newFiles, pinned: newPinned };
        });
        get().updateViewSchemeList(newViewSchemes);

        // 更新 FilterSchemes (仅 pinned)
        const newFilterSchemes = filterSchemes.map(scheme => {
            const newPinned = scheme.pinned.map(p => p === oldPath ? newPath : p);
            return { ...scheme, pinned: newPinned };
        });
        get().updateFilterSchemeList(newFilterSchemes);

        // 如果当前是 ViewScheme，需要立即更新当前 scheme 状态
        if (curScheme.type == 'ViewScheme') {
            const newScheme = newViewSchemes.find(scheme => scheme.id == curScheme.id);
            if (newScheme) {
                setCurScheme(newScheme);
            }
        } else if (curScheme.type == 'FilterScheme') {
            const newScheme = newFilterSchemes.find(scheme => scheme.id == curScheme.id);
            if (newScheme) {
                setCurScheme(newScheme);
            }
        }
    }
});
