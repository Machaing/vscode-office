# Markdown：默认使用 VS Code 原生编辑器

本扩展默认将 VS Code 的 Markdown 编辑器替换为所见即所得编辑器（vditor）。

如需继续使用 VS Code 原生 Markdown 编辑器，请在 `settings.json` 中添加：

```json
{
    "workbench.editorAssociations": {
        "*.md": "default",
        "*.markdown": "default"
    }
}
```

也可以随时通过编辑器标题栏的 **Switch markdown editor** 按钮（`Ctrl+Alt+E` / `⌘ ^ E`）在两种编辑器间按文件切换。
