import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Alert, Spin } from "antd";
import { DocxEditor, type DocxEditorRef } from "@eigenpal/docx-editor-react";
import "@eigenpal/docx-editor-react/styles.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { handler, vscodeApi } from "../../util/vscode";
import { loadOfficeBuffer } from "../../util/loadOfficeContent";
import { $t } from "../../i18n/i18nConfig.ts";
import { convertDocxTiffMedia } from "./tiffMedia";
import "./Word.css";

type WordColorMode = "light" | "adaptive";

const WORD_COLOR_MODE_KEY = "office-word-color-mode";

function loadWordColorMode(): WordColorMode {
    const state = vscodeApi?.getState?.() as { wordColorMode?: WordColorMode } | undefined;
    if (state?.wordColorMode === "light" || state?.wordColorMode === "adaptive") {
        return state.wordColorMode;
    }
    try {
        const saved = localStorage.getItem(WORD_COLOR_MODE_KEY);
        if (saved === "light" || saved === "adaptive") {
            return saved;
        }
    } catch { }
    return "light";
}

function saveWordColorMode(mode: WordColorMode) {
    try {
        localStorage.setItem(WORD_COLOR_MODE_KEY, mode);
    } catch { }
    if (vscodeApi?.setState) {
        const prev = (vscodeApi.getState?.() ?? {}) as Record<string, unknown>;
        vscodeApi.setState({ ...prev, wordColorMode: mode });
    }
}

interface WordOpenPayload {
    path?: string;
    buffer?: number[];
    error?: string;
    readOnly?: boolean;
    fileName?: string;
    documentCacheId?: string;
    nonce?: number;
}

/**
 * docx 本质是 zip 包,进入 docx-editor 前检查文件头魔数(plan-word-open-error):
 * OLE2 复合文档头(D0 CF 11 E0)说明内容是 Word 97-2003 等旧版二进制格式,
 * 只是扩展名叫 .docx,直接进库会得到 JSZip 的 "Can't find end of central directory"
 * 技术报错;其余非 PK 开头的内容同样不是 docx。返回 null 表示通过。
 */
function detectDocxMagicError(buffer: ArrayBuffer): string | null {
    const bytes = new Uint8Array(buffer, 0, Math.min(8, buffer.byteLength));
    if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
        return null;
    }
    if (bytes.length >= 4 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
        return $t("viewer.legacyOfficeBinary");
    }
    return $t("viewer.notDocxZip");
}

export default function Word() {
    const editorRef = useRef<DocxEditorRef>(null);
    const readOnlyRef = useRef(false);
    const [colorMode, setColorMode] = useState<WordColorMode>(loadWordColorMode);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [readOnly, setReadOnly] = useState(false);
    const [documentBuffer, setDocumentBuffer] = useState<ArrayBuffer | undefined>(undefined);
    const [documentKey, setDocumentKey] = useState("");
    const [fileName, setFileName] = useState("");
    const [commentsSidebarOpen, setCommentsSidebarOpen] = useState(false);
    const skipCommentsAutoOpenRef = useRef(true);

    const adaptiveColorMode = colorMode === "adaptive";

    const toggleColorMode = () => {
        setColorMode((prev) => {
            const next: WordColorMode = prev === "adaptive" ? "light" : "adaptive";
            saveWordColorMode(next);
            return next;
        });
    };

    const emitSave = useCallback((buffer: ArrayBuffer) => {
        const bytes = new Uint8Array(buffer);
        const content: number[] = new Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
            content[i] = bytes[i];
        }
        handler.emit("save", content);
    }, []);

    const handleSave = useCallback(async () => {
        const buffer = await editorRef.current?.save();
        if (!buffer) {
            return;
        }
        emitSave(buffer);
    }, [emitSave]);

    const loadDocument = useCallback(async (payload: WordOpenPayload) => {
        setLoading(true);
        setError(null);
        setDocumentBuffer(undefined);

        try {
            const fileReadOnly = payload.readOnly === true;
            readOnlyRef.current = fileReadOnly;
            setReadOnly(fileReadOnly);
            setFileName(payload.fileName ?? "");
            setDocumentKey(`${payload.documentCacheId ?? ""}-${payload.nonce ?? Date.now()}`);
            skipCommentsAutoOpenRef.current = true;
            setCommentsSidebarOpen(false);
            const buffer = await loadOfficeBuffer(payload);
            const magicError = detectDocxMagicError(buffer);
            if (magicError) {
                setError(magicError);
                return;
            }
            // 浏览器无法解码 TIFF,进入 docx-editor 前把 tiff 媒体转成 PNG(issue-311)
            setDocumentBuffer(await convertDocxTiffMedia(buffer));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load document");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        handler
            .on("open", (payload: WordOpenPayload) => {
                void loadDocument(payload);
            })
            .emit("init");
    }, [loadDocument]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.code === "KeyS") {
                e.preventDefault();
                void handleSave();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [handleSave]);

    return (
        <div className={`word-viewer${adaptiveColorMode ? " word-viewer--vscode-theme" : ""}`}>
            <button
                type="button"
                className="dark-mode-toggle"
                title={adaptiveColorMode ? "切换亮色" : "切换暗色（跟随 VS Code 主题）"}
                aria-label={adaptiveColorMode ? "Switch to light mode" : "Switch to adaptive dark mode"}
                onClick={toggleColorMode}
            >
                {adaptiveColorMode ? <SunOutlined /> : <MoonOutlined />}
            </button>
            <Spin spinning={loading} fullscreen />
            {error && <Alert type="error" message={error} showIcon style={{ margin: 16 }} />}
            {readOnly && !loading && !error && documentBuffer && (
                <div className="word-readonly-banner">Read-only — edits will be saved to a new file</div>
            )}
            {documentBuffer && !loading && !error && (
                <>
                    <DocxEditor
                        key={documentKey}
                        ref={editorRef}
                        className="word-editor"
                        documentBuffer={documentBuffer}
                        documentName={fileName}
                        documentNameEditable={false}
                        readOnly={readOnly}
                        {...(readOnly ? { mode: "viewing" as const } : {})}
                        commentsSidebarOpen={commentsSidebarOpen}
                        onCommentsSidebarOpenChange={(open) => {
                            if (open && skipCommentsAutoOpenRef.current) {
                                skipCommentsAutoOpenRef.current = false;
                                return;
                            }
                            setCommentsSidebarOpen(open);
                        }}
                        colorMode="light"
                        showFileOpen={false}
                        showHelpMenu={false}
                        onError={(err) => {
                            setError(err instanceof Error ? err.message : String(err));
                        }}
                        onChange={() => {
                            if (!readOnlyRef.current) {
                                handler.emit("change");
                            }
                        }}
                        onSave={emitSave}
                    />
                </>
            )}
        </div>
    );
}
