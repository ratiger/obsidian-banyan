import { CardContentMaxHeightType, TitleDisplayMode, FontTheme, NewNoteLocationMode } from "./models/Enum";

export interface BanyanPluginSettings {
	// basic
	settingsVersion: number;
	openWhenStartObsidian: boolean;
	cardsDirectory: string;
	cardsColumns: number;
	fontTheme: FontTheme;

	// card note
	titleDisplayMode: TitleDisplayMode;
	cardContentMaxHeight?: CardContentMaxHeightType;
	showBacklinksInCardNote?: boolean;
	useCardNote2?: boolean;

	// add note 
	useZkPrefixerFormat?: boolean;
	showAddNoteRibbonIcon?: boolean;
	newNoteLocationMode?: NewNoteLocationMode;
	customNewNoteLocation?: string;

	// features
	enableViewSchemes?: boolean;
	enableRandomReview?: boolean;

	// meta
	lastVersion?: string;
}

export const CUR_SETTINGS_VERSION = 9;



export const DEFAULT_SETTINGS: BanyanPluginSettings = {
	// basic
	settingsVersion: CUR_SETTINGS_VERSION,
	openWhenStartObsidian: true,
	cardsDirectory: 'cards',
	cardsColumns: 1,

	// card note 
	titleDisplayMode: 'fileOnly',
	fontTheme: 'normal',
	cardContentMaxHeight: 'normal',
	showBacklinksInCardNote: false,
	useCardNote2: false,

	// add note
	useZkPrefixerFormat: false,
	showAddNoteRibbonIcon: true,
	newNoteLocationMode: 'current',
	customNewNoteLocation: '',

	enableViewSchemes: false,
	enableRandomReview: false,
	lastVersion: '',
}