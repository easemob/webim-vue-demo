import { requireManager } from '../index';
import { wrapImEventHandler } from '@/utils/safeCall';

const CHAT_THREAD_LISTENER_ID = 'THREAD';

export const imThreadListener = () => {
  const describeThreadEvent = (eventName, payload) => ({
    eventName,
    chatThreadId: payload?.chatThreadId || '',
    parentId: payload?.parentId || '',
    operatorId: payload?.operatorId || '',
    chatThreadName: payload?.chatThreadName || '',
    messageId: payload?.messageId || '',
    memberId: payload?.memberId || '',
    messageCount: payload?.messageCount ?? '',
    timestamp: payload?.timestamp || '',
    rawEvent: payload,
  });

  const logThreadEvent = (eventName, payload) => {
    console.log(
      `[SDK 5.0 Thread Event] ${eventName} received`,
      describeThreadEvent(eventName, payload),
    );
  };

  const mountThreadEventListener = () => {
    const manager = requireManager('chatThreadManager');
    manager.removeEventHandler(CHAT_THREAD_LISTENER_ID);
    manager.addEventHandler(
      CHAT_THREAD_LISTENER_ID,
      wrapImEventHandler({
        onChatThreadCreated: (payload) =>
          logThreadEvent('onChatThreadCreated', payload),
        onChatThreadDestroyed: (payload) =>
          logThreadEvent('onChatThreadDestroyed', payload),
        onChatThreadUpdated: (payload) =>
          logThreadEvent('onChatThreadUpdated', payload),
        onChatThreadUserRemoved: (payload) =>
          logThreadEvent('onChatThreadUserRemoved', payload),
      }),
    );
  };

  return {
    mountThreadEventListener,
  };
};
