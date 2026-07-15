import { App, WorkspaceLeaf, MarkdownView, Platform, Component, MarkdownRenderer, TFile } from "obsidian";
import * as React from "react";
import { CardNoteMenuButton, openCardNoteMoreMenu } from "./CardNoteMenu";
import { i18n } from "src/utils/i18n";
import { useCombineStore, useDashboardLocalStore } from "src/store";
import { FileInfo } from "src/models/FileInfo";
import { Icon } from "src/components/Icon";
import CardNoteBacklinksView from "./CardNoteBacklinksView";

// ─── NoteContentViewRender ─────────────────────────────────────────────

interface NoteContentViewRenderProps {
  app: App;
  fileInfo: FileInfo;
  editMode?: boolean;
  endEdit?: () => void;
}

const NoteContentViewRender = ({ app, fileInfo, editMode = false, endEdit }: NoteContentViewRenderProps) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const leaf = React.useRef<any>(null);
  const [content, setContent] = React.useState("");
  const [overflow, setOverflow] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const cardContentMaxHeight = useCombineStore((state) => state.settings.cardContentMaxHeight);
  const fontTheme = useCombineStore((state) => state.settings.fontTheme);

  // 1. Fetch file content and subscribe to vault modify events when not in editMode
  React.useEffect(() => {
    if (editMode) return;

    const loadContent = async () => {
      try {
        const text = await app.vault.cachedRead(fileInfo.file);
        setContent(text);
      } catch (e) {
        console.error("读取文件内容失败", e, fileInfo.file.name);
      }
    };

    loadContent();

    const onModify = (file: TFile) => {
      if (file.path === fileInfo.file.path) {
        loadContent();
      }
    };

    app.vault.on("modify", onModify);
    return () => {
      app.vault.off("modify", onModify);
    };
  }, [fileInfo.file.path, editMode, app]);

  // 2. Render markdown content using Obsidian's MarkdownRenderer when not in editMode
  React.useEffect(() => {
    if (editMode) return;
    if (!ref.current) return;

    ref.current.empty();
    const component = new Component();
    component.load();

    MarkdownRenderer.render(app, content, ref.current, fileInfo.file.path, component);

    return () => {
      component.unload();
    };
  }, [content, editMode, app, fileInfo.file.path]);

  // 3. When in editMode, instantiate WorkspaceLeaf to show Obsidian's MarkdownView editor
  React.useEffect(() => {
    if (!editMode) {
      if (leaf.current) {
        leaf.current.detach();
        leaf.current = null;
      }
      return;
    }

    const setupEditView = async () => {
      if (!ref.current) return;
      try {
        if (!leaf.current) leaf.current = new (WorkspaceLeaf as any)(app);
        await (leaf.current as WorkspaceLeaf).openFile(fileInfo.file);
        if (!(leaf.current.view instanceof MarkdownView)) {
          console.log('视图初始化失败或类型不正确', fileInfo.file.name);
          return;
        }
        await leaf.current.view.setState(
          { ...leaf.current.view.getState(), mode: 'source' },
          { history: false }
        );
        ref.current?.empty();
        ref.current?.appendChild(leaf.current.containerEl);
      } catch (e) {
        console.log('打开编辑视图失败', e, fileInfo);
      }
    };

    setupEditView();
  }, [fileInfo.file.path, editMode, app]);

  // Clean up leaf on unmount
  React.useEffect(() => {
    return () => {
      if (leaf.current) {
        leaf.current.detach();
        leaf.current = null;
      }
    };
  }, []);

  // 4. Handle height and overflow detection
  React.useEffect(() => {
    if (editMode) {
      setOverflow(false);
      return;
    }

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        const ele = ref.current;
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
  }, [editMode, cardContentMaxHeight, content]);

  // 5. Handle task list checkbox click/toggle to modify the markdown source file
  React.useEffect(() => {
    if (editMode) return;
    const container = ref.current;
    if (!container) return;

    const handleCheckboxClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains("task-list-item-checkbox")) {
        e.preventDefault();
        e.stopPropagation();

        const checkboxes = Array.from(container.querySelectorAll(".task-list-item-checkbox"));
        const index = checkboxes.indexOf(target);
        if (index === -1) return;

        try {
          const file = fileInfo.file;
          const content = await app.vault.read(file);
          const lines = content.split("\n");
          let currentCheckboxIndex = 0;

          for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(/^(\s*(?:[-*+]|\d+\.))\s+\[([^\]])\]/);
            if (match) {
              if (currentCheckboxIndex === index) {
                const symbol = match[2];
                const newSymbol = symbol === " " ? "x" : " ";
                const linePrefix = match[0];
                const newPrefix = linePrefix.replace(`[${symbol}]`, `[${newSymbol}]`);
                lines[i] = newPrefix + lines[i].substring(linePrefix.length);
                break;
              }
              currentCheckboxIndex++;
            }
          }

          await app.vault.modify(file, lines.join("\n"));
        } catch (err) {
          console.error("更新任务列表状态失败", err);
        }
      }
    };

    container.addEventListener("click", handleCheckboxClick);
    return () => {
      container.removeEventListener("click", handleCheckboxClick);
    };
  }, [fileInfo.file, editMode, app]);

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
          >
            <Icon name="send-horizontal" size="l" color="var(--text-on-accent)" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div className={getContentClassName()}>
        <div className="workspace-leaf">
          <div className="workspace-leaf-content" data-type="markdown">
            <div className="view-content">
              <div className="markdown-preview-view markdown-rendered" data-font-theme={fontTheme}>
                <div className="markdown-preview-sizer">
                  <div ref={ref} className="markdown-preview-section" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
          className="card-note-collapse-button"
          onClick={handleExpandToggle}
        >
          {i18n.t('general_collapse')}
        </div>
      )}
    </div>
  );
};

// ─── RenderCardNote ────────────────────────────────────────────────────

interface RenderCardNoteProps {
  fileInfo: FileInfo;
  isPinned: boolean;
  editable?: boolean;
}

const RenderCardNote = ({ fileInfo, isPinned, editable = false }: RenderCardNoteProps) => {
  const plugin = useCombineStore((state) => state.plugin);
  const showBacklinksInCardNote = useCombineStore((state) => state.settings.showBacklinksInCardNote);
  const sortType = useCombineStore((state) => state.appData.sortType);
  const setCurScheme = useDashboardLocalStore((state) => state.setCurScheme);
  const setCurSchemeToTag = useDashboardLocalStore((state) => state.setCurSchemeToTag);
  const curScheme = useDashboardLocalStore((state) => state.curScheme);
  const pinFile = useDashboardLocalStore((state) => state.pinFile);
  const shouldShowTitle = useCombineStore((state) => state.shouldShowTitle);
  const app = plugin.app;
  const isCreated = sortType === 'created' || sortType === 'earliestCreated';
  const tags = fileInfo.tags;

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
          openCardNoteMoreMenu({ event: e.nativeEvent, fileInfo, isPinned, curScheme, setCurScheme, pinFile });
        }
      }}
    >
      {!editMode && (
        <div className="card-note-header">
          <div className="card-note-time">
            {isPinned ? `${i18n.t('general_pin')} · ` : ""}
            {isCreated ? i18n.t('created_at') : i18n.t('updated_at')}{" "}
            {new Date(isCreated ? fileInfo.file.stat.ctime : fileInfo.file.stat.mtime).toLocaleString()}
          </div>
          {shouldShowTitle(fileInfo.file.basename) && (
            <div className="card-note-title">
              <h3>{fileInfo.file.basename}</h3>
            </div>
          )}
          {tags.length > 0 && (
            <div className="card-note-tags">
              {tags.map((tag) => (
                <div className="card-note-tag" key={tag} onClick={() => { setCurSchemeToTag(tag); }}>
                  <div className="card-note-tag-content">{tag}</div>
                </div>
              ))}
            </div>
          )}
          <div className="card-note-more">
            <CardNoteMenuButton fileInfo={fileInfo} isPinned={isPinned} curScheme={curScheme} setCurScheme={setCurScheme} pinFile={pinFile} />
          </div>
        </div>
      )}
      <NoteContentViewRender
        app={app}
        fileInfo={fileInfo}
        editMode={editMode}
        endEdit={handleEditEnd}
      />
      {!editMode && showBacklinksInCardNote && (
        <div className="card-note-footer">
          <CardNoteBacklinksView app={app} fileInfo={fileInfo} />
        </div>
      )}
    </div>
  );
};

export default RenderCardNote;
