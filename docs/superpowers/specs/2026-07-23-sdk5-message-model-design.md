# SDK 5 Message Model Design

## Goal

Make received, historical, sent, recalled, and edited messages use the WebSDK 5.0 Message model directly.

## Constraints

- Use only WebSDK 5.0 fields: `msgServerId`, `msgLocalId`, `conversationId`, `conversationType`, `type`, `body`, `sender`, `ext`, and `modifiedInfo`.
- Do not map to or read `id`, `mid`, `msg`, `to`, `from`, or `chatType` in the message data path.
- Missing SDK fields and callbacks remain visible as raw SDK/server results; no fallback or local fabrication.

## Data Flow

`ChatManager` event or history result -> Vuex stores WebSDK 5.0 Message unchanged -> message list component renders `type`, `body`, `sender`, `conversationId`, and `conversationType`.

For `onMessageUpdated`, the Vuex message identified by `messageId` is updated with the SDK 5.0 `message.body`, `message.ext`, and `message.modifiedInfo`; its conversation locator and sender remain the original message's immutable metadata.

For `onMessageRecalled`, the Vuex message identified by `messageId` in `conversationId` is marked recalled using the SDK 5.0 `conversationType` without legacy locator conversion.

## Scope

The first implementation slice covers text messages and edit/recall real-time updates for singleChat, groupChat, and chatRoom. Other message bodies must retain their raw SDK 5.0 data and be migrated before their existing UI functions are considered supported.
