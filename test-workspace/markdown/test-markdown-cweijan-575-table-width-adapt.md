# issue 575：表格未按页面宽度自适应，单元格文字异常换行

## 常规宽度表格（对照）

| 名称   | 说明     | 数量 |
| ------ | -------- | ---- |
| alpha  | 常规说明 | 1    |
| beta   | 常规说明 | 2    |

## 宽表格（多列，总宽超出页面）

| 模块Module | 主要功能FunctionDescription | 负责人Owner | 状态Status | 最后更新时间LastUpdatedTime | 优先级Priority | 备注Notes | 版本Version | 关联需求RelatedRequirement |
| ---------- | --------------------------- | ----------- | ---------- | --------------------------- | -------------- | --------- | ----------- | -------------------------- |
| 用户中心UserCenter | 账号注册登录与权限管理AccountRegistrationLoginAndPermissionManagement | 张三ZhangSan | 进行中InProgress | 2026-09-01T12:00:00Z | 高High | 无None | v1.2.0 | REQ-1001Requirement |
| 订单系统OrderSystem | 订单创建支付与退款流程处理OrderCreationPaymentAndRefundProcessing | 李四LiSi | 已完成Completed | 2026-08-15T08:30:00Z | 中Medium | 已归档Archived | v2.0.1 | REQ-1002Requirement |

## 长内容无空格单元格

| 标识符 | 路径 |
| ------ | ---- |
| abcdefghijklmnopqrstuvwxyz0123456789 | /very/long/path/without/any/spaces/to/trigger/overflow/behavior/in/table/cell |
