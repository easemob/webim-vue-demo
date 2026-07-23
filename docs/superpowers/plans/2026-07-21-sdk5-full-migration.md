# SDK 5.0 Vue Demo Full Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every v4 runtime integration with the locally built SDK 5.0 package while retaining the Vue Demo's complete real-server capability surface.

**Architecture:** Build and package `websdk2`, install its tarball as the sole SDK dependency, and replace the v4 singleton with `src/IM/sdk5/` facades. Facades own SDK 5.0 initialization, Manager calls, parameter mapping, event routing, and raw-error logging; stores and Vue components use only the facades.

**Tech Stack:** Vue 3, Vuex, Element Plus, JavaScript, locally packed `easemob-websdk` SDK 5.0, Agora RTC SDK.

## Global Constraints

- The package must be built from `/Users/admin/easemob/easemob-web/demo/demo/websdk2` current source using `npm run build && npm pack`.
- Runtime source must contain no v4 dependency, patch, `EMClient`, `conn`, or `WebIM.message.create`.
- Do not mock, retry, use REST fallback, mutate optimistic success, or silently degrade any server capability.
- Every entry in `cases_list.md` maps to SDK 5.0 public APIs/events or an explicit visible SDK 5.0 unsupported result.
- Update `cases_list.md`, `.codex/prompts/superpowers.md`, README and `docs/sdk5-capability-matrix.md` with each behavior change.

---

### Task 1: Establish the SDK 5.0 dependency baseline

**Files:**
- Modify: `package.json`, `package-lock.json`
- Delete: `patches/easemob-websdk+4.17.0.patch`, `dist/`
- Create: `scripts/sdk5-migration-check.cjs`, `docs/sdk5-capability-matrix.md`

- [ ] Build the source SDK with `npm run build && npm pack` in `websdk2`; inspect the tarball `dist/index.d.ts` for `ChatClient` and all nine Managers.
- [ ] Set `easemob-websdk` to the exact generated `file:../websdk2/easemob-websdk-<version>.tgz` path, regenerate `package-lock.json`, and remove the v4 patch and generated target `dist/`.
- [ ] Implement `node scripts/sdk5-migration-check.cjs`: scan runtime source and manifests, excluding itself and `node_modules`, and fail on `easemob-websdk@4`, `EMClient`, `WebIM.message.create`, or `conn.`.
- [ ] Run the guard (expected initial failures identify migration targets), then commit only dependency baseline, guard and matrix skeleton with `build: switch demo to local sdk5 package`.

### Task 2: Replace initialization and lifecycle with SDK 5.0

**Files:**
- Modify: `src/IM/initwebsdk.js`, `src/IM/index.js`, `src/IM/config/index.js`, `src/IM/miniCore/index.js`
- Create: `src/IM/sdk5/client.js`, `src/IM/sdk5/errors.js`, `src/IM/sdk5/conversation.js`
- Test: `tests/specs/unit/sdk5-client-spec.cjs`

- [ ] Add tests that `requireManager` rejects before initialization and that an explicit `{ id, type }` maps to `{ conversationId, conversationType }`; missing type must reject.
- [ ] Implement `ChatClient.init({ appKey, serviceConfig, managers })` with `ChatManager`, `ContactManager`, `GroupManager`, `ChatRoomManager`, `ChatThreadManager`, `PresenceManager`, `PushManager`, and `UserInfoManager`.
- [ ] Map v4 lifecycle calls to `client.login({ userId, token })` and `client.logout()`. Preserve explicit WebSocket URLs and retain raw errors in console with action/user/conversation context.
- [ ] Run the unit test and `npm run build`; commit with `feat: add sdk5 client lifecycle facade`.

### Task 3: Migrate messages and conversations

**Files:**
- Modify: `src/store/modules/message.js`, `src/store/modules/conversation.js`, `src/views/Chat/components/Message/`, `src/views/Chat/components/Conversation/`, `src/utils/deliverOnlineOnly.js`
- Create: `src/IM/sdk5/chat.js`
- Test: `tests/specs/unit/sdk5-chat-spec.cjs`

- [ ] Test every displayed kind maps to its type-safe SDK 5.0 builder: text, image, file, voice, video, location, cmd, custom and combine; assert missing `conversationType` fails.
- [ ] Replace all creation/sending with `chatManager.createXxxMessage` and `sendMessage(message, options)`. Move `deliverOnlineOnly`, directed receivers, priority and upload callbacks to send options.
- [ ] Replace history, search, recall, edit, deletion, pin, reactions, message receipts, group read users, conversation refresh/delete/pin/mark and unread APIs with `chatManager` APIs.
- [ ] Remove pre-confirmation local success mutations; after every SDK failure log the raw error and show its actual message. Run tests/build and commit `feat: migrate messages and conversations to sdk5`.

### Task 4: Migrate contacts, profile, presence, push, groups and threads

**Files:**
- Modify: `src/store/modules/contacts.js`, `src/store/modules/groups.js`, `src/store/modules/usersProfile.js`, `src/views/Chat/components/Contacts/`, `src/views/Chat/components/AboutGroups/`, `src/views/Chat/components/NavBar/`
- Create: `src/IM/sdk5/contact.js`, `src/IM/sdk5/group.js`, `src/IM/sdk5/presence.js`
- Test: `tests/specs/unit/sdk5-domain-spec.cjs`

- [ ] Test the facade selects only `contactManager`, `userInfoManager`, `presenceManager`, `pushManager`, `groupManager`, and `chatThreadManager` for their respective UI domains.
- [ ] Migrate friend/blocklist/remark operations, own/other user profiles, presence publish/subscribe/read and global/conversation silent modes to their SDK 5.0 Managers.
- [ ] Migrate group CRUD, announcement, shared files, attributes, memberships/admins/mutes/blocklists/allowlists and every Thread action/event to `groupManager` and `chatThreadManager`.
- [ ] Run tests/build and commit `feat: migrate contacts groups and threads to sdk5`.

### Task 5: Migrate chatrooms and SDK event listeners

**Files:**
- Modify: `src/views/Chat/components/Chatroom/`, `src/IM/listener/`, `src/utils/handleSomeData/`
- Create: `src/IM/sdk5/chatroom.js`, `src/IM/sdk5/events.js`
- Test: `tests/specs/unit/sdk5-events-spec.cjs`

- [ ] Test that one SDK 5.0 `onMessage` event routes by actual `message.type` and actual `conversationType`, never inferred type.
- [ ] Migrate chatroom listing/detail/join/leave/update, announcements, attributes, members/admins/mutes/blocklists/allowlists to `chatRoomManager`. Keep duplicate join suppression only during an in-flight real request.
- [ ] Register SDK 5.0 client and Manager handlers once; route named group/chatroom/contact/thread/presence/reaction/multi-device events into current stores without v4 aggregate callbacks.
- [ ] Run tests/build and commit `feat: migrate chatrooms and events to sdk5`.

### Task 6: Sweep callsites and synchronize capabilities

**Files:**
- Modify: all remaining SDK callsites under `src/`
- Modify: `cases_list.md`, `.codex/prompts/superpowers.md`, `README.md`, `docs/sdk5-capability-matrix.md`

- [ ] Run `rg -n 'EMClient|WebIM\\.message\\.create|\\bconn\\.' src tests package.json package-lock.json yarn.lock`; route every runtime result through the facades.
- [ ] When the packaged SDK lacks an API, keep its UI entry but throw and display `SDK 5.0 current package does not expose <api>; no fallback is configured.` with raw console context.
- [ ] Record for every `cases_list.md` capability: SDK 5.0 Manager/API, UI entry, event route, and status `mapped`, `unsupported`, `build-verified`, `real-verified`, or `real-unverified`.
- [ ] Update user-facing docs to SDK 5.0 terminology and commit `docs: record sdk5 demo capability coverage`.

### Task 7: Verify removal and real-server behavior

**Files:**
- Modify: `docs/sdk5-capability-matrix.md`, `README.md`

- [ ] Run `node scripts/sdk5-migration-check.cjs`; expect zero forbidden identifiers and no v4 package resolution.
- [ ] Run `npm run build`; expect success, then remove its generated `dist/` before final status.
- [ ] Inspect package exports using `node -e "const sdk=require('easemob-websdk'); console.log(Object.keys(sdk).sort())"`; ensure `ChatClient` and Managers used by the matrix exist.
- [ ] With real configured credentials, verify login, single-chat text send/receive, conversation refresh, contacts, groups, chatrooms, presence read and logout. Record raw outcomes; unavailable credentials are `real-unverified`, and server failures are `failed`.
- [ ] Run `git diff --check` and commit the verification record using `test: verify sdk5 demo migration`.
