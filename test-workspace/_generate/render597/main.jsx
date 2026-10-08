import React from 'react';
import { createRoot } from 'react-dom/client';
import { DocxEditor } from '@eigenpal/docx-editor-react';

async function main() {
	const buf = await (await fetch('issue-597-toc.docx')).arrayBuffer();
	createRoot(document.getElementById('root')).render(
		React.createElement(DocxEditor, {
			documentBuffer: buf,
			documentName: 'issue-597-toc.docx',
			documentNameEditable: false,
			readOnly: true,
			mode: 'viewing',
			colorMode: 'light',
			showFileOpen: false,
			showHelpMenu: false,
			commentsSidebarOpen: false,
		})
	);
}
main().catch(e => {
	document.getElementById('root').textContent = 'ERROR: ' + e.message;
	console.error(e);
});
