import { getCurrentUserId, requireManager } from '../index';
import { CONVERSATION_TYPE } from '@/IM/constant';
import store from '@/store';
import { wrapImEventHandler } from '@/utils/safeCall';

const CHAT_MULTI_DEVICE_LISTENER_ID = 'multiDeviceEvent';
const getMultiDeviceMessageRemovedDomain = (conversationType) => {
  if (conversationType === CONVERSATION_TYPE.SINGLE) return 'singleChat';
  if (conversationType === CONVERSATION_TYPE.GROUP) return 'group';
  if (conversationType === CONVERSATION_TYPE.CHATROOM) return 'chatRoom';

  console.warn(
    '[Demo <- SDK 5.0 Event] ChatManager.onMultiDeviceMessageRemoved missing or unsupported conversationType',
    { conversationType },
  );
  return 'connection';
};

export const imMultiDeviceListener = () => {
  const onDispatchMultiDeviceEvent = (event) => {
    if (!event || typeof event !== 'object') {
      console.warn('[onDispatchMultiDeviceEvent] 无效 event', event);
      return;
    }
    const { eventType, payload } = event;
    console.log('[IM MultiDevice Event] received', {
      eventType,
      payload,
    });

    switch (eventType) {
      // 会话置顶事件
      case 'pinnedConversation':
        {
          Promise.resolve(
            store.dispatch('getServerPinnedConversations'),
          ).catch((err) =>
            console.error('[multiDevice pinnedConversation]', err),
          );
        }
        break;
      // 取消会话置顶事件
      case 'unpinnedConversation':
        {
          Promise.resolve(
            store.dispatch('getServerPinnedConversations'),
          ).catch((err) =>
            console.error('[multiDevice unpinnedConversation]', err),
          );
        }
        break;
      default:
        console.warn('[IM MultiDevice Event] unhandled eventType', {
          eventType,
          payload,
        });
        break;
    }
  };

  const mountMultiDeviceEventListener = () => {
    const manager = requireManager('chatManager');
    manager.removeEventHandler(CHAT_MULTI_DEVICE_LISTENER_ID);
    manager.addEventHandler(
      CHAT_MULTI_DEVICE_LISTENER_ID,
      wrapImEventHandler({
        onMultiDeviceConversation: (event) => {
          onDispatchMultiDeviceEvent(event);
        },
        onMultiDeviceMessageRemoved: (event) => {
          const receivedAt = Date.now();
          const domain = getMultiDeviceMessageRemovedDomain(
            event?.conversationType,
          );
          console.log(
            '[Demo <- SDK 5.0 Event] ChatManager.onMultiDeviceMessageRemoved',
            {
              eventName: 'onMultiDeviceMessageRemoved',
              conversationId: event?.conversationId,
              conversationType: event?.conversationType,
              messageIds: event?.messageIds,
              beforeTimestamp: event?.beforeTimestamp,
              deviceId: event?.deviceId,
              currentUserId: getCurrentUserId(),
              rawEvent: event,
            },
          );
          Promise.resolve(
            store.dispatch('recordSdkEvent', {
              domain,
              eventName: 'onMultiDeviceMessageRemoved',
              payload: event,
              currentUserId: getCurrentUserId(),
              receivedAt,
            }),
          ).catch((error) =>
            console.error('[imMultiDeviceListener.recordSdkEvent]', error),
          );
        },
      }),
    );
  };

  return {
    mountMultiDeviceEventListener,
  };
};
