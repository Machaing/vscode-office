/**
 * 模拟 AWS Toolkit 的 S3 文件系统,用于离线复现 cweijan-415:
 * "Unable to open S3 file, try reopening from the explorer."
 *
 * 与 toolkit 行为的对应关系:
 * - readFile 返回本地复现文件的字节(模拟从 S3 拉取对象);
 * - writeFile 抛出 toolkit 的兜底错误文案(其 activation.ts:37-39 注册 scheme 时注入,
 *   virtualFilesystem.ts:58-64 对无提供器的 uri 抛出),模拟"提供器不在线"时保存被拒。
 *
 * 用法: 经 .vscode/launch.json 的 "Extension (S3 Mock)" 配置随主扩展一起加载,
 * 命令面板执行 "Mock S3: Open test xlsx" 打开 s3mock:/bucket/ 下的复现文件。
 */
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

// 仓库内复现文件:test-workspace/excel/test-excel-cweijan-415-s3-save-error.xlsx
const BACKING_FILE = path.resolve(__dirname, '..', '..', 'excel', 'test-excel-cweijan-415-s3-save-error.xlsx');
const TOOLKIT_ERROR = 'Unable to open S3 file, try reopening from the explorer.';
const TEST_URI = 's3mock:/bucket/test-excel-cweijan-415-s3-save-error.xlsx';

class MockS3FileSystemProvider {
    stat(uri) {
        if (!fs.existsSync(BACKING_FILE)) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }
        return {
            type: vscode.FileType.File,
            ctime: 0,
            mtime: fs.statSync(BACKING_FILE).mtimeMs,
            size: fs.statSync(BACKING_FILE).size,
        };
    }

    async readFile(uri) {
        return new Uint8Array(await fs.promises.readFile(BACKING_FILE));
    }

    writeFile(uri) {
        // 模拟提供器不在线时的写入被拒,文案与 toolkit 一字不差
        throw vscode.FileSystemError.NoPermissions(TOOLKIT_ERROR);
    }

    readDirectory(uri) {
        throw vscode.FileSystemError.FileNotFound(uri);
    }

    createDirectory(uri) {
        throw vscode.FileSystemError.NoPermissions(TOOLKIT_ERROR);
    }

    delete(uri) {
        throw vscode.FileSystemError.NoPermissions(TOOLKIT_ERROR);
    }

    rename(source) {
        throw vscode.FileSystemError.NoPermissions(TOOLKIT_ERROR);
    }

    copy(source) {
        throw vscode.FileSystemError.NoPermissions(TOOLKIT_ERROR);
    }

    watch() {
        return new vscode.Disposable(() => { });
    }
}

function activate(context) {
    context.subscriptions.push(
        vscode.workspace.registerFileSystemProvider('s3mock', new MockS3FileSystemProvider(), {
            isCaseSensitive: true,
        }),
        vscode.commands.registerCommand('mockS3.openTestFile', () => {
            vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(TEST_URI));
        }),
    );
}

module.exports = { activate };
