const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

const conversationList = read(
  'src/views/Chat/components/Conversation/components/ConversationList.vue',
);
const conversationView = read(
  'src/views/Chat/components/Conversation/index.vue',
);
const eventCenter = read('src/views/Chat/components/InformDetails/index.vue');
const contactListener = read('src/IM/listener/imContactListener.js');
const groupListener = read('src/IM/listener/imGroupListener.js');
const conversationStore = read('src/store/modules/conversation.js');

assert.match(
  conversationList,
  /\$emit\('toInformDetails',\s*informDetail\.lastInformDeatail\)/,
  'The event-center preview must pass the displayed SDK event to its click handler.',
);
assert.match(
  conversationView,
  /query:\s*\{[\s\S]*?eventName:\s*inform\.sdkEventName,[\s\S]*?domain:\s*inform\.domain,[\s\S]*?receivedAt:\s*String\(inform\.receivedAt\),[\s\S]*?\}/,
  'Navigation must identify the exact previewed event instead of opening an unqualified event list.',
);
assert.match(
  eventCenter,
  /const selectedEventRecord = computed\(/,
  'The event center must resolve the route-selected event.',
);
assert.match(
  eventCenter,
  /record\.domain === selectedEventDomain\.value[\s\S]*?record\.eventName === selectedEventName\.value[\s\S]*?record\.receivedAt === selectedEventReceivedAt\.value/,
  'The selected event lookup must match domain, event name, and callback capture time.',
);
assert.match(
  eventCenter,
  /hasSelectedEvent\.value[\s\S]*?\[selectedEventRecord\.value\][\s\S]*?: \[\]/,
  'A missing selected event must not fall back to an unrelated latest event.',
);
assert.match(
  eventCenter,
  /联系人事件/,
  'Contact callbacks must be shown as a distinct event domain.',
);
assert.match(
  eventCenter,
  /payload\.userInfo\?\.userId/,
  'Contact event target rendering must use the real SDK userInfo.userId field.',
);
assert.match(
  contactListener,
  /domain:\s*'contact'/,
  'Contact callbacks must be written to the real SDK event center.',
);
assert.match(
  contactListener,
  /const receivedAt = Date\.now\(\);[\s\S]*?recordSdkEvent[\s\S]*?receivedAt,[\s\S]*?createNewInform[\s\S]*?receivedAt,/,
  'The contact preview and event record must retain the same callback capture time.',
);
assert.match(
  groupListener,
  /const receivedAt = Date\.now\(\);[\s\S]*?recordSdkEvent[\s\S]*?receivedAt,[\s\S]*?createNewInform[\s\S]*?receivedAt,/,
  'The group preview and event record must retain the same callback capture time.',
);
assert.match(
  conversationStore,
  /createNewInform:\s*\(\{ commit \}, \{ eventName, payload, domain, receivedAt \}\)/,
  'Notification records must retain the event domain and callback capture time.',
);
assert.match(
  conversationStore,
  /recordSdkEvent:\s*\(\{ commit \}, \{ domain, eventName, payload, currentUserId, receivedAt \}\)/,
  'Event records must accept the callback capture time supplied by the listener.',
);

console.log('sdk5 event center navigation contract: PASS');
