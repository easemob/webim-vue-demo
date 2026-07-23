const {
  ChatClient,
  ChatManager,
  ChatRoomManager,
  ChatThreadManager,
  ContactManager,
  GroupManager,
  PresenceManager,
  PushManager,
  UserInfoManager,
} = require('easemob-websdk');

let client = null;

const managerClasses = [
  ChatManager,
  ContactManager,
  GroupManager,
  ChatRoomManager,
  ChatThreadManager,
  PresenceManager,
  PushManager,
  UserInfoManager,
];

function toConversationLocator(input) {
  const conversationId = input?.conversationId || input?.id;
  const conversationType = input?.conversationType || input?.type;
  if (!conversationId) throw new Error('conversationId is required');
  if (!conversationType) throw new Error('conversationType is required');
  return { conversationId, conversationType };
}

function initializeClient(config) {
  if (client) return client;
  client = ChatClient.init({
    appKey: config.appKey,
    enableDeliveryReceipt: true,
    enableSyncData: ['conversation', 'contact', 'group'],
    serviceConfig: config.serviceConfig,
    managers: managerClasses,
  });
  return client;
}

function getClient() {
  if (!client) throw new Error('SDK 5.0 client is not initialized');
  return client;
}

function requireManager(name) {
  const currentClient = getClient();
  const manager = currentClient[name];
  if (!manager) {
    throw new Error(`SDK 5.0 current package does not expose ${name}; no fallback is configured.`);
  }
  return manager;
}

async function login({ userId, token }) {
  if (!userId || !token) throw new Error('userId and token are required');
  return getClient().login({ userId, token });
}

async function logout() {
  return getClient().logout();
}

function getCurrentUserId() {
  return getClient().getCurrentUserId() || '';
}

module.exports = {
  getClient,
  getCurrentUserId,
  initializeClient,
  login,
  logout,
  requireManager,
  toConversationLocator,
};
