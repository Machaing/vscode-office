import * as vscode from 'vscode';
import { Handler } from '@/common/handler';

const pendingBlockScroll = new Map<string, string>();
const webviewHandlers = new Map<string, Handler>();

/** 最近一次可见的 markdown webview,供命令入口定位(office.markdown.find) */
let activeHandler: Handler | undefined;

/** 按文件路径缓存 webview，忽略 query / fragment */
export function markdownUriKey(uri: vscode.Uri): string {
    return uri.with({ query: '', fragment: '' }).toString();
}

export function registerMarkdownWebview(uri: vscode.Uri, handler: Handler): void {
    webviewHandlers.set(markdownUriKey(uri), handler);
}

export function unregisterMarkdownWebview(uri: vscode.Uri): void {
    webviewHandlers.delete(markdownUriKey(uri));
}

export function getMarkdownWebviewHandler(uri: vscode.Uri): Handler | undefined {
    return webviewHandlers.get(markdownUriKey(uri));
}

export function setPendingBlockScroll(uri: vscode.Uri, fragment: string): void {
    pendingBlockScroll.set(markdownUriKey(uri), fragment);
}

export function consumePendingBlockScroll(uri: vscode.Uri): string | undefined {
    const key = markdownUriKey(uri);
    const fragment = pendingBlockScroll.get(key);
    if (fragment) {
        pendingBlockScroll.delete(key);
    }
    return fragment;
}

export function notifyBlockScroll(uri: vscode.Uri, fragment: string): void {
    const handler = getMarkdownWebviewHandler(uri);
    if (!handler) {
        setPendingBlockScroll(uri, fragment);
        return;
    }
    setTimeout(() => {
        handler.emit('gotoBlock', fragment);
    }, 150);
}

export function setActiveMarkdownWebview(handler: Handler): void {
    activeHandler = handler;
}

export function clearActiveMarkdownWebview(handler: Handler): void {
    if (activeHandler === handler) {
        activeHandler = undefined;
    }
}

export function getActiveMarkdownWebview(): Handler | undefined {
    return activeHandler;
}

export function broadcastToMarkdownWebviews(event: string, content?: unknown): void {
    for (const handler of webviewHandlers.values()) {
        handler.emit(event, content);
    }
}
