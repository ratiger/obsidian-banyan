import { Plugin, WorkspaceLeaf } from 'obsidian';
import { BanyanPluginSettings, DEFAULT_SETTINGS, CUR_SETTINGS_VERSION } from './BanyanPluginSettings';
import { CARD_DASHBOARD_VIEW_TYPE, CardDashboard } from './pages/CardDashboard';
import { BanyanSettingTab } from './BanyanSettingTab';
import { FileUtils } from './utils/fileUtils';
import { i18n } from './utils/i18n';
import { TagFilter } from './models/TagFilter';


export default class BanyanPlugin extends Plugin {
	settings: BanyanPluginSettings;
	fileUtils: FileUtils;

	async onload() {
		await this.loadSettings();

		// 初始化 store
		const { useCombineStore } = await import('./store');
		useCombineStore.getState().setupPlugin(this);

		this.fileUtils = new FileUtils(this.app, this);

		// 注册自定义 view
		this.registerView(
			CARD_DASHBOARD_VIEW_TYPE,
			(leaf) => new CardDashboard(leaf, this)
		)

		// 添加卡片笔记 命令和按钮
		this.addCommand({
			id: 'add-card-note',
			name: i18n.t('add_card_note'),
			callback: async () => {
				await this.fileUtils.addFile();
			}
		});

		// 打开笔记面板 命令和按钮
		this.addCommand({
			id: 'open-dashboard',
			name: i18n.t('open_dashboard'),
			callback: () => this.activateView(CARD_DASHBOARD_VIEW_TYPE),
		});
		this.addRibbonIcon('wallet-cards', i18n.t('open_dashboard'), () => {
			this.activateView(CARD_DASHBOARD_VIEW_TYPE);
		});

		// 创建笔记
		this.setupCreateNoteRibbonBtn();

		// 随机回顾
		this.setupRandomReview();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new BanyanSettingTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			this.updateSettingIfNeeded();
			// 启动时自动打开自定义面板
			if (this.settings.openWhenStartObsidian) {
				this.activateView(CARD_DASHBOARD_VIEW_TYPE);
			}
		});
	}

	onunload() {
		// do nothing
	}

	public openSettingsPanel(): void {
		(this.app as any).setting.open();
		(this.app as any).setting.openTabById(this.manifest.id);
	}

	randomRibbonIcons: HTMLElement[] = [];
	addNoteRibbonIcon: HTMLElement | null = null;

	setupCreateNoteRibbonBtn = () => {
		if (this.addNoteRibbonIcon) {
			this.addNoteRibbonIcon.remove();
			this.addNoteRibbonIcon = null;
		}
		if (this.settings.showAddNoteRibbonIcon) {
			this.addNoteRibbonIcon = this.addRibbonIcon('lightbulb', i18n.t('add_card_note'), async (evt: MouseEvent) => {
				await this.fileUtils.addFile();
			});
		}
	}

	resetRandomReview = () => {
		// 移除所有现有的随机回顾命令和功能区图标
		(this.app.workspace.leftRibbon as any).items = (this.app.workspace.leftRibbon as any).items.filter((item: any) => !item.id.startsWith(`banyan:${i18n.t('open_random_note')}`));
		this.randomRibbonIcons.forEach((ele) => {
			ele.remove();
		});
		this.randomRibbonIcons = [];
		this.settings.randomReviewFilters.forEach((filter) => {
			this.removeCommand(`open-random-note-${filter.id}`);
		});
	}

	setupRandomReview = () => {
		const icons = ['dice', 'shuffle', 'dices', 'dice-6',
			'dice-5', 'dice-4', 'dice-3', 'dice-2', 'dice-1'];
		this.randomRibbonIcons = [];
		this.settings.randomReviewFilters.forEach((filter) => {
			const name = `${i18n.t('open_random_note')} - ${filter.name}`;
			const icon = icons[filter.id % icons.length];
			this.addCommand({
				id: `open-random-note-${filter.id}`,
				name: name,
				callback: () => {
					this.fileUtils.openRandomFile(filter.tagFilter);
				}
			});
			if (filter.showInRibbon) {
				const ele = this.addRibbonIcon(icon, name, () => {
					this.fileUtils.openRandomFile(filter.tagFilter);
				});
				this.randomRibbonIcons.push(ele);
			}
		});
	}

	updateSettingIfNeeded = async () => {
		// *** 版本更新时，在以下添加更新逻辑 ***
		if (this.settings.settingsVersion < 2) {
			const getNewFilterIfNeeded = (tf: TagFilter) => {
				return tf.noTag !== undefined ? tf : { ...tf, notag: 'unlimited' };
			};
			this.settings.filterSchemes = [...this.settings.filterSchemes.map((scheme) => {
				return { ...scheme, tagFilter: getNewFilterIfNeeded(scheme.tagFilter) };
			})];
		};
		if (this.settings.settingsVersion < 3) {
			this.settings.filterSchemes = [...this.settings.filterSchemes.map((scheme) => {
				return scheme.parentId === undefined ? { ...scheme, parentId: null } : scheme;
			})];
		};
		if (this.settings.settingsVersion < 4) {
			// 为现有的随机回顾过滤器添加showInRibbon字段
			this.settings.randomReviewFilters = [...this.settings.randomReviewFilters.map((filter) => {
				return {
					...filter,
					showInRibbon: filter.showInRibbon === undefined ? true : filter.showInRibbon
				};
			})];
		}
		if (this.settings.settingsVersion < 5) {
			// 移除“属性标题”相关设置：将旧值迁移为新默认
			// titleDisplayMode: propertyOrNone/propertyThenFile -> fileOnly
			const legacyTitleModes: any = this.settings.titleDisplayMode as any;
			if (legacyTitleModes === 'propertyOrNone' || legacyTitleModes === 'propertyThenFile') {
				(this.settings as any).titleDisplayMode = 'fileOnly';
			}
		}
		if (this.settings.settingsVersion < 6) {
			this.settings.showAddNoteRibbonIcon = true;
			this.settings.filterSchemesExpanded = true;
			this.settings.randomReviewExpanded = true;
			this.settings.viewSchemesExpanded = true;
			this.settings.fontTheme = 'normal';
		}
		if (this.settings.settingsVersion < 7) {
			// 移除旧的占位文件
			const oldPlaceholderFile = `${this.settings.cardsDirectory}/banyan_editor_placeholder.md`;
			const oldFile = this.app.vault.getFileByPath(oldPlaceholderFile);
			if (oldFile) {
				this.app.vault.delete(oldFile);
				console.log('移除旧的占位文件', oldPlaceholderFile);
			} else {
				console.log('旧的占位文件不存在，无需移除', oldPlaceholderFile);
			}
		}
		// *** 版本更新时，在以上添加更新逻辑 ***
		this.settings.settingsVersion = CUR_SETTINGS_VERSION;
		this.updateSavedFile();
		this.saveSettings();
	}

	updateSavedFile = () => {
		const _allFiles = this.fileUtils.getAllFiles().map((f) => f.file.path);
		if (_allFiles.length === 0) return; // 防止获取不到文件，却清空数据的情况
		const allFiles = new Set(_allFiles);
		this.settings.viewSchemes = [...this.settings.viewSchemes.map((scheme) => {
			const newFiles = [...scheme.files.filter((path) => allFiles.has(path))];
			const newPinned = [...scheme.pinned.filter((path) => allFiles.has(path))];
			return { ...scheme, files: newFiles, pinned: newPinned };
		})];
		this.settings.filterSchemes = [...this.settings.filterSchemes.map((scheme) => {
			const newPinned = [...scheme.pinned.filter((path) => allFiles.has(path))];
			return { ...scheme, pinned: newPinned };
		})];
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// 使得打开的视图唯一
	activateView(viewType: string) {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(viewType);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
			workspace.revealLeaf(leaf);
		} else {
			// Our view could not be found in the workspace, create a new leaf in the right sidebar for it
			leaf = workspace.getLeaf(true);
			leaf.setViewState({ type: viewType, active: true }).then(() => leaf && workspace.revealLeaf(leaf));
		}
	}
}

