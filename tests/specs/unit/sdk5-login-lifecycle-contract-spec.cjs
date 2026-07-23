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
