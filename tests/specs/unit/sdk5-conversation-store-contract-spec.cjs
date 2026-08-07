const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.resolve(__dirname, '../../../src/store/modules/conversation.js'),
  'utf8',
);
const receiveListener = fs.readFileSync(
  path.resolve(__dirname, '../../../src/IM/listener/imReciveMessageListener.js'),
  'utf8',
);
const messageStore = fs.readFileSync(
  path.resolve(__dirname, '../../../src/store/modules/message.js'),
  'utf8',
);
const conversationList = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../src/views/Chat/components/Conversation/components/ConversationList.vue',
  ),
  'utf8',
);
const coverage = fs.readFileSync(
  path.resolve(__dirname, '../../../docs/sdk5-api-coverage.md'),
  'utf8',
);
const uncovered = fs.readFileSync(
  path.resolve(__dirname, '../../../docs/sdk5-uncovered-capabilities.md'),
  'utf8',
);
const casesList = fs.readFileSync(
  path.resolve(__dirname, '../../../cases_list.md'),
  'utf8',
);
const superpowers = fs.readFileSync(
  path.resolve(__dirname, '../../../.codex/prompts/superpowers.md'),
  'utf8',
);
const automaticConversationOpenSource =
  conversationList.match(
    /const toChatMessage = \(conversationItem, index\) => \{[\s\S]*?\n\};/,
  )?.[0] || '';

assert.match(source, /requireManager\('chatManager'\)/);
assert.match(source, /requireManager\('pushManager'\)/);
assert.match(source, /chatManager\(\)\s*\.getConversationList\(/);
assert.match(
  receiveListener,
  /onConversationListUpdate:\s*function\s*\(payload\)\s*\{[\s\S]*recordSdkEvent\('onConversationListUpdate', payload, 'conversation'\)[\s\S]*store\.dispatch\('applyConversationListUpdate', payload\)/,
  'Demo 必须监听 SDK 5.0 onConversationListUpdate，并把 SDK payload 交给会话 Store 消费。',
);
assert.match(
  messageStore,
  /const shouldSyncConversationListForMessage = \(conversationType\) =>\s*conversationType !== CONVERSATION_TYPE\.CHATROOM;/,
  '聊天室消息不会产生会话，message-driven 会话同步必须显式跳过 SDK 5.0 chatRoom。',
);
const assertMessageDrivenConversationSyncSkipsChatroom = (sourceText, label) => {
  const matches = [...sourceText.matchAll(/dispatch\('updateConversationList',/g)];
  assert.ok(matches.length > 0, `${label} should contain message-driven conversation sync calls.`);
  matches.forEach((match) => {
    const before = sourceText.slice(Math.max(0, match.index - 220), match.index);
    assert.match(
      before,
      /shouldSyncConversationListForMessage\([^)]*\)/,
      `${label} dispatch('updateConversationList') at offset ${match.index} must be guarded by shouldSyncConversationListForMessage().`,
    );
  });
};
assertMessageDrivenConversationSyncSkipsChatroom(messageStore, 'message store');
assertMessageDrivenConversationSyncSkipsChatroom(receiveListener, 'receive listener');
assert.match(
  source,
  /APPLY_CONVERSATION_LIST_UPDATE:\s*\(state, payload\)\s*=>\s*\{[\s\S]*payload\?\.items[\s\S]*state\.conversationListFromServer = conversationList;/,
  '会话列表必须以 SDK 5.0 onConversationListUpdate.items 作为权威快照更新。',
);
assert.doesNotMatch(
  source,
  /refreshSessionList|refreshConversationListFromServer/,
  'refreshSessionList is an internal SDK 5.0 API and must not be called or exposed by the Demo.',
);
assert.match(source, /chatManager\(\)\.clearConversationUnreadMessageCount/);
assert.doesNotMatch(
  conversationList,
  /刷新会话列表|conversationListRefreshLoading|refreshConversationListFromServer/,
  'The conversation list UI must not expose the internal refreshSessionList capability.',
);
assert.match(
  conversationList,
  /const supportsReadReceipt = \[\s*CONVERSATION_TYPE\.SINGLE,\s*CONVERSATION_TYPE\.GROUP,\s*\]\.includes\(conversationType\);/s,
  '只有单聊和群聊需要 SDK 5.0 会话未读清零与消息已读回执边界。',
);
assert.doesNotMatch(source, /\bCHAT_TYPE\b|\bchatType\b/);
assert.doesNotMatch(source, /\bEMClient\b/);
assert.doesNotMatch(source, /\.localCache\b/);
assert.doesNotMatch(
  source,
  /SDK 5\.0 clearConversationUnreadMessageCount only supports singleChat and groupChat\./,
  'The app must not surface an SDK limitation for an operation it did not send.',
);
assert.match(
  conversationList,
  /const toChatMessage = \(conversationItem, index\) => \{[\s\S]*const supportsReadReceipt =[\s\S]*if \(supportsReadReceipt\) \{[\s\S]*store\.dispatch\('setIncomingReadReceiptBoundary',[\s\S]*emit\('toChatMessage', conversationId, conversationType\);[\s\S]*if \(supportsReadReceipt\) \{[\s\S]*store\.dispatch\('clearConversationUnreadCount', \{\s*conversationId,\s*conversationType,\s*\}\);/,
  '点击单聊或群聊会话时必须先同步路由，再调用 SDK 5.0 清空当前会话未读数；清零请求不得阻塞首次进入会话。',
);
assert.doesNotMatch(
  automaticConversationOpenSource,
  /await store\.dispatch\('clearConversationUnreadCount'/,
  'SDK 5.0 清空未读数是独立异步请求，不能阻塞首次点击会话的路由跳转。',
);
assert.doesNotMatch(
  conversationList,
  /debouncedToChatMessage|_\.debounce\(/,
  '进入会话不得增加本地防抖等待；首次点击必须立即路由到消息页。',
);
assert.doesNotMatch(
  conversationList,
  /unreadCount > 0 &&\s*\[CONVERSATION_TYPE\.SINGLE, CONVERSATION_TYPE\.GROUP\]\.includes\(conversationType\)/,
  '用户点击有效单聊或群聊会话时应调用 SDK 清零，不应由本地 unreadCount 猜测是否跳过。',
);
assert.match(
  conversationList,
  /const supportsManualUnreadClear = \(conversationType\) =>\s*\[\s*CONVERSATION_TYPE\.SINGLE,\s*CONVERSATION_TYPE\.GROUP,\s*\]\.includes\(conversationType\);/s,
  '手动清空未读入口必须仅对 SDK 5.0 支持的单聊和群聊开放。',
);
assert.match(
  conversationList,
  /const clearConversationUnreadFromMenu = async \(conversationItem\) => \{[\s\S]*const \{ conversationId, conversationType \} = conversationItem;[\s\S]*await store\.dispatch\('clearConversationUnreadCount', \{\s*conversationId,\s*conversationType,\s*\}\);/,
  '右键菜单清空未读必须等待同一条 SDK 5.0 单会话清零请求完成。',
);
assert.match(
  conversationList,
  /v-if="supportsManualUnreadClear\(item\.conversationType\)"[\s\S]{0,320}@click="clearConversationUnreadFromMenu\(item\)"/,
  '单聊和群聊的右键菜单必须提供手动“清空未读”入口。',
);
assert.match(conversationList, /'清空未读'/, '右键菜单必须使用明确的“清空未读”文案。');
assert.match(
  source,
  /clearConversationUnreadCount:[\s\S]*await chatManager\(\)\.clearConversationUnreadMessageCount\(\{\s*conversationId,\s*conversationType,\s*\}\);[\s\S]*commit\('CLEAR_CONVERSATION_ITEM_UNREAD_COUNT', conversationId\);[\s\S]*catch \(error\) \{[\s\S]*throw error;/,
  '仅在 SDK 5.0 清零成功后更新本地未读数；显式菜单必须能收到原始失败。',
);
assert.match(
  automaticConversationOpenSource,
  /emit\('toChatMessage', conversationId, conversationType\);[\s\S]*void store\s*\.dispatch\('clearConversationUnreadCount', \{\s*conversationId,\s*conversationType,\s*\}\)\s*\.catch\(/,
  '点击进入会话仍须立即跳转；自动清零改为捕获失败而不阻塞路由。',
);
assert.match(conversationList, /lastMessage\?\.sender\?\.userId/);
assert.match(conversationList, /lastMessage\?\.timestamp/);
assert.doesNotMatch(
  conversationList,
  /lastMessage\?\.(?:from|time)\b|const \{ type, msg \}|route\?\.query\?\.id\b/,
);
assert.match(coverage, /\| API 覆盖率 \| 94\.1% \|/);
assert.match(coverage, /\| 已覆盖公开对外 API \| 192 \|/);
assert.match(coverage, /\| 未覆盖公开对外 API \| 12 \|/);
assert.match(
  coverage,
  /\| 会话列表与筛选 \| `ChatManager\.getConversationList` \| 是 \| 会话列表、本地筛选、置顶会话筛选均调用 `getConversationList` 读取 SDK 5\.0 当前会话快照；运行期监听 SDK 5\.0 `onConversationListUpdate` 并直接使用事件 `items` 作为会话列表权威快照。 \| `refreshSessionList` 属于内部接口，不在 Demo 页面暴露，也不计入公开 API 覆盖；群解散后页面仅随 SDK 会话列表更新事件移除群会话，不按群事件本地伪造删除。聊天室消息不会产生会话；Demo 不因聊天室收发消息、拉取历史、撤回、编辑或删除消息本地调用 `updateConversationList` 创建 \/ 刷新聊天室会话；若 SDK 会话列表事件真实返回聊天室项则按原始结果暴露，不本地伪造或隐藏。 \|/,
);
assert.doesNotMatch(coverage, /refreshSessionList\(\{ includeEmpty: true \}\)|主动刷新入口/);
assert.match(
  uncovered,
  /当前 `src\/` 覆盖 192 个，未覆盖 12 个；`@internal` 私有方法以及研发确认的 `ChatManager\.refreshSessionList` 内部接口已剔除/,
);
assert.match(
  casesList,
  /会话列表不提供“刷新会话列表”入口；`refreshSessionList` 属于内部接口，不调用、不展示、不计入公开功能覆盖/,
);
assert.match(
  casesList,
  /监听 SDK 5\.0 `ChatManager\.onConversationListUpdate`，直接以事件 `items` 刷新会话列表；群解散时仅在 SDK 下发会话列表更新并移除对应群会话后页面才移除该会话；聊天室消息不会产生会话，Demo 不因聊天室收发消息、拉取历史、撤回、编辑或删除消息本地调用 `updateConversationList` 创建 \/ 刷新聊天室会话；若 SDK 会话列表事件真实返回聊天室项则按原始结果暴露，不本地伪造或隐藏/,
);
assert.match(
  superpowers,
  /会话列表不得暴露“刷新会话列表”入口；`refreshSessionList` 属于内部接口，不调用、不展示、不计入公开功能覆盖/,
);
assert.match(
  superpowers,
  /会话列表必须监听 SDK 5\.0 `ChatManager\.onConversationListUpdate`，直接使用事件 `items` 作为权威快照；群解散后页面移除群会话必须来自 SDK 5\.0 会话列表更新事件，不得只凭群事件本地伪造删除。聊天室消息不会产生会话；收发消息、拉取历史、撤回、编辑、删除等 message-driven 路径不得为 `CONVERSATION_TYPE\.CHATROOM` 调用 `updateConversationList` 创建或刷新聊天室会话；若 SDK 会话列表事件真实返回聊天室项，只能按原始结果暴露并定位 SDK\/服务端行为，不能本地伪造或隐藏/,
);
for (const [documentName, documentSource] of [
  ['cases_list.md', casesList],
  ['sdk5-api-coverage.md', coverage],
  ['.codex/prompts/superpowers.md', superpowers],
]) {
  assert.match(
    documentSource,
    /点击单聊或群聊会话[\s\S]{0,240}clearConversationUnreadMessageCount\(\{ conversationId, conversationType \}\)/,
    `${documentName} 必须记录点击会话时的 SDK 5.0 未读清零。`,
  );
  assert.match(
    documentSource,
    /(?:消息页|页面消息)完成渲染后[\s\S]{0,320}`direct: 'RECEIVE'`、`needReadReceipt: true`、(?:带 )?`msgServerId`[\s\S]{0,240}sendMessageReadReceipts/,
    `${documentName} 必须记录页面渲染完成后才为真实 SDK 5.0 已读消息发送回执。`,
  );
  assert.match(
    documentSource,
    /聊天室不调用(?:已读回执 API)?/,
    `${documentName} 必须说明聊天室不调用 SDK 5.0 已读回执。`,
  );
  assert.match(
    documentSource,
    /会话右键菜单在单聊和群聊上提供手动“清空未读”[\s\S]{0,160}clearConversationUnreadMessageCount\(\{ conversationId, conversationType \}\)/,
    `${documentName} 必须记录单聊和群聊会话右键菜单的 SDK 5.0 手动清空未读能力。`,
  );
}

console.log('sdk5 conversation store contract: PASS');
