import { ItemView, WorkspaceLeaf, Menu, Platform } from "obsidian";
import BanyanPlugin from "src/main";
import { StrictMode, useEffect, useState, useRef, useCallback } from 'react';
import { Root, createRoot } from 'react-dom/client';
import * as React from "react";
import CardNote from "./cards/CardNote";
import CardNote2 from "./cards/CardNote2";
import { Icon } from "src/components/Icon";
import Sidebar from "./sidebar/Sidebar";
import { DefaultFilterSchemeID, getDefaultFilterScheme } from "src/models/FilterScheme";
import { SidebarContent } from "./sidebar/SideBarContent";
import { HeaderView } from "./header/HeaderView";
import EmptyStateCard from "./cards/EmptyStateCard";
import { ViewSelectModal } from "./sidebar/viewScheme/ViewSelectModal";
import { createFileWatcher } from 'src/utils/fileWatcher';
import AddNoteView from "./header/AddNoteView";
import { i18n } from "src/utils/i18n";
import { useCombineStore } from "src/store";
import { SortType } from "src/models/Enum";

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
  const setCurSchemeOriginal = useCombineStore((state) => state.setCurScheme);

  // 包装 setCurScheme 函数，在切换 scheme 时滚动到顶部
  const setCurScheme = useCallback((scheme: any) => {
    setCurSchemeOriginal(scheme);
    // 滚动到页面顶部
    if (dashboardRef.current) {
      dashboardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [setCurSchemeOriginal]);
  const updateViewScheme = useCombineStore((state) => state.updateViewScheme);
  const curSchemeNotesLength = useCombineStore((state) => state.curSchemeFiles.length);
  const needRefresh = useCombineStore((state) => state.needRefresh);
  const hasEditingFiles = useCombineStore((state) => state.hasEditingFiles);
  const resetEditingFiles = useCombineStore((state) => state.resetEditingFiles);

  const settings = useCombineStore((state) => state.settings);
  const [showSidebar, setShowSidebar] = useState<'normal' | 'hide' | 'show'>(Platform.isMobile ? 'hide' : 'normal');
  const [sortType, setSortType] = useState<SortType>(settings.sortType || 'created');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const notesPerPage = 10; // 每页显示的笔记数量
  const [colCount, setColCount] = useState(1);

  const [refreshFlag, setRefreshFlag] = useState(0);

  // 文件监听逻辑
  useEffect(() => {
    const watcher = createFileWatcher(plugin);
    const unsubscribe = watcher.onChange(({ type }) => {
      if (type === 'create' || type === 'delete') {
        setRefreshFlag(f => f + 1);
      }
      if (type === 'modify' || type === 'meta-change') {
        if (!hasEditingFiles()) {
          setRefreshFlag(f => f + 1);
        }
      }
    });
    return () => {
      unsubscribe();
      watcher.dispose();
    };
  }, [app]);

  useEffect(() => {
    const requestFiles = async () => {
      resetEditingFiles();
      setIsLoading(true);
      await requestData();
      setCurrentPage(1);
      setIsLoading(false);
    }
    requestFiles();
  }, [sortType, curScheme, refreshFlag, settings.cardsDirectory, settings.randomBrowse]);

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

  const observer = useRef<IntersectionObserver>(null);
  const lastCardElementRef = useCallback((node: HTMLElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadMoreNotes();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, loadMoreNotes]);

  useEffect(() => {
    const updateCol = () => {
      if (Platform.isMobile) {
        setShowSidebar('hide');
        setColCount(1);
        return;
      }
      if (!dashboardRef.current) return;
      const containerWidth = dashboardRef.current.clientWidth;
      const _showSidebar = containerWidth >= 920 ? 'normal' : 'hide'; // 920 是试验效果得来的
      setShowSidebar(_showSidebar);
      const currentSettings = useCombineStore.getState().settings;
      const cardsColumns = currentSettings.cardsColumns;
      if (cardsColumns == 1) {
        setColCount(1);
        return;
      }
      const mainWidth = containerWidth - (_showSidebar == 'normal' ? 400 : 0);
      const cardWidth = 620;
      const cardsPadding = 24;
      const widthFor2Cols = cardWidth + cardsPadding + cardWidth;
      const cnt = mainWidth >= widthFor2Cols ? 2 : 1;
      setColCount(cnt);
    };

    // 初始化时执行一次
    updateCol();

    // 使用ResizeObserver监听主容器尺寸变化
    const resizeObserver = new ResizeObserver(updateCol);
    if (dashboardRef.current) {
      resizeObserver.observe(dashboardRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [settings.cardsColumns]);

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

  const cardNodes = displayFiles.map((f, index) => {
    const isLastCard = index === displayFiles.length - 1;
    return (
      <div ref={isLastCard ? lastCardElementRef : null} key={f.file.path}>
        {(!Platform.isMobile && settings.useCardNote2) ? <CardNote2 fileInfo={f} /> : <CardNote fileInfo={f} />}
      </div>
    );
  });

  // 瀑布流布局
  const getColumns = (cards: React.JSX.Element[], colCount: number) => {
    const cols: React.JSX.Element[][] = Array.from({ length: colCount }, () => []);
    cards.forEach((card, idx) => {
      cols[idx % colCount].push(card);
    });
    return cols;
  };
  const columns = getColumns(cardNodes, colCount);

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
        {!Platform.isMobile && <div className="main-header-add-note-container"><AddNoteView app={app} plugin={plugin} onAdd={() => setRefreshFlag(f => f + 1)} /></div>}
        <div className="main-subheader-container">
          <div className="main-subheader-info">
            <div className="refresh-btn"
              children={<Icon name="refresh-ccw" />}
              onClick={() => setRefreshFlag(f => f + 1)}
            />
            <span className="main-subheader-loaded-notes">{i18n.t('loaded_notes', { count: `${displayFiles.length}`, total: `${curSchemeNotesLength}` })}</span>
            {cardNodes.length > 0 && <SortFilesButton plugin={plugin} sortType={sortType} setSortType={setSortType} />}
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

const SortFilesButton = ({ plugin, sortType, setSortType }: { plugin: BanyanPlugin, sortType: SortType, setSortType: (st: SortType) => void }) => {
  const updateSortType = useCombineStore((state) => state.updateSortType);

  const sortMenu = (event: MouseEvent) => {
    const sortMenu = new Menu();
    sortMenu.addItem((item) => {
      item.setTitle(i18n.t('recently_created'));
      item.setChecked(sortType === 'created');
      item.onClick(() => {
        setSortType('created');
        updateSortType('created');
      });
    });
    sortMenu.addItem((item) => {
      item.setTitle(i18n.t('recently_updated'));
      item.setChecked(sortType === 'modified');
      item.onClick(() => {
        setSortType('modified');
        updateSortType('modified');
      });
    });
    sortMenu.addItem((item) => {
      item.setTitle(i18n.t('earliest_created'));
      item.setChecked(sortType === 'earliestCreated');
      item.onClick(() => {
        setSortType('earliestCreated');
        updateSortType('earliestCreated');
      });
    });
    sortMenu.addItem((item) => {
      item.setTitle(i18n.t('earliest_updated'));
      item.setChecked(sortType === 'earliestModified');
      item.onClick(() => {
        setSortType('earliestModified');
        updateSortType('earliestModified');
      });
    });
    sortMenu.showAtMouseEvent(event);
  };

  return (
    <button className="clickable-icon sort-button"
      children={<Icon name="arrow-down-wide-narrow" />}
      onClick={(e) => sortMenu(e.nativeEvent)}
    />
  );
}