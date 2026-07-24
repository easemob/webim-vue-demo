const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../../..');

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

test('message search entry exists in the current demo surface', () => {
  const messageView = read('src/views/Chat/components/Message/index.vue');

  assert.match(messageView, /MessageSearchDrawer/);
  assert.match(messageView, /服务端消息搜索/);
  assert.match(messageView, /messageSearchDrawer/);
  assert.match(
    messageView,
    /CONVERSATION_TYPE\.SINGLE[\s\S]*CONVERSATION_TYPE\.GROUP[\s\S]*CONVERSATION_TYPE\.CHATROOM/,
  );
  assert.doesNotMatch(messageView, /\bCHAT_TYPE\b/);
  assert.match(messageView, /!routeQueryData\.value\.isChatThread/);
});

test('conversation search reads the SDK 5 last-message body and timestamp', () => {
  const content = read('src/components/SearchInput/index.vue');

  assert.match(
    content,
    /String\(getLastMessageSearchText\(o\.lastMessage\)\)\.includes\(inputValue\.value\)/,
  );
  assert.match(content, /message\?\.body/);
  assert.match(content, /lastMessage\?\.timestamp/);
  assert.doesNotMatch(content, /lastMessage\?\.(?:msg|time)\b|const \{ type, msg \}/);
});

test('message search uses a date range picker for optional time filtering', () => {
  const content = read('src/views/Chat/components/Message/components/MessageSearchDrawer.vue');

  assert.match(content, /el-date-picker/);
  assert.match(content, /datetimerange/);
  assert.match(content, /value-format="x"/);
  assert.match(content, /startTime/);
  assert.match(content, /endTime/);
  assert.match(content, /timeRange\.value\?\.length === 2/);
});

test('message search builds official searchMessages parameters', () => {
  const content = read('src/views/Chat/components/Message/components/MessageSearchDrawer.vue');

  assert.match(content, /requireManager\('chatManager'\)\.searchMessages\(params\)/);
  assert.match(content, /keywordList/);
  assert.match(content, /keywordListMatchType/);
  assert.match(content, /conversationId/);
  assert.match(content, /conversationType/);
  assert.match(content, /msgTypes/);
  assert.match(content, /searchScope/);
  assert.match(content, /pageNum/);
  assert.match(content, /pageSize/);
});

test('message search uses the SDK 5.0 chat manager without a v4 fallback', () => {
  const content = read('src/views/Chat/components/Message/components/MessageSearchDrawer.vue');

  assert.match(content, /import \{ getCurrentUserId, requireManager \} from '@\/IM';/);
  assert.match(content, /requireManager\('chatManager'\)\.searchMessages\(params\)/);
  assert.doesNotMatch(content, /\bEMClient\b/);
  assert.doesNotMatch(content, /fallback/i);
});

test('message search exposes only supported message type filters', () => {
  const content = read('src/views/Chat/components/Message/components/MessageSearchDrawer.vue');
  const optionsBlock = content.match(/const messageTypeOptions = \[[\s\S]*?\];/)?.[0] || '';

  for (const type of ['txt', 'img', 'video', 'loc', 'file', 'combine']) {
    assert.match(optionsBlock, new RegExp(`value: '${type}'`));
  }
  for (const unsupportedType of ['audio', 'cmd', 'custom']) {
    assert.doesNotMatch(optionsBlock, new RegExp(`value: '${unsupportedType}'`));
  }
});

test('message search message type selection shows every selected type label', () => {
  const content = read('src/views/Chat/components/Message/components/MessageSearchDrawer.vue');
  const messageTypeSelectBlock =
    content.match(/<el-form-item label="消息类型">[\s\S]*?<\/el-form-item>/)?.[0] || '';

  assert.match(messageTypeSelectBlock, /v-model="form\.msgTypes"/);
  assert.match(messageTypeSelectBlock, /multiple/);
  assert.doesNotMatch(messageTypeSelectBlock, /collapse-tags/);
  assert.doesNotMatch(messageTypeSelectBlock, /collapse-tags-tooltip/);
});

test('message search keyword input stays multiline with square corners', () => {
  const content = read('src/views/Chat/components/Message/components/MessageSearchDrawer.vue');
  const keywordInputBlock =
    content.match(/<el-form-item label="关键词">[\s\S]*?<\/el-form-item>/)?.[0] || '';

  assert.match(keywordInputBlock, /type="textarea"/);
  assert.match(keywordInputBlock, /class="message_search_keywords"/);
  assert.match(content, /:deep\(\.message_search_keywords \.el-textarea__inner\)/);
  assert.match(content, /border-radius:\s*0/);
});

test('message search does not intercept keyword count or length before server', () => {
  const content = read('src/views/Chat/components/Message/components/MessageSearchDrawer.vue');

  assert.doesNotMatch(content, /KEYWORD_COUNT_LIMIT_FOR_SERVER_BOUNDARY/);
  assert.doesNotMatch(content, /KEYWORD_LENGTH_LIMIT_FOR_SERVER_BOUNDARY/);
  assert.doesNotMatch(content, /KEYWORD_COMBINED_LENGTH_LIMIT_FOR_SERVER_BOUNDARY/);
  assert.doesNotMatch(content, /keywordList\.length > KEYWORD/);
  assert.doesNotMatch(content, /keyword\.length > KEYWORD/);
  assert.doesNotMatch(content, /keywordCombinedLength/);
  assert.doesNotMatch(content, /关键词最多支持/);
  assert.doesNotMatch(content, /单个关键词最多支持/);
  assert.match(content, /超出服务端限制时展示服务端返回的真实错误/);

  assert.doesNotMatch(content, /maxlength="200"/);
});

test('message search surfaces the SDK error without fake success or local rewording', () => {
  const content = read('src/views/Chat/components/Message/components/MessageSearchDrawer.vue');

  assert.match(content, /const errorTip = getSearchErrorTip\(error\);/);
  assert.match(content, /searchErrorType\.value = 'error';/);
  assert.match(content, /console\.error\('\[Message Search\] searchMessages failed'/);
  assert.match(content, /ElMessage\.error\(errorTip\)/);
  assert.doesNotMatch(content, /服务端消息搜索功能未开通/);
  assert.doesNotMatch(content, /retry|模拟成功|mock success|fake success|fallback/i);
});

test('message search retains the SDK runtime error text directly', () => {
  const content = read('src/views/Chat/components/Message/components/MessageSearchDrawer.vue');

  assert.match(content, /const getSearchErrorTip = \(error\) => getErrorMessageText\(error\);/);
  assert.match(content, /return error\.message \|\| stringifyJson\(error\);/);
  assert.doesNotMatch(content, /parseSearchServerErrorData|getSearchServerDetailErrorText/);
  assert.doesNotMatch(content, /getErrorMessageText\(error\) \|\| '服务端消息搜索失败'/);
  assert.doesNotMatch(content, /ElMessage\.error\('服务端消息搜索失败'\)/);
});

test('message search syncs documentation entries', () => {
  const readme = read('README.md');
  const casesList = read('cases_list.md');
  const superpowers = read('.codex/prompts/superpowers.md');

  assert.match(readme, /服务端消息搜索|消息搜索|searchMessages/);
  assert.match(casesList, /消息搜索|服务端消息搜索/);
  assert.match(superpowers, /消息搜索|服务端消息搜索/);
});
