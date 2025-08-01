import { App, Platform, PluginSettingTab, Setting } from 'obsidian';
import BanyanPlugin from './main';
import { i18n } from './utils/i18n';
import FolderSuggest from './components/FolderSuggest';
import { useCombineStore } from './store';

export class BanyanSettingTab extends PluginSettingTab {
	plugin: BanyanPlugin;

	constructor(app: App, plugin: BanyanPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		this.setupOpenWhenStartObsidianSetting(containerEl);
		this.setupCardsDirectorySetting(containerEl);		
		this.setupTitleDisplayModeSetting(containerEl);
		this.setupCardsColumnsSetting(containerEl);
        this.setupShowBacklinksSetting(containerEl);
        this.setupUseCardNote2Setting(containerEl); // 新增
        this.setupUseZkPrefixerFormatSetting(containerEl); // 新增
	}

	setupCardsDirectorySetting(containerEl: HTMLElement) {
		const settings = useCombineStore.getState().settings;
		new Setting(containerEl)
			.setName(i18n.t('setting_note_directory_name'))
			.setDesc(i18n.t('setting_note_directory_desc'))
			.addText(async text => {
				new FolderSuggest(this.app, text.inputEl, async (value) => {
					text.setValue(value);
					useCombineStore.getState().updateCardsDirectory(value);
				});
				text.setValue(settings.cardsDirectory || "")
					.onChange(async (value) => {
						useCombineStore.getState().updateCardsDirectory(value);
					});
			});
	}

	setupOpenWhenStartObsidianSetting(containerEl: HTMLElement) {
		const settings = useCombineStore.getState().settings;
		new Setting(containerEl)
			.setName(i18n.t('setting_on_open_name'))
			.setDesc(i18n.t('setting_on_open_desc'))
			.addToggle(toggle => {
				toggle.setValue(settings.openWhenStartObsidian)
					.onChange(async (value) => {
						useCombineStore.getState().updateOpenWhenStartObsidian(value);
					});
			});
	}

	setupTitleDisplayModeSetting(containerEl: HTMLElement) {
		const settings = useCombineStore.getState().settings;
		new Setting(containerEl)
			.setName(i18n.t('setting_title_display_mode_name'))
			.setDesc(i18n.t('setting_title_display_mode_desc'))
			.addDropdown(dropdown => {
				dropdown.addOption('propertyOrNone', i18n.t('setting_title_display_mode_property_or_none'))
					.addOption('propertyThenFile', i18n.t('setting_title_display_mode_property_then_file'))
					.addOption('fileOnly', i18n.t('setting_title_display_mode_file_only'))
					.addOption('none', i18n.t('setting_title_display_mode_none'))
					.setValue(settings.titleDisplayMode)
					.onChange(async (value) => {
						useCombineStore.getState().updateTitleDisplayMode(value as 'propertyOrNone' | 'propertyThenFile' | 'fileOnly' | 'none');
					});
			});
	}

	setupCardsColumnsSetting(containerEl: HTMLElement) {
		if (Platform.isMobile) return;
		const settings = useCombineStore.getState().settings;
		new Setting(containerEl)
			.setName(i18n.t('setting_col_nums_name'))
			.setDesc(i18n.t('setting_col_nums_desc'))
			.addDropdown(dropdown => {
				dropdown.addOption('1', i18n.t('setting_col_nums_1_col'))
					.addOption('2', i18n.t('setting_col_nums_2_col'))
					.setValue(settings.cardsColumns.toString())
					.onChange(async (value) => {
						useCombineStore.getState().updateCardsColumns(parseInt(value));
					});
			});
	}

    setupShowBacklinksSetting(containerEl: HTMLElement) {
        const settings = useCombineStore.getState().settings;
        new Setting(containerEl)
            .setName(i18n.t('setting_show_backlinks_name'))
            .setDesc(i18n.t('setting_show_backlinks_desc'))
            .addToggle(toggle => {
                toggle.setValue(settings.showBacklinksInCardNote ?? false)
                    .onChange(async (value) => {
                        useCombineStore.getState().updateShowBacklinksInCardNote(value);
                    });
            });
    }

    setupUseCardNote2Setting(containerEl: HTMLElement) {
        if (Platform.isMobile) return; // 移动端不显示此设置
        const settings = useCombineStore.getState().settings;
        new Setting(containerEl)
            .setName(i18n.t('setting_use_cardnote2_name'))
            .setDesc(i18n.t('setting_use_cardnote2_desc'))
            .addToggle(toggle => {
                toggle.setValue(settings.useCardNote2 ?? false)
                    .onChange(async (value) => {
                        useCombineStore.getState().updateUseCardNote2(value);
                    });
            });
    }

    setupUseZkPrefixerFormatSetting(containerEl: HTMLElement) {
        const settings = this.plugin.settings;
        new Setting(containerEl)
            .setName(i18n.t('setting_use_zk_prefixer_format_name'))
            .setDesc(i18n.t('setting_use_zk_prefixer_format_desc'))
            .addToggle(toggle => {
                toggle.setValue(settings.useZkPrefixerFormat ?? true)
                    .onChange(async (value) => {
                        this.plugin.settings.useZkPrefixerFormat = value;
                        await this.plugin.saveSettings();
                    });
            });
    }

}
