import { imConnectListener, fetchLoginUsersInitData } from './imConnectListener';
import { imReviceMessageListener } from './imReciveMessageListener';
import { imPresenceListener } from './imPresenceListener';
import { imReactionListener } from './imReactionListener';
import { imContactListener } from './imContactListener';
import { imGroupListener } from './imGroupListener';
import { imReadAckListener } from './imReadAckListener';
import { imMultiDeviceListener } from './imMultiDeviceListener';
import { imThreadListener } from './imThreadListener';
import { imChatroomListener } from './imChatroomListener';
import { safeSync } from '@/utils/safeCall';

function mountSafe(label, fn) {
  safeSync(label, fn);
}

/* mount all listener：单项失败不影响其余监听注册 */
export const mountAllEMListener = () => {
  const { mountConnectEventListener } = imConnectListener();
  mountSafe('imConnectListener', mountConnectEventListener);
  const { mountPresenceEventListener } = imPresenceListener();
  mountSafe('imPresenceListener', mountPresenceEventListener);
  const { mountReactionEventListener } = imReactionListener();
  mountSafe('imReactionListener', mountReactionEventListener);
  const { mountReviceMessageEventListener } = imReviceMessageListener();
  mountSafe('imReciveMessageListener', mountReviceMessageEventListener);
  const { mountContactEventListener } = imContactListener();
  mountSafe('imContactListener', mountContactEventListener);
  const { mountGroupEventListener } = imGroupListener();
  mountSafe('imGroupListener', mountGroupEventListener);
  const { mountReadAckEventListener } = imReadAckListener();
  mountSafe('imReadAckListener', mountReadAckEventListener);
  const { mountMultiDeviceEventListener } = imMultiDeviceListener();
  mountSafe('imMultiDeviceListener', mountMultiDeviceEventListener);
  const { mountThreadEventListener } = imThreadListener();
  mountSafe('imThreadListener', mountThreadEventListener);
  const { mountChatroomEventListener } = imChatroomListener();
  mountSafe('imChatroomListener', mountChatroomEventListener);
};
export {
  fetchLoginUsersInitData,
  imConnectListener,
  imPresenceListener,
  imReactionListener,
  imReviceMessageListener,
  imContactListener,
  imGroupListener,
  imReadAckListener,
  imMultiDeviceListener,
  imThreadListener,
  imChatroomListener,
};
