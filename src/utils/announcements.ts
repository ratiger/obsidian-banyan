import { i18n } from "./i18n";

// Import markdown files as strings
import welcome_en from "../../docs/welcome_en.md";
import welcome_zh from "../../docs/welcome_zh.md";
import changelog_en from "../../docs/changelog_en.md";
import changelog_zh from "../../docs/changelog_zh.md";

export const getWelcomeMarkdown = (): string => {
    const lang = i18n.getCurrentLanguage();
    if (lang === 'zh') return welcome_zh;
    return welcome_en;
};

export const getChangelogMarkdown = (): string => {
    const lang = i18n.getCurrentLanguage();
    if (lang === 'zh') return changelog_zh;
    return changelog_en;
};
