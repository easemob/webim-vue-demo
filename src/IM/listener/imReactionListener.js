import { getCurrentUserId, requireManager } from '../index';
import store from '@/store';
import { wrapImEventHandler } from '@/utils/safeCall';

const CHAT_REACTION_LISTENER_ID = 'REACTION';

export const imReactionListener = () => {
  const recordSdkEvent = (eventName, payload) => {
    Promise.resolve(
      store.dispatch('recordSdkEvent', {
        domain: payload?.conversationType === 'groupChat' ? 'group' : 'singleChat',
        eventName,
        payload,
        currentUserId: getCurrentUserId(),
      }),
    ).catch((error) => console.error('[imReactionListener.recordSdkEvent]', error));
  };
  const mountReactionEventListener = () => {
    const manager = requireManager('chatManager');
    manager.removeEventHandler(CHAT_REACTION_LISTENER_ID);
    manager.addEventHandler(
      CHAT_REACTION_LISTENER_ID,
      wrapImEventHandler({
        onReactionChanged: async (reactionMsg) => {
          recordSdkEvent('onReactionChanged', reactionMsg);
            console.log('[Reaction] onReactionChange received', {
            messageId: reactionMsg?.messageId,
            conversationId: reactionMsg?.conversationId,
            conversationType: reactionMsg?.conversationType,
            reactions: reactionMsg?.reactions,
            rawEvent: reactionMsg,
          });
          Promise.resolve(
            store.dispatch('handleReactionChange', reactionMsg),
          ).catch((err) =>
            console.error('[imReactionListener] handleReactionChange', err),
          );
        },
      }),
    );
  };

  return {
    mountReactionEventListener,
  };
};
