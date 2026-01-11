export type ViewScheme = {
    id: number,
    name: string,
    files: string[],
    pinned: string[], // 存储文件的路径，以便在文件移动或重命名时保持置顶状态
    type: 'ViewScheme'
};