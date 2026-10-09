# Architecture

This document describes how the extension host and the webview cooperate; for the build system, see [04-build.md](04-build.md).

## Extension host → webview data flow

1. `customEditors` in `package.json` dispatches files by filename pattern to providers (`maizhuoying.officeViewer`, `maizhuoying.markdownViewer`, `maizhuoying.archiveViewer`, etc.).
2. A provider (e.g. [officeViewerProvider.ts](../../src/provider/officeViewerProvider.ts)) maps the file extension to a `route` (excel/word/ppt/font/epub/psd/xmind/parquet/…) and calls `ReactApp.view(webview, { route })`.
3. `ReactApp` ([reactApp.ts](../../src/common/reactApp.ts)) loads the webview HTML and injects the route, language, and user configuration as JSON into the `{{configs}}` placeholder of the HTML.
4. The webview entry [main.tsx](../../src/react/main.tsx) reads the configs via `getConfigs()` and renders the lazy-loaded component for the `route` (under [src/react/view/<name>/](../../src/react/view/)).

Exceptions: PDF uses a standalone pdf.js viewer (`resource/pdf/viewer.html`) and Markdown uses vditor (`resource/markdown/index.html`); neither goes through React.

## Host ↔ webview messaging

[Handler](../../src/common/handler.ts) (`Handler.bind(panel, uri)`) wraps postMessage: on the host side, `handler.on(event, cb)` / `handler.emit(event, content)`, and it automatically wires up file watching (`fileChange`, `externalUpdate`, `dispose`). The webview counterpart is the `handler` exported from [vscode.ts](../../src/react/util/vscode.ts), exposing the same `on` / `emit` API with a `{ type, content }` message shape.

## Desktop / Web differences

- The web entry ([extension.web.ts](../../src/extension.web.ts)) does not register the HTTP Client, Git History, clipboard image paste, Java decompiler, or archive viewer; those file types fall back to [webUnsupportedViewerProvider.ts](../../src/provider/webUnsupportedViewerProvider.ts).
- Runtime checks use `isWebExtensionHost()` ([extensionHost.ts](../../src/common/extensionHost.ts)); commands and menus in `package.json` are gated by the `office.extensionHost.web` context key.

## Adding a new file type viewer

1. Add a filename selector to `customEditors` in `package.json`.
2. Map the extension to a new `route` in the switch in [officeViewerProvider.ts](../../src/provider/officeViewerProvider.ts).
3. Create the component under `src/react/view/<name>/` and add a lazy import plus a route branch in [main.tsx](../../src/react/main.tsx).
4. Optionally call `TelemetryService.trackOfficeViewOpen` when the viewer opens (telemetry is disabled in this fork; the method is a no-op, kept so it can be re-enabled later).

## See also

- For the build system, see [04-build.md](04-build.md); for the repository layout, see [02-structure.md](02-structure.md).
- For getting started with development and packaging, see [01-development.md](01-development.md).
