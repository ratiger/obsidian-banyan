import React, { useCallback } from "react";
import { createEmptyFilterScheme, DefaultFilterSchemeID, FilterScheme } from "src/models/FilterScheme";
import { FilterEditModal } from "./FilterEditModal";
import { Icon } from "src/components/Icon";
import { SidebarButton } from "../SidebarButton";
import { Menu } from "obsidian";
import { i18n } from "src/utils/i18n";
import { useCombineStore, useDashboardLocalStore } from "src/store";

export const FilterSchemesInfo = () => {

    const app = useCombineStore((state) => state.plugin.app);
    const allTags = useCombineStore((state) => state.allTags);
    const filterSchemes = useCombineStore((state) => state.filterSchemes);
    const curScheme = useDashboardLocalStore((state) => state.curScheme);
    const curFilterSchemeID = curScheme.type === 'FilterScheme' ? curScheme.id : undefined;
    const setCurScheme = useDashboardLocalStore((state) => state.setCurScheme);
    const updateFilterScheme = useCombineStore((state) => state.updateFilterScheme);
    const createFilterScheme = useCombineStore((state) => state.createFilterScheme);
    const deleteFilterScheme = useCombineStore((state) => state.deleteFilterScheme);
    const getSchemeById = useCombineStore((state) => state.getSchemeById);
    const getChildSchemes = useCombineStore((state) => state.getChildSchemes);
    const moveScheme = useCombineStore((state) => state.moveScheme);

    const [draggedItem, setDraggedItem] = React.useState<{ scheme: FilterScheme } | null>(null);
    const [dragOverItem, setDragOverItem] = React.useState<{ scheme: FilterScheme, position: 'before' | 'inside' | 'after' } | null>(null);
    // 存储展开状态的方案ID
    const [expandedSchemeIds, setExpandedSchemeIds] = React.useState<number[]>([]);

    // 从设置中获取展开状态
    const filterSchemesExpanded = useCombineStore((state) => state.appData.filterSchemesExpanded);
    const updateFilterSchemesExpanded = useCombineStore((state) => state.updateFilterSchemesExpanded);

    const handleCreateFilterScheme = (parentId: number | null = null) => {
        const maxId = getMaxSchemeId(filterSchemes);
        const newScheme = createEmptyFilterScheme(maxId + 1, '', parentId);
        const modal = new FilterEditModal(app, {
            filterScheme: newScheme,
            allTags,
            isNew: true,
            onSave: (updatedScheme: FilterScheme) => {
                createFilterScheme(updatedScheme);
            }
        });
        modal.open();
    };

    // 递归查找最大ID
    const getMaxSchemeId = (schemes: FilterScheme[]): number => {
        return schemes.reduce((maxId, scheme) => Math.max(maxId, scheme.id), 0);
    };

    const hanldeUpdateFilterScheme = (scheme: FilterScheme) => {
        const modal = new FilterEditModal(app, {
            filterScheme: { ...scheme },
            allTags,
            isNew: false,
            onSave: (updatedScheme: FilterScheme) => {
                updateFilterScheme(updatedScheme);
            }
        });
        modal.open();
    }

    const handleDuplicateFilterScheme = (scheme: FilterScheme) => {
        const maxId = getMaxSchemeId(filterSchemes);
        const newScheme = {
            ...scheme,
            id: maxId + 1,
            name: `${scheme.name} ${i18n.t('general_copy')}`,
            parentId: scheme.parentId // 保持相同的父方案
        };
        createFilterScheme(newScheme);
    }

    // 点击更多按钮弹出菜单
    const handleClickMore = (event: MouseEvent, scheme: FilterScheme) => {
        const menu = new Menu();
        const isDefault = scheme.id === DefaultFilterSchemeID;
        if (!isDefault) menu.addItem((item) => {
            item.setTitle(i18n.t('general_update'));
            item.onClick(() => hanldeUpdateFilterScheme(scheme));
        });
        menu.addItem((item) => {
            item.setTitle(i18n.t('create_sub_scheme'));
            item.onClick(() => handleCreateFilterScheme(scheme.id));
        });
        if (!isDefault) menu.addItem((item) => {
            item.setTitle(i18n.t('create_copy'));
            item.onClick(() => handleDuplicateFilterScheme(scheme));
        });
        if (!isDefault) menu.addSeparator();
        if (!isDefault) menu.addItem((item) => {
            item.setTitle(i18n.t('general_delete'));
            item.onClick(() => deleteFilterScheme(scheme.id));
        });
        menu.showAtMouseEvent(event);
    };

    const handleDragStart = (scheme: FilterScheme) => {
        setDraggedItem({ scheme });
    };

    const handleDragOver = (scheme: FilterScheme, e: React.DragEvent) => {
        e.preventDefault();
        if (!draggedItem) return;

        // 计算拖拽位置（上方、内部或下方）
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseY = e.clientY;
        const thirdHeight = rect.height / 3;

        let position: 'before' | 'inside' | 'after' = 'inside';

        if (mouseY < rect.top + thirdHeight && scheme.id !== DefaultFilterSchemeID) {
            position = 'before';
        } else if (mouseY > rect.bottom - thirdHeight) {
            position = 'after';
        }

        setDragOverItem({ scheme, position });
    };

    const reorder = () => {
        if (!draggedItem || !dragOverItem) return;

        const { scheme: draggedScheme } = draggedItem;
        const { scheme: targetScheme, position } = dragOverItem;

        // 防止拖拽到自己或自己的子方案
        if (draggedScheme.id === targetScheme.id) return;

        // 检查是否拖拽到自己的子方案（防止循环引用）
        const isChildOf = (childId: number, parentId: number): boolean => {
            const child = getSchemeById(childId);
            if (!child) return false;
            if (child.parentId === parentId) return true;
            if (child.parentId === null) return false;
            return isChildOf(child.parentId, parentId);
        };
        if (isChildOf(targetScheme.id, draggedScheme.id)) return;

        moveScheme(draggedScheme, targetScheme, position);
    }

    const handleDrop = () => {
        reorder(); // 防止有时候 handleDragEnd 不执行
        setDraggedItem(null);
        setDragOverItem(null);
    };

    const handleDragEnd = () => {
        reorder(); // 防止有时候 handleDrop 不执行
        setDraggedItem(null);
        setDragOverItem(null);
    };

    // 切换方案的展开/折叠状态
    const toggleExpand = (schemeId: number) => {
        if (expandedSchemeIds.includes(schemeId)) {
            setExpandedSchemeIds(expandedSchemeIds.filter(id => id !== schemeId));
        } else {
            setExpandedSchemeIds([...expandedSchemeIds, schemeId]);
        }
    };

    // 切换整个FilterSchemes的展开/折叠状态
    const toggleFilterSchemesExpanded = () => {
        updateFilterSchemesExpanded(!filterSchemesExpanded);
    };

    const filterSchemeBtn = (scheme: FilterScheme, indentLevel: number) => {
        const hasChildren = getChildSchemes(scheme.id).length > 0;
        const isExpanded = expandedSchemeIds.includes(scheme.id);
        const isDragging = draggedItem && draggedItem.scheme.id === scheme.id;
        const isDragOver = dragOverItem && dragOverItem.scheme.id === scheme.id;
        const dragPosition = isDragOver ? dragOverItem?.position : null;
        const isDefault = scheme.id === DefaultFilterSchemeID;
        return (
            <div
                key={scheme.id}
                className={`filter-scheme-item ${isDragging ? 'filter-scheme-item-dragging' : ''
                    } ${dragPosition === 'before' ? 'filter-scheme-item-drag-over-before' : ''
                    } ${dragPosition === 'after' ? 'filter-scheme-item-drag-over-after' : ''
                    } ${dragPosition === 'inside' ? 'filter-scheme-item-drag-over-inside' : ''
                    }`.trim()}
                draggable={!isDefault}
                onDragStart={isDefault ? undefined : () => handleDragStart(scheme)}
                onDragOver={(e) => handleDragOver(scheme, e)}
                onDrop={() => handleDrop()}
                onDragEnd={handleDragEnd}
                style={{ marginLeft: indentLevel * 12 }}
            >
                <SidebarButton
                    leftIconName={!hasChildren ? undefined : (isExpanded ? "chevron-down" : "chevron-right")}
                    label={scheme.name}
                    selected={curFilterSchemeID === scheme.id}
                    onClick={() => setCurScheme(scheme)}
                    rightIconName={'ellipsis'}
                    onClickRightIcon={(e) => handleClickMore(e, scheme)}
                    onClickLeftIcon={hasChildren ? () => toggleExpand(scheme.id) : undefined}
                />
            </div>
        );
    };

    // 递归渲染方案列表
    const renderSchemeList = () => {
        const res: { scheme: FilterScheme, indentLevel: number }[] = [];
        const dfs = (indentLevel: number, parentId: number | null) => {
            const curSchems = getChildSchemes(parentId);
            for (const scheme of curSchems) {
                res.push({ scheme, indentLevel });
                if (getChildSchemes(scheme.id).length === 0 || !expandedSchemeIds.includes(scheme.id)) continue;
                dfs(indentLevel + 1, scheme.id);
            }
        };
        dfs(0, null);
        return res.map(({ scheme, indentLevel }) => filterSchemeBtn(scheme, indentLevel));
    };

    return (
        <div className='filter-scheme-container'>
            <div className='filter-scheme-header'>
                <div className='filter-scheme-header-left'>
                    <div className='filter-scheme-header-toggle'>
                        <button className='filter-scheme-header-toggle-btn clickable-icon'
                            onClick={toggleFilterSchemesExpanded}>
                            <Icon name={filterSchemesExpanded ? 'chevron-down' : 'chevron-right'} size='m' color='var(--interactive-accent)' />
                        </button>
                    </div>
                    <div className='filter-scheme-header-title'>
                        <span>{i18n.t('filter_schemes')}</span>
                    </div>
                </div>
                <div className='filter-scheme-header-add'>
                    <button className='filter-scheme-header-add-btn clickable-icon'
                        onClick={() => handleCreateFilterScheme()}>
                        <Icon name='plus' size='m' color='var(--interactive-accent)' />
                    </button>
                </div>
            </div>
            {filterSchemesExpanded && (
                <div className='filter-scheme-list'>
                    {renderSchemeList()}
                </div>
            )}
        </div>
    );
}