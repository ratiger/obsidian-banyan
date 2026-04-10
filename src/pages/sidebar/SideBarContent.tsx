import { Heatmap } from 'src/pages/sidebar/heatmap/Heatmap';
import { FilterSchemesInfo } from './filterScheme/FilterSchemesInfo';
import { ViewSchemesInfo } from './viewScheme/ViewSchemesInfo';
import { RandomReviewInfo } from './randomReview/RandomReviewInfo';
import { i18n } from 'src/utils/i18n';
import { useCombineStore } from 'src/store';
import { SearchFilterScheme } from 'src/models/FilterScheme';
import { useMemo, useState } from 'react';
import { SidebarButton } from './SidebarButton';
import { SidebarSwitchButton } from './SidebarSwitchButton';
import { Platform } from 'obsidian';

export const SidebarContent = () => {
    const setCurScheme = useCombineStore((state) => state.setCurScheme);
    const plugin = useCombineStore((state) => state.plugin);
    const settings = useCombineStore((state) => state.settings);

    const handleClickDate = (date: string) => {
        setCurScheme({ ...SearchFilterScheme, name: date, dateRange: { from: date, to: date } });
    }

    return (
        <div className="sidebar-content-container">
            <StatisticsInfo />
            <Heatmap onCickDate={handleClickDate} />
            <div className="sidebar-margin-top" />
            <SidebarButton leftIconName="settings"
                label={i18n.t('setting_panel')}
                onClick={() => plugin.openSettingsPanel()} />
            {!Platform.isMobile && (
                <SidebarButton leftIconName="lightbulb"
                    label={i18n.t('create_note')}
                    onClick={async () => await plugin.fileUtils.addFile()} />
            )}
            <RandomBrowseSwitch />
            <div className="sidebar-margin-top" />
            <div className="sidebar-section-container">
                {settings.enableRandomReview && <RandomReviewInfo />}
                <FilterSchemesInfo />
                {settings.enableViewSchemes && <ViewSchemesInfo />}
            </div>
        </div>);
}

const StatisticsInfo = () => {
    const allFiles = useCombineStore((state) => state.allFiles);
    const allTags = useCombineStore((state) => state.allTags);
    const firstUseDateStr = useCombineStore((state) => state.appData.firstUseDate);

    const usedDays = useMemo(() => {
        if (!firstUseDateStr) return 0;
        const firstUseDate = new Date(firstUseDateStr);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - firstUseDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }, [firstUseDateStr]);

    return (
        <div className="statistics-info-container">
            <div>
                <span className="statistics-info-item-value">{allFiles.length}</span>
                <br />
                <span className="statistics-info-item-label">{i18n.t('note')}</span>
            </div>
            <div>
                <span className="statistics-info-item-value">{allTags.length}</span>
                <br />
                <span className="statistics-info-item-label">{i18n.t('tag')}</span>
            </div>
            <div>
                <span className="statistics-info-item-value">{usedDays}</span>
                <br />
                <span className="statistics-info-item-label">{i18n.t('days')}</span>
            </div>
        </div>
    );
}

const RandomBrowseSwitch = () => {
    const randomBrowse = useCombineStore((state) => state.appData.randomBrowse);
    const updateRandomBrowse = useCombineStore((state) => state.updateRandomBrowse);

    const [isRandomBrowseOn, setIsRandomBrowseOn] = useState(randomBrowse);

    const handleRandomBrowseToggle = () => {
        const newValue = !isRandomBrowseOn;
        setIsRandomBrowseOn(newValue);
        updateRandomBrowse(newValue);
    }
    return <SidebarSwitchButton
        leftIconName='shuffle'
        label={i18n.t('random_browse')}
        isOn={isRandomBrowseOn}
        onSwitch={handleRandomBrowseToggle} />;
}