# Project Structure

This repository combines a VS Code extension with an editor subproject. This document first gives the big picture as a directory tree with inline comments, then details the core directories in a table; to keep the first tree shallow, the internals of `src/` and `resource/` are expanded in their own sections below. How the build wires these directories together is covered in [04-build.md](04-build.md); runtime host ↔ webview cooperation in [03-architecture.md](03-architecture.md).

## Overview

```text
vscode-office/
├── src/                # Extension source (host side + webview side), see "src/ tree"
├── vditor/             # Forked Markdown editor subproject, a standalone vite library project
├── resource/           # Runtime assets shipped with the extension, see "resource/ tree"
├── public/             # vite public directory, copied as-is to the webview output root (woff2 decompression for the font viewer)
├── icons/              # SVG icons for the file-icon theme
├── theme/              # File-icon theme manifest (material-icons.json)
├── syntaxes/           # tmLanguage grammars and language configs for HTTP, Kotlin, Kusto, Nginx, Reg, TOML
├── snippets/           # HTTP Client snippets
├── template/           # Document export templates
├── lib/                # Platform scripts for clipboard image paste (PowerShell, AppleScript, shell)
├── patches/            # pnpm dependency patches, wired in pnpm-workspace.yaml patchedDependencies
├── docs/               # Project documentation, see "Core directories"
├── test/               # Performance-verification scripts (no automated test framework)
├── test-workspace/     # Issue reproduction files; regenerable large files are not committed
├── image/              # Images used by the README and other docs
├── out/                # Build output (git-ignored)
├── release/            # vsix packaging output (git-ignored)
├── .github/            # CI workflows (tag push builds and publishes a release) and issue templates
├── vite.config.ts      # Build orchestration entry; every npm script starts here
├── build.ts            # esbuild script for the extension host
├── vite/               # vite plugins (vditorPlugin.ts)
├── index.html          # vite HTML entry for the webview, contains the {{configs}} placeholder
├── package.json        # Command and customEditors registration
├── package.nls.*.json  # Localized command strings
├── tsconfig.json       # TypeScript config; defines the @/* → src/* path alias
├── eslint.config.mjs   # ESLint flat config
├── pnpm-workspace.yaml # pnpm workspace config (where dependency patches are wired in)
├── telemetry.json      # Telemetry event declarations (reporting disabled in this fork)
├── .vscodeignore       # vsix packaging exclusions (node_modules, src, docs, etc. stay out)
├── README.md           # Project readme; changelog.md holds the changelog, each with a -CN Chinese version
└── CLAUDE.md           # Working guide for Claude Code
```

## Core directories

| Directory | Description |
|-----------|-------------|
| `src/` | All extension source code, layered into host and webview sides: entry points `extension.ts` (desktop) and `extension.web.ts` (web); `common/` is host-side infrastructure, `provider/` handles customEditors dispatch, `react/` is the webview SPA, `service/` holds host-side services, and `shims/` replaces Node built-ins for the web build. Expanded in "src/ tree" below. |
| `vditor/` | A fork of the Vditor Markdown editor, self-contained (its own package.json, vite.config.ts, and src/). Its UMD build is copied to `resource/markdown/dist/` for the Markdown webview; see [04-build.md](04-build.md) for when it builds. |
| `resource/` | Runtime assets shipped with the extension, always read through `extensionResource` / `readExtensionText` instead of hardcoded paths. Expanded in "resource/ tree" below. |
| `docs/` | `plans/` (issue-handling plans; naming and archiving conventions in its agent.md), `issues/` (upstream and local issue tracking), `faq/`, `dev/` (this document), `release/`, `archive/`. |
| `test/`, `test-workspace/` | Performance-verification scripts; the issue reproduction workspace, organized by issue number, with regenerable large files git-ignored. |
| `out/`, `release/` | `out/` is the build output (webview, extension hosts, bundled dependencies, assets); `release/` holds the packaged vsix. Both are git-ignored. |

## src/ tree

```text
src/
├── extension.ts        # Desktop extension-host entry
├── extension.web.ts    # Web extension-host entry (vscode.dev); differences in 03-architecture.md
├── common/             # Host-side infrastructure
│   ├── handler.ts                   # Host ↔ webview messaging wrapper
│   ├── reactApp.ts                  # Webview HTML loading and {{configs}} injection
│   ├── extensionHost.ts             # isWebExtensionHost() platform detection
│   ├── extensionResource.ts         # Extension resource access
│   ├── fileUtil.ts etc.             # File and general utilities
│   └── vscode-nls-i18n/             # Host-side i18n
├── provider/           # One provider per customEditors viewer
│   ├── officeViewerProvider.ts      # Dispatches routes by file extension (excel, word, ppt, …)
│   ├── markdownEditorProvider.ts    # Markdown editor (vditor)
│   ├── archiveViewerProvider.ts     # Archive viewer
│   ├── classViewerProvider.ts       # Java decompilation
│   ├── webUnsupportedViewerProvider.ts  # Fallback notice for types unsupported on the web
│   └── compress/ http/ xml/ yaml/ handlers/  # Host-side implementations for those viewers
├── react/              # Webview SPA
│   ├── main.tsx        # Entry; renders the component under view/ for each route
│   ├── view/           # Viewer components (excel, word, powerpoint, psd, xmind, epub, parquet, fontViewer, compress, svg, image, icns, gitHistory, …)
│   ├── i18n/           # Webview strings (11 languages under messages/)
│   ├── util/           # vscode.ts (webview-side messaging wrapper) and other utilities
│   └── shims/ polyfills/   # Browser compatibility shims
├── service/            # Host-side services
│   ├── markdownService.ts    # Markdown PDF/DOCX export, clipboard image paste
│   ├── compress/ zip/        # Archive viewing and extraction
│   ├── parquet/ icon/ ai/    # Services for the matching features
│   └── telemetryService.ts   # Telemetry (disabled in this fork, methods are no-ops)
├── gitHistory/         # Git History view (desktop only)
├── shims/              # Replacements for Node built-ins and deps like puppeteer-core, used by the web build
└── types/              # .d.ts for third-party libraries that ship none (heic2any, utif)
```

## resource/ tree

```text
resource/
├── pdf/                # pdf.js viewer (viewer.html, pdf.js, worker, fonts, cmaps)
├── markdown/           # vditor webview: index.html and scripts; dist/ holds the vditor build output
├── lib/
│   └── vscode.js       # postMessage wrapper used by the non-React webviews (PDF, Markdown)
└── java-decompiler.jar # Java decompiler
```

## See also

- For getting started with development and packaging, see [01-development.md](01-development.md).
- For runtime host ↔ webview cooperation, see [03-architecture.md](03-architecture.md).
- For the build system, see [04-build.md](04-build.md).
