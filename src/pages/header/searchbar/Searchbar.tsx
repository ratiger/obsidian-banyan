import { Icon } from "src/components/Icon";
import { SearchView } from "./SearchView";
import { useState, useEffect, useRef } from "react";
import { SearchFilterScheme } from "src/models/FilterScheme";
import { Platform } from "obsidian";
import { i18n } from "src/utils/i18n";
import { useCombineStore, useDashboardLocalStore } from "src/store";

export const Searchbar = () => {

    const allTags = useCombineStore((state) => state.allTags);
    const curScheme = useDashboardLocalStore((state) => state.curScheme);
    const setCurScheme = useDashboardLocalStore((state) => state.setCurScheme);

    const [tempFilterScheme, setTempFilterScheme] = useState(SearchFilterScheme);
    const [showFilterBox, setShowFilterBox] = useState(false);
    const searchBarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (curScheme && curScheme.type === 'FilterScheme') {
            setTempFilterScheme({
                ...tempFilterScheme, // 保留表明它是「搜索」的相关属性值
                tagFilter: JSON.parse(JSON.stringify(curScheme.tagFilter)), // 深拷贝，避免引用同一个对象；
                keyword: curScheme.keyword,
                dateRange: JSON.parse(JSON.stringify(curScheme.dateRange)),
            });
        }
    }, [curScheme]);

    const handleSearch = () => {
        setCurScheme(tempFilterScheme);
        setShowFilterBox(false);
    };

    const handleReset = () => {
        setTempFilterScheme(SearchFilterScheme);
    };

    const handleCancel = () => {
        setShowFilterBox(false);
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // 防止事件处理期间搜索框已经关闭的情况
            if (!showFilterBox) return;

            const targetElement = event.target as HTMLElement;

            // 如果点击的是过滤框内部或者是触发按钮，则不关闭
            if (
                (searchBarRef.current && searchBarRef.current.contains(targetElement))
            ) {
                return;
            }

            // 检查是否点击的是标签选择器的下拉菜单、标签元素或其他浮动元素
            // 这些元素可能在DOM中不是filterBoxRef的子元素，但在UI上是属于搜索框的一部分
            if (
                targetElement.closest('.tag-input-tag')
                || targetElement.closest('.tag-input-container')
                || targetElement.closest('.tag-input-inputarea')
                || targetElement.closest('.tag-input-suggest')
            ) {
                return;
            }

            // 否则关闭过滤框
            handleCancel();
        };

        // 只有当过滤框显示时才添加事件监听
        if (showFilterBox) {
            // 使用较低优先级的事件，确保其他点击事件先处理
            // 延迟执行以确保其他元素的点击事件已经处理完毕
            setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 0);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFilterBox]);

    if (Platform.isMobile) {
        return (
            <div ref={searchBarRef} className="searchbar-mobile-container">
                <div onClick={() => setShowFilterBox(v => !v)} className="searchbar-mobile-button"><Icon name="search" /></div>
                {showFilterBox && (
                    <div className="searchbar-mobile-filter-box">
                        <div className="searchbar-mobile-filter-box-title">{i18n.t('search_view_title')}</div>
                        <div className="input-container">
                            <input
                                type="text"
                                placeholder={i18n.t('search_input_placeholder')}
                                value={tempFilterScheme.keyword}
                                onChange={e => {
                                    const newKeyword = e.target.value;
                                    setTempFilterScheme(prev => ({ ...prev, keyword: newKeyword }));
                                }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        handleSearch();
                                    }
                                }}
                            />
                        </div>
                        <SearchView
                            allTags={allTags}
                            filterScheme={tempFilterScheme}
                            setFilterScheme={setTempFilterScheme}
                        />
                        <div className="searchbar-action-buttons">
                            <button onClick={handleReset}>{i18n.t('general_reset')}</button>
                            <div className="searchbar-action-buttons-spacer"></div>
                            <button onClick={handleSearch} className="mod-cta">{i18n.t('general_search')}</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div ref={searchBarRef} className="searchbar-desktop-container">
            <Icon name="search" />
            <input
                type="text"
                placeholder={i18n.t('search_bar_placeholder')}
                value={tempFilterScheme.keyword}
                onChange={e => {
                    const newKeyword = e.target.value;
                    setTempFilterScheme(prev => ({ ...prev, keyword: newKeyword }));
                }}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        handleSearch();
                    }
                }}
            />
            <div onClick={() => setShowFilterBox(v => !v)} className="searchbar-desktop-filter-button"><Icon name="sliders-horizontal" /></div>
            {showFilterBox && (
                <div className="searchbar-desktop-filter-box">
                    <div className="searchbar-desktop-filter-box-title">{i18n.t('search_view_title')}</div>
                    <SearchView
                        allTags={allTags}
                        filterScheme={tempFilterScheme}
                        setFilterScheme={setTempFilterScheme}
                    />
                    <div className="searchbar-action-buttons">
                        <button onClick={handleReset}>{i18n.t('general_reset')}</button>
                        <div className="searchbar-action-buttons-spacer"></div>
                        <button onClick={handleSearch} className="mod-cta">{i18n.t('general_search')}</button>
                    </div>
                </div>
            )}
        </div>
    );
}