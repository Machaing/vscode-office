# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/597](https://github.com/cweijan/vscode-office/issues/597)

## 标题

Word 文档目录页渲染异常：目录标题与条目文本丢失，仅显示页码

## 问题描述

该 `.docx` 文件在 Microsoft Word 中显示正常，目录标题、章节编号、引导点和页码均完整可见；但使用该插件预览时，目录条目的文本内容和编号丢失，只剩下页码。

## 期望行为

在 Microsoft Word 中，目录可以正常显示：

[![Image](https://private-user-images.githubusercontent.com/185761690/644288650-5cc08e79-81dd-4df7-a804-b9f8c1bd0547.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3ODkyMDU5OTEsIm5iZiI6MTc4OTIwNTY5MSwicGF0aCI6Ii8xODU3NjE2OTAvNjQ0Mjg4NjUwLTVjYzA4ZTc5LTgxZGQtNGRmNy1hODA0LWI5ZjhjMWJkMDU0Ny5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYwOTEyJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MDkxMlQwOTM0NTFaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1jOTg4NWUxNWNmNmNlMjY4MjU3ZTc5MGMxODFmNTZlN2FlZmQzODM3YzMzZjI2MWYwZDBjNjY3NzMzZDhiZjJhJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZyZXNwb25zZS1jb250ZW50LXR5cGU9aW1hZ2UlMkZwbmcifQ.u7IkX56jIgFrbuoRnATPOqdvkvUOB1Wgz8RIjKm67H0)](https://private-user-images.githubusercontent.com/185761690/644288650-5cc08e79-81dd-4df7-a804-b9f8c1bd0547.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3ODkyMDU2OTgsIm5iZiI6MTc4OTIwNTM5OCwicGF0aCI6Ii8xODU3NjE2OTAvNjQ0Mjg4NjUwLTVjYzA4ZTc5LTgxZGQtNGRmNy1hODA0LWI5ZjhjMWJkMDU0Ny5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYwOTEyJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MDkxMlQwOTI5NThaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT02ZmZjYTRlNGMxMWI2Njc2NmRlMmUwYWY1M2NiZjQwYTIzYTkwYmY1ZTQ3MTU2NzE5NzE5NmYyMjcxYzU0OTk4JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZyZXNwb25zZS1jb250ZW50LXR5cGU9aW1hZ2UlMkZwbmcifQ.HllhBQWqIEGhjp38OcndH2f1JONzSIcuVSIgG3HQzJI)

## 实际行为

使用该插件预览后，目录文本、章节编号和引导点均未正常显示，页面中主要只剩页码：

[![Image](https://private-user-images.githubusercontent.com/185761690/644289207-69bdfce3-1d2e-49e0-833f-37f23533132e.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3ODkyMDU5OTEsIm5iZiI6MTc4OTIwNTY5MSwicGF0aCI6Ii8xODU3NjE2OTAvNjQ0Mjg5MjA3LTY5YmRmY2UzLTFkMmUtNDllMC04MzNmLTM3ZjIzNTMzMTMyZS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYwOTEyJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MDkxMlQwOTM0NTFaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT00OWQxNmYxMDE4NGUzNDQ0MzExNWQ4ZDczNTVjY2ZjY2ZmYjE3YTVjYjkzODEzYjkwZTY5MWE0MWI5ZDczYmEwJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZyZXNwb25zZS1jb250ZW50LXR5cGU9aW1hZ2UlMkZwbmcifQ.GVmshq7qCK4mnJ6ly0OmNoggjdX1ayT4WpfamTxRWk4)](https://private-user-images.githubusercontent.com/185761690/644289207-69bdfce3-1d2e-49e0-833f-37f23533132e.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3ODkyMDU2OTgsIm5iZiI6MTc4OTIwNTM5OCwicGF0aCI6Ii8xODU3NjE2OTAvNjQ0Mjg5MjA3LTY5YmRmY2UzLTFkMmUtNDllMC04MzNmLTM3ZjIzNTMzMTMyZS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYwOTEyJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MDkxMlQwOTI5NThaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1jMzVmNWE2ZmJiMzc4MjVlMmRlYmJiMDlmZWFkOTg5OTk1YjljNGJiNjQ3YTg2YWIyMmFhNzE2MDhjYjljMTQxJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZyZXNwb25zZS1jb250ZW50LXR5cGU9aW1hZ2UlMkZwbmcifQ.nyfpdfSNJr6UMFRg7___up9imTNLLBqfiHPjeMwiVlU)

## 补充说明

* 正文部分目前可以正常显示。
* 问题主要出现在 Word 自动目录（Table of Contents）区域。
* 从渲染结果来看，插件似乎能够读取目录中的页码信息，但没有正确渲染目录条目的文本内容。

# 问题确认及解决

## 复现数据

`test-workspace/word/` 下提供两个复现文件(生成脚本见 `test-workspace/_generate/issue_597_toc.py` 与 `issue_597_variants.py`):

| 文件 | TOC 结构 | 渲染结果 |
| --- | --- | --- |
| `issue-597-toc.docx` | Word 标准结构: 条目由 `<w:hyperlink>` 包裹, 内嵌 PAGEREF 域 | ✅ 正常(目录标题/条目文本/页码俱全) |
| `issue-597-toc-plain.docx` | WPS/无 `\h` 开关变体: 条目是 TOC 域 fieldResult 内的普通 run, 无 hyperlink | ❌ **第一条目"第一章 引言"文本丢失, 仅剩页码 `1`**, 与 issue 现象一致 |

两个文件正文、页码均正常, 仅 TOC 域结果区的文本受影响。

## 根因定位(已确认)

问题出在 `@eigenpal/docx-editor-core@1.9.0`(npm 依赖)的段落内域解析状态机,
位于 `dist/chunk-TNQDZQ6K.mjs` 的 `q()` 函数(inline 内容解析器):

```js
for (T of c) {              // 遍历段落内 run
  ...
  if (g && (u = true, C = false, d = "", p = [], w = [], ...))
  //     ^ 遇到 fldChar begin 时无条件重置域累积状态(d=指令, p=fieldCode, w=fieldResult)
}
```

**该状态机没有嵌套域(栈)概念**: 当 TOC 域(外层)的 fieldResult 区内出现 PAGEREF 域(内层)的 `begin` 时,
外层已累积的 `w`(条目文本 run、tab)被整体清空丢弃。逐 run 过程:

| run | 状态机行为 |
| --- | --- |
| `begin`(TOC) | 进入域模式, 重置 d/p/w |
| `instrText "TOC \\o ..."` | 入 p(fieldCode) |
| `separate` | 进入域结果区 |
| `"第一章 引言"`(文本) | 入 w(fieldResult) ✓ |
| `tab` | 入 w ✓ |
| `begin`(PAGEREF, 嵌套) | **重置 w —— 上述文本被丢弃** ✗ |
| `instrText "PAGEREF ..."` / `separate` / `"1"` / `end` | PAGEREF 闭合为独立 complexField, fieldResult 仅剩页码 |

最终第一条目段落只剩 `complexField(PAGEREF)` 一个节点(fieldResult=["1"]),
条目文本在 Document 模型层就已丢失(经 `parseDocx` dump 验证),
后续 PM `field` 节点(atom, `displayText` 属性)自然只能渲染出页码。

而 hyperlink 版正常的原因: `q()` 的 `case "hyperlink"` 走独立分支,
hyperlink 内的 run 不参与域状态机, 不受嵌套 begin 清空影响。

issue 上传者的文件应为 plain 变体(或所有条目共段的单段 TOC), 故大面积丢失文本、仅剩页码。

## 修复方向

1. **上游修复(推荐)**: 向 `@eigenpal/docx-editor` 报 issue/PR, 将 `q()` 的域状态改为栈式处理 ——
   遇到嵌套 `begin` 时压栈保存外层状态, `end` 时弹栈并将嵌套 complexField 并入外层 `w`;
   外层域跨段落(TOC 域 begin 与 end 分处首末条目段)时当前实现同样无法闭合, 一并处理。
2. **本地补丁(过渡)**: 用 `pnpm patch @eigenpal/docx-editor-core` 对 `q()` 做最小修复:
   嵌套 begin 不清空 d/p/w, 嵌套域整体作为外层 fieldResult 的一部分。

## 修复记录(已实施本地补丁)

已于 2026-09-12 通过 `pnpm patch` 实施本地修复([patches/@eigenpal__docx-editor-core.patch](../../../patches/@eigenpal__docx-editor-core.patch),
配置见 [pnpm-workspace.yaml](../../../pnpm-workspace.yaml), 应用脚本见 `test-workspace/_generate/apply_597_patch.py`),
对 `dist/chunk-TNQDZQ6K.mjs` 与 `dist/chunk-OPJSWATH.js` 中 `q()` 状态机做三处修改:

1. 增加域栈 `fldStack`: 嵌套域 `begin` 时压栈保存外层 `{d,C,p,w,y,h,B}`, 不再直接清空;
2. 嵌套域 `end` 闭合时弹栈恢复外层状态, 并将内层 complexField 追加进外层 `fieldResult`;
3. 段落结束时若有未闭合域(TOC 等跨段域), 将其 `fieldResult` 摊平为段落内容, 避免跨段域内容整体丢失。

**验证**(无头 Chrome 跑真实 `DocxEditor` 渲染管线):
- `issue-597-toc-plain.docx`: 修复前第一条目仅剩页码 `1`; 修复后「第一章 引言 + tab + 1」完整, 五个条目全部正常;
- `issue-597-toc.docx`(hyperlink 版): 修复前后均正常, 无回归;
- `npm run build` 通过。

上游发布修复版本后, 应移除本补丁并升级依赖(见 [docs/plans/plan.md](../plans/plan.md) 的依赖升级跟踪)。

## 验证方式

```bash
# 生成复现文件
python test-workspace/_generate/issue_597_toc.py
python test-workspace/_generate/issue_597_variants.py

# 用扩展真实渲染管线验证(需先 F5 打开扩展, 分别预览两个文件):
# - issue-597-toc.docx         目录完整
# - issue-597-toc-plain.docx   第一条目录条目仅剩页码
```

另有无头验证脚本(浏览器直接跑 DocxEditor): `test-workspace/_generate/render597/main.jsx`,
经 esbuild bundle 后由静态服务加载, 可脱离 VS Code 快速回归。