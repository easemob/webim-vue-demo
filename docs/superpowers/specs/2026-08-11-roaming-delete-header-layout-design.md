# 漫游删除入口横向布局设计

## 目标

修复消息页顶部“漫游删除”入口继承通用 `.more` 的 `35px` 固定宽度后发生中文换行的问题，使该入口以一行文本与搜索、置顶、子区和更多操作并列展示。

## 根因

`ChatContainerHeader` 的通用 `.more` 样式服务于图标按钮，固定 `width: 35px` 与 `font-size: 20px`。按时间删除入口复用该 class 但显示四个汉字，宽度不足导致文本换行。

## 方案

在 `src/views/Chat/components/Message/index.scss` 中仅为 `.roaming_message_time_delete_trigger` 添加局部覆盖：

- 以 `flex: 0 0 auto` 防止该按钮被 flex 压缩；
- 使用约 `68px` 的最小宽度与适当的横向 padding；
- 使用 `white-space: nowrap` 保证“漫游删除”保持单行；
- 使用适合文字操作项的较小字号。

不改变通用 `.more` 样式，不修改入口可见性、弹窗、二次确认、SDK5 `removeHistoryMessages` 调用或服务端结果处理。

## 验证

扩展现有按时间删除 UI 合同：读取同一组件样式并断言该专用选择器具备不可收缩、最小宽度和单行规则。先验证合同在样式缺失时失败，再添加最小样式使其通过；随后运行现有按时间删除 Store/UI/文档合同、SDK5 迁移门禁、`git diff --check` 和生产构建。
