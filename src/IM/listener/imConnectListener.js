import router from '@/router';
import store from '@/store';
import { handleSDKErrorNotifi } from '@/utils/handleSomeData';
import { EMClient } from '../index';
import { usePlayRing } from '@/hooks';
export const imConnectListener = () => {
  const mountConnectEventListener = () => {
    const { isOpenPlayRing, clickRing } = usePlayRing();
    EMClient.addEventHandler('connection', {
      onConnected: () => {
        store.commit('CHANGE_LOGIN_STATUS', true);
        if (isOpenPlayRing.value) clickRing();
        fetchLoginUsersInitData();
        router.replace('/chat');
      },
      onDisconnected: () => {
        router.push('/login');
        store.commit('CHANGE_LOGIN_STATUS', false);
      },
      onOnline: () => {
        store.commit('CHANGE_NETWORK_STATUS', true);
      }, // 本机网络连接成功。
      onOffline: () => {
        store.commit('CHANGE_NETWORK_STATUS', false);
      }, // 本机网络掉线。
      onError: (error) => {
        handleSDKErrorNotifi(error.type, error.message);
      },
    });
  };

  //fetch 登陆用户的初始数据
  const fetchLoginUsersInitData = () => {
    getMyUserInfos();
    fetchFriendList();
    fetchTheLoginUserBlickList();
    fetchGroupList();
    //初始化vuex中的会话列表相关数据
    // store.dispatch('getConversationListFromLocal')
    store.dispatch('getConversationList');
  };
  //获取登陆用户属性
  const getMyUserInfos = () => {
    const userId = EMClient.user;
    store.dispatch('getMyUserInfo', userId);
  };
  //获取好友列表
  const fetchFriendList = () => {
    store.dispatch('fetchAllContactsListWithRemarkFromServer');
  };
  //获取黑名单列表
  const fetchTheLoginUserBlickList = () => store.dispatch('fetchBlackList');
  //获取加入的群组列表
  const fetchGroupList = () => store.dispatch('fetchJoinedGroupListFromServer');
  return {
    mountConnectEventListener,
    fetchLoginUsersInitData,
    getMyUserInfos,
    fetchFriendList,
    fetchTheLoginUserBlickList,
    fetchGroupList,
  };
};
