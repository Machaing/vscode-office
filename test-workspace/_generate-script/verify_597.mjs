/** 用扩展实际使用的 @eigenpal/docx-editor-core 解析 issue-597 复现文件, 检查 TOC 文本是否丢失 */
import { parseDocx } from '@eigenpal/docx-editor-core';
import { readFileSync } from 'node:fs';

async function main() {
	const file = process.argv[2] ?? 'test-workspace/word/issue-597-toc.docx';
	const buf = readFileSync(file);
	const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
	const doc = await parseDocx(ab);

	const json = JSON.stringify(doc);
	const expectations = ['目录', '第一章 引言', '第二章 系统设计', '2.1 总体架构', '2.2 数据流', '第三章 总结'];
	console.log('文件:', file);
	for (const text of expectations) {
		console.log(json.includes(text) ? `  [保留] ${text}` : `  [丢失] ${text}`);
	}
	// 页码(域结果)是否保留
	for (const page of ['1', '2', '3']) {
		if (json.includes(`"${page}"`)) console.log(`  [页码字段存在] "${page}"`);
	}
}

main().catch(e => { console.error(e); process.exit(1); });
