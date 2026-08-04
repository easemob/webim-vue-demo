# TKE SDK 5.0 Sync WebSocket Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure the real TKE SDK 5.0 sync WebSocket endpoint for automatic group and contact synchronization.

**Architecture:** The selected environment remains the single configuration source. The TKE preset supplies the fixed sync endpoint, and the existing private `serviceConfig.serverUrls` branch passes it unchanged to `ChatClient.init`.

**Tech Stack:** Vue 3, Vuex, Node.js contract tests, easemob-websdk 5.0.

## Global Constraints

- Use SDK 5.0 fields directly; do not add SDK 4.0 compatibility code.
- Do not add REST fallback, retry, or local fake group/contact data.
- TKE `syncWsUrl` is exactly `wss://tke-sdb-fusion.easemob.com/ws`.
- Synchronize `cases_list.md` and `.codex/prompts/superpowers.md` with behavior changes.

---

### Task 1: Configure the TKE sync WebSocket

**Files:**

- Modify: `src/views/Login/components/CustomImConfig/imEnvPresets.js`
- Modify: `src/IM/initwebsdk.js`
- Test: `tests/specs/unit/sdk5-login-lifecycle-contract-spec.cjs`

**Interfaces:**

- Consumes: `webimConfig.syncWsUrl` from the selected environment.
- Produces: SDK 5.0 `serviceConfig.serverUrls.syncWsUrl` in the private fixed-address branch.

- [x] **Step 1: Write the failing test**

```js
assert.match(environmentSource, /syncWsUrl:\s*'wss:\/\/tke-sdb-fusion\.easemob\.com\/ws'/);
assert.match(initSource, /syncWsUrl:\s*CUSTOM_CONFIG\.syncWsUrl,/);
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/specs/unit/sdk5-login-lifecycle-contract-spec.cjs`

Observed: FAIL because the TKE preset had no `syncWsUrl`.

- [x] **Step 3: Write minimal implementation**

```js
[IM_ENVIRONMENTS.TKE]: {
  syncWsUrl: 'wss://tke-sdb-fusion.easemob.com/ws',
}

serverUrls: {
  syncWsUrl: CUSTOM_CONFIG.syncWsUrl,
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `node --test tests/specs/unit/sdk5-login-lifecycle-contract-spec.cjs`

Observed: PASS with `sdk5 login lifecycle contract: PASS`.

- [x] **Step 5: Verify production build**

Run: `npm run build`

Expected: build succeeds; existing bundle-size warning is non-blocking.

Observed: PASS (`npm run build`, 2026-08-03). The build emitted only the existing
asset-size / entrypoint-size warnings and produced `dist/js/app.d809412a.js`, which
contains the configured TKE `syncWsUrl`.
