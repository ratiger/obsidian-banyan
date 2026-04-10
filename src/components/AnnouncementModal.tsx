import { App, Modal, MarkdownRenderer, Component } from "obsidian";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { i18n } from "src/utils/i18n";

interface AnnouncementModalProps {
    type: 'welcome' | 'update';
    content: string;
    onClose?: () => void;
}

export class AnnouncementModal extends Modal {
    props: AnnouncementModalProps;
    root: Root | null = null;

    constructor(app: App, props: AnnouncementModalProps) {
        super(app);
        this.props = props;
    }

    onOpen() {
        this.modalEl.addClass('announcement-modal');
        this.root = createRoot(this.modalEl);
        this.root.render(
            <React.StrictMode>
                <AnnouncementContainer app={this.app} props={this.props} close={() => { this.close() }} />
            </React.StrictMode>
        );
        (this as any).shouldRestoreSelection = false;
    }

    onClose() {
        this.root?.unmount();
        this.props.onClose?.();
    }
}

const AnnouncementContainer = ({ app, props, close }: {
    app: App, props: AnnouncementModalProps, close: () => void
}) => {
    const { type, content } = props;
    const buttonText = type === 'welcome' ? i18n.t('announcement_get_started') : i18n.t('announcement_close');
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (contentRef.current) {
            contentRef.current.empty();
            const component = new Component();
            component.load();
            MarkdownRenderer.render(app, content, contentRef.current, '', component);
        }
    }, [content, app]);

    return (
        <div className="announcement-container">
            <div className="announcement-content markdown-rendered" ref={contentRef}>
            </div>
            <div className="announcement-footer">
                <button className="announcement-btn mod-cta" onClick={close}>{buttonText}</button>
            </div>
        </div>
    );
};
