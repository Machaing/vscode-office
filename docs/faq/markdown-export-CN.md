# Markdown：导出操作

在 Markdown 编辑器中右键，可将当前文档导出为 PDF、DOCX 或 HTML。

![导出 Markdown](../../image/README-CN/1685418034035.png)

## PDF 导出前提

PDF 导出依赖无头 Chromium 运行：

- 本机已安装 Chrome/Edge 时，多数情况下会自动探测；
- 探测失败时可显式配置浏览器可执行文件路径：

```json
{
    "vscode-office.chromiumPath": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
}
```

相关配置：

- `vscode-office.pdfMarginTop`：导出 PDF 的上边距（默认 25）
- `vscode-office.puppeteerArgs`：传给 Chromium 的附加启动参数，例如以 root 运行的服务器需 `["--no-sandbox", "--disable-setuid-sandbox"]`
