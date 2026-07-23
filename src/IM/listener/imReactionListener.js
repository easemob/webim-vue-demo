import { requireManager } from '../index';
import store from '@/store';
import { wrapImEventHandler } from '@/utils/safeCall';

export const imReactionListener = () => {
  const mountReactionEventListener = () => {
    requireManager('chatManager').addEventHandler(
      'REACTION',
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
