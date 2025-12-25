export default {

    /* 通用 */
    general_save: "Save",
    general_cancel: "Cancel",
    general_confirm: "Confirm",
    general_search: "Search",
    general_reset: "Reset",
    general_update: "Update",
    general_create: "Create",
    general_delete: "Delete",
    general_edit: "Edit",
    general_open: "Open",
    general_close: "Close",
    general_pin: "Pin",
    general_unpin: "Unpin",
    general_copy: "copy", // used in phrase
    general_expand: "Expand",
    general_collapse: "Collapse",

    create_note_folder_path: "Year{{year}}/Quarter{{quarter}}/Month{{month}}/Day{{day}}",

    /* 组件 */

    // 确认弹窗
    confirm_delete_title: "Confirm deletion",

    // 标签输入框
    tag_already_added: "The tag has already been added",
    only_existing_tags: "Only existing tags can be used",

    // 标签筛选区
    tag_group_label_include: "Include",
    tag_group_placeholder_include: "Include tags",
    tag_group_label_or_include: "Or include",
    tag_group_placeholder_or_include: "Or include tags",
    tag_group_label_exclude: "Exclude",
    tag_group_placeholder_exclude: "Exclude tags",
    tag_group_btn_or: "OR",
    tag_group_label_notag: "No tag",
    tag_group_label_notag_unlimited: "Unlimited",
    tag_group_label_notag_include: "Include",
    tag_group_label_notag_exclude: "Exclude",

    // filter scheme编辑区
    filter_scheme_title_update: "Update filter scheme",
    filter_scheme_title_create: "Create filter scheme",
    filter_scheme_name_label: "Name",
    filter_scheme_name_placeholder: "Please input the name",
    filter_scheme_date_label: "Date",
    filter_scheme_keyword_label: "Keyword",
    filter_scheme_keyword_placeholder: "You can input the keyword",

    // 视图编辑区
    view_scheme_title_update: "Update view scheme",
    view_scheme_title_create: "Create view scheme",
    view_scheme_name_label: "Name",
    view_scheme_name_placeholder: "Please input name",
    select_view_to_import: "Select view to import",

    /* 设置 */
    setting_header_basic: "⚙️ Basic",
    setting_header_cards: "🗂 Card view",
    setting_header_editor: "✏️ Create note",

    setting_note_directory_name: "Notes directory",
    setting_note_directory_desc1: "This plugin only manages notes in this directory.",
    setting_note_directory_desc2: "The structure of notes and subdirectories in this directory is not important.",
    setting_note_directory_desc3: "Migrated notes to this directory will be managed by this plugin.",
    setting_note_directory_placeholder: "Please input the path of the directory",

    setting_on_open_name: "Open after start",
    setting_on_open_desc: "Enable this to open the plugin when obsidian starts.",

    setting_title_display_mode_name: "Show title",
    setting_title_display_mode_desc: "Timestamp format title will not be displayed.",

    setting_col_nums_name: "Number of columns",
    setting_col_nums_desc: "When the panel is wide enough, how many columns to show.",
    setting_col_nums_1_col: "1 column",
    setting_col_nums_2_col: "2 columns",

    setting_random_review_name: "Range of random review",
    setting_random_review_desc: "Random review notes in the note directory.",

    setting_show_backlinks_name: "Show backlinks",
    setting_show_backlinks_desc: "Whether to show backlinks (which notes reference this) in card view.",
    setting_use_cardnote2_name: "Double click to edit (PC only)",
    setting_use_cardnote2_desc: "In editing mode, changes are saved immediately, and the confirm button is only used to return to reading mode.",
    setting_use_zk_prefixer_format_name: "Use the format in \"Unique note creator\" plugin for new notes filename",
    setting_use_zk_prefixer_format_desc: "If enabled, new notes will use the naming format from the plugin if available. Use the default format else.",

    setting_show_add_note_ribbon_name: "Show add note button in ribbon",
    setting_show_add_note_ribbon_desc: "Enable to show the add note button in Obsidian's ribbon.",

    setting_card_content_max_height_name: "Content max height",
    setting_card_content_max_height_desc: "The maximum display height of card content area (excluding title), fold extra content.",
    setting_card_content_max_height_short: "Short",
    setting_card_content_max_height_normal: "Normal",
    setting_card_content_max_height_expand: "Expand",

    // font
    setting_font_theme_name: "Font size",
    setting_font_theme_desc: "Base font size of content area in card view.",
    setting_font_theme_small: "Small",
    setting_font_theme_normal: "Normal",

    // migrate: frontmatter.title -> filename
    setting_migrate_title_to_filename_name: "Migrate property title to filename",
    setting_migrate_title_to_filename_desc: "Scan all notes in the working directory with \"title\" property, rename file to that title and remove the property.",
    setting_migrate_title_to_filename_btn: "Start migration",

    // new migrate modal
    migrate_modal_title: "Migrate property title to filename",
    migrate_modal_desc: "Select the notes to migrate. After start, progress will display in real time. Please backup first.",
    migrate_select_all: "Select all / none",
    migrate_selected_count: "Selected {{count}} / {{total}}",
    migrate_start: "Start",
    migrate_close: "Close",
    migrate_progress: "Progress: done {{done}} / {{total}}, success {{success}}.",
    migrate_empty_list: "No notes need migration.",
    migrate_rescan: "Rescan",

    /* 命令和ribbon */
    add_card_note: "Add card note",
    open_dashboard: "Open dashboard",
    open_random_note: "Random open a note",
    illegal_unique_prefix_format: "Illegal unique note creator format, use default format instead",
    illegal_title_chars: "Title cannot contain the following characters: [ ] # ^ |",

    /* 首页 */
    notice_note_to_trash: "The note has been deleted.",
    delete_note_confirm: "Are you sure to delete this note?",
    notice_error_when_load_notes: "Something went wrong when loading notes",
    notice_note_already_in_view: "The note is already in the view",
    notice_note_pinned: "Note pinned",
    notice_note_unpinned: "Note unpinned",

    // 标题栏
    search_bar_placeholder: "Search",
    search_view_title: "Search condition",
    search_input_placeholder: "Keyword",
    search_result: "Search result",
    expand_sidebar: "Expand sidebar",

    // 编辑区
    editor_title_placeholder: "Title (optional)",
    editor_content_placeholder: "Your thoughts...",
    editor_tags_placeholder: "Input tags here",
    new_note_added: "New note added",

    // 副标题栏
    loaded_notes: "{{count}}/{{total}} notes loaded",
    batch_add_to_view: "Add those notes to view",
    recently_updated: "Recently updated",
    recently_created: "Recently created",
    earliest_created: "Earliest created",
    earliest_updated: "Earliest updated",

    // 侧边栏
    note: "Note",
    tag: "Tag",
    days: "Days",

    month1: "January",
    month2: "February",
    month3: "March",
    month4: "April",
    month5: "May",
    month6: "June",
    month7: "July",
    month8: "August",
    month9: "September",
    month10: "October",
    month11: "November",
    month12: "December",
    notes_created_at: "notes created at",
    notes_modified_at: "notes modified at",

    create_note: "Create note",
    setting_panel: "Setting panel",
    random_browse: "Random browse",

    all_notes: "All notes",

    random_review: "Random review",
    random_review_name_placeholder: "Enter name",
    random_review_title_create: "Create random review",
    random_review_title_update: "Update random review",
    random_review_name_label: "Name",
    random_reivew_no_match: "No notes match the filter rules",
    random_review_show_in_ribbon: "Show in ribbon",

    filter_schemes: "Filter schemes",
    create_copy: "Create copy",
    create_sub_scheme: "Create sub scheme",

    view_schemes: "View schemes",

    // 卡片
    created_at: "Created at",
    updated_at: "Updated at",
    copy_link: "Copy link",
    add_to_view: "Add to view",
    remove_from_view: "Remove from view",
    link_copied: "Link copied",
    empty_search_result: "No search results",
    empty_note_result: "No notes yet",

    // 底部栏
    loading_text: "Loading...",
    reached_bottom: "You have reached the bottom.~",

};