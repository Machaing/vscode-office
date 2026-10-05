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

现象为「webview 主线程长任务 + 堆内存爆炸 → VS Code 渲染进程 GC 卡死 → 整窗 "not responding"」。用 esbuild bundle 真实 `excel_reader.ts` 后在 node 分段计时定位(node 22,桌面机;webview 同为 V8,量级可比;脚本 `test-workspace/_generate/verify_239.mjs`,`--orig` 可切 git HEAD 基线):

### CSV 路径(decodeCsvBuffer → udsv → 行对象构建 → x-spreadsheet)

| 文件 | decode | inferSchema | udsv stringArrs | 行对象构建 | loadSheets 全程 | 峰值堆 |
|---|---|---|---|---|---|---|
| 12 万行(11.3MB,复现文件) | 10ms | 1ms | 49ms | 41ms | 174ms | 259MB |
| 100 万行(94.4MB,issue 原始量级) | 51ms | 5ms | 405ms | 513ms | 1594ms | **1874MB** |

- 解析本身不慢,瓶颈是**全量物化**:100 万行 × 9 列 → 900 万个字符串 + 100 万个行对象/单元格对象,堆直奔 1.9GB。webview 渲染进程堆预算远小于此 → 反复 Mark-Compact,主线程被 GC 占满,而 webview 与窗口同进程,表现为整窗挂死。
- 渲染侧(x-spreadsheet)是视口虚拟化,单次 render 只画可见行,初始渲染不是瓶颈;但 `sumHeight(0, ri)`、`totalHeight()` 每次滚动/渲染 O(n) 扫全表行高,行数越大滚动越卡,同样源于全量 rows。

### XLSX 路径(ExcelJS)

100k 行 × 9 列 xlsx(5.6MB)分段:ExcelJS `workbook.xlsx.load` **2245ms / 堆 349MB**(占总 2.6s 的 85%),sortState 二次解压 245ms,逐单元格转换约 150ms。即 ExcelJS 自身的全量建模才是大头(34MB sheet XML ≈ 350MB 堆,线性外推 100 万行 ≈ 22s + 3.5GB);修复前实测 1M 行 xlsx 在 node 4GB 堆下直接 OOM 崩溃(约 95s GC 挣扎后 `Reached heap limit`),webview 内即「CPU 占满 + 窗口无响应」。

### 结论

单一「解析慢」并不是根根因,根因是**所有行/单元格被无条件物化成 JS 对象图**,对象图大小随行数线性膨胀,内存先于 CPU 杀死 webview。

## 修复方案

选择候选 a(行数上限截断)+ 针对 xlsx 的体量路由,不做候选 b(分块/滚动增量加载渲染):

- 查看器定位是预览而非全量编辑,截断为前 N 行即可满足「打开、浏览、查找」;b 需要重构 x-spreadsheet 数据层与滚动加载,成本高且大文件下滚动 O(n) 行高计算仍卡,收益不成比例。
- 候选 c(MAX_ROWS_TO_CHECK 等常数)只影响列宽计算等边角,对主瓶颈无效,不单独采用。

实现(`src/react/view/excel/excel_reader.ts`):

1. 常量 `MAX_LOAD_ROWS = 100_000`(注释说明,后续可配置化)。
2. **CSV**:`stringArrs` 的 `onData` 回调返回 false 提前终止解析——多解析 1 行用于精确判定截断(`rows.length > MAX`),不再物化后续约 90 万行;被截断时用 `indexOf` 循环按行分隔符近似统计总行数(引号内嵌换行会多计,提示文案用「约」),仅用于提示。
3. **XLSX(ExcelJS 路径)**:`convertExcelJsWorksheet` 的 `eachRow` 回调对超限行直接 return(eachRow 不可中断,跳过逐单元格转换即可),行高回填循环同样封顶;`worksheet.rowCount` 提供精确总行数。
4. **XLSX 大文件路由**:`readSheetXmlSize` 只解 zip 中央目录(不解压),sheet XML 解压总量 > `MAX_EXCELJS_XML_SIZE`(64MB)时放弃 ExcelJS 全量建模,改走 SheetJS `sheetRows: MAX_LOAD_ROWS + 1` 截断解析(解析层就丢掉超限行,内存有界)。代价是该体量以上的 xlsx 丢失样式保真(纯文本预览),换取可打开;多解 1 行同样用于判定截断。
5. **XLS/ODS(SheetJS 路径)**:同样启用 `sheetRows` 截断。带 `<dimension>` 的文件 SheetJS 会在 `!fullref` 保留原始总范围(精确总行数);生成器漏写 dimension 时(实测 openpyxl write_only 即如此)以「解到上限+1 行」判定截断,总行数按未知处理——此判定不依赖文件元数据,杜绝「截断了却没识别 → 可编辑 → 保存覆盖丢数据」的隐患。
6. **截断即只读**:`ExcelData` 新增 `truncated`/`totalRows`,`Excel.tsx` 在截断时强制 read 模式(防止保存把前 10 万行覆盖写回原文件造成数据丢失),并展示横幅(复用 `excel-readonly-banner` 样式):已知总行数时「文件较大:只读预览前 {} 行(共约 {} 行)」,未知时「文件较大:只读预览前 {} 行(超出预览上限)」。文案加入 x-spreadsheet 的 5 个 locale 文件(en/zh-cn/zh-tw/de/nl,`truncatedBanner`/`truncatedBannerNoTotal`)。

已知取舍/边界:

- 截断后查找、导出、另存为只作用于已加载的前 N 行(预览语义,横幅已明示);CSV 另存为走 saveAs 对话框,不会静默覆盖原文件。
- >64MB sheet XML 的 xlsx 走 SheetJS 后不带样式/冻结/超链接等(该量级此前直接挂死,属行为改善而非回退)。
- `MAX_EXCELJS_XML_SIZE` 以下但行数超 10 万的 xlsx 仍由 ExcelJS 全量建模(约 ≤4.5s + ≤700MB 堆),再由转换层截断——完全流式解析留待后续需要时再做。
- 截断文件的列数按前 N 行推断,极端「后面的行更宽」的文件列宽/列数以已加载行为准。

## 修复记录

- 2026-09-14:按上述方案实现。改动文件:
  - `src/react/view/excel/excel_reader.ts`:`MAX_LOAD_ROWS`/`MAX_EXCELJS_XML_SIZE` 常量;CSV onData 提前终止 + `countCsvRows`;ExcelJS 转换封顶 + `readSheetXmlSize` 体量路由;SheetJS `sheetRows` 截断 + `!fullref`/探针行判定;`ExcelData.totalRows`/`truncated`。
  - `src/react/view/excel/Excel.tsx`:截断强制只读 + 截断横幅(与只读横幅互斥展示)。
  - `src/react/view/excel/x-spreadsheet/locale/{en,zh-cn,zh-tw,de,nl}.js`:`viewer.truncatedBanner`/`viewer.truncatedBannerNoTotal`。
  - `test-workspace/_generate/verify_239.mjs`:分段计时验证脚本(esbuild bundle 真实源码,`--orig` 对比 git HEAD 基线,输出各段耗时/堆/sheets JSON md5)。

## 验证方式

node 侧模拟(node 22,`node test-workspace/_generate/verify_239.mjs <文件> [ext] [--orig]`):

1. **修复前后对比(同一 1M 行数据)**:

| 场景 | 修复前 | 修复后 |
|---|---|---|
| 100 万行 CSV(94MB) | loadSheets 1594ms,峰值堆 1874MB | loadSheets **248~323ms**,固定路径堆增量 ~200MB,`TRUNCATED totalRows=1000001` |
| 100 万行 XLSX(57MB) | node 4GB 堆 OOM 崩溃(~95s GC 挣扎) | loadSheets **6.5~6.6s,堆 290MB**,`TRUNCATED`(无 dimension,总行数未知) |
| 12 万行 CSV 复现文件(11.3MB) | 174ms,不截断全量加载 | 192ms,`TRUNCATED totalRows=120001`(多出的 ~18ms 为总行数扫描) |

2. **上限逻辑边界**:恰好 100000 行 CSV 不截断、100001 行 CSV 截断且 `totalRows=100001`(精确);100k 行 xlsx(ExcelJS 路径)截断 `totalRows=100001`;注入 `<dimension>` 的同类文件 `totalRows` 经 `!fullref` 精确给出。
3. **小文件零回归**:sample.csv / sample.tsv / issue-221 csv / sample.xlsx / sample.xlsm / sample.xls / sample.ods / formula-dollar-ref.xlsx / issue-592 xlsx 共 9 个既有用例,修复前后 sheets JSON md5 全部一致(`--orig` 基线逐一对拍);样式快照字节数一致(sample.xlsx 1252B)。
4. **编译与规范**:`npm run build` 通过;改动文件 ESLint 0 error(仅 Excel.tsx 既有的 exhaustive-deps 警告,与本修复无关)。
5. 临时生成的大文件(1M 行 csv/xlsx、边界 csv、注入 dimension 的 xlsx)验证后已删除;`verify_239.mjs` 按仓库惯例保留在 `test-workspace/_generate/` 供复验。
