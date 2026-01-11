import { App, WorkspaceLeaf, MarkdownView, Editor, Notice } from "obsidian";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "src/components/Icon";
import TagInput from "src/components/TagInput";
import BanyanPlugin from "src/main";
import { i18n } from "src/utils/i18n";
import { useCombineStore } from "src/store";
import { legalFileName } from "src/utils/utils";

interface AddNoteViewProps {
  app: App;
  plugin: BanyanPlugin;
  onAdd: () => void;
}

const AddNoteView: React.FC<AddNoteViewProps> = ({ app, plugin, onAdd }) => {
  const ref = useRef<HTMLDivElement>(null);
  const leaf: WorkspaceLeaf = new (WorkspaceLeaf as any)(app);
  const [titleFocused, setTitleFocused] = useState(false);
  const [contentFocused, setContentFocused] = useState(false);
  const [tagsFocused, setTagsFocused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [showThis, setShowThis] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [title, setTitle] = useState<string>('');
  const [isTitleInvalid, setIsTitleInvalid] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateHasContent = useCallback(() => {
    const ele = leaf.view.containerEl.querySelector('.cm-content') as HTMLElement;
    const content = ele?.innerText.trim() ?? '';
    setHasContent(content.length > 0);
  }, [leaf.view.containerEl]);

  useEffect(() => {
    const setupView = async () => {
      if (!ref.current) return;
      try {
        const file = await plugin.fileUtils.getPlaceholderFile();
        await (leaf as WorkspaceLeaf).openFile(file);
        setShowThis(true);
        updateHasContent();
        if (!(leaf.view instanceof MarkdownView)) {
          console.warn('添加笔记编辑区初始化失败');
          return;
        }
        setEditor(leaf.view.editor);
        await leaf.view.setState(
          { ...leaf.view.getState(), mode: 'source' },
          { history: false })
        ref.current?.empty();
        ref.current?.appendChild(leaf.view.containerEl);
      } catch (e) {
        console.warn('打开占位文件失败', e);
        setShowThis(false);
      };
    };
    setupView();
  }, []);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(async (mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const targetElement = mutation.target as HTMLElement;
          if (targetElement.classList.contains('cm-editor')) {
            setContentFocused(targetElement.classList.contains('cm-focused'));
            updateHasContent();
          }
        }
      });
    });

    if (ref.current) {
      observer.observe(ref.current, {
        childList: true,      // 监听子节点增删
        attributes: true, // 监听属性变化
        attributeFilter: ['class'], // 仅监听 class 属性
        subtree: true, // 监听子元素
      });
    }

    return () => observer.disconnect(); // 组件卸载时销毁监听
  }, []);

  const allTags = useMemo(() => {
    const tags = plugin.fileUtils.getAllFilesTags();
    return tags;
  }, [app, plugin]);

  useEffect(() => {
    setFocused(titleFocused || contentFocused || tagsFocused);
  }, [titleFocused, contentFocused, tagsFocused]);

  useEffect(() => {
    setShowPlaceholder(!contentFocused && !hasContent); // 只有在没有焦点且没有内容时显示占位符，否则隐藏占位符
  }, [contentFocused, hasContent]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [title]);

  if (!showThis) return null;

  return (
    <div className={"add-note-container" + (focused ? " add-note-container--focusd" : "")} >
      <div className={`add-note-title ${isTitleInvalid ? 'add-note-title-input--invalid' : ''}`}>
        <textarea
          ref={textareaRef}
          onFocus={() => setTitleFocused(true)}
          onBlur={() => setTitleFocused(false)}
          placeholder={i18n.t('editor_title_placeholder')}
          value={title}
          rows={1}
          onChange={(e) => {
            const newTitle = e.target.value;
            setTitle(newTitle);
            setIsTitleInvalid(newTitle.length > 0 && !legalFileName(newTitle));
          }}
          onKeyDown={(e) => {
            // 防止用户在标题输入换行符
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              editor?.focus();
            }
          }}
        />
      </div>
      <div className="add-note-content-container" onClick={(e) => {
        editor?.focus();
      }}>
        {showPlaceholder && <div className="add-note-placeholder">{i18n.t('editor_content_placeholder')}</div>}
        <div ref={ref} className="add-note-content" />
      </div>
      <div className="add-note-footer">
        <div className="add-note-tag-input-container"><TagInput tags={tags} onChange={setTags} allTags={allTags} placeholder={i18n.t('editor_tags_placeholder')} allowCreate={true}
          onFocus={() => setTagsFocused(true)}
          onBlur={() => setTagsFocused(false)}
        /></div>
        <button className={`add-note-send-button ${focused ? 'clickable-icon' : ''}`}
          onClick={async () => {
            const file = await plugin.fileUtils.getPlaceholderFile();
            const body = await plugin.fileUtils.readFileContent(file);
            const _title = title.trim();
            if (body.trim().length === 0 && tags.length === 0 && _title.length === 0) return;

            // 检查标题合法性
            if (_title && !legalFileName(_title)) {
              new Notice(i18n.t('illegal_title_chars'));
              return;
            }

            await plugin.fileUtils.addFile(_title, body, tags, false);
            await plugin.fileUtils.modifyFileContent(file, '');
            setTags([]);
            setTitle('');
            onAdd();
            new Notice(i18n.t('new_note_added'));
          }}><Icon name="send-horizontal" size="l" color="var(--text-on-accent)" /></button>
      </div>
    </div>
  );
};

export default AddNoteView;