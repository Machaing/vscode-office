# Markdown: export to PDF / DOCX / HTML

Right-click inside the Markdown editor to export the current document to PDF, DOCX, or HTML.

![Export Markdown](../../image/README-CN/1685418034035.png)

## PDF export prerequisites

PDF export runs on a headless Chromium instance:

- If a Chrome/Edge browser is already installed, it is detected automatically in most cases.
- If detection fails, set the browser executable path explicitly:

```json
{
    "vscode-office.chromiumPath": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
}
```

Related settings:

- `vscode-office.pdfMarginTop`: top margin of the exported PDF (default 25)
- `vscode-office.puppeteerArgs`: extra Chromium launch arguments, e.g. `["--no-sandbox", "--disable-setuid-sandbox"]` for servers running as root
