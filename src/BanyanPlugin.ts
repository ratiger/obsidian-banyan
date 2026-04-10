import { Plugin, WorkspaceLeaf } from 'obsidian';
import { BanyanPluginSettings, DEFAULT_SETTINGS, CUR_SETTINGS_VERSION } from './BanyanPluginSettings';
import { BanyanAppData, DEFAULT_APP_DATA, CUR_APP_DATA_VERSION } from './BanyanAppData';
import { CARD_DASHBOARD_VIEW_TYPE, CardDashboard } from './pages/CardDashboard';
import { BanyanSettingTab } from './BanyanSettingTab';
import { FileUtils } from './utils/fileUtils';
import { i18n } from './utils/i18n';
import { TagFilter } from './models/TagFilter';


export default class BanyanPlugin extends Plugin {
	settings: BanyanPluginSettings;
	appData: BanyanAppData;
	fileUtils: FileUtils;

	async onload() {
		await this.loadSettings();

		// 初始化 store
		const { useCombineStore } = await import('./store');
		useCombineStore.getState().setupPlugin(this);

		this.fileUtils = new FileUtils(this.app, this);

		const { createFileWatcher } = await import('./utils/fileWatcher');
		const watcher = createFileWatcher(this);
		watcher.onChange(({ type, fileInfo }) => {
			const state = useCombineStore.getState();
			if (type === 'create') {
				useCombineStore.setState({ needRefresh: true });
			} else if (type === 'delete') {
				const path = 'path' in fileInfo ? (fileInfo as any).path : (fileInfo as any).file.path;
				state.removeSingleFile(path);
				state.updateWhenDeleteFile(path);
			} else if (type === 'modify' || type === 'meta-change') {
				if (!state.hasEditingFiles() && 'tags' in fileInfo) {
					state.updateSingleFile(fileInfo as any);
				}
			}
		});

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
		this.appData.randomReviewFilters.forEach((filter) => {
			this.removeCommand(`open-random-note-${filter.id}`);
		});
	}

	setupRandomReview = () => {
		const icons = ['dice', 'shuffle', 'dices', 'dice-6',
			'dice-5', 'dice-4', 'dice-3', 'dice-2', 'dice-1'];
		this.randomRibbonIcons = [];
		this.appData.randomReviewFilters.forEach((filter) => {
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
			this.appData.filterSchemes = [...this.appData.filterSchemes.map((scheme) => {
				return { ...scheme, tagFilter: getNewFilterIfNeeded(scheme.tagFilter) };
			})];
		};
		if (this.settings.settingsVersion < 3) {
			this.appData.filterSchemes = [...this.appData.filterSchemes.map((scheme) => {
				return scheme.parentId === undefined ? { ...scheme, parentId: null } : scheme;
			})];
		};
		if (this.settings.settingsVersion < 4) {
			// 为现有的随机回顾过滤器添加showInRibbon字段
			this.appData.randomReviewFilters = [...this.appData.randomReviewFilters.map((filter) => {
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
			this.appData.filterSchemesExpanded = true;
			this.appData.randomReviewExpanded = true;
			this.appData.viewSchemesExpanded = true;
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
		this.appData.version = CUR_APP_DATA_VERSION;
		this.updateSavedFile();
		this.saveSettings();
		this.saveAppData();
	}

	updateSavedFile = () => {
		const _allFiles = this.fileUtils.getAllFiles().map((f) => f.file.path);
		if (_allFiles.length === 0) return; // 防止获取不到文件，却清空数据的情况
		const allFiles = new Set(_allFiles);
		this.appData.viewSchemes = [...this.appData.viewSchemes.map((scheme) => {
			const newFiles = [...scheme.files.filter((path) => allFiles.has(path))];
			const newPinned = [...scheme.pinned.filter((path) => allFiles.has(path))];
			return { ...scheme, files: newFiles, pinned: newPinned };
		})];
		this.appData.filterSchemes = [...this.appData.filterSchemes.map((scheme) => {
			const newPinned = [...scheme.pinned.filter((path) => allFiles.has(path))];
			return { ...scheme, pinned: newPinned };
		})];
	}

	async loadAppData(settingsRawData: any) {
		const adapter = this.app.vault.adapter;
		const appDataPath = `${this.manifest.dir}/banyan_state.json`;

		// 1. 尝试加载现有 AppData
		let needsMigration = false;
		if (await adapter.exists(appDataPath)) {
			try {
				const appDataContent = await adapter.read(appDataPath);
				const appDataRaw = JSON.parse(appDataContent);
				this.appData = Object.assign({}, DEFAULT_APP_DATA, appDataRaw);
				// 如果没有版本号，视为需要从 settings 迁移或补全
				if (appDataRaw.version === undefined) needsMigration = true;
			} catch (e) {
				console.error('解析 AppData 失败，将重新初始化', e);
				this.appData = Object.assign({}, DEFAULT_APP_DATA);
				needsMigration = true;
			}
		} else {
			this.appData = Object.assign({}, DEFAULT_APP_DATA);
			needsMigration = true;
		}

		// 2. 执行从 Settings 到 AppData 的迁移逻辑
		if (needsMigration && settingsRawData) {
			const keysToMigrate = [
				'sortType', 'firstUseDate', 'randomBrowse', 'randomReviewFilters',
				'filterSchemes', 'viewSchemes', 'filterSchemesExpanded',
				'randomReviewExpanded', 'viewSchemesExpanded'
			];

			let migrated = false;
			keysToMigrate.forEach(key => {
				if (key in settingsRawData) {
					(this.appData as any)[key] = settingsRawData[key];
					delete (this.settings as any)[key];
					migrated = true;
				}
			});

			if (migrated) {
				console.log('Detected legacy settings, migrated to appData');
				this.appData.version = CUR_APP_DATA_VERSION;
				await this.saveAppData();
				await this.saveSettings();
			}
		}
	}

	async saveAppData() {
		const adapter = this.app.vault.adapter;
		const path = `${this.manifest.dir}/banyan_state.json`;
		await adapter.write(path, JSON.stringify(this.appData, null, 2));
	}

	async loadSettings() {
		const data = await this.loadData();

		// 1. 加载基础设置
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);

		// 2. 加载并检查迁移 AppData
		await this.loadAppData(data);
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

