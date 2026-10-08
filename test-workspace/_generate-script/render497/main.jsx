// issue-497 无头渲染验证(参照 render529/main.jsx 套路)
// 用法: 经 esbuild bundle 后由静态服务(test-workspace 根目录)加载,
//       URL 带 ?file=word/xxx.docx 指定要渲染的文件(默认 497 复现文件)。
// 分页层(.layout-page/.layout-table)在隐藏 ProseMirror 之外且按可视区虚拟化,
// 故滚动遍历后聚合各表格分片: 逐片记录 fromRow/toRow/cut border,
// 并校验 0..100 行覆盖(缺失/跨片重叠即"行丢失/行被切开")。
// 渲染完成后 window.__RESULT__ 携带结果, document.title 置为 RENDER_DONE。
import React from 'react';
import { createRoot } from 'react-dom/client';
import { DocxEditor } from '@eigenpal/docx-editor-react';

const params = new URLSearchParams(location.search);
const file = params.get('file') || 'word/test-word-cweijan-497-cross-page-table.docx';
const ROWS = 100;

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

// 滚动遍历分页容器触发虚拟化渲染, 聚合所有 .layout-table 分片
async function collectFragments() {
	const scroller = document.querySelector('.docx-editor__scroll-container') || document.getElementById('root');
	const collected = {};
	for (let y = 0; y <= scroller.scrollHeight; y += 600) {
		scroller.scrollTop = y;
		await new Promise(r => setTimeout(r, 400));
		for (const t of document.querySelectorAll('.layout-table')) {
			const d = t.dataset;
			const key = `${d.fromRow}-${d.toRow}`;
			if (!collected[key]) {
				collected[key] = {
					fromRow: +d.fromRow,
					toRow: +d.toRow,
					styleHeight: t.style.height,
					// cut border 顶点去重: 一个水平切边 x 每列一条, 去重后即切线数
					cutLines: [...new Set([...t.querySelectorAll('.layout-table-cut-border')].map(b => parseFloat(b.style.top)))],
				};
			}
		}
	}
	scroller.scrollTop = 0;
	await new Promise(r => setTimeout(r, 500));
	return Object.values(collected).sort((a, b) => a.fromRow - b.fromRow);
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
	const frags = await collectFragments();

	// 覆盖分析: 每行出现在哪些分片
	const coverage = [];
	for (const f of frags) for (let r = f.fromRow; r < f.toRow; r++) (coverage[r] = coverage[r] || []).push(f.fromRow);
	const missing = [];
	const splitRows = [];
	for (let r = 0; r <= ROWS; r++) {
		if (!coverage[r]) missing.push(r);
		else if (coverage[r].length > 1) splitRows.push(r);
	}

	window.__RESULT__ = {
		file,
		pageCount: document.querySelectorAll('.layout-page').length,
		fragments: frags,
		missingRows: missing,
		// 被切开的行(同一行出现在相邻两个分片, 修复后应为空)
		splitRows,
		fragmentsWithCut: frags.filter(f => f.cutLines.length > 0).length,
	};
	document.title = 'RENDER_DONE';
	const pre = document.getElementById('dump');
	if (pre) pre.textContent = JSON.stringify(window.__RESULT__, null, 2);
}
main().catch(e => {
	document.title = 'RENDER_ERROR';
	document.getElementById('root').textContent = 'ERROR: ' + e.message;
	console.error(e);
});
