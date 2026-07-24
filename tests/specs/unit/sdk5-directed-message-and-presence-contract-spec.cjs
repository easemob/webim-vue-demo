const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const inputBox = read(
  'src/views/Chat/components/Message/components/ChatInputBox/index.vue',
);
const directedMessage = read(
  'src/views/Chat/components/Message/components/ChatInputBox/components/DirectedMessage/SendDirectedMessage.vue',
);
const contacts = read('src/store/modules/contacts.js');
const directedDefaults = read('src/utils/directedMessageDefaults.js');
const contactInfos = read('src/views/Chat/components/Contacts/components/ContactInfos.vue');
const personalSettings = read('src/views/Chat/components/NavBar/components/PersonalsettingCard/index.vue');
const chatHeader = read('src/views/Chat/components/Message/components/ChatContainerHeader/index.vue');
const casesList = read('cases_list.md');
const superpowers = read('.codex/prompts/superpowers.md');

assert.match(
  inputBox,
  /<SendDirectedMessage[\s\S]*:conversationId="routeQueryData\.conversationId"[\s\S]*:conversationType="routeQueryData\.conversationType"/,
);
assert.doesNotMatch(
  inputBox,
  /<SendDirectedMessage[\s\S]*:(targetId|chatType)=/,
);
assert.match(directedMessage, /conversationId:\s*\{[\s\S]*type:\s*String/);
assert.match(directedMessage, /conversationType:\s*\{[\s\S]*type:\s*String/);
assert.doesNotMatch(directedMessage, /\b(targetId|chatType)\b/);
assert.match(
  directedMessage,
  /requireManager\('groupManager'\)\.getGroup\(conversationId\.value\)\.getMembers/,
);
assert.match(
  directedMessage,
  /requireManager\('chatRoomManager'\)\s*\.\s*getChatRoom\(conversationId\.value\)\s*\.\s*getMembers\(\{\s*cursor,\s*pageSize:\s*50,\s*\}\)/s,
  'Chatroom directed-message recipients must use the public SDK 5.0 ChatRoom.getMembers facade.',
);
assert.doesNotMatch(directedMessage, /\.getMemberList\(/);
assert.doesNotMatch(directedMessage, /fetchGroupsMemberFromServer/);
assert.match(directedDefaults, /member\.user\?\.userId/);
assert.doesNotMatch(directedDefaults, /member\.(member|owner)/);
assert.match(contacts, /const validUserIds = .*filter\(/s);
assert.match(
  contacts,
  /const currentUserId = getCurrentUserId\(\);[\s\S]*\.filter\(\(userId\) => userId !== currentUserId\)/,
  'Presence subscribe targets must exclude the current user before calling SDK 5.0 subscribePresence.',
);
assert.match(contacts, /presenceManager\(\)\.subscribePresence\(\{[\s\S]*userIds: userItem/);
assert.match(
  contacts,
  /console\.log\(\s*'\[环信 Presence\] subscribePresence 跳过空目标'[\s\S]*currentUser[\s\S]*rawUsers/,
  'subFriendsPresence must skip empty/self-only target lists without issuing an invalid SDK request.',
);
assert.match(
  contacts,
  /console\.error\(\s*'\[环信 Presence\] subscribePresence 失败'[\s\S]*currentUser[\s\S]*validUserIds[\s\S]*requestBatches[\s\S]*error/,
  'subscribePresence failures must keep current user and exact request batches for SDK/server debugging.',
);
assert.match(
  chatHeader,
  /conversationType === CONVERSATION_TYPE\.SINGLE[\s\S]*conversationId[\s\S]*!isSubscribedUserPresence\.value\(conversationId\)[\s\S]*store\.dispatch\('subFriendsPresence', \[conversationId\]\)/,
  'Chat message header may auto-subscribe Presence only for singleChat user conversations.',
);
assert.doesNotMatch(
  chatHeader,
  /conversationType !== CONVERSATION_TYPE\.GROUP[\s\S]*store\.dispatch\('subFriendsPresence', \[conversationId\]\)/,
  'Chatroom and group IDs must never be passed to SDK 5.0 subscribePresence.',
);
assert.match(
  contacts,
  /option = \{ pageNum: 1, pageSize: 50 \}/,
  'Subscribed presence pagination must default to the server-accepted first page.',
);
assert.match(
  contacts,
  /const normalizeSubscribedPresenceListOption = \(option = \{\}\) => \(\{[\s\S]*pageNum: normalizePositiveInteger\(option\?\.pageNum, 1\),[\s\S]*pageSize: normalizePositiveInteger\(option\?\.pageSize, 50\),[\s\S]*\}\);/,
  'Subscribed presence pagination must normalize Demo-owned pageNum/pageSize before calling SDK 5.0.',
);
assert.match(
  contacts,
  /const requestOption = normalizeSubscribedPresenceListOption\(option\);[\s\S]*presenceManager\(\)\.getSubscribedPresenceList\(requestOption\)/,
  'getSubscribedPresenceList must receive the normalized SDK 5.0 request option.',
);
assert.match(
  contacts,
  /console\.error\(\s*'\[环信 Presence\] getSubscribedPresenceList 失败'[\s\S]*requestOption[\s\S]*rawOption[\s\S]*error/,
  'Subscribed presence failures must keep raw SDK/server error and request context for debugging.',
);
assert.doesNotMatch(
  contactInfos,
  /fetchSubscribedPresenceList', \{\s*pageNum:\s*0,/s,
  'Subscribe and unsubscribe follow-up queries must not send the server-rejected pageNum=0.',
);
assert.match(personalSettings, /const presencePageNum = ref\(1\);/);
assert.match(
  personalSettings,
  /catch \(error\) \{[\s\S]*console\.error\(\s*'\[PersonalsettingCard\] fetchSubscribedPresenceList failed'/,
  'Personal settings must catch subscribed-presence failures so the Demo surfaces the real error without the Vue dev overlay.',
);
assert.match(
  personalSettings,
  /ElMessage\.error\(error\?\.message \|\| '在线状态订阅列表刷新失败'\)/,
  'Personal settings must show the SDK 5.0 error message instead of swallowing it.',
);
assert.match(
  casesList,
  /订阅列表查询固定从服务端接受的 `pageNum: 1` 开始；Demo 调用前将 `pageNum\/pageSize` 规范为正整数；`pageNum: 0` 的 SDK 类型注释与服务端 400 结果不一致，服务端仍拒绝时保留原始错误且不重试、不触发开发态红屏/,
);
assert.match(
  casesList,
  /消息页头部自动订阅在线状态仅限 SDK 5\.0 `singleChat` 用户会话；`groupChat` 和 `chatRoom` 不调用 `subscribePresence`；订阅前过滤当前登录用户，避免把群组 ID、聊天室 ID 或自己作为 Presence 订阅目标/,
);
assert.match(
  superpowers,
  /Presence 订阅列表查询必须传服务端接受的 `pageNum: 1` 并在 Demo 调用边界把 `pageNum\/pageSize` 规范为正整数；若 SDK 类型注释仍称 0 起始，与服务端 400 冲突时保留原始错误，不重试、不伪造结果；页面必须 catch 真实错误并用 toast\/console 展示，不能触发开发态红屏/,
);
assert.match(
  superpowers,
  /消息页头部 Presence 自动订阅只能在 `conversationType === CONVERSATION_TYPE\.SINGLE` 时调用 `subscribePresence\(\{ userIds \}\)`；禁止用“非群聊”判断覆盖聊天室；`subFriendsPresence` 必须过滤空 ID 和当前登录用户，失败日志必须保留 currentUser、validUserIds、requestBatches 和原始 error/,
);

console.log('sdk5 directed message and presence contract: PASS');
