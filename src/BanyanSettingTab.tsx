import { App, Platform, PluginSettingTab, Setting, Notice } from 'obsidian';
import BanyanPlugin from './main';
import { i18n } from './utils/i18n';
import FolderSuggest from './components/FolderSuggest';
import { useCombineStore } from './store';
import { CardContentMaxHeightType, FontTheme, NewNoteLocationMode } from './models/Enum';
import { openMigrateTitleModal } from './components/MigrateTitleModal';
import { openRemoveIdModal } from './components/RemoveIdModal';

export class BanyanSettingTab extends PluginSettingTab {
	plugin: BanyanPlugin;

	constructor(app: App, plugin: BanyanPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// 基础设置
		new Setting(containerEl).setName(i18n.t('setting_header_basic')).setHeading();
		this.setupCardsDirectorySetting(containerEl);
		this.setupOpenWhenStartObsidianSetting(containerEl);
		this.setupCardsColumnsSetting(containerEl);

		// 卡片视图
		new Setting(containerEl).setName(i18n.t('setting_header_cards')).setHeading();
		this.setupTitleDisplayModeSetting(containerEl);
		this.setupFontThemeSetting(containerEl);
		this.setupCardContentMaxHeightSetting(containerEl);
		this.setupShowBacklinksSetting(containerEl);
		this.setupUseCardNote2Setting(containerEl);

		// 编辑
		new Setting(containerEl).setName(i18n.t('setting_header_editor')).setHeading();
		this.setupNewNoteLocationSetting(containerEl);
		this.setupUseZkPrefixerFormatSetting(containerEl);
		this.setupShowAddNoteRibbonSetting(containerEl);

		// 旧版清理
		new Setting(containerEl).setName(i18n.t('setting_header_clean')).setHeading();
		this.setupMigrateTitleToFilenameSetting(containerEl);
	}

	setupCardsDirectorySetting(containerEl: HTMLElement) {
		const dateDesc = document.createDocumentFragment();
		dateDesc.appendText(i18n.t('setting_note_directory_desc1'));
		dateDesc.createEl('br');
		dateDesc.appendText(i18n.t('setting_note_directory_desc2'));
		dateDesc.createEl('br');
		dateDesc.appendText(i18n.t('setting_note_directory_desc3'));
		const settings = useCombineStore.getState().settings;
		new Setting(containerEl)
			.setName(i18n.t('setting_note_directory_name'))
			.setDesc(dateDesc)
			.addText(async text => {
				new FolderSuggest(this.app, text.inputEl, async (value) => {
					text.setValue(value);
					useCombineStore.getState().updateCardsDirectory(value);
				});
				text.setValue(settings.cardsDirectory || "")
					.onChange(async (value) => {
						useCombineStore.getState().updateCardsDirectory(value);
					});
				setTimeout(() => {
					text.inputEl.blur(); // 防止打开设置面板时输入框自动聚焦
				}, 0);
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
			.addToggle(toggle => {
				toggle.setValue(settings.titleDisplayMode !== 'none')
					.onChange(async (value) => {
						useCombineStore.getState().updateTitleDisplayMode(value ? 'fileOnly' : 'none');
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
		const settings = useCombineStore.getState().settings;
		new Setting(containerEl)
			.setName(i18n.t('setting_use_zk_prefixer_format_name'))
			.setDesc(i18n.t('setting_use_zk_prefixer_format_desc'))
			.addToggle(toggle => {
				toggle.setValue(settings.useZkPrefixerFormat ?? true)
					.onChange(async (value) => {
						useCombineStore.getState().updateUseZkPrefixerFormat(value);
					});
			});
	}

	setupShowAddNoteRibbonSetting(containerEl: HTMLElement) {
		const settings = useCombineStore.getState().settings;
		new Setting(containerEl)
			.setName(i18n.t('setting_show_add_note_ribbon_name'))
			.setDesc(i18n.t('setting_show_add_note_ribbon_desc'))
			.addToggle(toggle => {
				toggle.setValue(settings.showAddNoteRibbonIcon ?? true)
					.onChange(async (value) => {
						useCombineStore.getState().updateShowAddNoteRibbonIcon(value);
						// 重新设置功能区图标
						this.plugin.setupCreateNoteRibbonBtn();
					});
			});
	}

	setupNewNoteLocationSetting(containerEl: HTMLElement) {
		const settings = useCombineStore.getState().settings;
		new Setting(containerEl)
			.setName(i18n.t('setting_new_note_location_name'))
			.setDesc(i18n.t('setting_new_note_location_desc'))
			.addDropdown(dropdown => {
				dropdown.addOption('current', i18n.t('setting_new_note_location_current'))
					.addOption('custom', i18n.t('setting_new_note_location_custom'))
					.setValue(settings.newNoteLocationMode ?? 'current')
					.onChange(async (value) => {
						useCombineStore.getState().updateNewNoteLocationMode(value as NewNoteLocationMode);
						this.display(); // 刷新以显示/隐藏自定义路径设置
					});
			});

		if (settings.newNoteLocationMode === 'custom') {
			this.setupCustomNewNoteLocationSetting(containerEl);
		}
	}

	setupCustomNewNoteLocationSetting(containerEl: HTMLElement) {
		const settings = useCombineStore.getState().settings;
		new Setting(containerEl)
			.setName(i18n.t('setting_custom_new_note_location_name'))
			.setDesc(i18n.t('setting_custom_new_note_location_desc'))
			.addText(async text => {
				new FolderSuggest(this.app, text.inputEl, async (value) => {
					text.setValue(value);
					useCombineStore.getState().updateCustomNewNoteLocation(value);
				});
				text.setValue(settings.customNewNoteLocation || "")
					.onChange(async (value) => {
						useCombineStore.getState().updateCustomNewNoteLocation(value);
					});
				setTimeout(() => {
					text.inputEl.blur();
				}, 0);
			});
	}

	setupCardContentMaxHeightSetting(containerEl: HTMLElement) {
		const settings = useCombineStore.getState().settings;
		new Setting(containerEl)
			.setName(i18n.t('setting_card_content_max_height_name'))
			.setDesc(i18n.t('setting_card_content_max_height_desc'))
			.addDropdown(dropdown => {
				dropdown.addOption('short', i18n.t('setting_card_content_max_height_short'))
					.addOption('normal', i18n.t('setting_card_content_max_height_normal'))
					.addOption('expand', i18n.t('setting_card_content_max_height_expand'))
					.setValue(settings.cardContentMaxHeight ?? 'normal')
					.onChange(async (value) => {
						useCombineStore.getState().updateCardContentMaxHeight(value as CardContentMaxHeightType);
					});
			});
	}

	setupFontThemeSetting(containerEl: HTMLElement) {
		if (Platform.isMobile) return; // 移动端不显示此设置
		const settings = useCombineStore.getState().settings;
		new Setting(containerEl)
			.setName(i18n.t('setting_font_theme_name'))
			.setDesc(i18n.t('setting_font_theme_desc'))
			.addDropdown(dropdown => {
				dropdown
					.addOption('normal', i18n.t('setting_font_theme_normal'))
					.addOption('small', i18n.t('setting_font_theme_small'))
					.setValue(settings.fontTheme ?? 'normal')
					.onChange(async (value) => {
						useCombineStore.getState().updateFontTheme(value as FontTheme);
					});
			});
	}

	setupMigrateTitleToFilenameSetting(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName(i18n.t('setting_migrate_title_to_filename_name'))
			.setDesc(i18n.t('setting_migrate_title_to_filename_desc'))
			.addButton(btn => {
				btn.setButtonText(i18n.t('setting_migrate_title_to_filename_btn'))
					.onClick(async () => {
						openMigrateTitleModal({ app: this.app, plugin: this.plugin });
					});
			});
		new Setting(containerEl)
			.setName(i18n.t('setting_remove_id_name'))
			.setDesc(i18n.t('setting_remove_id_desc'))
			.addButton(btn => {
				btn.setButtonText(i18n.t('setting_remove_id_btn'))
					.onClick(async () => {
						openRemoveIdModal({ app: this.app, plugin: this.plugin });
					});
			});
	}

}
