# Markdown: use the built-in VS Code editor

This extension replaces the default Markdown editor with a WYSIWYG editor (vditor).

To keep using the built-in VS Code Markdown editor instead, add this to your `settings.json`:

```json
{
    "workbench.editorAssociations": {
        "*.md": "default",
        "*.markdown": "default"
    }
}
```

You can also switch editors per file at any time via the **Switch markdown editor** button (`Ctrl+Alt+E` / `⌘ ^ E`) in the editor title bar.
