# 遥测配置(Azure Application Insights)— 已弃用

> [!WARNING]
> **已弃用 —— 本 Fork 已禁用遥测。**
>
> **Office Viewer Enhance** 不收集、不发送任何使用数据。`src/service/telemetryService.ts` 当前为 no-op 空实现,`@vscode/extension-telemetry` 依赖也已移除(见 [README-CN.md](../README-CN.md) 的「隐私」章节)。
>
> 本文档仅作**存档**,供维护者日后需要恢复遥测时参考 —— 且必须使用**自己的** Azure Application Insights 资源。请**勿**复用上游的连接字符串,请自行创建。

---

本指南面向**自行构建并发布本扩展的维护者**。终端用户请阅读 [README-CN.md](../README-CN.md) 中的「隐私」章节。

## 概览

| 项目 | 值 |
|------|-------|
| SDK | [`@vscode/extension-telemetry`](https://www.npmjs.com/package/@vscode/extension-telemetry) |
| 后端 | Azure Application Insights(基于工作区) |
| 代码 | `src/service/telemetryService.ts`(当前为 no-op 空实现) |
| 事件清单 | `telemetry.json`(仓库根目录) |

只有当 `telemetryService.ts` 中配置了非空连接字符串时,遥测才会发送数据。

## 1. 创建 Azure 资源

### 登录

1. 打开 [https://portal.azure.com](https://portal.azure.com)
2. 使用 Microsoft 账号(个人或工作账号)登录。对于流量适中的扩展,免费 Azure 账号即可。

### 创建 Log Analytics 工作区(如已有可跳过)

基于工作区的 Application Insights 需要一个 Log Analytics 工作区。

1. 门户搜索:**Log Analytics workspaces** → **Create**
2. 选择订阅、资源组、名称和区域(选离你近的,如 East Asia)
3. **Review + create**

### 创建 Application Insights

1. 门户搜索:**Application Insights** → **Create**
2. **Basics**
   - 名称:如 `vscode-office-telemetry`
   - 区域:尽量与工作区一致
   - 资源模式:**Workspace-based**
   - 工作区:选择上面创建的工作区
3. **Review + create** → 等待部署完成
4. 打开新资源 → 左侧菜单 **Configure** → **Connection string**
5. 复制完整字符串,例如:

   ```text
   InstrumentationKey=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx;IngestionEndpoint=https://eastasia-1.in.applicationinsights.azure.com/;LiveEndpoint=https://eastasia.livediagnostics.monitor.azure.com/;ApplicationId=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

微软官方说明该连接字符串**不属于敏感信息**,通常可直接提交到扩展源码中。它只允许**发送**遥测,不能读取。

## 2. 接入扩展

1. 恢复依赖:`npm i @vscode/extension-telemetry`
2. 重新实现 `src/service/telemetryService.ts` 中的上报器(可参考上游 [cweijan/vscode-office](https://github.com/cweijan/vscode-office) 的原始实现),并填入**你自己的**连接字符串:

   ```typescript
   const TELEMETRY_CONNECTION_STRING = 'InstrumentationKey=...;IngestionEndpoint=...';
   ```

3. 重新构建并打包:

   ```bash
   npm run build
   npm run package
   ```

4. 本地安装 `.vsix`,打开一个受支持的文件(如 `.xlsx`)
5. 在 Azure 门户 → 你的 Application Insights → **Logs** 中执行:

   ```kusto
   customEvents
   | where timestamp > ago(30m)
   | where name == "view.open"
   | project timestamp, name, customDimensions
   | order by timestamp desc
   ```

   事件首次出现可能需要 **2–5 分钟**。

## 3. 示例查询

### 按类型统计打开次数

```kusto
customEvents
| where name == "view.open"
| extend viewType = tostring(customDimensions.viewType)
| extend fileType = tostring(customDimensions.fileType)
| summarize count() by viewType, fileType
| order by count_ desc
```

### 日活跃用户(DAU)

使用 Application Insights 的匿名 `user_Id`(非 PII)。

```kusto
customEvents
| where name == "view.open"
| summarize DAU = dcount(user_Id) by bin(timestamp, 1d)
| order by timestamp desc
```

### 扩展版本分布

```kusto
customEvents
| where name == "view.open"
| extend viewType = tostring(customDimensions.viewType)
| summarize count() by viewType, appVersion
| order by count_ desc
```

## 4. 费用与限额

- Application Insights 按**引入数据量**计费
- 本扩展事件小且低频,个人/小型扩展的用量通常在**每月免费额度**内
- 流量增长时可在 Azure 门户的 **Usage and estimated costs** 中监控

## 5. 用户控制

若恢复遥测,请继续尊重以下用户开关:

| 控制项 | 设置 |
|---------|---------|
| VS Code 全局 | `telemetry.telemetryLevel` / `telemetry.enableTelemetry` |
| 仅本扩展 | `vscode-office.enableTelemetry`(本 fork 已移除该配置项,恢复上报时应一并加回) |

`@vscode/extension-telemetry` 发送前会检查 `env.isTelemetryEnabled`。

## 6. 本地校验事件清单

构建扩展后,可检查已声明的事件:

```bash
code --telemetry > /tmp/vscode-telemetry.json
```

若 `telemetry.json` 随扩展打包,其声明的事件会出现在该报告中。

## 故障排查

| 问题 | 检查 |
|---------|--------|
| Logs 中无事件 | 连接字符串已设置且非空?改完后重新构建了?稍等几分钟 |
| 仍无事件 | VS Code 遥测已关闭?扩展遥测开关为 false? |
| 仅开发环境有事件 | 发布的 VSIX 是在添加连接字符串**之后**构建的吗 |
| 查询为空 | 在 Logs 中放宽时间范围,如 `ago(24h)` |

## 相关文件

- `src/service/telemetryService.ts` — 上报器与事件 API(当前为 no-op 空实现)
- `src/service/officeViewType.ts` — `viewType` / `fileType` 映射
- `src/provider/officeViewerProvider.ts` — Office 预览事件
- `telemetry.json` — 事件透明度元数据
