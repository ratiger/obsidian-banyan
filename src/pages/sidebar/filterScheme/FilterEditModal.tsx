import { App, Modal, Platform, Notice } from "obsidian";
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
        if (!scheme.name || scheme.name.trim() === "") {
            new Notice(i18n.t('filter_scheme_name_empty_warning'));
            return;
        }
        onSave(scheme);
        close();
    };
    const handleCancel = () => {
        close();
    };
    return <div className="filter-modal-container">
        <div>
            <div className="filter-modal-title">{isNew ? i18n.t('filter_scheme_title_create') : i18n.t('filter_scheme_title_update')}</div>
            <FilterView
                allTags={allTags}
                filterScheme={scheme}
                setFilterScheme={v => setScheme(v)}
                showLabel={!Platform.isMobile}
            />
            <div className="filter-modal-footer">
                <button onClick={handleCancel}>{i18n.t('general_cancel')}</button>
                <button onClick={handleSave} className="mod-cta">{i18n.t('general_save')}</button>
            </div>
        </div>
    </div>;
};