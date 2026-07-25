const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const sdkRoot = path.join(projectRoot, 'node_modules/easemob-websdk');
const sourceRoot = path.join(projectRoot, 'src');

const apiSources = [
  ['ChatClient', 'dist/chat-client.d.ts'],
  ['ChatManager', 'dist/managers/chat-manager.d.ts'],
  ['ContactManager', 'dist/managers/contact-manager.d.ts'],
  ['GroupManager', 'dist/managers/group-manager.d.ts'],
  ['ChatRoomManager', 'dist/managers/chatroom-manager.d.ts'],
  ['ChatThreadManager', 'dist/managers/chat-thread-manager.d.ts'],
  ['PresenceManager', 'dist/managers/presence-manager.d.ts'],
  ['PushManager', 'dist/managers/push-manager.d.ts'],
  ['UserInfoManager', 'dist/managers/user-info-manager.d.ts'],
  ['Group', 'dist/managers/group/group.d.ts'],
  ['ChatRoom', 'dist/managers/chatroom/chatroom.d.ts'],
  ['ChatThread', 'dist/managers/chat-thread/chat-thread.d.ts'],
];

const topLevelApis = ['setLogLevel', 'createPlatformAdapter', 'detectRuntimePlatform'];
const excludedNames = new Set(['constructor', 'bind']);
const extraInternalApis = new Set([
  'ChatClient.emitConversationListUpdate',
  'GroupManager.hydrateMessageProfileGroupNamecards',
]);
const messageBuilderNames = new Set([
  'createTextMessage',
  'createImageMessage',
  'createFileMessage',
  'createVoiceMessage',
  'createVideoMessage',
  'createLocationMessage',
  'createCmdMessage',
  'createCustomMessage',
  'createCombineMessage',
]);

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

function readSdk(relativePath) {
  return fs.readFileSync(path.join(sdkRoot, relativePath), 'utf8');
}

function listSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(fullPath);
    return /\.(?:js|vue|ts)$/.test(entry.name) ? [fullPath] : [];
  });
}

function parseClassMethods(className, relativePath) {
  const source = readSdk(relativePath);
  const classStart = source.indexOf(`export declare class ${className}`);
  if (classStart < 0) throw new Error(`Missing ${className} declaration`);

  const methods = [];
  const excluded = {};
  let pendingDoc = '';
  let inDoc = false;
  let docLines = [];

  for (const line of source.slice(classStart).split('\n')) {
    if (inDoc) {
      docLines.push(line);
      if (line.includes('*/')) {
        inDoc = false;
        pendingDoc = docLines.join('\n');
      }
      continue;
    }

    const docStart = line.indexOf('/**');
    const declaration = docStart >= 0 ? line.slice(0, docStart) : line;
    const match = declaration.match(
      /^\s{4}(?:static\s+)?(?:protected\s+)?([A-Za-z_$][\w$]*)/,
    );
    if (match && declaration.includes('(')) {
      const name = match[1];
      const fullName = `${className}.${name}`;
      const isInternal =
        /@internal/.test(pendingDoc) ||
        extraInternalApis.has(fullName);
      const isPrivateOrProtected = /^\s{4}(?:private|protected)\b/.test(
        declaration,
      );
      if (!isPrivateOrProtected && !excludedNames.has(name) && !isInternal) {
        methods.push(name);
      } else if (!isPrivateOrProtected && !excludedNames.has(name)) {
        excluded[name] = '@internal declaration';
      }
      pendingDoc = '';
    }

    if (docStart >= 0 && !match) {
      const doc = line.slice(docStart);
      if (doc.includes('*/')) {
        pendingDoc = doc;
        privateSection = false;
      } else {
        inDoc = true;
        docLines = [doc];
      }
    }
  }
  return { methods, excluded };
}

function hasCall(source, pattern) {
  return pattern.test(source);
}

function managerWasAssigned(source, variableName, managerName) {
  return hasCall(
    source,
    new RegExp(
      `(?:const|let)\\s+${variableName}\\s*=\\s*(?:requireManager\\(\\s*['"]${managerName}['"]\\s*\\)|${managerName}\\(\\))`,
    ),
  );
}

function clientWasAssigned(source, variableName) {
  return hasCall(
    source,
    new RegExp(`(?:const|let)\\s+${variableName}\\s*=\\s*getClient\\(\\)`),
  );
}

function isCalled(api, sourceFiles) {
  const escaped = api.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return sourceFiles.some((source) => {
    if (api.owner === 'topLevel') {
      return hasCall(source, new RegExp(`\\b${escaped}\\s*\\(`));
    }
    if (api.owner === 'ChatClient') {
      return (
        api.name === 'init' ||
        hasCall(
          source,
          new RegExp(
            `(?:getClient\\(\\)|\\bclient\\b|\\bsdkClient\\b)\\s*\\.\\s*${escaped}\\s*(?:\\?\\.)?\\s*\\(`,
          ),
        ) ||
        (clientWasAssigned(source, 'manager') &&
          hasCall(source, new RegExp(`\\bmanager\\s*\\.\\s*${escaped}\\s*\\(`)))
      );
    }

    const managerOwners = {
      ChatManager: 'chatManager',
      ContactManager: 'contactManager',
      GroupManager: 'groupManager',
      ChatRoomManager: 'chatRoomManager',
      ChatThreadManager: 'chatThreadManager',
      PresenceManager: 'presenceManager',
      PushManager: 'pushManager',
      UserInfoManager: 'userInfoManager',
    };
    const managerName = managerOwners[api.owner];
    if (managerName) {
      const dynamicMessageBuilder =
        api.owner === 'ChatManager' &&
        messageBuilderNames.has(api.name) &&
        hasCall(
          source,
          new RegExp(`\\bbuilders\\s*=\\s*\\{[\\s\\S]*?['"]${escaped}['"]`),
        );
      return (
        dynamicMessageBuilder ||
        hasCall(
          source,
          new RegExp(
            `(?:${managerName}\\(\\)|requireManager\\(\\s*['"]${managerName}['"]\\s*\\))\\s*\\.\\s*${escaped}\\s*\\(`,
          ),
        ) ||
        (managerWasAssigned(source, 'manager', managerName) &&
          hasCall(source, new RegExp(`\\bmanager\\s*\\.\\s*${escaped}\\s*\\(`)))
      );
    }

    const entityPatterns = {
      Group: [
        `(?:groupManager\\(\\)|requireManager\\(\\s*['"]groupManager['"]\\s*\\))\\s*\\.\\s*getGroup\\s*\\([\\s\\S]*?\\)\\s*\\.\\s*${escaped}\\s*\\(`,
      ],
      ChatRoom: [
        `(?:chatRoomManager\\(\\)|requireManager\\(\\s*['"]chatRoomManager['"]\\s*\\))\\s*\\.\\s*getChatRoom\\s*\\([\\s\\S]*?\\)\\s*\\.\\s*${escaped}\\s*\\(`,
        `\\bchatRoom\\s*\\(\\)\\s*\\.\\s*${escaped}\\s*\\(`,
      ],
      ChatThread: [
        `getChatThreadEntity\\s*\\([\\s\\S]*?\\)\\s*\\.\\s*${escaped}\\s*\\(`,
      ],
    };
    return entityPatterns[api.owner].some((pattern) =>
      hasCall(source, new RegExp(pattern)),
    );
  });
}

function buildReport() {
  const sourceFiles = listSourceFiles(sourceRoot).map((file) =>
    fs.readFileSync(file, 'utf8'),
  );
  const apis = topLevelApis.map((name) => ({ owner: 'topLevel', name }));

  const excludedApis = {};
  for (const [owner, declaration] of apiSources) {
    const { methods, excluded } = parseClassMethods(owner, declaration);
    for (const name of methods) {
      apis.push({ owner, name });
    }
    for (const [name, reason] of Object.entries(excluded)) {
      excludedApis[`${owner}.${name}`] = reason;
    }
  }

  const coveredApis = apis.filter((api) => isCalled(api, sourceFiles));
  const uncoveredApis = apis
    .filter((api) => !isCalled(api, sourceFiles))
    .map((api) => (api.owner === 'topLevel' ? api.name : `${api.owner}.${api.name}`))
    .sort();

  return {
    sdk: { name: 'easemob-websdk', majorVersion: '5.0' },
    sourceRoot: 'src',
    total: apis.length,
    covered: coveredApis.length,
    uncovered: uncoveredApis.length,
    coveragePercent: `${((coveredApis.length / apis.length) * 100).toFixed(1)}%`,
    uncoveredApis,
    excludedApis,
  };
}

const report = buildReport();
if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(report)}\n`);
} else {
  console.log(`SDK ${report.sdk.name} ${report.sdk.majorVersion}`);
  console.log(`Static API coverage: ${report.covered}/${report.total} (${report.coveragePercent})`);
  console.log(`Uncovered (${report.uncovered}): ${report.uncoveredApis.join(', ')}`);
}
