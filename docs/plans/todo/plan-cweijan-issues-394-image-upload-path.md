# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/394](https://github.com/cweijan/vscode-office/issues/394)

## 标题

[BUG] Upload image broken if top-level GIT folder

## 标签

bug

## 问题描述

环境:Windows 11,扩展版本 v3.5.0(2025-03-10 提交)。

用户把所有检出的 git 仓库放在同一个父目录下(如 `c:/Users/myuser/repos/repo1`、`c:/Users/myuser/repos/repo2`),并用 VS Code 打开该**父目录**作为工作区。每个仓库内都含 `docs` 文件夹(常用 mkdocs,markdown 一般放在 `docs` 下)。

在该工作区布局下打开 `docs` 内的 markdown 文件并上传/粘贴图片时报错:

```
ENOENT: no such file or directory, open 'c:\\Users\\myuser\\repos\\repo1\\docs\\image\\index\\1741622430698.png'
```

对照:如果 VS Code 直接打开仓库文件夹(而非其父目录),扩展工作正常。

报错路径 `docs\image\index\<时间戳>.png` 与默认图片规则 `image/${fileName}/${now}.${ext}` 按 md 文件(`docs/index.md`,故 `${fileName}` = `index`)相对其所在目录展开的结果一致,说明路径模板已正常展开,但目标文件的父目录在该工作区布局下未被成功创建/解析,写入时父目录不存在导致 ENOENT。

## 期望行为

(推断)无论 VS Code 打开的是仓库本身还是包含多个 git 仓库的父目录,粘贴/上传的图片都应按 `vscode-office.pasterImgPath` 规则成功保存到 md 所在目录的相对路径(自动创建父目录)并插入图片引用。

## 实际行为

工作区根目录为多个 git 仓库的父目录时,在 markdown 中上传/粘贴图片失败,报 ENOENT(目标父目录不存在);直接打开仓库文件夹时同样操作正常。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-394-image-upload-path.md`
生成脚本: 文本文件,直接维护

文件内容说明: 最小 mkdocs 风格 Markdown 载体(含标题、一段正文、一个既有图片引用),复现时复制到 `仓库/docs/index.md` 使用 —— 文件名 `index` 与 issue 报错路径中的 `docs\image\index\` 对应(默认规则 `image/${fileName}/${now}.${ext}` 展开结果)。

### 复现步骤

1. 构造 issue 描述的目录结构(任意位置,如 `%TEMP%/issue-394/`):

   ```
   issue-394/                <- VS Code 打开的工作区(父目录)
   ├── repo1/                <- git init 过的仓库
   │   └── docs/
   │       └── index.md      <- 复制复现文件内容到此
   └── repo2/                <- 再放一个仓库,匹配"多仓库共父目录"场景
   ```

2. F5 调起扩展调试,在开发扩展宿主中「文件 → 打开文件夹」打开 `issue-394` 父目录(保持默认 `vscode-office.pasterImgPath` = `image/${fileName}/${now}.${ext}`);
3. 打开 `repo1/docs/index.md`,复制一张图片后在正文中 Ctrl+V 粘贴;
4. 预期: 图片保存为 `repo1/docs/image/index/<时间戳>.png`(父目录自动创建)并插入引用;实际: 报 ENOENT,与 issue 现象一致;
5. 对照: 「文件 → 打开文件夹」改为直接打开 `repo1`,重复步骤 3,验证是否恢复正常(对应 issue 中"直接打开仓库文件夹正常"的对照结论)。

## 根因定位

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
