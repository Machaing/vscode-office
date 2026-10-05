# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/503](https://github.com/cweijan/vscode-office/issues/503)

## 标题

[BUG]WLS2 windows linux 子系统 转换md 到pdf 出现错误

## 标签

bug

## 问题描述

环境:WSL2(Windows Linux 子系统),扩展版本 4.0.9(2026-06-29 提交)。

用户通过 VSCode 连接 WSL 打开 Markdown 文档,执行转换/导出为 PDF(或 DOCX)时报错:

```
Error: Not chromium found, export fail.
```

正文较简略,未提供更多复现细节。从报错看,导出功能依赖的浏览器(chromium)在 WSL 环境内未被发现:Windows 侧安装的 Chrome/Edge 在 WSL 的 Linux 文件系统中不存在于扩展内置的探测路径,WSL 内也未必安装了 Linux 版 chromium。

## 期望行为

(推断)在 WSL2 环境下导出 PDF/DOCX 应能成功:或自动探测到可用浏览器(含 Windows 侧浏览器在 WSL 下的挂载路径,如 `/mnt/c/...`),或在用户通过 `vscode-office.chromiumPath` 显式指定浏览器路径后可用;探测失败时应给出可操作的指引而非仅一句报错。

## 实际行为

导出失败,弹出 "Not chromium found, export fail.",PDF/DOCX 未生成。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-503-wsl-export-chromium.md`
生成脚本: 文本文件,直接维护

文件内容说明: 最小 Markdown 导出载体,含标题、段落、列表、表格与代码块等常见渲染元素,用于验证导出 PDF 的完整链路。

### 复现步骤

1. 前置环境:Windows + WSL2 发行版;WSL 内**未**安装 chrome/chromium;VS Code 通过 Remote-WSL 打开本项目(扩展运行于 Linux 侧);`vscode-office.chromiumPath` 未设置;
2. F5 调起扩展调试,在开发扩展宿主中打开复现文件;
3. 使用 Markdown 编辑器工具栏的导出功能导出 PDF;
4. 预期: 导出成功生成 PDF;实际: 弹出 "Not chromium found, export fail.",无 PDF 生成,与 issue 现象一致;
5. 对照实验:设置 `vscode-office.chromiumPath` 指向可用浏览器路径(WSL 内安装的 chromium,或 Windows 侧浏览器在 WSL 下的路径,如 `/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`)后再次导出,验证是否成功 —— 以界定问题是否仅出在"浏览器自动探测不适配 WSL 场景"。

## 根因定位

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
