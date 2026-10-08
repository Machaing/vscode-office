// Mock of resource/lib/vscode.js webview shim: drives the REAL resource/markdown/index.js
// pipeline (issue-596). On Vditor init it fetches the probe file and posts the "open"
// message exactly like the extension host does.
(() => {
    const events = {};
    const emits = [];
    window.addEventListener('message', (e) => {
        if (e.data && events[e.data.type]) {
            events[e.data.type](e.data.content);
        }
    });

    const startOpen = async () => {
        const params = new URLSearchParams(location.search);
        const file = params.get('file') || 'test-markdown-cweijan-596-md-silent-rewrite.md';
        const mode = params.get('mode') || 'wysiwyg';
        try {
            const content = await (await fetch(`/test-workspace/markdown/${file}`)).text();
            window.__origContent = content;
            window.__mode = mode;
            window.dispatchEvent(new MessageEvent('message', {
                data: {
                    type: 'open',
                    content: {
                        content,
                        rootPath: '/resource/markdown',
                        workspaceBaseUrl: '',
                        documentCacheId: `harness-596:${file}`,
                        pendingFragment: null,
                        shouldRestoreFocus: false,
                        fileName: file,
                        config: {
                            language: 'zh-cn',
                            isWeb: false,
                            isDev: false,
                            markdown: { math: { macros: {} } },
                            editMode: mode,
                            editorTheme: 'Auto',
                            codeMirrorTheme: 'Auto',
                            mermaidTheme: 'Auto',
                        },
                        viewerSettings: { enabled: false },
                    },
                },
            }));
            window.__harnessReady = true;
        } catch (err) {
            window.__harnessError = String(err);
        }
    };

    const emitter = {
        on(event, cb) { events[event] = cb; return this; },
        emit(event, content) {
            emits.push({ event, content, at: Date.now() });
            if (event === 'init') {
                setTimeout(() => void startOpen(), 0);
            }
        },
    };
    window.handler = emitter;
    window.vscodeEvent = emitter;
    window.__emits = emits;
})();
