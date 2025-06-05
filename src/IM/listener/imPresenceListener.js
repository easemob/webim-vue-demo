import { EMClient } from '../index';
import store from '@/store';
export const imPresenceListener = () => {
  //处理登陆用户状态的变更
  const getUserPresence = (status) => {
    store.dispatch('handlePresenceChanges', status);
  };
  const mountPresenceEventListener = () => {
    EMClient.addEventHandler('presenceStatusChange', {
      onPresenceStatusChange: (status) => {
        getUserPresence(...status);
      },
    });
  };
  return {
    mountPresenceEventListener,
  };
};
