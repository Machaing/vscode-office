# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/590](https://github.com/cweijan/vscode-office/issues/590)

## 标题

[BUG] Heading conversion drops ordered list numbers in Markdown / Markdown 标题操作丢失有序列表序号

## 标签

bug

## 问题描述

2026-08-21 由 fanruinet 报告(正文未提及具体扩展版本号，操作发生在 VS Code 的 Markdown 编辑功能中)。

带有序列表序号的 Markdown 行执行 Heading(标题)转换操作时，序号被错误替换为无序列表符号，文档结构信息被破坏。

复现步骤(正文原文)：

1. 在 Markdown 编辑器中输入：

   ```
   2. 甲公司
   ```

2. 选中该行，执行 Heading 操作(如 H5)。

实际结果：

```
##### * 甲公司
```

- 原有序列表序号 `2.` 丢失，被错误替换为无序列表符号 `*`(或其他无关标记)。
- 影响范围：任何以有序列表前缀(`1.`、`2.`、`(a)` 等)开头的行，执行标题转换时前缀都可能被覆盖或丢失。
- 报告者建议的修复方向：标题转换应基于整行文本插入前缀(`#####` + 原行内容)，而不是用正则重写行首，以免把有序列表序号误认为可替换的列表标记。
- 截至抓取时无任何评论，无维护者结论。

## 期望行为

仅添加标题标记，完整保留原内容：

```
##### 2. 甲公司
```

## 实际行为

得到 `##### * 甲公司`：原有序列表序号 `2.` 丢失，被错误替换为无序列表符号 `*`。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-590-heading-list-number.md`
生成脚本: 文本文件,直接维护

文件内容说明: 含 issue 原文的目标行 `2. 甲公司`(单独成段，即正文复现步骤的精确输入)，另附一组有序列表(1.、2.、10. 两位数序号)与无序列表、普通文本行作对照，用于验证 Heading 转换对各前缀的处理。

### 复现步骤

1. F5 调起扩展调试，打开复现文件；
2. 选中 `2. 甲公司` 所在行，执行 Heading 转换操作(如 H5)；
3. 预期: `##### 2. 甲公司`(仅添加标题标记，完整保留原行内容)；实际: `##### * 甲公司`(有序列表序号 `2.` 丢失，被替换为 `*`)。

## 根因定位

编辑器为 fork 的 vditor(vscode-office 默认 `editMode: wysiwyg`),标题转换入口:

- WYSIWYG:`vditor/src/ts/wysiwyg/setHeading.ts` 的 `setHeading`(工具栏 Headings 面板、Ctrl+Alt+1..6、⌘=/⌘- 均汇聚于此);
- IR:`vditor/src/ts/ir/process.ts` 的 `processHeading`。

WYSIWYG 模式下有序列表行 `2. 甲公司` 的 DOM 为 `<ol data-block="0" data-marker="2." start="2"><li data-marker="2.">甲公司</li></ol>`——序号只存在于 `data-marker`/`start` 属性,文本内容仅为 `甲公司`。`setHeading` 中 `hasClosestBlock` 命中的是整个 `<ol>`,代码直接执行 `ol.outerHTML = <h5 data-block="0">ol.innerHTML</h5>`,把 `<li data-marker="2.">` 整个塞进 h5。Lute `SpinVditorDOM` 重新解析时,脱离 `ol` 语境的孤儿 `li` 的有序标记被忽略、按默认无序标记渲染为文本,最终得到 `##### * 甲公司`——与 issue 报告的实际结果完全一致(node 层直接调用 Lute 复现确认)。

附带发现两个同源问题:

1. 多项列表(`1. a / 2. b / 3. c`)执行转换时整个 `<ol>` 被吞,结果为 `##### * a` + `* b\n* c`,整列表被毁;
2. IR 模式 `processHeading` 把标题标记文本插到 `<ol>` 开头(`insertAdjacentText("afterbegin")`),单项列表恰巧正确(Lute 重组为 `##### 2. xxx`),但多项列表时光标在第 2 项也会把第 1 项转成标题(定位错误)。

## 修复方案

按 issue 期望「仅添加标题标记,完整保留原行内容」:

- `vditor/src/ts/wysiwyg/setHeading.ts`:blockElement 为 UL/OL 时,先用 `hasClosestByTag(range.startContainer, "LI")` 定位光标所在 `li`,仅将该 `li` 原位替换为 `<hN>`,不再整包替换列表;有序列表(OL)时把 `li`/`ol` 的 `data-marker`(如 `2.`、`10.`、`2)`,保留原始形态)写入标题文本前缀;任务列表项的 checkbox `<input>` 及其后空格一并剥除(无序标记 `-`/`*` 为纯展示,不写入,与复现文件中"无序前缀被替换属预期"一致)。替换后残留的 `ol>hN` 结构由既有 `input()` 的 `getTopList` 提升逻辑交给 Lute 整链重组(实测立即归一化为 `1. a` / `##### 2. b` / `3. c`)。
- `vditor/src/ts/ir/process.ts` `processHeading`:blockElement 为 UL/OL 时,标题标记文本改为插到光标所在 `li` 之前(`beforebegin`)而非列表开头,使多项列表转换的是选中行而非首项;单项列表行为不变(Lute 重组时本就保留序号)。

## 修复记录(2026-09-14)

- `vditor/src/ts/wysiwyg/setHeading.ts`(+34/-2):列表分支定位 li、有序序号写入前缀、剥除 checkbox 及尾部空格;
- `vditor/src/ts/ir/process.ts`(+6):`processHeading` 列表分支插入点改为选中 li 之前,新增 `hasClosestByTag` import;
- `npm run build`(vditor 子项目)通过,`dist/` 产物已更新并经 closeBundle 同步至 `resource/markdown/dist/`(checksum 一致;dist 目录在 .gitignore 中,随构建再生成)。

## 验证方式

无头浏览器(chrome-devtools MCP)+ 静态服务加载构建产物 `dist/index.min.js`,初始化真实 Vditor 编辑器,模拟"选中/光标置于列表行 → Heading 操作"(工具栏 Headings 面板按钮与 Ctrl+Alt+N 快捷键两条路径),读取 `getValue()` 断言。结果:

| 场景 | 输入 → 操作 | 结果 |
| --- | --- | --- |
| issue 主场景(wysiwyg,工具栏按钮/快捷键/整行选中) | `2. 甲公司` + H5 | `##### 2. 甲公司` ✅(修复前 `##### * 甲公司`) |
| 多项列表中间项 | `1. 甲/2. 乙/3. 丙` + H5 | `1. 甲` `##### 2. 乙` `3. 丙`,兄弟项与序号保留 ✅ |
| 多项列表首/末项 | `1. 甲/2. 乙` + H1 / H6 | `# 1. 甲`+`2. 乙` / `1. 甲`+`###### 2. 乙` ✅(空行差异为 Lute tight/loose 归一化) |
| 两位数/括号序号 | `10. 第十项`、`2) 括号序号` + H5 | `##### 10. 第十项`、`##### 2) 括号序号` ✅ |
| 无序列表 | `- 无序列表项` + H5 | `##### 无序列表项` ✅ |
| 任务列表 | `- [ ] 任务项`、`2. [ ] 有序任务`、`- [x] 已完成` + HN | checkbox 与多余空格干净剥除 ✅ |
| IR 模式 | `2. 甲公司` + H5;多项中间项 | `##### 2. 甲公司`;`1. 甲/##### 2. 乙/3. 丙`(修复前转换的是首项)✅ |
| 回归 | 普通段落 + H2、标题 toggle-off(还原回 `2. 甲公司` 列表)、⌘- 降级 `# 2. 甲公司`→`## 2. 甲公司` | 全部正常 ✅ |

node 层另直接调用 Lute(`Md2VditorDOM`/`SpinVditorDOM`/`VditorDOM2Md`)验证了根因复现与各修复形态(单项/多项/首/中/尾/无序/任务/`2)` 形态)的重组结果。手动验证步骤:打开 `test-workspace/markdown/test-markdown-cweijan-590-heading-list-number.md`,光标置于 `2. 甲公司` 行,Ctrl+Alt+5(或工具栏 标题 → H5),应得到 `##### 2. 甲公司`。
