// issue-311 无头渲染验证(参照 render529/main.jsx 套路)
// 用法: 经 esbuild bundle 后由静态服务(test-workspace 根目录)加载,
//       URL 参数 ?file=word/xxx.docx 指定文件(默认 311 复现文件)、
//       &convert=1 启用 tiff 媒体预处理(直接 import 仓库内修复代码 tiffMedia.ts)。
// 渲染完成后 window.__RESULT__ 携带每张 <img> 的 src 前缀与 naturalWidth/Height,
// TIFF 修复前 data:image/tiff 的 img naturalWidth=0(解码失败), 修复后应 > 0。
import React from 'react';
import { createRoot } from 'react-dom/client';
import { DocxEditor } from '@eigenpal/docx-editor-react';
import { convertDocxTiffMedia } from '../../../src/react/view/word/tiffMedia';

const params = new URLSearchParams(location.search);
const file = params.get('file') || 'word/test-word-cweijan-311-tif-image.docx';
const convert = params.get('convert') === '1';

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

// 等图片解码完成(img.complete 且非 broken,naturalWidth>0)
async function waitForImages() {
	const deadline = Date.now() + 20000;
	while (Date.now() < deadline) {
		const imgs = [...editorRoot().querySelectorAll('img')];
		if (imgs.length && imgs.every(i => i.complete)) return imgs;
		await new Promise(r => setTimeout(r, 500));
	}
	return [...editorRoot().querySelectorAll('img')];
}

async function main() {
	let buf = await (await fetch('/' + file)).arrayBuffer();
	let convertedBytes = null;
	// 暴露转换函数供外部结构校验(?dump=1 时把转换后 zip 以 base64 放到 __CONVERTED__)
	window.__convert = convertDocxTiffMedia;
	window.__fetchBuf = async () => await (await fetch('/' + file)).arrayBuffer();
	if (convert) {
		buf = await convertDocxTiffMedia(buf);
		convertedBytes = buf.byteLength;
		if (params.get('dump') === '1') {
			const bytes = new Uint8Array(buf);
			let bin = '';
			const chunk = 0x8000;
			for (let i = 0; i < bytes.length; i += chunk) {
				bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
			}
			window.__CONVERTED__ = btoa(bin);
		}
	}
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
	const imgs = await waitForImages();

	const root = editorRoot();
	const images = imgs.map(i => ({
		src: (i.getAttribute('src') || '').slice(0, 40),
		naturalWidth: i.naturalWidth,
		naturalHeight: i.naturalHeight,
		renderedWidth: i.width,
		renderedHeight: i.height,
	}));
	const paragraphs = [...root.querySelectorAll('p')].map(p => p.textContent);
	window.__RESULT__ = {
		file,
		convert,
		convertedBytes,
		images,
		paragraphs,
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
