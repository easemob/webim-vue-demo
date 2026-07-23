# AGENTS

## Project Positioning

This project is a Web demo used to verify real Easemob server-side capabilities and behavior.

It is a pure WebSDK 5.0 verification tool.

## WebSDK 5.0 Exclusivity

- Use only WebSDK 5.0 APIs, types, parameters, message fields, and event payloads.
- Do not retain, introduce, or restore WebSDK 4.0 code, field names, compatibility shims, fallback behavior, dual-SDK paths, or downgrade logic.
- **Branch hard gate:** this branch must contain no runnable SDK 4.0 code and no code whose purpose is to accept, translate, normalize, adapt, or emulate SDK 4.0 APIs, parameters, events, or message models.
- Delete V4 adapters and their callers; do not rename, wrap, isolate, deprecate, or leave them dormant for compatibility. This includes legacy aggregate callbacks, `to/from/chatType/mid/msg` message-model aliases, V4 message-type aliases, and `EMClient`/`conn` send paths.
- Every SDK request, event listener, Store record, log payload, and UI consumer must use the current WebSDK 5.0 public field names directly. A local display label is allowed only when it does not create a second SDK-shaped data model or substitute a missing SDK field.
- Before declaring a migration complete, scan the affected runtime path for V4 API names, fields, adapters, and fallback branches; a passing API call alone is not proof that the path is V4-free.
- When a WebSDK 5.0 behavior differs from 4.0, implement and expose the WebSDK 5.0 behavior exactly; do not emulate the former behavior.
- Treat a missing WebSDK 5.0 field or callback as a real SDK/server result. Log and surface it for verification instead of substituting a legacy value.
- Do not translate WebSDK 5.0 data into WebSDK 4.0-shaped UI data. The UI must consume the WebSDK 5.0 model directly.

## Defect Verification Rule

- This demo exists to verify whether WebSDK 5.0 capabilities work correctly, not to make an unsupported behavior appear usable.
- When a WebSDK 5.0 API, event, field, callback, or server response is absent, invalid, or inconsistent with its documented contract, preserve the raw result and report it as a defect.
- Do not fix a WebSDK 5.0 or server defect with client-side field substitution, local state fabrication, compatibility mapping, retries, or fallback behavior.
- Agents must distinguish a demo implementation defect from a WebSDK/server defect using real request, callback, and response evidence before changing code.

## Core Rule

All features and scenarios in this demo must reflect the real server response truthfully.

Do not add client-side fallback logic that hides, retries, softens, simulates, or masks server behavior, including but not limited to:

- automatic retry for failed server capability calls
- local success simulation when the server fails
- silent downgrade when the server does not support a capability
- optimistic UI that presents a server capability as successful before the server confirms it
- client-side data patching that makes unsupported or failed server behavior appear normal
- compatibility shims added only to make the demo look “usable”

## Implementation Rules

- Prefer exposing raw server success and failure states in the UI and console.
- If the server returns an error, the demo should surface that error instead of hiding it.
- If a capability is unsupported, unavailable, or misconfigured on the server, the demo should show the real result.
- Do not add “兜底” behavior unless the user explicitly requests a special non-demo behavior for a separate purpose.
- Before adding any new feature, first confirm the implementation path is aligned with the real server capability being verified.
- If a Web SDK behavior differs from a REST behavior, do not merge them into one “successful” experience. Expose the distinction clearly.
- Exposing real errors does not mean crashing the page. Failures should keep the page usable and display normal error feedback.

## Logging Rules

- Keep complete console error output for server capability failures.
- When possible, include key request context needed for troubleshooting, such as message ID, target ID, chat type, and current user.
- Do not replace real errors with vague generic messages unless the user explicitly requests product-style copy.

## Documentation Sync

Whenever a feature is added, removed, or behavior is changed, also update:

- `cases_list.md`
- `.codex/prompts/superpowers.md`

`cases_list.md` should reflect the currently implemented demo capabilities only, and should not include `tests/`-only capabilities.
