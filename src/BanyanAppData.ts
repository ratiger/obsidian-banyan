import { FilterScheme, getDefaultFilterScheme } from "./models/FilterScheme";
import { ViewScheme } from "./models/ViewScheme";
import { DefaultRandomReviewFilter, RandomReviewFilter } from "./models/RandomReviewFilters";
import { SortType } from "./models/Enum";
import { getToday } from "./utils/utils";

export interface BanyanAppData {
    // in app
    sortType: SortType;
    firstUseDate: string;
    randomBrowse: boolean;
    randomReviewFilters: RandomReviewFilter[];
    filterSchemes: FilterScheme[];
    viewSchemes: ViewScheme[];

    // UI state
    filterSchemesExpanded: boolean;
    randomReviewExpanded: boolean;
    viewSchemesExpanded: boolean;
}


export const DEFAULT_APP_DATA: BanyanAppData = {
    // in app
    sortType: 'created',
    firstUseDate: getToday(),
    randomBrowse: false,
    randomReviewFilters: [DefaultRandomReviewFilter],
    filterSchemes: [getDefaultFilterScheme([])],
    viewSchemes: [],

    // UI state
    filterSchemesExpanded: true,
    randomReviewExpanded: true,
    viewSchemesExpanded: true,
}
