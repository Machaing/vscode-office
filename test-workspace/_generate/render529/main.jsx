// issue-529 无头渲染验证(参照 render597/main.jsx,不改动原脚本)
// 用法: 经 esbuild bundle 后由静态服务(test-workspace 根目录)加载,
//       URL 带 ?file=word/xxx.docx 指定要渲染的文件(默认 529 复现文件)。
// 渲染完成后 window.__RESULT__ 携带逐段文本, document.title 置为 RENDER_DONE。
import React from 'react';
import { createRoot } from 'react-dom/client';
import { DocxEditor } from '@eigenpal/docx-editor-react';

const params = new URLSearchParams(location.search);
// file 相对静态服务根(即 test-workspace/),fetch 时以 / 前缀避免相对当前页面目录解析
const file = params.get('file') || 'word/test-word-cweijan-529-toc-blank.docx';

function editorRoot() {
	return document.querySelector('.ProseMirror') || document.getElementById('root');
}

async function waitForRender() {
	let last = '';
	let stable = 0;
	const deadline = Date.now() + 60000;
	while (Date.now() < deadline) {
		await new Promise(r => setTimeout(r, 500));
		const text = editorRoot().textContent || '';
		if (text.length > 20 && text === last) {
			stable += 500;
			if (stable >= 2000) return true;
		} else {
			stable = 0;
			last = text;
		}
	}
	return false;
}

async function main() {
	const buf = await (await fetch('/' + file)).arrayBuffer();
	createRoot(document.getElementById('root')).render(
		React.createElement(DocxEditor, {
			documentBuffer: buf,
			documentName: file.split('/').pop(),
			documentNameEditable: false,
			readOnly: true,
			mode: 'viewing',
			colorMode: 'light',
			showFileOpen: false,
			showHelpMenu: false,
			commentsSidebarOpen: false,
		})
	);

	await waitForRender();

	const root = editorRoot();
	// 逐段落提取文本(目录条目 = TOC1/TOC2 样式段落, 应为「标题 + tab + 页码」)
	const paragraphs = [...root.querySelectorAll('p')].map(p => p.textContent);
	// 第一条目录条目的 innerHTML 片段, 用于观察 tab/域节点的实际 DOM 结构
	const firstEntry = [...root.querySelectorAll('p')].find(
		p => (p.textContent || '').includes('第一章')
	);
	window.__RESULT__ = {
		file,
		ok: true,
		paragraphs,
		firstEntryHtml: firstEntry ? firstEntry.innerHTML.slice(0, 1200) : null,
	};
	document.title = 'RENDER_DONE';
	const pre = document.getElementById('dump');
	if (pre) pre.textContent = JSON.stringify(window.__RESULT__.paragraphs, null, 2);
}
main().catch(e => {
	document.title = 'RENDER_ERROR';
	document.getElementById('root').textContent = 'ERROR: ' + e.message;
	console.error(e);
});
