import { requireManager } from '../index';
import store from '@/store';
import { wrapImEventHandler } from '@/utils/safeCall';

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
    requireManager('chatManager').addEventHandler(
      'multiDeviceEvent',
      wrapImEventHandler({
        onMultiDeviceConversation: (event) => {
          onDispatchMultiDeviceEvent(event);
        },
      }),
    );
  };

  return {
    mountMultiDeviceEventListener,
  };
};
