# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/587](https://github.com/cweijan/vscode-office/issues/587)

## 标题

[BUG]markdown 的照片突然不显示了，原来的版本可以正常显示

## 标签

bug

## 问题描述

- 报告人 mapengsen,2026-08-20 提交;issue 模板的 OS 与 Extension Version 均未填写;
- 正文几乎没有文字描述,仅附一张截图(托管于 GitHub 私有用户图片服务,匿名抓取无法查看具体内容);
- 从标题可得的现象: markdown 文档中的照片(本地图片)在某次扩展升级后突然不显示,
  回退到原来的版本可以正常显示 —— 属于版本回归;
- issue 无评论,维护者尚未回复。

## 期望行为

升级后的扩展版本仍应与旧版本一致,正常渲染 markdown 中的本地照片(推断;正文未明写,
按「原来的版本可以正常显示」反推)。

## 实际行为

markdown 中的照片不显示(截图无法查看,具体表现为占位符、裂图还是空白,
待用复现文件在当前版本上确认;回归引入的扩展版本区间亦待确认)。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-587-local-image-regression.md`
生成脚本: 文本文件,直接维护

文件内容说明: 构造本地相对路径图片引用三处(PNG/JPG/GIF,均指向 `test-workspace/image/`
下真实存在的文件)。与 issue 现象的对应关系: 打开预览观察本地照片是否渲染。
原 issue 未附 markdown 源码,按「本地相对路径图片在扩展升级后不显示」的标题语义构造。

### 复现步骤

1. F5 调起扩展调试,打开复现文件;
2. 查看预览中的三张本地图片;
3. 预期: 相对路径图片全部正常渲染;实际: 照片不显示(issue 现象)。
   若当前版本无法复现,需按版本回归思路对比升级前后的扩展版本,定位引入回归的提交。

## 根因定位

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
