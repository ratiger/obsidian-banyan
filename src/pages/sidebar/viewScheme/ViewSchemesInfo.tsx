import React from "react";
import { Icon } from "src/components/Icon";
import { ViewScheme } from "src/models/ViewScheme";
import { SidebarButton } from "../SidebarButton";
import { Menu } from "obsidian";
import { ViewEditModal } from "./ViewEditModal";
import { i18n } from "src/utils/i18n";
import { useCombineStore, useDashboardLocalStore } from "src/store";

export const ViewSchemesInfo = () => {

    const app = useCombineStore((state) => state.plugin.app);
    const viewSchemes = useCombineStore((state) => state.viewSchemes);
    const curScheme = useDashboardLocalStore((state) => state.curScheme);
    const curViewSchemeID = curScheme.type === 'ViewScheme' ? curScheme.id : undefined;
    const setCurScheme = useDashboardLocalStore((state) => state.setCurScheme);
    const reorderViewSchemes = useCombineStore((state) => state.reorderViewSchemes);
    const updateViewScheme = useCombineStore((state) => state.updateViewScheme);
    const createViewScheme = useCombineStore((state) => state.createViewScheme);
    const deleteViewScheme = useCombineStore((state) => state.deleteViewScheme);
    const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

    // 从设置中获取展开状态
    const viewSchemesExpanded = useCombineStore((state) => state.appData.viewSchemesExpanded);
    const updateViewSchemesExpanded = useCombineStore((state) => state.updateViewSchemesExpanded);

    const handleCreateViewScheme = () => {
        const maxId = viewSchemes.length > 0 ? Math.max(...viewSchemes.map(s => s.id)) : 0;
        const newScheme = {
            id: maxId + 1,
            name: '',
            files: [],
            pinned: [],
            type: 'ViewScheme' as const
        };
        const modal = new ViewEditModal(app, {
            viewScheme: newScheme,
            isNew: true,
            onSave: (updatedScheme: ViewScheme) => {
                createViewScheme(updatedScheme);
            }
        });
        modal.open();
    }

    const handleMenuClick = (action: string, index: number) => {
        if (action === 'update') {
            const modal = new ViewEditModal(app, {
                viewScheme: { ...viewSchemes[index] },
                isNew: false,
                onSave: (updatedScheme: ViewScheme) => {
                    updateViewScheme(updatedScheme);
                }
            });
            modal.open();
        } else if (action === 'duplicate') {
            const maxId = viewSchemes.length > 0 ? Math.max(...viewSchemes.map(s => s.id)) : 0;
            const newScheme = {
                ...viewSchemes[index],
                id: maxId + 1,
                name: `${viewSchemes[index].name} ${i18n.t('general_copy')}`
            };
            createViewScheme(newScheme);
        } else if (action === 'delete') {
            deleteViewScheme(viewSchemes[index].id);
        }
    };

    const handleViewSchemeClickMore = (event: MouseEvent, index: number) => {
        const menu = new Menu();
        menu.addItem((item) => {
            item.setTitle(i18n.t('general_update'));
            item.onClick(() => handleMenuClick('update', index));
        });
        menu.addSeparator();
        menu.addItem((item) => {
            item.setTitle(i18n.t('general_delete'));
            item.onClick(() => handleMenuClick('delete', index));
        });
        menu.showAtMouseEvent(event);
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (index: number, e: React.DragEvent) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (index: number) => {
        if (draggedIndex === null) return;
        const newSchemes = [...viewSchemes];
        const [removed] = newSchemes.splice(draggedIndex, 1);
        newSchemes.splice(index, 0, removed);
        reorderViewSchemes(newSchemes);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // 切换ViewSchemes的展开/折叠状态
    const toggleViewSchemesExpanded = () => {
        updateViewSchemesExpanded(!viewSchemesExpanded);
    };

    return (
        <div className='view-scheme-container'>
            <div className='view-scheme-header'>
                <div className='view-scheme-header-left'>
                    <div className='view-scheme-header-toggle'>
                        <button className='view-scheme-header-toggle-btn clickable-icon'
                            onClick={toggleViewSchemesExpanded}>
                            <Icon name={viewSchemesExpanded ? 'chevron-down' : 'chevron-right'} size='m' color='var(--interactive-accent)' />
                        </button>
                    </div>
                    <div className='view-scheme-header-title'>
                        <span>{i18n.t('view_schemes')}</span>
                    </div>
                </div>
                <div className='view-scheme-header-add'>
                    <button className='view-scheme-header-add-btn clickable-icon'
                        onClick={handleCreateViewScheme}>
                        <Icon name='plus' size='m' color='var(--interactive-accent)' />
                    </button>
                </div>
            </div>
            {viewSchemesExpanded && (
                <div className='view-scheme-list'>
                    {viewSchemes.map((scheme, index) => (
                        <div
                            key={scheme.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(index, e)}
                            onDrop={() => handleDrop(index)}
                            onDragEnd={() => handleDragEnd()}
                            className={`view-scheme-item ${draggedIndex === index ? 'view-scheme-item-dragged' : ''
                                } ${dragOverIndex === index && draggedIndex !== null ? 'view-scheme-item-dragover' : ''
                                }`}>
                            <SidebarButton
                                label={scheme.name}
                                selected={curViewSchemeID === scheme.id}
                                onClick={() => setCurScheme(scheme)}
                                rightIconName='ellipsis'
                                rightLabel={`${scheme.files.length}`}
                                onClickRightIcon={(e) => handleViewSchemeClickMore(e, index)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

