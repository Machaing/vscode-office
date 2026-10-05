# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/589](https://github.com/cweijan/vscode-office/issues/589)

## 标题

The rendered Markdown document takes a long time to load.

## 标签

(无标签,bug 报告)

## 问题描述

在 VS Code 中同时使用 CC(Claude Code)与 Office Viewer:当 CC 在跑长任务期间,点击打开一个 Markdown 文档,加载时间长达 **10-20 分钟**。

未附文件与环境细节。合理推断:CC 长任务会持续向 markdown 文件(任务日志/报告)追加写入,产生大体积文档;加载缓慢可能与大文档整体渲染有关,也可能与"文件被持续写入时扩展监听 `fileChange` 反复触发重载/重渲染"有关(两者叠加更甚)。

### 环境

- 扩展版本: 4.1.3

## 期望行为

大 markdown 文档应在秒级完成打开并可交互(或渐进渲染);文件持续被外部写入时不应反复整页重载放大卡顿。

## 实际行为

点击 markdown 文档后约 10-20 分钟才完成加载。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-589-large-file-slow-load.md`
生成脚本: `test-workspace/_generate/issue_589_large_file_slow_load.py`

文件内容说明: 程序生成约 5MB 的混合结构 markdown(标题层级 + 段落 + 列表 + 表格 + 代码块,模拟 CC 长任务输出的长文档),行数/体积可在脚本头部参数调整。分两个场景验证:

- **场景 A(纯大文件)**: 静态打开,测从点击到可交互的耗时;
- **场景 B(边写边开,模拟 CC)**: 打开期间用脚本持续向另一同规格文件追加写入,观察是否反复重载、卡顿是否放大。

### 复现步骤

1. F5 调起扩展调试;
2. 场景 A: 打开 `test-markdown-cweijan-589-large-file-slow-load.md`,记录点击 → 可交互耗时;
3. 场景 B: 运行 `python test-workspace/_generate/issue_589_large_file_slow_load.py --append` 使目标文件持续追加写入,期间(重新)打开该文件观察行为;
4. 预期: 场景 A 秒级打开;场景 B 不因写入监听反复整页重载;
   实际(按 issue): 加载耗时分钟级(10-20 分钟)。

注: 5MB 未必达到 issue 的复现体量(CC 长任务日志可能远大于此),若 5MB 无感,逐步调大脚本参数(10MB/50MB)再测;同时关注 webview 内存与主进程 IPC 传输耗时占比。

## 根因定位

{待分析}(待排除的环节: ① 宿主读取全文 → postMessage 传输大字符串; ② vditor/lute 全量解析渲染; ③ fileChange 监听触发整页 reload 的策略; ④ 是否有同步阻塞扩展宿主的操作)

## 修复方案

{待分析}(候选方向: 大文件阈值降级(只读纯文本/分块渲染)、写入监听防抖与增量处理、渲染 worker 化)

## 验证方式

{待分析}(基线: 上述两场景量化耗时对比修复前后;回归: 常规 md(#601 等小文件)打开行为不变)
