# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/239](https://github.com/cweijan/vscode-office/issues/239)

## 标题

[BUG] Large CSV/XLS files hang the window

## 标签

bug

## 问题描述

提交者 mbauman,2023-06-06。

环境:

- OS: macOS
- Extension Version: v3.1.6

打开大文件(CSV 或 XLSX,约 100MB、100 万行 × 9 列,内容为 32 位浮点数)时,扩展无法显示内容,CPU 占满,整个窗口挂起,并弹出 "The window is not responding" 的系统通知。正文附一张该通知弹窗的截图。

正文未单独列出复现步骤/期望/实际行为,可归纳为:用扩展打开上述量级的大文件即触发挂起。截至抓取时无任何评论,无维护者回复。

## 期望行为

大 CSV/XLSX 文件能正常预览,或至少分块/可取消加载,不冻结整个窗口(推断,正文未明写)。

## 实际行为

无法显示内容,CPU 占满,整个窗口挂起,弹出 "The window is not responding" 通知(正文截图所示)。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/excel/test-excel-cweijan-239-large-csv.csv`
生成脚本: `test-workspace/_generate/issue_239_large_csv_hang.py`

文件内容说明: 表头 + 12 万行 × 9 列确定性伪随机浮点数的 CSV(约 12MB),与 issue 报告的文件同结构(100 万行 × 9 列浮点数)。受仓库体积限制未直接生成 100MB,行数可通过脚本顶部 `ROWS` 常量调整;行数越大现象越明显,100MB 量级可复现 "window is not responding"。

### 复现步骤

1. F5 调起扩展调试,打开复现文件;
2. 观察渲染过程与窗口响应(必要时把脚本 `ROWS` 调大至百万行模拟原始量级);
3. 预期: 文件可打开并滚动浏览,期间 UI 不冻结;实际: 渲染期间窗口长时间无响应、CPU 占用高,大文件直接弹出 "The window is not responding"。

## 根因定位

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
