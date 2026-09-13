# Development Guide

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [VS Code](https://code.visualstudio.com/) 1.64+

## Getting started

```bash
git clone https://github.com/Machaing/vscode-office.git
cd vscode-office
npm install
```

## Development

**Desktop extension** (full feature set):

```bash
npm run dev
```

Press `F5` in VS Code, or choose **Extension** from Run and Debug.

The webview React app is served by a vite dev server (`http://127.0.0.1:5739`), so changes under `src/react/` hot-reload instantly; extension-host code (`out/extension.js`) rebuilds via esbuild watch — reload the Extension Development Host window (`Ctrl+R`) to pick it up.

**Web extension** (Markdown, HTML, YAML in the browser):

```bash
npm run dev:web
```

Choose **Extension (Web)** from Run and Debug.

## Build & package

```bash
npm run build    # production build
npm run package  # create .vsix
```

## Publishing

See [docs/release/publish.md](../release/publish.md) for VS Code Marketplace and Open VSX publishing steps.
