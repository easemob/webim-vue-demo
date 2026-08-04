# TKE SDK 5.0 同步 WebSocket 配置设计

## 目标

为 TKE 环境预设提供服务端给出的 SDK 5.0 同步 WebSocket 地址，使 SDK 登录后的联系人和已加入群组同步可以建立真实同步连接。

## 设计

环境预设新增 `syncWsUrl`。TKE 的默认值为 `wss://tke-sdb-fusion.easemob.com/ws`。当用户选择 TKE 时，现有 `normalizeImEnvironmentConfig` 会保留该默认值；不创建本地群组或联系人数据。

私有化固定地址分支将 `CUSTOM_CONFIG.syncWsUrl` 原样传给 SDK 5.0 `serviceConfig.serverUrls.syncWsUrl`。NGI 与 VIP6 仍使用 DNS，DEV 与 QA 未提供地址时保留 SDK 原始同步失败。

## 验证

登录生命周期合同验证 TKE 预设值和 `serverUrls.syncWsUrl` 透传。真实登录后，以 `onSyncDataFinished` 的原始 payload 判断群同步是否成功；不使用 REST、重试或本地伪造群列表。
