const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const initSource = read('src/IM/initwebsdk.js');
const environmentSource = read('src/views/Login/components/CustomImConfig/imEnvPresets.js');
const listenerSource = read('src/IM/listener/imConnectListener.js');
const listenerIndexSource = read('src/IM/listener/index.js');
const appSource = read('src/App.vue');
const loginSource = read('src/views/Login/components/LoginInput/emloginWithPasswordLogin.vue');

assert.match(
  initSource,
  /const useSdkDns\s*=\s*!CUSTOM_CONFIG\.isPrivate\s*\|\|\s*CUSTOM_CONFIG\.environment\s*===\s*'VIP6'/,
  'SDK 5.0 must use DNS unless private configuration is explicitly enabled; VIP6 remains DNS.',
);
assert.match(
  initSource,
  /const serviceConfig\s*=\s*!useSdkDns\s*\?\s*\{[\s\S]*serverUrls[\s\S]*:\s*undefined/,
  'fixed serverUrls must only be created for the explicit private-configuration branch.',
);
assert.match(
  initSource,
  /CUSTOM_CONFIG\.environment\s*===\s*'VIP6'/,
  'VIP6 must use SDK 5.0 DNS even when an old saved configuration still marks it private.',
);
assert.match(
  environmentSource,
  /env\s*===\s*IM_ENVIRONMENTS\.NGI\s*\|\|\s*env\s*===\s*IM_ENVIRONMENTS\.VIP6/,
  'the VIP6 preset must not display or persist fixed private server configuration.',
);
assert.match(
  environmentSource,
  /\[IM_ENVIRONMENTS\.TKE\]:\s*\{[\s\S]*?syncWsUrl:\s*'wss:\/\/tke-sdb-fusion\.easemob\.com\/ws'/,
  'the TKE preset must provide its real SDK 5.0 group/contact sync WebSocket URL.',
);
assert.match(
  initSource,
  /serverUrls:\s*\{[\s\S]*?syncWsUrl:\s*CUSTOM_CONFIG\.syncWsUrl,/,
  'private SDK 5.0 serverUrls must pass the selected environment syncWsUrl through unchanged.',
);
assert.match(
  initSource,
  /import\s*\{\s*normalizeImEnvironmentConfig\s*\}\s*from\s*'\.\.\/views\/Login\/components\/CustomImConfig\/imEnvPresets';/,
  'SDK initialization must use the selected environment preset when loading saved configuration.',
);
assert.match(
  initSource,
  /const CUSTOM_CONFIG = normalizeImEnvironmentConfig\(\s*\(webimConfig && JSON\.parse\(webimConfig\)\) \|\| \{\},\s*\);/,
  'a saved TKE configuration without new fields must still receive its SDK 5.0 syncWsUrl preset.',
);

const onConnectedBody = listenerSource.match(/onConnected:\s*\(\)\s*=>\s*\{([\s\S]*?)\n\s*\},\n\s*onDisconnected/);
assert.ok(onConnectedBody, 'connection onConnected handler must exist');
assert.doesNotMatch(
  onConnectedBody[1],
  /fetchLoginUsersInitData\s*\(/,
  'onConnected fires before SDK 5.0 login() resolves, so it must not trigger REST managers.',
);
assert.match(
  onConnectedBody[1],
  /CHANGE_NETWORK_STATUS',\s*true/,
  'a real SDK 5.0 onConnected event must restore the UI online state after onConnecting.',
);
assert.match(
  listenerSource,
  /onSyncDataFinished:\s*\(payload\)\s*=>\s*\{[\s\S]*payload\?\.dataType !== 'group'[\s\S]*payload\?\.status === 'success'[\s\S]*fetchGroupList\(\)/,
  'SDK 5.0 group sync finishes asynchronously after login, so the Demo must refresh the joined-group snapshot after group sync success.',
);
assert.match(
  listenerSource,
  /onSyncDataFinished[\s\S]*console\.error\(\s*'\[connection\.onSyncDataFinished\] SDK 5\.0 group sync failed'/,
  'SDK 5.0 group sync failures must be surfaced with the raw sync payload/error instead of using REST fallback or fake groups.',
);
assert.match(
  listenerIndexSource,
  /export\s+\{[\s\S]*?fetchLoginUsersInitData/,
  'the post-login initializer must be available to successful login callers.',
);
assert.match(
  appSource,
  /await login\([\s\S]*?\);\s*fetchLoginUsersInitData\(\);\s*await router\.replace\('\/chat'\);/,
  'stored-session login must initialize data and return to chat after login() resolves.',
);
assert.match(
  read('src/store/index.js'),
  /getUserInfoByUserId\(\{\s*userIds:\s*\[userId\][\s\S]*?\}\)/,
  'SDK 5.0 user-info lookup requires an array of userIds.',
);
const storeSource = read('src/store/index.js');
assert.doesNotMatch(
  storeSource,
  /throw new Error\(`SDK 5\.0 returned no user profile/,
  'SDK 5.0 user-info empty hits are a real server result and must not be converted into a Demo initialization error.',
);
assert.match(
  storeSource,
  /console\.warn\(\s*'\[getMyUserInfo\] SDK 5\.0 returned no user profile'/,
  'The Demo must surface the SDK 5.0 empty user-info result as a warning with context.',
);
assert.match(
  storeSource,
  /commit\('SET_LOGIN_USER_INFO',\s*\{\s*hxId:\s*userId\s*\}\)/,
  'When the profile service returns no hit, the Demo may only keep the real current SDK userId for local display context.',
);
assert.match(
  loginSource,
  /await login\([\s\S]*?\);[\s\S]*?fetchLoginUsersInitData\(\);[\s\S]*?router\.replace\('\/chat'\)/,
  'interactive login must initialize data after login() resolves and route without a second login.',
);
assert.doesNotMatch(
  loginSource,
  /window\.location\.href\s*=\s*'\/chat'/,
  'interactive login must not reload and execute a duplicate SDK login.',
);

assert.match(
  appSource,
  /\[IM SDK 5\.0 登录诊断\]/,
  're-login failure must expose non-sensitive SDK 5.0 routing and provision details.',
);
assert.match(
  appSource,
  /tokenLength:\s*loginUserFromStorage\.accessToken\.length/,
  'diagnostics must record token length without printing the token value.',
);
assert.match(
  appSource,
  /details:\s*raw\?\.details/,
  'diagnostics must surface the SDK Provision statusCode and reason details.',
);

console.log('sdk5 login lifecycle contract: PASS');
