import { requireManager } from '../index';
import store from '@/store';
import { wrapImEventHandler } from '@/utils/safeCall';

const CHAT_REACTION_LISTENER_ID = 'REACTION';

export const imReactionListener = () => {
  const mountReactionEventListener = () => {
    const manager = requireManager('chatManager');
    manager.removeEventHandler(CHAT_REACTION_LISTENER_ID);
    manager.addEventHandler(
      CHAT_REACTION_LISTENER_ID,
      wrapImEventHandler({
        onReactionChanged: async (reactionMsg) => {
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
