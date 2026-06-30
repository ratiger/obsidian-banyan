import * as React from "react";
import { useMemo } from "react";
import { FilterScheme } from "src/models/FilterScheme";
import { ViewScheme } from "src/models/ViewScheme";
import { isEmptyDateRange } from "src/models/DateRange";
import { Icon } from "src/components/Icon";
import { i18n } from "src/utils/i18n";
import { useDashboardLocalStore } from "src/store";

export interface ActiveFiltersViewProps {
  curScheme: FilterScheme | ViewScheme;
  colCount: number;
}

export const ActiveFiltersView: React.FC<ActiveFiltersViewProps> = ({ curScheme, colCount }) => {
  const setCurSchemeToTag = useDashboardLocalStore((state) => state.setCurSchemeToTag);
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
            {row.map(tag => (
              <span
                className="filter-chip-tag-item"
                key={tag}
                onClick={() => setCurSchemeToTag(tag)}
              >
                #{tag}
              </span>
            ))}
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
            {curScheme.tagFilter.not.map(tag => (
              <span
                className="filter-chip-tag-item filter-chip-tag-item--exclude"
                key={tag}
                onClick={() => setCurSchemeToTag(tag)}
              >
                #{tag}
              </span>
            ))}
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
    return colCount * 620 + (colCount - 1) * 16;
  }, [colCount]);

  if (filterChips.length === 0) return null;

  return (
    <div className="dashboard-active-filters-bar" style={{ maxWidth: `${maxWidth}px` }}>
      <div className="active-filters-list">
        {filterChips}
      </div>
    </div>
  );
};
