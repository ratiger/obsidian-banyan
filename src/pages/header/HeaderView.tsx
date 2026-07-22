import React from 'react';
import { Icon } from "src/components/Icon";
import { Searchbar } from "./searchbar/Searchbar";
import { DefaultFilterSchemeID, FilterScheme, getDefaultFilterScheme, isTagScheme } from "src/models/FilterScheme";
import { i18n } from "src/utils/i18n";
import { ViewScheme } from 'src/models/ViewScheme';
import { useDashboardLocalStore } from "src/store";

interface HeaderViewProps {
  showSidebar: 'normal' | 'hide' | 'show';
  setShowSidebar: (state: 'normal' | 'hide' | 'show') => void;
  curScheme: FilterScheme | ViewScheme;
  filterSchemes: FilterScheme[];
  setCurScheme: (scheme: FilterScheme | ViewScheme) => void;
}

export const HeaderView: React.FC<HeaderViewProps> = ({
  showSidebar,
  setShowSidebar,
  curScheme,
  filterSchemes,
  setCurScheme
}) => {
  const setCurSchemeToTag = useDashboardLocalStore((state) => state.setCurSchemeToTag);
  const tagSchemeActive = isTagScheme(curScheme);

  const renderTagHierarchy = (schemeName: string) => {
    const tagName = schemeName.startsWith('#') ? schemeName.slice(1) : schemeName;
    const parts = tagName.split('/');
    const elements: React.ReactNode[] = [];
    
    parts.forEach((part, index) => {
      const cumulativeTag = parts.slice(0, index + 1).join('/');
      const isLast = index === parts.length - 1;
      
      elements.push(
        <span
          key={`tag-part-${index}`}
          className={`header-main-title-content ${!isLast ? 'header-main-title-content-clickable' : ''}`}
          onClick={!isLast ? () => {
            setCurSchemeToTag(cumulativeTag);
          } : undefined}
        >
          {index === 0 ? `#${part}` : part}
        </span>
      );
      
      if (!isLast) {
        elements.push(
          <span key={`tag-sep-${index}`} className="header-main-title-separator">
            /
          </span>
        );
      }
    });
    
    return elements;
  };

  return (
    <div className="header-main">
      <div className="header-main-title">
        <button 
          className={"clickable-icon " + (showSidebar == 'normal' ? "sidebar-toggle-button-hidden" : "sidebar-toggle-button-visible")}
          onClick={() => setShowSidebar('show')}
          title={i18n.t('expand_sidebar')}
        >
          <Icon name="menu" />
        </button>
        {curScheme.id === DefaultFilterSchemeID && (
          <div className="header-main-title-content">{i18n.t('all_notes')}</div>
        )}
        {curScheme.id !== DefaultFilterSchemeID && (
          <div className="header-main-title-container">
            <div 
              className="header-main-title-content header-main-title-content-clickable" 
              onClick={() => {
                setCurScheme(getDefaultFilterScheme(filterSchemes));
              }}
            >
              {i18n.t('all_notes')}
            </div>
            <div className="header-main-title-separator">{'/'}</div>
            {tagSchemeActive ? (
              renderTagHierarchy(curScheme.name)
            ) : (
              <div className="header-main-title-content">{curScheme.name}</div>
            )}
          </div>
        )}
      </div>
      <Searchbar />
    </div>
  );
};
