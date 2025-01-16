import { imConnectListener } from './imConnectListener';
import { imReviceMessageListener } from './imReciveMessageListener';
import { imPresenceListener } from './imPresenceListener';
import { imContactListener } from './imContactListener';
import { imGroupListener } from './imGroupListener';
import { imReadAckListener } from './imReadAckListener';
/* mount all listener */
export const mountAllEMListener = () => {
  const { mountConnectEventListener } = imConnectListener();
  mountConnectEventListener();
  const { mountPresenceEventListener } = imPresenceListener();
  mountPresenceEventListener();
  const { mountReviceMessageEventListener } = imReviceMessageListener();
  mountReviceMessageEventListener();
  const { mountContactEventListener } = imContactListener();
  mountContactEventListener();
  const { mountGroupEventListener } = imGroupListener();
  mountGroupEventListener();
  const { mountReadAckEventListener } = imReadAckListener();
  mountReadAckEventListener();
};
export {
  imConnectListener,
  imPresenceListener,
  imReviceMessageListener,
  imContactListener,
  imGroupListener,
  imReadAckListener,
};
