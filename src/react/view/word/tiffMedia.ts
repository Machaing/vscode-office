/**
 * docx 内嵌 TIFF 媒体预处理(issue-311)。
 *
 * 浏览器 <img> 原生不支持解码 TIFF,而 @eigenpal/docx-editor 会把
 * `word/media/*.tif(f)` 按扩展名原样转成 `data:image/tiff;base64,...`
 * 塞给 <img>,导致该图片区域空白(解析期不报错,仅加载失败)。
 *
 * 这里在文档 buffer 进入 docx-editor 之前重写 zip 包:
 * 1. 找出 `word/media/` 下的 tiff 条目,用 utif 解码(多页 TIFF 仅取首页)
 *    并经 canvas 转成 PNG;
 * 2. 重命名条目(`image2.tiff` -> `image2.png`),同步改写所有 `*.rels`
 *    中的 Target、并在 `[Content_Types].xml` 补上 png 的 Default 声明;
 * 3. 未包含 tiff 媒体或解码失败时原样返回(解码失败退化为既有行为)。
 */
import JSZip from 'jszip';
import * as UTIF from 'utif';

const TIFF_ENTRY_RE = /^word\/media\/[^/]+\.tiff?$/i;
/** zip 中央目录里条目名未压缩存储,先对原始字节做一次廉价的 latin1 扫描 */
const TIFF_HINT_RE = /media\/[^"'\\\x00/]*\.tiff?/i;

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 字节流里是否可能出现 tiff 媒体条目(误报无妨,仅用于跳过无谓的解包) */
function mayContainTiffMedia(bytes: Uint8Array): boolean {
    const chunkSize = 0x8000;
    let text = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
        text += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        if (TIFF_HINT_RE.test(text)) {
            return true;
        }
        // 保留末尾一小段,避免文件名恰好被分块截断
        text = text.slice(-512);
    }
    return false;
}

/** utif 解码首页并经 canvas 转成 PNG;失败返回 null */
async function decodeTiffToPng(data: ArrayBuffer): Promise<ArrayBuffer | null> {
    try {
        const ifds = UTIF.decode(data);
        if (!ifds.length) {
            return null;
        }
        UTIF.decodeImage(data, ifds[0]);
        const rgba = UTIF.toRGBA8(ifds[0]);
        const { width, height } = ifds[0];
        if (!width || !height) {
            return null;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return null;
        }
        ctx.putImageData(
            new ImageData(new Uint8ClampedArray(rgba), width, height),
            0,
            0
        );
        return await new Promise<ArrayBuffer | null>((resolve) => {
            canvas.toBlob(
                (blob) => {
                    void (blob ? blob.arrayBuffer().then(resolve, () => resolve(null)) : resolve(null));
                },
                'image/png'
            );
        });
    } catch {
        return null;
    }
}

export async function convertDocxTiffMedia(buffer: ArrayBuffer): Promise<ArrayBuffer> {
    if (!mayContainTiffMedia(new Uint8Array(buffer))) {
        return buffer;
    }

    let zip: JSZip;
    try {
        zip = await JSZip.loadAsync(buffer);
    } catch {
        return buffer;
    }

    const renames: Array<{ from: string; to: string }> = [];
    for (const name of Object.keys(zip.files)) {
        if (!TIFF_ENTRY_RE.test(name)) {
            continue;
        }
        const entry = zip.file(name);
        if (!entry) {
            continue;
        }
        const png = await decodeTiffToPng(await entry.async('arraybuffer'));
        if (!png) {
            continue;
        }
        const base = name.replace(/\.tiff?$/i, '');
        let target = `${base}.png`;
        let suffix = 1;
        while (zip.file(target)) {
            target = `${base}_${suffix++}.png`;
        }
        zip.remove(name);
        // createFolders:false — 避免隐式生成源包里不存在的目录条目
        zip.file(target, png, { createFolders: false });
        renames.push({ from: name, to: target });
    }
    if (!renames.length) {
        return buffer;
    }

    // 改写所有 .rels 里的 Target(document/header/footer 等共用 media/)
    for (const name of Object.keys(zip.files)) {
        if (!/\.rels$/i.test(name)) {
            continue;
        }
        const entry = zip.file(name);
        if (!entry) {
            continue;
        }
        let xml = await entry.async('string');
        let changed = false;
        for (const { from, to } of renames) {
            const oldTarget = `media/${from.split('/').pop()}`;
            const newTarget = `media/${to.split('/').pop()}`;
            const pattern = new RegExp(escapeRegExp(oldTarget), 'gi');
            if (pattern.test(xml)) {
                xml = xml.replace(pattern, newTarget);
                changed = true;
            }
        }
        if (changed) {
            zip.file(name, xml, { createFolders: false });
        }
    }

    // [Content_Types].xml 缺 png Default 声明时补上(已含 tiff 声明可保留)
    const contentTypes = zip.file('[Content_Types].xml');
    if (contentTypes) {
        const xml = await contentTypes.async('string');
        if (!/Extension="png"/i.test(xml)) {
            zip.file(
                '[Content_Types].xml',
                xml.replace(/<\/Types>/i, '<Default Extension="png" ContentType="image/png"/></Types>'),
                { createFolders: false }
            );
        }
    }

    return zip.generateAsync({
        type: 'arraybuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
    });
}
