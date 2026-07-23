import store from '@/store';
import { handleSDKErrorNotifi } from '@/utils/handleSomeData';
import { getClient, getCurrentUserId } from '../index';
import { usePlayRing } from '@/hooks';
import { safeSync } from '@/utils/safeCall';

// SDK 5.0 在 onConnected 事件后才完成 login() Promise 的会话提交。
// REST Manager 初始化必须由 await login() 成功后的调用方触发，不能在这里抢跑。
export const fetchLoginUsersInitData = () => {
  getMyUserInfos();
  fetchLoginUserPresenceStatus();
  fetchFriendList();
  fetchTheLoginUserBlickList();
  fetchGroupList();
  Promise.resolve(store.dispatch('getConversationList')).catch((err) =>
    console.error('[fetchLoginUsersInitData.getConversationList]', err),
  );
};

const getMyUserInfos = () => {
  const userId = getCurrentUserId();
  Promise.resolve(store.dispatch('getMyUserInfo', userId)).catch((err) =>
    console.error('[getMyUserInfos]', err),
  );
};

const fetchLoginUserPresenceStatus = () => {
  const userId = getCurrentUserId();
  Promise.resolve(store.dispatch('fetchLoginUserPresenceStatus', userId)).catch(
    (err) => console.error('[fetchLoginUserPresenceStatus]', err),
  );
};

const fetchFriendList = () => {
  Promise.resolve(store.dispatch('fetchAllContactsListWithRemarkFromServer')).catch(
    (err) => console.error('[fetchFriendList]', err),
  );
};

const fetchTheLoginUserBlickList = () =>
  Promise.resolve(store.dispatch('fetchBlackList')).catch((err) =>
    console.error('[fetchTheLoginUserBlickList]', err),
  );

const fetchGroupList = () =>
  Promise.allSettled([
    Promise.resolve(
      store.dispatch('fetchJoinedGroupListFromServer', {
        startPageNum: 0,
        reset: true,
      }),
    ),
    Promise.resolve(store.dispatch('fetchJoinedGroupCountFromServer')),
  ]).catch((err) => console.error('[fetchGroupList]', err));

export const imConnectListener = () => {
  const mountConnectEventListener = () => {
    const { isOpenPlayRing, clickRing } = usePlayRing();
    getClient().addEventHandler('connection', {
      onConnected: () => {
        safeSync('connection.onConnected', () => {
          store.commit('CHANGE_LOGIN_STATUS', true);
          // onConnecting marks the UI offline; only the SDK's real connected event restores it.
          store.commit('CHANGE_NETWORK_STATUS', true);
          if (isOpenPlayRing.value) clickRing();
          console.log(
            '[connection.onConnected] SDK 连接已建立；登录调用方将在 login() 成功后初始化数据并路由。',
          );
        });
      },
      onDisconnected: () => {
        safeSync('connection.onDisconnected', () => {
          store.commit('CHANGE_LOGIN_STATUS', false);
          console.warn(
            '[connection.onDisconnected] IM 连接已断开，等待 SDK 自动重连；未跳转登录页。',
          );
        });
      },
      onConnecting: () => {
        safeSync('connection.onConnecting', () => {
          store.commit('CHANGE_NETWORK_STATUS', false);
        });
      },
      onConnectError: (error) => {
        safeSync('connection.onError', () => {
          handleSDKErrorNotifi(error?.type, error?.message, error);
        });
      },
    });
  };

  return {
    mountConnectEventListener,
    fetchLoginUsersInitData,
    getMyUserInfos,
    fetchLoginUserPresenceStatus,
    fetchFriendList,
    fetchTheLoginUserBlickList,
    fetchGroupList,
  };
};
