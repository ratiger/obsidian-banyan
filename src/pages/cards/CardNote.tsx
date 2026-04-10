import { App, WorkspaceLeaf, MarkdownView, Platform } from "obsidian";
import * as React from "react";
import { CardNoteMenuButton, openCardNoteMoreMenu } from "./CardNoteMenu";
import { i18n } from "src/utils/i18n";
import { useCombineStore } from "src/store";
import { FileInfo } from "src/models/FileInfo";
import { createEmptySearchFilterScheme } from "src/models/FilterScheme";
import CardNoteBacklinksView from "./CardNoteBacklinksView";

const NoteContentView = ({ app, fileInfo }: { app: App, fileInfo: FileInfo }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const leaf = React.useRef<any>(null);
  const [overflow, setOverflow] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const cardContentMaxHeight = useCombineStore((state) => state.settings.cardContentMaxHeight);
  const fontTheme = useCombineStore((state) => state.settings.fontTheme);

  React.useEffect(() => {
    const setupView = async () => {
      if (!ref.current) return;
      try {
        if (!leaf.current) leaf.current = new (WorkspaceLeaf as any)(app);
        await (leaf.current as WorkspaceLeaf).openFile(fileInfo.file);
        if (!(leaf.current.view instanceof MarkdownView)) {
          console.log('视图初始化失败或类型不正确', fileInfo.file.name);
          return;
        }
        await leaf.current.view.setState(
          { ...leaf.current.view.getState(), mode: 'preview' },
          { history: false })
        ref.current?.empty();
        ref.current?.appendChild(leaf.current.containerEl);
      } catch (e) { console.log('打开文件失败', e, fileInfo) };
    };
    setupView();
  }, [fileInfo.file.path]);

  // Cleanup leaf on unmount
  React.useEffect(() => {
    return () => {
      if (leaf.current) {
        leaf.current.detach();
        leaf.current = null;
      }
    }
  }, []);

  React.useEffect(() => {
    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        const ele = ref.current?.querySelector('.view-content');
        if (ele) {
          const maxHeight = cardContentMaxHeight === 'expand' ? Infinity :
            cardContentMaxHeight === 'short' ? 160 : 300;
          setOverflow(ele.scrollHeight > maxHeight);
        }
      });
    });
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [cardContentMaxHeight]);

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const getContentClassName = () => {
    let className = "card-note-content";

    if (isExpanded) {
      className += " card-note-content--expanded";
    } else if (cardContentMaxHeight === 'expand') {
      className += " card-note-content--expand";
    } else if (cardContentMaxHeight === 'short') {
      className += " card-note-content--short";
    } else {
      className += " card-note-content--normal";
    }

    if (overflow && !isExpanded && cardContentMaxHeight !== 'expand') {
      className += " card-note-content--overflow";
    }

    return className;
  };

  return (
    <div style={{ position: 'relative' }}>
      <div ref={ref} className={getContentClassName()} data-font-theme={fontTheme} />
      {overflow && !isExpanded && cardContentMaxHeight !== 'expand' && (
        <div
          className="card-note-expand-button"
          onClick={handleExpandToggle}
        >
          {i18n.t('general_expand')}
        </div>
      )}
      {isExpanded && cardContentMaxHeight !== 'expand' && (
        <div
          className="card-note-expand-button"
          onClick={handleExpandToggle}
        >
          {i18n.t('general_collapse')}
        </div>
      )}
    </div>
  );
};

const CardNote = ({ fileInfo, isPinned }: { fileInfo: FileInfo, isPinned: boolean }) => {

  const plugin = useCombineStore((state) => state.plugin);
  const showBacklinksInCardNote = useCombineStore((state) => state.settings.showBacklinksInCardNote);
  const sortType = useCombineStore((state) => state.appData.sortType);
  // isPinned passed as prop
  const setCurScheme = useCombineStore((state) => state.setCurScheme);
  const app = plugin.app;
  const isCreated = sortType === 'created' || sortType === 'earliestCreated';
  const tags = fileInfo.tags;
  const shouldShowTitle = useCombineStore((state) => state.shouldShowTitle);

  return (
    <div className="card-note-container"
      onDoubleClick={(e) => {
        plugin.fileUtils.openFile(fileInfo.file);
        e.preventDefault();
      }}
      onContextMenu={(e) => {
        if (!Platform.isMobile) {
          e.preventDefault();
          openCardNoteMoreMenu({ event: e.nativeEvent, fileInfo, isPinned });
        }
      }}
    >
      <div className="card-note-header">
        <div className="card-note-time">{isPinned ? `${i18n.t('general_pin')} · ` : ""}{isCreated ? i18n.t('created_at') : i18n.t('updated_at')} {new Date(isCreated ? fileInfo.file.stat.ctime : fileInfo.file.stat.mtime).toLocaleString()}</div>
        {shouldShowTitle(fileInfo.file.basename) && <div className="card-note-title"><h3>{fileInfo.file.basename}</h3></div>}
        {tags.length > 0 && <div className="card-note-tags"> {tags.map((tag) =>
          <div className="card-note-tag" key={tag} onClick={() => {
            const fs = createEmptySearchFilterScheme();
            fs.tagFilter.or = [[tag]];
            fs.name = '#' + tag;
            setCurScheme(fs);
          }}>
            <div className="card-note-tag-content">{tag}</div>
          </div>
        )}</div>}
        <div className="card-note-more">
          <CardNoteMenuButton fileInfo={fileInfo} isPinned={isPinned} />
        </div>
      </div>
      <NoteContentView app={app} fileInfo={fileInfo} />
      <div className="card-note-footer">
        {showBacklinksInCardNote && (
          <CardNoteBacklinksView app={app} fileInfo={fileInfo} />
        )}
      </div>
    </div>
  );
};

export default CardNote;