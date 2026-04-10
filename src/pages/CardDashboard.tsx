import { ItemView, WorkspaceLeaf, Menu, Platform } from "obsidian";
import BanyanPlugin from "src/main";
import { StrictMode, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Root, createRoot } from 'react-dom/client';
import * as React from "react";
import CardNote from "./cards/CardNote";
import { Icon } from "src/components/Icon";
import Sidebar from "./sidebar/Sidebar";
import { DefaultFilterSchemeID, getDefaultFilterScheme } from "src/models/FilterScheme";
import { SidebarContent } from "./sidebar/SideBarContent";
import { HeaderView } from "./header/HeaderView";
import EmptyStateCard from "./cards/EmptyStateCard";
import { ViewSelectModal } from "./sidebar/viewScheme/ViewSelectModal";
import { createFileWatcher } from 'src/utils/fileWatcher';
import { FileInfo } from 'src/models/FileInfo';
import { useDashboardLayout } from 'src/hooks/useDashboardLayout';
import { useInfiniteScroll } from 'src/hooks/useInfiniteScroll';
import AddNoteView from "./header/AddNoteView";
import { i18n } from "src/utils/i18n";
import { useCombineStore } from "src/store";
import { SortType } from "src/models/Enum";
import { SortFilesButton } from "./header/SortFilesButton";

// 瀑布流布局辅助函数
const getColumns = (cards: React.JSX.Element[], colCount: number) => {
  const cols: React.JSX.Element[][] = Array.from({ length: colCount }, () => []);
  cards.forEach((card, idx) => {
    cols[idx % colCount].push(card);
  });
  return cols;
};

export const CARD_DASHBOARD_VIEW_TYPE = "dashboard-view";

export class CardDashboard extends ItemView {
  root: Root | null = null;
  plugin: BanyanPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: BanyanPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return CARD_DASHBOARD_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Banyan";
  }

  getIcon(): string {
    return 'wallet-cards';
  }

  async onOpen() {
    this.root = createRoot(this.containerEl.children[1]);
    this.root.render(
      <StrictMode>
        <CardDashboardView plugin={this.plugin} />
      </StrictMode>
    );
    return;
  }

  async onClose() {
    this.root?.unmount();
  }
}

const CardDashboardView = ({ plugin }: { plugin: BanyanPlugin }) => {
  const app = plugin.app;

  const dashboardRef = React.useRef<HTMLDivElement>(null);

  const requestData = useCombineStore((state) => state.requestData);
  const updateDisplayFiles = useCombineStore((state) => state.updateDisplayFiles);
  const curSchemeFiles = useCombineStore((state) => state.curSchemeFiles);
  const displayFiles = useCombineStore((state) => state.displayFiles);
  const curScheme = useCombineStore((state) => state.curScheme);
  const filterSchemes = useCombineStore((state) => state.filterSchemes);
  const viewSchemes = useCombineStore((state) => state.viewSchemes);
  const setCurScheme = useCombineStore((state) => state.setCurScheme);

  // Scroll to top when scheme changes
  useEffect(() => {
    if (dashboardRef.current) {
      dashboardRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [curScheme]);
  const updateViewScheme = useCombineStore((state) => state.updateViewScheme);
  const curSchemeNotesLength = useCombineStore((state) => state.curSchemeFiles.length);
  const needRefresh = useCombineStore((state) => state.needRefresh);
  const hasEditingFiles = useCombineStore((state) => state.hasEditingFiles);
  const resetEditingFiles = useCombineStore((state) => state.resetEditingFiles);

  const cardsDirectory = useCombineStore((state) => state.settings.cardsDirectory);
  const useCardNote2 = useCombineStore((state) => state.settings.useCardNote2);
  const sortType = useCombineStore((state) => state.appData.sortType) || 'created';
  const randomBrowse = useCombineStore((state) => state.appData.randomBrowse);
  const { showSidebar, setShowSidebar, colCount } = useDashboardLayout(dashboardRef);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const notesPerPage = 10; // 每页显示的笔记数量

  const [refreshFlag, setRefreshFlag] = useState(0);

  const updateSingleFile = useCombineStore((state) => state.updateSingleFile);
  const removeSingleFile = useCombineStore((state) => state.removeSingleFile);
  const updateWhenDeleteFile = useCombineStore((state) => state.updateWhenDeleteFile);

  // 文件监听逻辑
  useEffect(() => {
    const watcher = createFileWatcher(plugin);
    const unsubscribe = watcher.onChange(({ type, fileInfo }) => {
      if (type === 'create') {
        // 新文件需要全量刷新（要重新过滤/排序）
        setRefreshFlag(f => f + 1);
      } else if (type === 'delete') {
        // 删除文件：增量移除，不刷新整个面板
        const path = 'path' in fileInfo ? fileInfo.path : fileInfo.file.path;
        removeSingleFile(path);
        updateWhenDeleteFile(path);
      } else if (type === 'modify' || type === 'meta-change') {
        // 修改/元数据变化：仅更新受影响的单个文件
        if (!hasEditingFiles() && 'tags' in fileInfo) {
          updateSingleFile(fileInfo as FileInfo);
        }
      }
    });
    return () => {
      unsubscribe();
      watcher.dispose();
    };
  }, [app]);

  const handleRefresh = useCallback(() => {
    setRefreshFlag(f => f + 1);
  }, []);

  useEffect(() => {
    const requestFiles = async () => {
      resetEditingFiles();
      setIsLoading(true);
      await requestData();
      setCurrentPage(1);
      setIsLoading(false);
    }
    requestFiles();
  }, [sortType, curScheme, refreshFlag, cardsDirectory, randomBrowse]);

  useEffect(() => {
    if (needRefresh) {
      setRefreshFlag(f => f + 1);
    }
  }, [needRefresh]);

  useEffect(() => {
    updateDisplayFiles(currentPage * notesPerPage);
  }, [currentPage, curSchemeFiles]);

  const loadMoreNotes = useCallback(() => {
    if (isLoading) return;
    setCurrentPage(prevPage => prevPage + 1);
  }, [isLoading]);

  const lastCardElementRef = useInfiniteScroll(isLoading, loadMoreNotes);

  const handleBatchImportToView = () => {
    const modal = new ViewSelectModal(app, {
      viewSchemes: viewSchemes,
      onSelect: (scheme) => {
        const temp = new Set<string>([...scheme.files, ...displayFiles.map((f) => f.file.path)]);
        const newFiles = Array.from(temp);
        const newScheme = { ...scheme, files: newFiles };
        updateViewScheme(newScheme);
      }
    });
    modal.open();
  };

  const cardNodes = useMemo(() => displayFiles.map((f, index) => {
    const isLastCard = index === displayFiles.length - 1;
    const isPinned = curScheme.pinned.includes(f.file.path);
    return (
      <div ref={isLastCard ? lastCardElementRef : null} key={f.file.path}>
        <CardNote fileInfo={f} isPinned={isPinned} editable={!Platform.isMobile && useCardNote2} />
      </div>
    );
  }), [displayFiles, curScheme.pinned, lastCardElementRef, useCardNote2]);

  // 瀑布流布局
  const columns = useMemo(() => getColumns(cardNodes, colCount), [cardNodes, colCount]);

  return (
    <div className="dashboard-container" ref={dashboardRef}>
      {showSidebar != 'normal' && <Sidebar visible={showSidebar == 'show'} onClose={() => setShowSidebar('hide')}><SidebarContent /></Sidebar>}
      {showSidebar == 'normal' && <SidebarContent />}
      <div className="main-container">
        <HeaderView
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          curScheme={curScheme}
          filterSchemes={filterSchemes}
          setCurScheme={setCurScheme}
        />
        {!Platform.isMobile && <div className="main-header-add-note-container"><AddNoteView app={app} plugin={plugin} onAdd={handleRefresh} /></div>}
        <div className="main-subheader-container">
          <div className="main-subheader-info">
            <div className="refresh-btn" onClick={handleRefresh}>
              <Icon name="refresh-ccw" />
            </div>
            <span className="main-subheader-loaded-notes">{i18n.t('loaded_notes', { count: `${displayFiles.length}`, total: `${curSchemeNotesLength}` })}</span>
            {cardNodes.length > 0 && <SortFilesButton />}
          </div>
          <div className="main-subheader-btn-section">
            {curScheme.type != 'ViewScheme' && curScheme.id != DefaultFilterSchemeID && cardNodes.length > 0 && <button className="clickable-icon batch-add-button" onClick={handleBatchImportToView}>{i18n.t('batch_add_to_view')}</button>}
          </div>
        </div>
        <div className="main-cards">
          {cardNodes.length === 0 ? (
            <EmptyStateCard isSearch={curScheme.type == 'FilterScheme' && curScheme.id !== DefaultFilterSchemeID} />
          ) : (
            columns.map((col, idx) => (
              <div className="main-cards-column" key={idx}>{col}</div>
            ))
          )}
        </div>
        {/* Add loading and end-of-list indicators here */}
        <div className="main-cards-loading">
          {isLoading && <div>{i18n.t('loading_text')}</div>}
          {!isLoading && displayFiles.length >= curSchemeNotesLength && cardNodes.length > 0 && <div>{i18n.t('reached_bottom')}</div>}
        </div>
        {/* 手机端悬浮添加按钮 */}
        {Platform.isMobile && (
          <>
            <button
              className="fab-add-note clickable-icon"
              onClick={() => plugin.fileUtils.addFile()}
              title={i18n.t('create_note')}
            >
              <Icon name="plus" size="xl" color="var(--text-on-accent)" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
