// issue-596 harness: mirrors resource/markdown/index.js initialization flow.
// Loads the reproduction file, initializes the real Vditor WYSIWYG editor,
// records every input-callback invocation (the "save" emit path) without any user interaction.
const params = new URLSearchParams(location.search);
const file = params.get('file') || 'test-markdown-cweijan-596-md-silent-rewrite.md';
const mode = params.get('mode') || 'wysiwyg';

const res = await fetch(`/test-workspace/markdown/${file}`);
const content = await res.text();

window.__origContent = content;
window.__mode = mode;
window.__inputs = [];

window.__report = () => {
    const saves = window.__emits.filter((e) => e.event === 'save').map((e) => e.content);
    const normalized = (s) => s.replace(/\r/g, '');
    const orig = normalized(window.__origContent);
    const last = saves.length ? saves[saves.length - 1] : null;
    const value = window.__editor ? window.__editor.getValue() : null;
    return {
        file,
        mode,
        saveCount: saves.length,
        firstSaveDiffers: saves.length > 0 && normalized(saves[0]) !== orig,
        lastSaveDiffers: last != null && normalized(last) !== orig,
        getValueDiffers: value != null && normalized(value) !== orig,
        firstSave: saves[0] ?? null,
        lastSave: last,
        getValue: value,
        orig,
    };
};

window.__vditorInstance = new Vditor('vditor', {
    value: content,
    cdn: '/resource/markdown',
    height: '100%',
    outline: { position: 'left' },
    cache: {
        enable: false,
        id: `harness-596:${file}`,
        focusHost: 'vscode',
    },
    mode,
    lang: 'zh_CN',
    tab: '\t',
    toolbar: [],
    input(md) {
        window.__inputs.push(md);
        handler.emit('save', md);
    },
    preview: { math: { macros: {} } },
    after() {
        window.__editor = window.__vditorInstance;
        window.__editor.restoreDocumentSession(true, false);
        window.__harnessReady = true;
    },
});
