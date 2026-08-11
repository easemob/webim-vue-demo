import { CONVERSATION_TYPE } from '@/IM/constant';

export const DELIVER_ONLINE_ONLY_VALUE = true;

export const supportsDeliverOnlineOnly = (conversationType, isChatThread = false) =>
  !isChatThread &&
  (conversationType === CONVERSATION_TYPE.SINGLE ||
    conversationType === CONVERSATION_TYPE.GROUP);

export const buildDeliverOnlineOnlyOptions = (enabled) =>
  enabled ? { deliverOnlineOnly: DELIVER_ONLINE_ONLY_VALUE } : {};
