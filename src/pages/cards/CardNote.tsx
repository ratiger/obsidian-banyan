import { App, WorkspaceLeaf, MarkdownView, Platform } from "obsidian";
import * as React from "react";
import { CardNoteMenuButton, openCardNoteMoreMenu } from "./CardNoteMenu";
import { i18n } from "src/utils/i18n";
import { useCombineStore } from "src/store";
import { FileInfo } from "src/models/FileInfo";
import { createEmptySearchFilterScheme } from "src/models/FilterScheme";
import { Icon } from "src/components/Icon";
import CardNoteBacklinksView from "./CardNoteBacklinksView";

// ─── NoteContentView ───────────────────────────────────────────────────

interface NoteContentViewProps {
  app: App;
  fileInfo: FileInfo;
  editMode?: boolean;
  endEdit?: () => void;
}

const NoteContentView = ({ app, fileInfo, editMode = false, endEdit }: NoteContentViewProps) => {
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
          { ...leaf.current.view.getState(), mode: editMode ? 'source' : 'preview' },
          { history: false })
        ref.current?.empty();
        ref.current?.appendChild(leaf.current.containerEl);
      } catch (e) { console.log('打开文件失败', e, fileInfo) };
    };
    setupView();
  }, [fileInfo.file.path, editMode]);

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
    if (editMode) {
      setOverflow(false);
      return;
    }
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
  }, [editMode, cardContentMaxHeight]);

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

  if (editMode) {
    return (
      <div className="card-note-edit-content" onDoubleClick={e => e.preventDefault()}>
        <div ref={ref} />
        <div className="card-note-edit-footer">
          <button
            className="card-note-edit-btn clickable-icon"
            onClick={() => endEdit?.()}
          ><Icon name="send-horizontal" size="l" color="var(--text-on-accent)" /></button>
        </div>
      </div>
    );
  }

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

// ─── CardNote ──────────────────────────────────────────────────────────

interface CardNoteProps {
  fileInfo: FileInfo;
  isPinned: boolean;
  editable?: boolean;
}

const CardNote = ({ fileInfo, isPinned, editable = false }: CardNoteProps) => {

  const plugin = useCombineStore((state) => state.plugin);
  const showBacklinksInCardNote = useCombineStore((state) => state.settings.showBacklinksInCardNote);
  const sortType = useCombineStore((state) => state.appData.sortType);
  const setCurScheme = useCombineStore((state) => state.setCurScheme);
  const shouldShowTitle = useCombineStore((state) => state.shouldShowTitle);
  const app = plugin.app;
  const isCreated = sortType === 'created' || sortType === 'earliestCreated';
  const tags = fileInfo.tags;

  // 编辑模式状态（仅 editable 时使用）
  const addEditingFile = useCombineStore((state) => state.addEditingFile);
  const deleteEditingFile = useCombineStore((state) => state.deleteEditingFile);
  const editMode = useCombineStore((state) =>
    editable ? state.editingFilesPath.includes(fileInfo.file.path) : false
  );

  const handleDoubleClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (editable) {
      addEditingFile(fileInfo.file.path);
    } else {
      plugin.fileUtils.openFile(fileInfo.file);
    }
  }, [editable, addEditingFile, fileInfo.file.path, plugin]);

  const handleEditEnd = React.useCallback(() => {
    deleteEditingFile(fileInfo.file.path);
  }, [deleteEditingFile, fileInfo.file.path]);

  return (
    <div
      className={"card-note-container" + (editMode ? " card-note-container--edit" : "")}
      onDoubleClick={handleDoubleClick}
      onContextMenu={e => {
        if (!Platform.isMobile) {
          e.preventDefault();
          openCardNoteMoreMenu({ event: e.nativeEvent, fileInfo, isPinned });
        }
      }}
    >
      {!editMode && <div className="card-note-header">
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
      </div>}
      <NoteContentView
        app={app}
        fileInfo={fileInfo}
        editMode={editMode}
        endEdit={handleEditEnd}
      />
      {!editMode && showBacklinksInCardNote && <div className="card-note-footer">
        <CardNoteBacklinksView app={app} fileInfo={fileInfo} />
      </div>}
    </div>
  );
};

export default CardNote;