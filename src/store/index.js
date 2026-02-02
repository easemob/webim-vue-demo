import { createStore } from 'vuex';
import { EMClient } from '@/IM';
import Conversation from './modules/conversation';
import Contacts from './modules/contacts';
import Message from './modules/message';
import Groups from './modules/groups';
import UsersProfile from './modules/usersProfile';
import { SOURCE_TYPE } from './modules/usersProfile';
export default createStore({
  state: {
    loginState: false,
    networkStatus: true,
    isShowWarningTips: true,
    loginUserInfo: {
      hxId: '',
      nickname: '',
      avatarurl:
        'https://download-sdk.oss-cn-beijing.aliyuncs.com/downloads/IMDemo/avatar/Image5.png',
    },
    loginUserOnlineStatus: '',
  },
  getters: {
    loginUserInfo: (state) => state.loginUserInfo,
    loginUserOnlineStatus: (state) => state.loginUserOnlineStatus,
  },
  mutations: {
    CLOSE_WARNING_TIPS: (state) => (state.isShowWarningTips = false),
    RESET_WARNING_TIPS: (state) => (state.isShowWarningTips = true),
    CHANGE_LOGIN_STATUS: (state, status) => {
      state.loginState = status;
    },
    CHANGE_NETWORK_STATUS: (state, status) => {
      state.networkStatus = status;
    },

    SET_LOGIN_USER_INFO: (state, infos) => {
      state.loginUserInfo = Object.assign(state.loginUserInfo, infos);
    },
    SET_LOGIN_USER_ONLINE_STATUS: (state, payload) => {
      state.loginUserOnlineStatus = payload;
    },
  },
  actions: {
    //重置所有store状态(退出登录时调用)
    resetAllStoreState({ commit, state }) {
      // 重置主store状态
      commit('SET_LOGIN_USER_INFO', {
        hxId: '',
        nickname: '',
        avatarurl:
          'https://download-sdk.oss-cn-beijing.aliyuncs.com/downloads/IMDemo/avatar/Image5.png',
      });
      commit('SET_LOGIN_USER_ONLINE_STATUS', '');
      commit('RESET_WARNING_TIPS');
      commit('CHANGE_LOGIN_STATUS', false);
      commit('CHANGE_NETWORK_STATUS', true);
      
      // 重置Conversation模块(直接调用非命名空间的mutation)
      commit('CLEAR_INFORM_LIST');
      commit('GET_CONVERSATION_LIST_FROM_LOCAL', []);
      commit('GET_CONVERSATION_LIST_FROM_SERVER', { isInit: true, conversationListData: [] });
      commit('SET_CONVERSATION_LIST_FROM_SERVER_PAGE_CURSOR', '');
      
      // 重置Contacts模块(使用空数组触发mutation来清空Map)
      commit('SET_FRIEND_LIST_WITH_REMARK', { friendList: [] });
      commit('SET_FRIEND_LIST_USER_INFOS', { userInfos: {} });
      commit('SET_BLACK_LIST', []);
      // 直接清空Map
      state.Contacts.contactsUsersPresenceMap.clear();
      
      // 重置Message模块
      commit('RESET_MESSAGE_STATE');
      
      // 重置Groups模块
      commit('RESET_GROUPS_STATE');
      
      // 重置UsersProfile模块
      commit('UsersProfile/RESET_USER_PROFILES', null, { root: true });
    },
    //获取登陆用户的用户属性
    getMyUserInfo: async ({ commit }, userId) => {
      const { data } = await EMClient.fetchUserInfoById(userId);
      data[userId].hxId = userId;
      commit('SET_LOGIN_USER_INFO', data[userId]);
      commit(
        'UsersProfile/UPDATE_USER_PROFILE',
        {
          userId,
          sourceType: SOURCE_TYPE.CONTACT,
          profile: {
            ...data[userId],
          },
        },
        { root: true },
      );
    },
    //修改登陆用户的用户属性
    updateMyUserInfo: async ({ commit }, params) => {
      const { data } = await EMClient.updateUserInfo({ ...params });
      commit('SET_LOGIN_USER_INFO', data);
    },
    //处理在线状态订阅变更(包含他人的用户状态)
    handlePresenceChanges: ({ commit }, status) => {
      const { userId, ext: statusType } = status || {};
      if (userId === EMClient.user) {
        commit(
          'SET_LOGIN_USER_ONLINE_STATUS',
          statusType ? statusType : 'Unset',
        );
      } else {
        commit('SET_CONTACTS_PRESENCE_TO_MAP', [{ ...status }]);
      }
    },
  },
  modules: {
    Conversation,
    Contacts,
    Message,
    Groups,
    UsersProfile,
  },
});
