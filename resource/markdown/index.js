import { getToolbar, bindShortcut, createContextMenu, setAIAvailable, } from "./util.js";
import { observeWorkspaceAbsoluteImages, createMarkdownValueReader, restoreWorkspaceBaseUrls, } from "./imagePath.js";
import { mapVscodeLanguageToVditorLang } from "./lang.js";
import { createStyleRestorer } from "./styleRestore.js";

const SEARCH_FLASH_CLASS = 'vditor-search-flash';
const SEARCH_FLASH_DURATION = 1600;

function flashSearchMatch(blockElement) {
  blockElement.classList.remove(SEARCH_FLASH_CLASS);
  // 强制 reflow,让重复搜索时 CSS 动画重新播放
  void blockElement.offsetWidth;
  blockElement.classList.add(SEARCH_FLASH_CLASS);
  setTimeout(() => {
    blockElement.classList.remove(SEARCH_FLASH_CLASS);
  }, SEARCH_FLASH_DURATION);
}

/**
 * issue-599: VS Code 全局搜索点击结果打开自定义编辑器时不传递匹配位置
 * (core 缺口 microsoft/vscode#289785)。宿主命令 office.markdown.find 下发
 * revealSearchTerm 后,优先以预填关键词方式打开 vditor 自带 FindBar(高亮全部
 * 匹配、跳到首个匹配、支持下一个/替换);FindBar 不可用时回退到
 * revealSearchText(滚动 + 短暂高亮首个匹配块)。
 */

/** 打开 FindBar 并预填关键词;返回 false 表示 FindBar 不可用 */
function openFindBarWithKeyword(editor, keyword) {
  const vditor = editor?.vditor;
  const toolbar = vditor?.toolbar?.element;
  if (!toolbar || (vditor.currentMode !== 'wysiwyg' && vditor.currentMode !== 'ir')) {
    return false;
  }
  // FindBar 由工具栏 find 按钮懒创建:先点击触发创建并显示
  const findButton = toolbar.querySelector('[data-type="find"]');
  if (!findButton) {
    return false;
  }
  findButton.click();
  const input = toolbar.querySelector('.vditor-find-bar__input');
  if (!input) {
    return false;
  }
  input.value = keyword;
  // 触发 FindBar 自身的 input 监听执行搜索并定位首个匹配
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}

/** 读取 FindBar 计数:"1 / N" 表示命中;明确的"No results"才视为未命中,空文本不误报 */
function findBarHasResult(editor) {
  const countText = (editor?.vditor?.toolbar?.element
    ?.querySelector('.vditor-find-bar__count')?.textContent || '').trim();
  if (!countText) {
    return true;
  }
  return /\d+\s*\/\s*\d+/.test(countText);
}

/**
 * 回退路径:按关键词查找第一个匹配块,滚动定位并短暂高亮。返回是否找到。
 */
function revealSearchText(editor, keyword) {
  if (!editor?.vditor || typeof keyword !== 'string' || !keyword.trim()) {
    return false;
  }
  const needle = keyword.trim().toLowerCase();
  const surface = editor.vditor[editor.vditor.currentMode]?.element;
  if (!surface) {
    return false;
  }
  const walker = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (node.nodeValue && node.nodeValue.toLowerCase().includes(needle))
      ? NodeFilter.FILTER_ACCEPT
      : NodeFilter.FILTER_REJECT,
  });
  const textNode = walker.nextNode();
  const hitElement = textNode?.parentElement;
  if (!textNode || !hitElement) {
    return false;
  }
  let blockElement = hitElement;
  while (blockElement.parentElement && blockElement.parentElement !== surface) {
    blockElement = blockElement.parentElement;
  }
  blockElement.scrollIntoView({ block: 'center' });
  flashSearchMatch(blockElement);
  const index = textNode.nodeValue.toLowerCase().indexOf(needle);
  // CodeMirror 内容的 DOM 选区会与 CM 内部状态脱钩,跳过;普通文本设置选区便于继续编辑
  if (index >= 0 && !hitElement.closest('.cm-content')) {
    try {
      const range = document.createRange();
      range.setStart(textNode, index);
      range.setEnd(textNode, index + needle.length);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    } catch {
      // 选区失败不影响滚动定位
    }
  }
  return true;
}

handler.on("open", async (md) => {
  const { content, rootPath, workspaceBaseUrl, documentCacheId, pendingFragment, shouldRestoreFocus, config, fileName } = md;
  window.__officeMarkdownFileName = fileName || 'Note';
  const {
    language, isWeb, isDev, markdown,
    editMode, editorTheme, codeMirrorTheme, mermaidTheme
  } = config;
  if (isWeb) {
    document.body.classList.add('is-web')
  }
  let editor;
  const getMarkdownValue = createMarkdownValueReader(() => editor, workspaceBaseUrl);
  // issue-596: 保存时以打开时的文件内容为基线,还原 Lute 规范化造成的风格改写
  // (分隔线/表格对齐/列表空行/硬换行/autolink/link-ref 等),仅保留真实编辑差异
  let baselineMarkdown = content;
  const restorer = createStyleRestorer(
    () => editor?.vditor?.lute,
    () => editor?.getCurrentMode?.(),
  );
  const withOriginalStyle = (raw) => restorer.restore(baselineMarkdown, raw);
  editor = new Vditor('vditor', {
    value: content,
    cdn: rootPath,
    height: '100%',
    outline: {
      position: 'left',
    },
    cache: {
      enable: false,
      id: documentCacheId,
      focusHost: 'vscode',
    },
    mode: editMode,
    editorTheme,
    codeMirrorTheme,
    mermaidTheme,
    lang: mapVscodeLanguageToVditorLang(language),
    tab: '\t',
    toolbar: await getToolbar(rootPath, () => {
      handler.emit('doSave', withOriginalStyle(getMarkdownValue()));
      editor?.markSaved();
    }),
    onLinkClick(payload, event) {
      const isCompose = event.metaKey || event.ctrlKey;
      if (payload.action !== "dblclick" && !(payload.action === "click" && isCompose)) {
        return;
      }
      if (payload.type === "footnote-ref") {
        editor.scrollToBlock(`footnote:${payload.href}`);
        return;
      }
      if (payload.href?.startsWith("#")) {
        editor.scrollToBlock(payload.href);
        return;
      }
      let uri = payload.href;
      if (payload.type === "wikilink" || payload.type === "wikilink-embed") {
        const hashIndex = uri.indexOf("#");
        const page = hashIndex < 0 ? uri : uri.slice(0, hashIndex);
        const fragment = hashIndex < 0 ? "" : uri.slice(hashIndex + 1);
        if (!page && fragment) {
          editor.scrollToBlock(fragment);
          return;
        }
        uri = `wiki:${payload.href}`;
      }
      handler.emit("openLink", uri);
    },
    debugger: isDev,
    wysiwygInputPerf: isDev && false,
    changeEditorTheme(theme) {
      handler.emit('editorTheme', theme)
    },
    changeCodeTheme(theme) {
      handler.emit('codeMirrorTheme', theme)
    },
    changeMermaidTheme(theme) {
      handler.emit('mermaidTheme', theme)
    },
    changeEditMode(mode) {
      handler.emit('editMode', mode)
    },
    onSettingsChange(settings) {
      handler.emit('syncViewerSettings', settings)
    },
    onEditSettings() {
      handler.emit('editViewerSettings', editor.exportViewerSettings())
    },
    input(content) {
      // 先还原 webview 内部重写的图片绝对路径,再做原文风格还原
      handler.emit("save", withOriginalStyle(restoreWorkspaceBaseUrls(content, workspaceBaseUrl)))
    },
    upload: {
      url: '/image',
      accept: 'image/*',
      handler(files) {
        const file = files[0];
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
        let reader = new FileReader();
        reader.readAsBinaryString(file);
        reader.onloadend = () => {
          handler.emit("img", { data: reader.result, ext })
        };
      }
    },
    onTelemetry(event, properties) {
      handler.emit('telemetry', { event, properties });
    },
    ai: {
      onPolish(markdown, apply, options) {
        handler.emit('aiPolish', { markdown, options })
      },
      onCancelPolish() {
        handler.emit('aiPolishCancel')
      }
    },
    preview: {
      math: {
        macros: markdown?.math?.macros ?? {},
      },
    },
    after() {
      const { viewerSettings } = md;
      observeWorkspaceAbsoluteImages(document.getElementById('vditor'), workspaceBaseUrl);
      if (viewerSettings?.enabled) {
        editor.setViewerSettingsSyncEnabled(true);
        if (viewerSettings.settings) {
          editor.applyViewerSettings(viewerSettings.settings);
        }
      }
      handler.on('viewerSettingsSync', ({ enabled }) => {
        editor.setViewerSettingsSyncEnabled(!!enabled);
      });
      handler.on('viewerSettings', (settings) => {
        editor.applyViewerSettings(settings);
      });
      handler.on('markdownConfig', (update) => {
        if (update.editorTheme !== undefined) {
          editor.setEditorTheme(update.editorTheme);
        }
        if (update.codeMirrorTheme !== undefined) {
          Vditor.setCodeTheme(update.codeMirrorTheme, editor.vditor?.element);
        }
        if (update.mermaidTheme !== undefined) {
          editor.setMermaidTheme(update.mermaidTheme);
        }
        if (update.editMode !== undefined) {
          editor.switchEditMode(update.editMode);
        }
      });
      handler.on("update", content => {
        if (document.querySelector("[data-type='yaml-front-matter'].vditor-code-block--cm .cm-editor.cm-focused")) {
          return;
        }
        // 磁盘内容变更后以新内容为风格还原基线
        baselineMarkdown = content;
        if (getMarkdownValue() === content) {
          return;
        }
        editor.setValue(content);
        editor.markSaved();
      })
      handler.on("insertImageMarkdown", (markdown) => {
        editor.insertMarkdown(markdown);
      })
      handler.on("gotoBlock", (fragment) => {
        if (fragment) {
          editor.scrollToBlock(fragment);
        }
      })
      handler.on("revealSearchTerm", (keyword) => {
        const term = typeof keyword === 'string' ? keyword.trim() : '';
        if (!term) {
          handler.emit('revealSearchTermResult', { keyword, found: false });
          return;
        }
        if (openFindBarWithKeyword(editor, term)) {
          // FindBar 已打开并预填;CodeMirror 懒加载场景下计数稍晚稳定,延迟读取后回传结果
          setTimeout(() => {
            handler.emit('revealSearchTermResult', { keyword: term, found: findBarHasResult(editor) });
          }, 120);
          return;
        }
        const found = revealSearchText(editor, term);
        handler.emit('revealSearchTermResult', { keyword: term, found });
      })
      handler.emit('queryAIAvailable')
      handler.on("aiAvailable", (available) => {
        setAIAvailable(available, editor)
        if (available) {
          handler.emit('queryVSCodeModels')
        }
      })
      handler.on("vscodeModels", (models) => {
        editor.setVSCodeModels(models)
      })
      handler.on('aiPolishChunk', (chunk) => {
        editor.streamAIChunk(chunk)
      })
      handler.on('aiPolishEnd', () => {
        editor.endAIStream()
      })
      editor.restoreDocumentSession(true, !!shouldRestoreFocus)
      if (pendingFragment) {
        editor.scrollToBlock(pendingFragment);
      }
    }
  })
  bindShortcut(handler, editor, workspaceBaseUrl, withOriginalStyle);
  createContextMenu(editor)
}).emit("init")
