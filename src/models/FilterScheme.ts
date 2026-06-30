import { i18n } from "src/utils/i18n";
import { emptyTagFilter, TagFilter } from "./TagFilter";
import { DateRange, emptyDateRange } from "./DateRange";
import { ViewScheme } from "./ViewScheme";

export type FilterScheme = {
    id: number,
    name: string,
    tagFilter: TagFilter,
    dateRange: DateRange,
    keyword: string,
    pinned: string[], // 存储文件的路径，以便在文件移动或重命名时保持置顶状态
    parentId: number | null, // 父方案的ID，如果是顶级方案则为null
    type: 'FilterScheme'
};

export const getDefaultFilterScheme = (schemes: FilterScheme[]) => {
    return schemes.find(s => s.id === DefaultFilterSchemeID) ?? _DefaultFilterScheme;
}

export const createEmptyFilterScheme = (id: number = EmptyFilterSchemeID, name = '', parentId: number | null = null): FilterScheme => {
    return {
        id: id,
        name: name,
        tagFilter: emptyTagFilter(),
        dateRange: emptyDateRange(),
        keyword: "",
        pinned: [],
        parentId: parentId,
        type: 'FilterScheme'
    }
}

export const DefaultFilterSchemeID = -1;
export const SearchFilterSchemeID = -2;
export const EmptyFilterSchemeID = -3; // 占位用的，如果有id是这个，说明逻辑有问题！
export const TagFilterSchemeID = -4;

const _DefaultFilterScheme = createEmptyFilterScheme(DefaultFilterSchemeID, i18n.t('all_notes'));
export const createEmptySearchFilterScheme = () => createEmptyFilterScheme(SearchFilterSchemeID, i18n.t('search_result'));
export const SearchFilterScheme: FilterScheme = createEmptySearchFilterScheme();
export const createEmptyTagFilterScheme = () => createEmptyFilterScheme(TagFilterSchemeID, '');
export const TagFilterScheme: FilterScheme = createEmptyTagFilterScheme();

export const isDefaultScheme = (scheme: FilterScheme | ViewScheme): boolean => {
    return scheme.type === 'FilterScheme' && scheme.id === DefaultFilterSchemeID;
};

export const isSearchScheme = (scheme: FilterScheme | ViewScheme): boolean => {
    return scheme.type === 'FilterScheme' && scheme.id === SearchFilterSchemeID;
};

export const isTagScheme = (scheme: FilterScheme | ViewScheme): boolean => {
    return scheme.type === 'FilterScheme' && scheme.id === TagFilterSchemeID;
};

export const isTempScheme = (scheme: FilterScheme | ViewScheme): boolean => {
    return isSearchScheme(scheme) || isTagScheme(scheme);
};