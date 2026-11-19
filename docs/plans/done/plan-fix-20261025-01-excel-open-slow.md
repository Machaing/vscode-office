# Excel 打开慢至窗口未响应(稀疏大 sheet 的空位全遍历叠加样式注册线性扫描)

> 创建: 2026-10-25 · 来源: 本地实测报告(用户打开实际工作文档时触发,非上游 issue)

## 问题描述(报告原文)

> 实际使用插件打开以下execel很慢，大概10几秒后vscode会弹出窗口未响应的窗口，提示重新打开、关闭、继续等待，选择继续等待，然后再等待会正常渲染。
> test-workspace\excel\test-open-slow.xlsx
>
> 我觉得这个体验很不好，请你建立自动化手段能够日志记录到excel的加载时间，排查是哪个处理环节导致加载那么慢（wps打开是很快的），然后给出优化方案

## 复现数据

复现文件为用户实际工作文档,体积小可直接入库:[excel/test-open-slow.xlsx](../../../test-workspace/excel/test-open-slow.xlsx)(89KB,压缩包解压后 443KB,10 个 sheet)。无生成脚本,文件特征见下表(zip 中央目录与 XML 分析所得,也是本次根因的关键输入):

| 特征 | 数值 | 说明 |
| --- | --- | --- |
| `<c>` 单元格实体总数 | 6,678 | 其中约 4,090 个有值,其余为「空值但带样式」的实体 |
| 远端样式空 cell | 每个大 sheet 约 28 个 | 形如 `<c r="XET2" s="36"/>`,列号在 16,374~16,381(XET~XFA),分布在若干行的行尾 |
| 行 spans | `1:17 16374:16381` 这类跨段 | WPS 写入的行数据范围声明直接跨到 16,374 列之后 |
| 整列样式定义 | `<col min="18" max="16384" width="8.875" style="2"/>` | 第 18~16,384 列统一默认宽与样式,共 16,367 列 |
| styles.xml 规模 | cellXfs 304、fonts 41 | 解压后 66KB,为包内最大条目 |
| 实际数据范围 | 最大 sheet 95 行 × 17 列左右 | 6 个 sheet 有远端 cell,4 个 sheet 正常 |

### 复现步骤

1. F5 调起扩展调试(或安装版直接使用),打开 `test-open-slow.xlsx`;
2. 实际(修复前):界面停留在加载状态,约十几秒后 VS Code 弹出「窗口未响应」对话框(重新打开/关闭/继续等待),选择继续等待,再等一段时间后表格正常渲染;WPS 打开同一文件为秒开;
3. 预期(修复后):秒级完成打开与可交互,全程无未响应弹窗。

# 问题确认及解决

术语说明:

- **dimension / spans**:sheet XML 里声明数据范围的属性。`dimension` 是整表范围(如 `A1:XFA95`),`spans` 是单行的实际数据列范围(如 `1:17 16374:16381`,表示第 1~17 列和第 16,374~16,381 列有数据)。范围大不代表数据多,本文件就是这样;
- **稀疏数组 `_cells`**:ExcelJS 解析每行时,把单元格按「列号 − 1」塞进数组的对应下标,中间没有单元格的位置留空。只要某行有一个位于 16,381 列的 cell,这行的数组长度就是 16,381;
- **includeEmpty 遍历**:ExcelJS 的 `row.eachCell({ includeEmpty: true })` 会从第 1 列遍历到该行数组的长度,对每个空位调 `getCell` 现场创建一个 Cell 对象(而不是只访问 XML 里真实存在的单元格);
- **整列样式**:`<col>` 元素为一整段列定义的默认宽度和样式,该区间内所有空单元格在 Excel 语义上都继承它。ExcelJS 动态创建的空 Cell 也会带上这份样式;
- **StyleRegistry(样式注册表)**:[excel_styles.ts](../../../src/react/view/excel/excel_styles.ts) 里把每个单元格的样式对象去重登记、返回序号的组件,转换结果里单元格只存序号;
- **webview 主线程**:承载表格界面的网页进程里的 JS 执行线程。解析与转换都在这条线程上同步执行,期间页面无法响应任何消息,这是「窗口未响应」弹窗的直接来源(此句为推断,依据是下文实测的单线程长阻塞与用户描述的现象吻合)。

## 根因定位

**已定位,三层因素叠加,决定性的一层在样式注册的算法。** 文件合法且体量很小(WPS 秒开是正常表现),问题出在本扩展的转换环节对「稀疏大范围 sheet」的处理方式:远端空 cell 把每行的遍历范围拉到 1.6 万列,空位全遍历制造了 259 万个带样式的空 Cell 对象,而每个对象都要过一遍线性扫描加双重字符串化的样式注册,单线程同步跑满几十秒,webview 冻结,VS Code 判定窗口无响应。以下按链路展开,全部结论经 Node 侧实测(与 webview 同一份代码,esbuild 打包后运行,2026-10-25 本机)。

### 打开链路与各环节实测耗时

webview 侧的打开流程是:收到 `open` 消息后 [Excel.tsx](../../../src/react/view/excel/Excel.tsx) 先经 `loadOfficeBuffer` 从扩展宿主取回文件字节,然后交给 [excel_reader.ts:325](../../../src/react/view/excel/excel_reader.ts#L325) 的 `loadSheets` 解析并转换成表格数据,最后在 [Excel.tsx:337-364](../../../src/react/view/excel/Excel.tsx#L337-L364) 构造 Spreadsheet 实例并 `loadData` 挂载渲染。`loadSheets` 内部先用 ExcelJS 建模([excel_reader.ts:385-401](../../../src/react/view/excel/excel_reader.ts#L385-L401)),再逐 sheet 调 `convertExcelJsWorksheet` 转换([excel_reader.ts:240-321](../../../src/react/view/excel/excel_reader.ts#L240-L321))。分环节计时结果:

| 环节 | 实测耗时 | 备注 |
| --- | --- | --- |
| JSZip 解析 zip 目录(打点前置) | 4 ms | |
| ExcelJS `workbook.xlsx.load` 解析建模 | 136 ms | 解析本身不慢 |
| 转换 10 个 sheet(现状代码,含每 cell 样式注册) | **约 54,000~60,000 ms** | `loadSheets` 全链实测 60.4s |
| └ 其中 `StyleRegistry.add` 累计 | **52,831 ms(98%)** | 逐函数计时定位 |
| └ 其余每 cell 函数(文本格式化、样式转换、超链接、保护判定) | 合计约 1.4s | 259 万次的基数摊薄 |
| 转换(仅把注册改成 Map 缓存后) | 3,376 ms | 见「修复方案」PoC |
| 转换(只遍历 XML 实体 cell,不再展开空位) | **98 ms** | 遍历 4,090 个有值 cell |

### 三层因素的逐层展开

**第一层,文件的特征把遍历范围拉大了三个数量级。** 六个 sheet 的行尾都带有 28 个左右的远端样式空 cell(XET~XFA 列,即第 16,374~16,381 列),推测是 WPS 或历史编辑操作留下的痕迹。这些 cell 让每行在 ExcelJS 里的 `_cells` 稀疏数组长度达到 16,381,`worksheet.columnCount` 随之报告 16,373~16,381。同时 `<col>` 定义把第 18~16,384 列统一给了默认样式,这意味着后续动态创建的每个空 Cell 都自带样式对象,为第三层的爆炸提供了燃料。

**第二层,includeEmpty 遍历把空位全部实体化。** [excel_reader.ts:255](../../../src/react/view/excel/excel_reader.ts#L255) 用 `row.eachCell({ includeEmpty: true }, ...)` 遍历,而 ExcelJS(`@cweijan/exceljs`,`dist/browser/doc/row.js` 第 145~149 行)在该模式下从第 1 列循环到 `_cells.length`,每个空位都调 `getCell` 现场创建 Cell 对象。行数乘以数组长度,六个大 sheet 合计被遍历 2,590,962 次,其中绝大多数是这种「无值但继承了整列样式」的动态空 Cell(实测遍历到的 cell 全部带样式,无一例外)。空跑这一遍(回调什么都不做)约 0.8s,本身已不便宜,但还不是主因。

**第三层(决定性),样式注册对每个 cell 做线性扫描加双重字符串化。** 转换回调里每个 cell 都要调 [excel_styles.ts:294-303](../../../src/react/view/excel/excel_styles.ts#L294-L303) 的 `styleRegistry.add` 查重登记,它的实现是:对已注册的每个样式各做一次 `JSON.stringify`,再把入参也 `JSON.stringify` 一遍,逐个比较字符串;命中才返回,不命中追加后下一轮扫描更长。也就是说每注册一个 cell 样式要付出「已注册样式数 × 两次字符串化」的成本,且没有任何缓存。259 万次调用 × 每次 40~80 个候选样式 × 每次几百字节的两次序列化与垃圾回收压力,实测累计 52.8 秒,占总耗时 98%。这就是「十几秒到几十秒才渲染完」的全部来源(用户机器与测试环境 JIT 热度不同,体感十几秒与本机实测 60 秒为同一数量级)。

**附带的数据膨胀。** 转换结果里,这些空位 cell 因带样式而不会被 [excel_reader.ts:263](../../../src/react/view/excel/excel_reader.ts#L263) 的判空跳过,全部写进了每行的 `cells` 记录;列宽构建 [excel_reader.ts:125-132](../../../src/react/view/excel/excel_reader.ts#L125-L132) 又按 `worksheet.columnCount`(16,381)为每一列生成宽度对象,七个 sheet 合计 114,679 条列记录。这不构成主要耗时(实测列宽循环每 sheet 仅 1~11ms),但让挂载到表格组件的数据对象和后续保存时的序列化都背着十多万条冗余条目。

**为什么 WPS 快。** WPS 与 Excel 只按 XML 里真实存在的 `<c>` 节点建模(本文件仅 6,678 个),不会按声明的范围把空位展开成百万级对象,自然秒开。修复后的本扩展应回到同样的工作基数。

## 加载耗时打点设计(自动化测量手段)

按报告要求建立常驻的加载耗时日志,一次打开输出一条汇总,后续任何性能问题可直接复测对比。打点用 `performance.now()` 分段,分布在两处:

1. **[Excel.tsx](../../../src/react/view/excel/Excel.tsx) 的打开主链**,五个时间点:收到 `open` 消息、`loadOfficeBuffer` 取回字节、`loadSheets` 返回、`new Spreadsheet` 构造完成、`loadData` 挂载完成,另在挂载后的首个 `requestAnimationFrame` 记首帧时间;
2. **[excel_reader.ts](../../../src/react/view/excel/excel_reader.ts) 的解析内部**,三个时间点:ExcelJS 建模、排序状态 XML 读取(`readWorkbookSortStateXml`)、逐 sheet 转换(附每 sheet 被遍历的 cell 数与样式注册次数,大稀疏 sheet 一眼可见)。

全部段落汇总为一条 `console.info`,带 `[excel-perf]` 前缀输出到 webview 控制台(开发模式与安装版均可通过「打开 Webview 开发工具」查看),同时用 `performance.mark/measure` 留痕以便 DevTools Performance 面板对齐分析。示意格式:

```
[excel-perf] test-open-slow.xlsx: buffer=12ms parse=141ms convert=60210ms(10 sheets, cells=2590962, styleAdd=2590962) mount=35ms firstFrame=60450ms total=60450ms
```

打点随修复方案一并落地,修复前后各跑一轮即为验证基线。

## 修复方案

按收益排序,前两项已用 PoC 实测量化(见根因定位的耗时表):

1. **样式注册改哈希缓存**(根因第三层,治本):[excel_styles.ts:294-303](../../../src/react/view/excel/excel_styles.ts#L294-L303) 的 `StyleRegistry.add` 改为「入参序列化一次成键 + `Map<键, 序号>` 查找」,命中 O(1),未命中才追加数组。PoC 实测该文件转换从约 54s 降到 3.4s,且对任何文件的样式查重都有收益;
2. **不再展开空位,只转换 XML 实体 cell**(根因第二层,治本):[excel_reader.ts:255](../../../src/react/view/excel/excel_reader.ts#L255) 的遍历改为只处理每行 `_cells` 数组中真实存在的项(即 XML 里的 `<c>` 实体,含「空值但显式带样式」的),跳过动态创建的空位。实现上给 fork 包 `@cweijan/exceljs` 的 `eachCell` 增加「只遍历实体」选项,或直接遍历 `_cells`(包在本仓库管控内,可改)。PoC 实测配合第 1 项后转换仅 98ms,遍历基数从 259 万回到 6,678。配套两点:
   - **整列样式改挂列记录**:空位的样式来自 `<col>` 整列定义,折叠空位后把它转换到 `cols` 记录的 `style` 字段(x-spreadsheet 数据模型已预留,[col.js:96-99](../../../src/react/view/excel/x-spreadsheet/core/col.js#L96-L99)),并在 [data_proxy.js:1374-1380](../../../src/react/view/excel/x-spreadsheet/core/data_proxy.js#L1374-L1380) 的 `getCellStyle` 加一层「cell 无样式时回退所在列样式」的兜底,保证整列背景色等视觉不丢;
   - **保存链适配**:[excel_writer.ts](../../../src/react/view/excel/excel_writer.ts) 写回时,列样式应落为 `<col>` 定义而不是逐空 cell 展开;此为对照验证项,见「验证方式」第 3 条;
3. **列记录瘦身**(附带的数据膨胀):[excel_reader.ts:297](../../../src/react/view/excel/excel_reader.ts#L297) 的 `colCount` 不再采用来自 dimension 的 `worksheet.columnCount`(16,381),改为「内容实际最大列与显式 `<col>` 定义最大列的较大值」;[excel_reader.ts:125-132](../../../src/react/view/excel/excel_reader.ts#L125-L132) 只为显式定义了宽度或样式的列生成条目(本文件仅 13 条),其余列由表格组件的默认列宽兜底。列记录从 114,679 条回到几十条,滚动范围也回到实际内容附近;
4. **(备选)长任务兜底**:若仍存在极端文件使转换超过阈值(如 3s),考虑把解析转换移入 Web Worker 或分段让出主线程避免「未响应」弹窗。工程量较大,待前三项落地后按实测决定是否需要。

预期整体效果:该文件打开从分钟级降到 1 秒以内(打点 `total` 前后对照),与 WPS 体感对齐。

## 验证方式

1. **耗时基线**:按「加载耗时打点设计」修复前先跑一轮留档(现状预期 `total` 为数十秒量级,本 plan 的 Node 侧实测可作参照),修复后同法复测,目标 `total < 1s` 且各段均为毫秒级;
2. **视觉回归**:打开本文件与既有 excel 测试文件(sample、239 截断文件、415、592、604、607 两组),内容、合并、冻结、行高与列宽一致;重点核对整列样式的呈现(改为列级兜底后整列背景色、默认字体不丢)与远端空 cell 区域(第 17 列之后本就无可见内容,不应出现空白但可滚动到 1.6 万列之外的异常滚动范围);
3. **保存回归**:打开后不做任何编辑直接保存,产物与原文件的差异应止于元数据级;编辑某个单元格样式后保存,该样式与整列样式均正确写回(空位不再展开为逐 cell 样式,列样式落为 `<col>` 定义);
4. **实测收尾**:F5 调试与安装版各实测一次原文件,确认无未响应弹窗、秒级渲染,然后随下一版本发布。

## 修复记录

**已实施并经 Node 侧复测(2026-11-19),该文件打开耗时从 60.4s 降到 294ms。** 修复方案四项全部落地,实施过程中又定位并消除了第四处热点(ExcelJS `worksheet.model` 的 getter 每次访问都全量重建 model),详见下文。各环节新实测(与根因定位同一环境,esbuild 打包后 Node 运行,webview 用的是同一份代码):

| 环节 | 修复前 | 修复后 |
| --- | --- | --- |
| ExcelJS 建模(parse) | 136 ms | 160 ms |
| 排序状态 XML(sortState) | - | 9 ms |
| 逐 sheet 转换(convert) | 约 54,000~60,000 ms | **121 ms** |
| `loadSheets` 全链(total) | 60.4 s | **294 ms** |
| 遍历 cell 基数 | 2,590,962(空位全展开) | 6,022(XML 实体) |
| 样式注册调用(styleAdd) | 2,590,962 | 6,115 |
| 列记录条数(10 个 sheet 合计) | 114,679 | 89 |
| 滚动范围(cols.len) | 16,373~16,381 | 5~12 |

### 代码改动清单

1. **样式注册改哈希缓存**:[excel_styles.ts:308](../../../src/react/view/excel/excel_styles.ts#L308) 的 `StyleRegistry.add` 改为「入参 `JSON.stringify` 一次成键 + `Map<键, 序号>` 查找」,命中 O(1),未命中才追加数组;另暴露 `addCalls` 计数供打点读取。
2. **只转换 XML 实体 cell**:[excel_reader.ts:180](../../../src/react/view/excel/excel_reader.ts#L180) 新增 `forEachActualCell`,直接遍历行内 `_cells` 稀疏数组中真实存在的项(即 XML 的 `<c>` 实体,含空值带样式的),替换原来的 `row.eachCell({ includeEmpty: true })`,不再为 16,381 列的每个空位现场创建 Cell 对象。
3. **滚动范围收敛**:[excel_reader.ts:332](../../../src/react/view/excel/excel_reader.ts#L332) 处,`maxCols` 只由「有内容的 cell」推进。这是实施中对方案的一处必要修正:远端空 cell 本身就是 XML 实体,只做实体遍历时它们仍会经 `maxCols` 把 `cols.len` 拉到 16,381(首轮实测即如此);改为有值 cell 才推进后,这些空 cell 仍保留进 `cells` 记录(样式、锁定状态不丢),但不再影响滚动范围,满足「验证方式」第 2 条对滚动范围的要求。
4. **列记录瘦身与整列样式挂列**:[excel_reader.ts:150](../../../src/react/view/excel/excel_reader.ts#L150) 重写 `buildColsFromWorksheet`,遍历 `worksheet.columns`(`fromModel` 按 `<col>` 定义建好的 Column 数组,纯 getter 不会动态补列),只为显式定义了宽度或样式的列生成条目;显式定义超出内容范围的部分折叠不展开(否则本文件的 `<col min="18" max="16384"/>` 又是 1.6 万条),因此 `colCount` 的实际口径是「内容实际最大列」与「显式定义落在内容范围内的最大列」取较大值,这是对方案原文「显式 `<col>` 定义最大列」的一处收紧——原文口径在本文件上仍会取到 16,384。列样式经 `excelJsCellToStyle` 泛化版([excel_styles.ts:161-169](../../../src/react/view/excel/excel_styles.ts#L161-L169),入参放宽为 Cell 与 Column 共用的样式属性结构)登记进同一个 `StyleRegistry`,挂到条目的 `style` 序号。
5. **渲染侧整列兜底**:`Cols` 增加 `getStyle`([col.js:101](../../../src/react/view/excel/x-spreadsheet/core/col.js#L101)),[data_proxy.js:1374-1394](../../../src/react/view/excel/x-spreadsheet/core/data_proxy.js#L1374-L1394) 的 `getCellStyle` 与 `getCellStyleOrDefault` 在 cell 无样式时回退所在列样式;[table.js:70-80](../../../src/react/view/excel/x-spreadsheet/component/table.js#L70-L80) 的空 cell 分支原样跳过不渲染,现改为所在列带样式时也按列背景绘制,保证整列背景色在无实体的空位不丢。
6. **保存链适配**:[excel_writer.ts:87-99](../../../src/react/view/excel/excel_writer.ts#L87-L99) 写列时,条目带 `style` 序号的经 `applySpreadsheetStyle`(已泛化支持 Column)落到 Column 上,序列化时由 ExcelJS 聚合为 `<col>` 定义。Node 侧验证产物为 `<col min="1" max="1" width="12" style="1" customWidth="1"/>`,确认列样式不再逐空 cell 展开。
7. **`worksheet.model` 全量重建的规避(实施中新发现)**:首轮复测 convert 仍要 858 ms,CPU profile 定位到 ExcelJS `worksheet` 的 `get model()`——每次访问都对全部 Column 做深比较聚合(`Column.toModel` × `equivalentTo`/`isEqual`),列数 1.6 万时一次访问即数百毫秒。原代码有两处踩中:[excel_reader.ts:110](../../../src/react/view/excel/excel_reader.ts#L110) 的合并信息与 [excel_protection.ts:15-21](../../../src/react/view/excel/excel_protection.ts#L15-L21) 的工作表保护都读 `ws.model` 兜底,而这两处要的内容(`merges`、`sheetProtection`)在实例属性里就有且内容等价(`get model` 本身就是从实例属性取的),改为直接读 `_merges` 与 `sheetProtection`。该修正对所有文件的转换都有收益。
8. **加载耗时打点**:按「加载耗时打点设计」落地。[excel_reader.ts:44](../../../src/react/view/excel/excel_reader.ts#L44) 定义 `ExcelPerfStats` 并随 `ExcelData.perf` 返回 parse/sortState/convert 三段与 cell、styleAdd 计数;[Excel.tsx:121](../../../src/react/view/excel/Excel.tsx#L121) 的 `logExcelPerf` 汇总打开主链五段时间,挂载后首个 `requestAnimationFrame` 记首帧,输出一条 `[excel-perf]` `console.info` 并留 `performance.mark/measure` 痕迹。CSV 等无分段数据的路径只记 `load` 总段。修复后的实际输出示例:

    ```
    [excel-perf] test-open-slow.xlsx: buffer=1ms parse=160ms sortState=9ms convert=121ms(10 sheets, cells=6022, styleAdd=6115) construct=1ms mount=8ms firstFrame=12ms total=12ms
    ```

    (Node 侧复测无 buffer/construct/mount 段,webview 实测时补全。)

9. **顺手清理**:[Excel.tsx](../../../src/react/view/excel/Excel.tsx) 卸载分支里残留的 `setBottombarEl(null)` 调用没有任何对应定义(1aaaea9 删除 bottombarEl 状态时漏删),组件卸载时会抛 `ReferenceError`,已删除。

### 验证结论

按「验证方式」逐条:

1. **耗时基线**:修复前基线取本 plan 根因定位的实测(60.4s);修复后同法复测 `total=294ms`、各段均为毫秒级,复测脚本与打包产物暂存 [test-workspace/_tmp/_tmp_excel_open_slow_verify.cjs](_tmp/_tmp_excel_open_slow_verify.cjs),可随时重跑;
2. **结构与回归对照**:转换产物断言通过——10 个 sheet 的列记录 5~12 条、滚动范围 5~12 列、样式表 12~78 条;sample.xlsx 与 415、592、604、607 两组既有回归文件转换正常(607-x-prefixed 文件按 issue-607 的既有逻辑降级 SheetJS,与本次无关)。视觉回归(整列背景、合并、冻结、行高列宽)与「F5 调试 + 安装版实测无未响应弹窗」待发布前人工确认,Webview 开发工具里看 `[excel-perf]` 日志即可对照;
3. **保存回归**:列样式落 `<col>` 已由 Node 侧产物验证;「打开后不编辑直接保存差异止于元数据级」待人工抽查。

### 后续项

方案第 4 项(Web Worker 兜底)按约定暂不实施:前三项落地后该文件转换仅 121 ms,远低于 3s 阈值,常规文件更小,暂无必要。`[excel-perf]` 打点为常驻能力,后续再遇慢加载文件可直接取日志分段定位。
