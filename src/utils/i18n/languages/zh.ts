export default {

    /* 通用 */
    general_save: "保存",
    general_cancel: "取消",
    general_confirm: "确认",
    general_search: "搜索",
    general_reset: "重置",
    general_update: "更新",
    general_create: "创建",
    general_delete: "删除",
    general_edit: "编辑",
    general_open: "打开",
    general_close: "关闭",
    general_pin: "置顶",
    general_unpin: "取消置顶",
    general_copy: "副本",
    general_expand: "展开",
    general_collapse: "折叠",

    create_note_folder_path: "{{year}}年/{{quarter}}季度/{{month}}月/{{day}}日",

    /* 组件 */

    // 确认弹窗
    confirm_delete_title: "确认删除",

    // 标签输入框
    tag_already_added: "该标签已添加",
    only_existing_tags: "只能选择已有标签",

    // 标签筛选区
    tag_group_label_include: "包含",
    tag_group_placeholder_include: "包含标签",
    tag_group_label_or_include: "或含",
    tag_group_placeholder_or_include: "或含标签",
    tag_group_label_exclude: "不含",
    tag_group_placeholder_exclude: "排除标签",
    tag_group_btn_or: "或",
    tag_group_label_notag: "无标签",
    tag_group_label_notag_unlimited: "不论",
    tag_group_label_notag_include: "包含",
    tag_group_label_notag_exclude: "排除",

    // filter scheme编辑区
    filter_scheme_title_update: "更新过滤方案",
    filter_scheme_title_create: "创建过滤方案",
    filter_scheme_name_label: "名称",
    filter_scheme_name_placeholder: "请输入名称",
    filter_scheme_date_label: "日期",
    filter_scheme_keyword_label: "关键字",
    filter_scheme_keyword_placeholder: "你可以输入关键字",

    // 视图编辑区
    view_scheme_title_update: "更新视图",
    view_scheme_title_create: "创建视图",
    view_scheme_name_label: "名称",
    view_scheme_name_placeholder: "请输入名称",
    select_view_to_import: "选择要导入的视图",

    /* 设置 */
    setting_header_basic: "⚙️ 基础设置",
    setting_header_cards: "🗂 卡片视图",
    setting_header_editor: "✏️ 新建笔记",

    setting_note_directory_name: "笔记目录",
    setting_note_directory_desc1: "「卡片面板」只会管理该目录下的所有笔记。",
    setting_note_directory_desc2: "该目录下的笔记和子目录的存放结构不再紧要。",
    setting_note_directory_desc3: "已有笔记迁移到该目录之下，即可受本插件管理。",
    setting_note_directory_placeholder: "请输入目录的路径",

    setting_on_open_name: "启动时自动打开面板",
    setting_on_open_desc: "开启后，Obsidian 启动时会自动打开「卡片面板」。",

    setting_title_display_mode_name: "显示标题",
    setting_title_display_mode_desc: "默认的时间戳格式标题不会显示。",

    setting_col_nums_name: "笔记列数",
    setting_col_nums_desc: "当面板足够宽时，最多显示多少列笔记。",
    setting_col_nums_1_col: "1 列",
    setting_col_nums_2_col: "2 列",

    setting_random_review_name: "随机笔记的范围",
    setting_random_review_desc: "随机回顾「笔记目录」下的笔记。",

    setting_show_backlinks_name: "显示反向链接",
    setting_show_backlinks_desc: "是否在卡片视图中显示反向链接（被哪些笔记引用）。",

    setting_use_cardnote2_name: "双击进入编辑模式（仅限桌面端）",
    setting_use_cardnote2_desc: "编辑模式下改动立即保存，确认按钮仅用于恢复阅读模式。",

    setting_use_zk_prefixer_format_name: "默认文件名使用「时间戳笔记生成器」的格式",
    setting_use_zk_prefixer_format_desc: "开启后，新建笔记的默认文件名会使用时间戳笔记插件的命名格式。关闭则使用默认格式。",

    setting_show_add_note_ribbon_name: "在功能区显示创建笔记按钮",
    setting_show_add_note_ribbon_desc: "启用后，会在Obsidian的功能区显示创建笔记的按钮。",

    setting_card_content_max_height_name: "内容最大高度",
    setting_card_content_max_height_desc: "内容区(不包括标题)的最大显示高度，内容过长时折叠。",
    setting_card_content_max_height_short: "较短",
    setting_card_content_max_height_normal: "一般",
    setting_card_content_max_height_expand: "不折叠",

    // 字体
    setting_font_theme_name: "内容区域字体大小",
    setting_font_theme_desc: "内容区域的基础字体大小。",
    setting_font_theme_small: "较小",
    setting_font_theme_normal: "一般",

    // 迁移：属性title -> 文件名
    setting_migrate_title_to_filename_name: "迁移属性标题为文件名",
    setting_migrate_title_to_filename_desc: "扫描「笔记目录」中含有属性含有“title”的笔记，将其作为文件名，并删除该属性。",
    setting_migrate_title_to_filename_btn: "开始迁移",

    // 新迁移弹窗
    migrate_modal_title: "迁移属性标题到文件名",
    migrate_modal_desc: "以防万一，建议先备份笔记。",
    migrate_select_all: "全选/全不选",
    migrate_selected_count: "已选择 {{count}} / {{total}}",
    migrate_start: "开始",
    migrate_close: "关闭",
    migrate_progress: "进度：完成 {{done}} / {{total}} 条，成功 {{success}} 条。",
    migrate_empty_list: "没有需要迁移的笔记。",
    migrate_rescan: "重新检测",

    /* 命令和ribbon */
    add_card_note: "添加卡片笔记",
    open_dashboard: "打开笔记面板",
    open_random_note: "随机打开笔记",
    illegal_unique_prefix_format: "时间戳格式非法，改用默认格式",
    illegal_title_chars: "标题不能包含以下字符：[ ] # ^ |",

    /* 首页 */
    notice_error_when_load_notes: "加载笔记内容时出错",
    notice_note_to_trash: "笔记已删除",
    delete_note_confirm: "确定要删除此笔记吗？",
    notice_note_already_in_view: "笔记已存在于该视图中",
    notice_note_pinned: "已置顶",
    notice_note_unpinned: "已取消置顶",

    // 标题栏
    search_bar_placeholder: "搜索",
    search_view_title: "搜索条件",
    search_input_placeholder: "关键字",
    search_result: "搜索结果",
    expand_sidebar: "展开侧边栏",

    // 编辑区
    editor_title_placeholder: "标题（可选）",
    editor_content_placeholder: "此刻的想法是...",
    editor_tags_placeholder: "在这里输入标签",
    new_note_added: "笔记添加成功",

    // 副标题栏
    loaded_notes: "已加载 {{count}}/{{total}} 条笔记",
    batch_add_to_view: "批量添加到视图",
    recently_updated: "最近更新",
    recently_created: "最近创建",
    earliest_created: "最早创建",
    earliest_updated: "最早更新",

    // 侧边栏
    note: "笔记",
    tag: "标签",
    days: "天",

    month1: "一月",
    month2: "二月",
    month3: "三月",
    month4: "四月",
    month5: "五月",
    month6: "六月",
    month7: "七月",
    month8: "八月",
    month9: "九月",
    month10: "十月",
    month11: "十一月",
    month12: "十二月",
    notes_created_at: "条笔记创建于",
    notes_modified_at: "条笔记更新于",

    create_note: "创建笔记",
    setting_panel: "设置面板",
    random_browse: "乱序浏览",

    all_notes: "所有笔记",

    random_review: "随机回顾",
    random_review_name_placeholder: "输入名称",
    random_review_title_create: "创建随机回顾",
    random_review_title_update: "更新随机回顾",
    random_review_name_label: "名称",
    random_reivew_no_match: "没有符合筛选规则的笔记",
    random_review_show_in_ribbon: "在功能区显示",

    filter_schemes: "常用过滤",
    create_copy: "创建副本",
    create_sub_scheme: "创建子方案",

    view_schemes: "视图空间",

    // 卡片
    created_at: "创建于",
    updated_at: "更新于",
    copy_link: "复制链接",
    add_to_view: "添加到视图",
    remove_from_view: "从视图中移除",
    link_copied: "已复制链接",
    empty_search_result: "无搜索结果",
    empty_note_result: "暂无笔记",

    // 底部栏
    loading_text: "加载中...",
    reached_bottom: "你已经到底部了",

};