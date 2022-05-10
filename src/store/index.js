import { createStore } from 'vuex';
import Ease from '@/IM/initwebsdk';
export default createStore({
  state: {
    loginState: false,
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
    CHANGE_LOGIN_STATUS: (state, status) => {
      state.loginState = status;
    },
    SET_LOGIN_USER_INFO: (state, infos) => {
      state.loginUserInfo = Object.assign(state.loginUserInfo, infos);
    },
    SET_LOGIN_USER_ONLINE_STATUS: (state, payload) => {
      console.log('payload', payload);
      state.loginUserOnlineStatus = payload;
    },
  },
  actions: {
    getMyUserInfo: async ({ commit }, userId) => {
      const { data } = await Ease.conn.fetchUserInfoById(userId);
      data[userId].hxId = userId;
      commit('SET_LOGIN_USER_INFO', data[userId]);
    },
    handlePresenceChanges: ({ commit, dispatch }, status) => {
      console.log('>>>>>>拿到要订阅的用户状态', status);
      const { userId, ext: statusType } = status || {};
      if (userId === Ease.conn.user) {
        console.log('statusType');
        commit(
          'SET_LOGIN_USER_ONLINE_STATUS',
          statusType ? statusType : 'Unset'
        );
      }
    },
  },
  modules: {},
});
