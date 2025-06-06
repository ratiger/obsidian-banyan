import { App, Modal, Platform } from "obsidian";
import { FilterScheme } from "src/models/FilterScheme";
import { FilterView } from "./FilterView";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { i18n } from "src/utils/i18n";

interface FilterEditModalProps {
    filterScheme: FilterScheme;
    allTags: string[];
    onSave: (updatedScheme: FilterScheme) => void;
    isNew: boolean;
}

export class FilterEditModal extends Modal {
    props: FilterEditModalProps;
    root: Root | null = null;
    unmount: (() => void) | null = null;
    constructor(app: App, props: FilterEditModalProps) {
        super(app);
        this.props = props;
    }
    onOpen() {
        this.root = createRoot(this.containerEl.children[1]);
        this.root.render(
            <React.StrictMode>
                <FilterViewContainer props={this.props} close={() => { this.close() }} />
            </React.StrictMode>
        );
    }

    onClose() {
        this.root?.unmount();
    }
}

const FilterViewContainer = ({ props, close }: { props: FilterEditModalProps, close: () => void }) => {
    const { filterScheme, allTags, onSave, isNew } = props;
    const [scheme, setScheme] = React.useState(filterScheme);
    const handleSave = () => {
        onSave(scheme);
        close();
    };
    const handleCancel = () => {
        close();
    };
    return <div className="filter-modal-container" style={{ padding: '30px 20px 30px 20px' }}>
        <div style={{}}>
            <div style={{ marginBottom: 16, fontWeight: "bold" }}>{isNew ? i18n.t('filter_scheme_title_create') : i18n.t('filter_scheme_title_update')}</div>
            <FilterView
                allTags={allTags}
                filterScheme={scheme}
                setFilterScheme={v => setScheme(v)}
                showLabel={!Platform.isMobile}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                <button onClick={handleCancel}>{i18n.t('general_cancel')}</button>
                <button onClick={handleSave} style={{ background: "var(--interactive-accent)", color: "var(--text-on-accent)", border: "none", borderRadius: 4, padding: "4px 16px" }}>{i18n.t('general_save')}</button>
            </div>
        </div>
    </div>;
};