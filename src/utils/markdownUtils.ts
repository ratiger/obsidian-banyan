export const stripMarkdown = (mdStr: string) => {
    return mdStr
        .replace(/(\*\*\*|__)(.*?)\1/g, '$2')  // 着重
        .replace(/(\*\*|__)(.*?)\1/g, '$2')    // 加粗
        .replace(/(\*|_)(.*?)\1/g, '$2')       // 斜体
        .replace(/(==|__)(.*?)\1/g, '$2')      // 高亮
        .replace(/~~(.*?)~~/g, '$1')           // 删除线
        .replace(/`(.*?)`/g, '$1')             // 行内代码
        .replace(/!?\[(.*?)\]\(.*?\)/g, '$1')  // 链接和图片
        .replace(/^#+\s+/gm, '');              // 标题
}
