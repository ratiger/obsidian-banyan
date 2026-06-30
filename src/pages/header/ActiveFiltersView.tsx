import * as React from "react";
import { useMemo } from "react";
import { FilterScheme, isSearchScheme } from "src/models/FilterScheme";
import { ViewScheme } from "src/models/ViewScheme";
import { isEmptyDateRange } from "src/models/DateRange";
import { Icon } from "src/components/Icon";
import { i18n } from "src/utils/i18n";
import { useDashboardLocalStore, useCombineStore } from "src/store";
import { FilterEditModal } from "../sidebar/filterScheme/FilterEditModal";

export interface ActiveFiltersViewProps {
  curScheme: FilterScheme | ViewScheme;
  colCount: number;
}

export const ActiveFiltersView: React.FC<ActiveFiltersViewProps> = ({ curScheme, colCount }) => {
  const setCurSchemeToTag = useDashboardLocalStore((state) => state.setCurSchemeToTag);
  const setCurScheme = useDashboardLocalStore((state) => state.setCurScheme);
  const app = useCombineStore((state) => state.plugin.app);
  const allTags = useCombineStore((state) => state.allTags);
  const filterSchemes = useCombineStore((state) => state.filterSchemes);
  const createFilterScheme = useCombineStore((state) => state.createFilterScheme);

  const isSearch = isSearchScheme(curScheme);

  const filterChips = useMemo(() => {
    if (curScheme.type !== 'FilterScheme') return [];

    const chips: React.ReactNode[] = [];

    // 1. Keyword
    if (curScheme.keyword && curScheme.keyword.trim() !== '') {
      chips.push(
        <div className="filter-chip filter-chip-keyword" key="keyword">
          <Icon name="search" size="s" />
          <span className="filter-chip-label">{i18n.t('filter_scheme_keyword_label')}</span>
          <span className="filter-chip-value">"{curScheme.keyword}"</span>
        </div>
      );
    }

    // 2. Date Range
    if (!isEmptyDateRange(curScheme.dateRange)) {
      const { from, to } = curScheme.dateRange;
      let dateStr = '';
      if (from && to) {
        dateStr = from === to ? from : `${from} ~ ${to}`;
      } else if (from) {
        dateStr = `>= ${from}`;
      } else if (to) {
        dateStr = `<= ${to}`;
      }
      chips.push(
        <div className="filter-chip filter-chip-date" key="date">
          <Icon name="calendar" size="s" />
          <span className="filter-chip-label">{i18n.t('filter_scheme_date_label')}</span>
          <span className="filter-chip-value">{dateStr}</span>
        </div>
      );
    }

    const renderTagItem = (tag: string, isExclude = false) => {
      const parts = tag.split('/');
      const itemClass = `filter-chip-tag-item ${isExclude ? 'filter-chip-tag-item--exclude' : ''}`;
      
      if (parts.length <= 1) {
        return (
          <span
            className={itemClass}
            key={tag}
            onClick={(e) => {
              e.stopPropagation();
              setCurSchemeToTag(tag);
            }}
          >
            #{tag}
          </span>
        );
      }
      
      return (
        <span className={`${itemClass} filter-chip-tag-item-hierarchical`} key={tag}>
          <span className="filter-chip-tag-hash">#</span>
          {parts.map((part, index) => {
            const cumulativeTag = parts.slice(0, index + 1).join('/');
            const isLast = index === parts.length - 1;
            return (
              <React.Fragment key={index}>
                <span
                  className="filter-chip-tag-segment"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurSchemeToTag(cumulativeTag);
                  }}
                >
                  {part}
                </span>
                {!isLast && <span className="filter-chip-tag-separator">/</span>}
              </React.Fragment>
            );
          })}
        </span>
      );
    };

    // 3. Tags - Include
    const activeOrRows = curScheme.tagFilter.or.filter(row => row.length > 0);
    activeOrRows.forEach((row, idx) => {
      chips.push(
        <div className="filter-chip filter-chip-include-tags" key={`tag-in-${idx}`}>
          <Icon name="tag" size="s" />
          <span className="filter-chip-label">
            {idx === 0 ? i18n.t('tag_group_label_include') : i18n.t('tag_group_label_or_include')}
          </span>
          <div className="filter-chip-tags-list">
            {row.map(tag => renderTagItem(tag, false))}
          </div>
        </div>
      );
    });

    // 4. Tags - Exclude
    if (curScheme.tagFilter.not.length > 0) {
      chips.push(
        <div className="filter-chip filter-chip-exclude-tags" key="tag-ex">
          <Icon name="tag" size="s" />
          <span className="filter-chip-label filter-chip-label--exclude">{i18n.t('tag_group_label_exclude')}</span>
          <div className="filter-chip-tags-list">
            {curScheme.tagFilter.not.map(tag => renderTagItem(tag, true))}
          </div>
        </div>
      );
    }

    // 5. Tags - No Tag option
    if (curScheme.tagFilter.noTag !== 'unlimited') {
      chips.push(
        <div className="filter-chip filter-chip-notag" key="no-tag">
          <Icon name="tag" size="s" />
          <span className="filter-chip-label">{i18n.t('tag_group_label_notag')}</span>
          <span className="filter-chip-value">
            {curScheme.tagFilter.noTag === 'include' ? i18n.t('tag_group_label_notag_include') : i18n.t('tag_group_label_notag_exclude')}
          </span>
        </div>
      );
    }

    return chips;
  }, [curScheme, setCurSchemeToTag]);

  const maxWidth = useMemo(() => {
    return colCount * 620 + (colCount - 1) * 16 - 8; // 多减8是为了让右边框不被遮挡
  }, [colCount]);

  if (filterChips.length === 0) return null;

  const handleClick = () => {
    if (!isSearch) return;
    
    const maxId = filterSchemes.reduce((max, s) => Math.max(max, s.id), 0);
    const newScheme: FilterScheme = {
      ...(curScheme as FilterScheme),
      id: maxId + 1,
      name: '',
      type: 'FilterScheme'
    };

    const modal = new FilterEditModal(app, {
      filterScheme: newScheme,
      allTags,
      isNew: true,
      onSave: (updatedScheme: FilterScheme) => {
        createFilterScheme(updatedScheme);
        setCurScheme(updatedScheme);
      }
    });
    modal.open();
  };

  return (
    <div 
      className={`dashboard-active-filters-bar ${isSearch ? 'clickable-active-filters' : ''}`} 
      style={{ maxWidth: `${maxWidth}px` }}
      onClick={isSearch ? handleClick : undefined}
      aria-label={isSearch ? i18n.t('create_filter_scheme_from_search') || "Save search as filter scheme" : undefined}
    >
      <div className="active-filters-list">
        {filterChips}
      </div>
    </div>
  );
};
