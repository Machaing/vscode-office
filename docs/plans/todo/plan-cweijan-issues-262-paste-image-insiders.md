# issue信息

## issue链接

https://github.com/cweijan/vscode-office/issues/262

## 标题

[BUG]vscode-insider在markdown文件中无法粘贴图片

## 标签

bug

## 问题描述

- 环境: OS 与扩展版本字段均未填写(2023-09-15 提交)
- 用户使用该扩展两年余;反馈在 VS Code 正式版中 markdown 文件可正常粘贴图片,但在 VS Code Insiders(vscode-insider)中无法粘贴图片;
- 用户怀疑是配置问题但找不到配置入口,请求指点;
- 相关机制(本仓库现状):扩展注册命令 `office.markdown.paste`(title "Enhance paste in markdown",默认键位 `ctrl+v` / mac `cmd+v`,when: `editorTextFocus && resourceLangId == markdown && !office.extensionHost.web`),负责把剪贴板图片落盘并插入 markdown 图片链接;相关配置 `vscode-office.pasterImgPath`(默认 `image/${fileName}/${now}.${ext}`)、`vscode-office.pasteImageToWorkspacePath`、`vscode-office.workspacePathAsImageBasePath`;
- issue 无评论、无维护者结论。

## 期望行为

在 vscode-insider 中打开 md 文本编辑器,光标处按 `ctrl+v`(mac `cmd+v`)时与正式版一致:剪贴板图片按 `vscode-office.pasterImgPath` 规则保存到工作区,并在光标处插入对应的 markdown 图片引用。(推断;正文未明写期望,按正式版正常行为推断)

## 实际行为

vscode-insider 中粘贴图片无任何反应(不落盘、不插入链接);同一用法在 VS Code 正式版中正常。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-262-paste-image-insiders.md`
生成脚本: 文本文件,直接维护

文件内容说明: 含标题、正文与一行既有图片引用(指向 test-workspace 自带的 `image/sample.png`)的极简 markdown;图片引用行用于对照「粘贴成功后的预期产物形态」,文末空行作为粘贴落点。

### 复现步骤

1. 截图或复制一张本地图片,使剪贴板中为图片数据;
2. F5 调起扩展调试,分别在同一 workspace 用 VS Code 正式版与 Insiders 打开复现文件(以普通文本编辑器方式打开,保证 `editorTextFocus` 成立);
3. 将光标置于文末「粘贴落点」行,按 `ctrl+v`(mac `cmd+v`);
4. 预期(正式版表现): 图片按 `vscode-office.pasterImgPath` 规则保存(默认 `image/{文件名}/{时间戳}.{扩展名}`),并在光标处插入 `![](...)` 图片引用;
5. 实际(Insiders 表现): 无反应,既无文件落盘也无链接插入;
6. 排查项: 确认两个版本安装的扩展版本一致;在 Insiders 键盘快捷方式面板检查 `office.markdown.paste` 键位未被其他扩展/用户改绑抢占;对比两版本剪贴板 API 对图片格式的返回差异。

## 根因定位

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
