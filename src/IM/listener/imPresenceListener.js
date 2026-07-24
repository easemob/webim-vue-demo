import { getCurrentUserId, requireManager } from '../index';
import store from '@/store';
import { wrapImEventHandler } from '@/utils/safeCall';

const PRESENCE_EVENT_HANDLER_ID = 'presenceStatusChange';

/**
 * 在线状态：用户 A subscribePresence 用户 B 后，B 的状态变更会通过 onPresenceStatusChange 通知 A。
 * @see https://doc.easemob.com/document/web/presence.html
 */
const logOnPresenceStatusChange = (payload, index) => {
  const loginUser = getCurrentUserId();
  const list = Array.isArray(payload) ? payload : [payload];
  const item = list[index] ?? payload;
  const targetId = item?.userId ?? item?.uid;
  const description = item?.description ?? item?.ext;
  console.log(
    '%c[环信 Presence] onPresenceStatusChange',
    'color:#059669;font-weight:bold;',
    {
      流程说明:
        'A 已订阅 B 的在线状态 → B 的状态变更 → A 收到本回调（与官方文档一致）',
      文档: 'https://doc.easemob.com/document/web/presence.html',
      当前登录用户_A: loginUser,
      状态所属用户_B: targetId,
      description_ext: description,
      本条在批次中的序号: Array.isArray(payload) ? index : 0,
      原始事件_payload: payload,
      本条解析_item: item,
    },
  );
};

export const imPresenceListener = () => {
  const getUserPresence = (status, batchPayload, indexInBatch) => {
    logOnPresenceStatusChange(batchPayload ?? status, indexInBatch ?? 0);
    Promise.resolve(store.dispatch('handlePresenceChanges', status)).catch(
      (err) => console.error('[imPresenceListener] handlePresenceChanges', err),
    );
  };
  const mountPresenceEventListener = () => {
    const manager = requireManager('presenceManager');
    manager.removeEventHandler(PRESENCE_EVENT_HANDLER_ID);
    manager.addEventHandler(
      PRESENCE_EVENT_HANDLER_ID,
      wrapImEventHandler({
        onPresenceStatusChange: (status) => {
          if (Array.isArray(status)) {
            status.forEach((item, index) => {
              getUserPresence(item, status, index);
            });
          } else {
            getUserPresence(status, status, 0);
          }
        },
      }),
    );
  };
  return {
    mountPresenceEventListener,
  };
};
