const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const page = fs.readFileSync(
  path.resolve(__dirname, '../../../src/views/Chat/components/Message/index.vue'),
  'utf8',
);

assert.match(page, /const isRoamingMessageTimeDeleteVisible = computed\(\(\) =>/);
assert.match(
  page,
  /CONVERSATION_TYPE\.SINGLE,[\s\S]*CONVERSATION_TYPE\.GROUP/,
  '顶部入口只能枚举单聊和群聊。',
);
assert.match(page, /!routeQueryData\.value\.isChatThread/);
assert.match(page, /const selectedRoamingMessageDeleteTimestamp = ref\(''\);/);
assert.match(page, /const confirmRoamingMessageTimeDelete = async \(\) =>/);
assert.match(page, /beforeTimestamp % 60000 !== 0/);
assert.match(page, /store\.dispatch\('removeMessageRoamingBeforeTimestamp', \{[\s\S]*conversationId,[\s\S]*conversationType,[\s\S]*beforeTimestamp,/);
assert.match(page, /store\.commit\('CLEAR_SOMEONE_MESSAGE', conversationId\);/);
assert.match(page, /historyMessageCursor\.value = -1;/);
assert.match(page, /await fechHistoryMessage\('fistLoad', \{ throwOnError: true \}\);/);
assert.match(page, /const fechHistoryMessage = async \(loadType, \{ throwOnError = false \} = \{\}\) =>/);
assert.match(page, /if \(throwOnError\) throw error;/);
assert.match(page, /type="datetime"/);
assert.match(page, /format="YYYY-MM-DD HH:mm"/);
assert.match(page, /time-format="HH:mm"/);
assert.match(page, /value-format="x"/);
assert.match(page, /删除该时间点之前的服务端漫游消息/);
assert.match(page, /二次确认删除漫游消息/);

const handlerStart = page.indexOf('const confirmRoamingMessageTimeDelete = async () =>');
const handlerEnd = page.indexOf('//消息重新编辑', handlerStart);
const handler = page.slice(handlerStart, handlerEnd);
assert.doesNotMatch(handler, /\.filter\([\s\S]{0,300}timestamp/);
assert.doesNotMatch(handler, /\/notify|fetch\(|axios|XMLHttpRequest/);

assert.notEqual(handlerStart, -1, '必须存在按时间删除确认处理器。');
assert.notEqual(handlerEnd, -1, '确认处理器必须在消息重新编辑函数前结束。');
assert.match(
  handler,
  /await store\.dispatch\('removeMessageRoamingBeforeTimestamp', \{[\s\S]*?conversationId,[\s\S]*?conversationType,[\s\S]*?beforeTimestamp,[\s\S]*?\}\);/,
  '必须等待 SDK 删除 resolve，不能并行清理本地缓存。',
);
const deleteDispatchIndex = handler.indexOf(
  "await store.dispatch('removeMessageRoamingBeforeTimestamp'",
);
const clearCacheIndex = handler.indexOf(
  "store.commit('CLEAR_SOMEONE_MESSAGE', conversationId);",
);
const resetCursorIndex = handler.indexOf('historyMessageCursor.value = -1;');
const reloadIndex = handler.indexOf(
  "await fechHistoryMessage('fistLoad', { throwOnError: true });",
);
assert.ok(
  deleteDispatchIndex >= 0 &&
    deleteDispatchIndex < clearCacheIndex &&
    clearCacheIndex < resetCursorIndex &&
    resetCursorIndex < reloadIndex,
  '只有 SDK 删除 resolve 后才能清缓存、重置游标并重拉取服务端消息。',
);
assert.match(
  handler,
  /ElMessageBox\.confirm\([\s\S]*?二次确认删除漫游消息/,
  '确认处理器必须实际弹出二次危险确认。',
);
assert.doesNotMatch(
  handler,
  /\.filter\(|\.reduce\(|\.find\(|\.forEach\(|\.map\(|\.some\(|\.every\(|for\s*\(|while\s*\(|do\s*\{|\/notify|fetch\(|axios|XMLHttpRequest|\brequest\b|\$http|RestClient|\bhttp(?:Client)?\s*\.|\$\s*\.\s*ajax|\bky\s*\(|\bsuperagent\b|sendBeacon|retry|setTimeout|\bEMClient\b|\bWebIM\b|\bconn\s*\.|\bchatType\s*:|\bmid\s*:|\bmsg\s*:/,
  '确认处理器不得本地筛选/迭代、走 HTTP/REST/重试或引入 SDK 4.0 路径。',
);

const visibilityStart = page.indexOf(
  'const isRoamingMessageTimeDeleteVisible = computed(() =>',
);
const visibilityEnd = page.indexOf(
  'const formatRoamingMessageDeleteMinute =',
  visibilityStart,
);
const visibility = page.slice(visibilityStart, visibilityEnd);
assert.match(visibility, /!!conversationId/);
assert.match(visibility, /!isChatThread/);
assert.match(
  visibility,
  /\[CONVERSATION_TYPE\.SINGLE, CONVERSATION_TYPE\.GROUP\]\.includes\([\s\S]*?conversationType/,
  '入口可见性必须在同一个 computed 中限定为单聊/群聊。',
);
assert.match(
  page,
  /v-if="isRoamingMessageTimeDeleteVisible"[\s\S]{0,600}@click="openRoamingMessageTimeDeleteDialog"/,
  '可见性 computed 必须实际控制顶部入口。',
);
assert.match(
  page,
  /v-model="selectedRoamingMessageDeleteTimestamp"[\s\S]{0,500}type="datetime"[\s\S]{0,500}@click="confirmRoamingMessageTimeDelete"/,
  '日期时间选择器必须绑定删除边界，并能进入二次确认。',
);

const sourceRoot = path.resolve(__dirname, '../../../src');
const collectRuntimeSources = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectRuntimeSources(entryPath);
    return /\.(js|vue|ts)$/.test(entry.name)
      ? [fs.readFileSync(entryPath, 'utf8')]
      : [];
  });
const runtimeSource = collectRuntimeSources(sourceRoot).join('\n');
assert.doesNotMatch(
  runtimeSource,
  /\bEMClient\b|\bWebIM\b|\bconn\s*\.|\bthis\.conn\b|\bchatType\s*:|\bmid\s*:|\bmsg\s*:/,
  'SDK 5.0 分支运行代码不得存在 SDK 4.0 客户端、调用或旧消息模型别名。',
);

assert.match(
  handler,
  /await ElMessageBox\.confirm\([\s\S]*?二次确认删除漫游消息/,
  '用户必须完成二次确认后才可继续删除。',
);
const confirmationIndex = handler.indexOf('await ElMessageBox.confirm');
assert.ok(
  confirmationIndex >= 0 && confirmationIndex < deleteDispatchIndex,
  '二次确认 resolve 必须先于 SDK 删除请求。',
);

const historyLoaderStart = page.indexOf(
  'const fechHistoryMessage = async (loadType, { throwOnError = false } = {}) =>',
);
const historyLoaderEnd = page.indexOf(
  '//获取当前会话的原始 SDK 5.0 消息列表。',
  historyLoaderStart,
);
const historyLoader = page.slice(historyLoaderStart, historyLoaderEnd);
assert.notEqual(historyLoaderStart, -1, '必须存在可抛出刷新错误的历史加载函数。');
assert.notEqual(historyLoaderEnd, -1, '历史加载函数必须在消息列表 computed 前结束。');
assert.match(
  historyLoader,
  /catch \(error\) \{[\s\S]*?if \(throwOnError\) throw error;/,
  'fechHistoryMessage 必须在自身 catch 内传播要求上抛的真实重拉取错误。',
);
assert.match(
  historyLoader,
  /store\.dispatch\('getHistoryMessage', \{[\s\S]*?conversationId:[\s\S]*?conversationType:/,
  '重拉取必须走显式当前会话的 Store 历史消息路径。',
);

const messageStore = fs.readFileSync(
  path.resolve(__dirname, '../../../src/store/modules/message.js'),
  'utf8',
);
assert.match(
  messageStore,
  /getHistoryMessage:[\s\S]*?chatManager\(\)\.getHistoryMessages\(options\)/,
  'Store 历史路径必须实际调用 SDK 5.0 ChatManager.getHistoryMessages。',
);

assert.match(
  historyLoader,
  /const result = await store\.dispatch\('getHistoryMessage', \{[\s\S]*?conversationId:[\s\S]*?conversationType:/,
  'fechHistoryMessage 必须等待当前会话的真实 Store 历史请求完成。',
);

const historyActionStart = messageStore.indexOf('getHistoryMessage: async');
const historyActionEnd = messageStore.indexOf(
  '//已发送展示类型消息',
  historyActionStart,
);
const historyAction = messageStore.slice(historyActionStart, historyActionEnd);
assert.notEqual(historyActionStart, -1, 'Store 必须存在 getHistoryMessage action。');
assert.notEqual(historyActionEnd, -1, 'getHistoryMessage action 必须在发送展示 action 前结束。');
assert.match(
  historyAction,
  /chatManager\(\)\.getHistoryMessages\(options\)[\s\S]*?\.then\(/,
  '同一个 getHistoryMessage action 必须调用 SDK 5.0 ChatManager.getHistoryMessages。',
);

const timeDeleteDialogStart = page.indexOf(
  '<el-dialog\n      v-model="roamingMessageTimeDeleteDialogVisible"',
);
const timeDeleteDialogEnd = page.indexOf('</el-dialog>', timeDeleteDialogStart);
const timeDeleteDialog = page.slice(timeDeleteDialogStart, timeDeleteDialogEnd);
assert.notEqual(timeDeleteDialogStart, -1, '必须存在按时间删除漫游消息的日期选择弹窗。');
assert.notEqual(timeDeleteDialogEnd, -1, '按时间删除弹窗必须完整关闭。');
const datePickerStart = timeDeleteDialog.indexOf('<el-date-picker');
const datePickerEnd = timeDeleteDialog.indexOf('/>', datePickerStart);
const timeDeleteDatePicker = timeDeleteDialog.slice(
  datePickerStart,
  datePickerEnd,
);
assert.notEqual(datePickerStart, -1, '按时间删除弹窗必须包含日期时间控件。');
assert.notEqual(datePickerEnd, -1, '日期时间控件必须以自闭合标签结束。');
assert.match(timeDeleteDatePicker, /v-model="selectedRoamingMessageDeleteTimestamp"/);
assert.match(timeDeleteDatePicker, /type="datetime"/);
assert.match(timeDeleteDatePicker, /format="YYYY-MM-DD HH:mm"/);
assert.match(timeDeleteDatePicker, /time-format="HH:mm"/);
assert.match(timeDeleteDatePicker, /value-format="x"/);
assert.match(
  timeDeleteDialog,
  /@click="confirmRoamingMessageTimeDelete"/,
  '同一按时间删除弹窗必须提供进入二次确认的下一步按钮。',
);

console.log('sdk5 roaming message time-delete UI contract: PASS');
