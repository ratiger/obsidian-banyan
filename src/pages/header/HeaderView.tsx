import React from 'react';
import { Icon } from "src/components/Icon";
import { Searchbar } from "./searchbar/Searchbar";
import { DefaultFilterSchemeID, FilterScheme, getDefaultFilterScheme } from "src/models/FilterScheme";
import { i18n } from "src/utils/i18n";
import { ViewScheme } from 'src/models/ViewScheme';

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
          <div className="header-main-title-content">{curScheme.name}</div>
        )}
        {curScheme.id !== DefaultFilterSchemeID && (
          <div className="header-main-title-container">
            <div 
              className="header-main-title-content header-main-title-content-clickable" 
              onClick={() => {
                setCurScheme(getDefaultFilterScheme(filterSchemes));
              }}
            >
              {getDefaultFilterScheme(filterSchemes).name}
            </div>
            <div className="header-main-title-separator">{'/'}</div>
            <div className="header-main-title-content">{curScheme.name}</div>
          </div>
        )}
      </div>
      <Searchbar />
    </div>
  );
};
