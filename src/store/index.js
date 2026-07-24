import { createStore } from 'vuex';
import { getCurrentUserId, requireManager } from '@/IM';
import Conversation from './modules/conversation';
import Contacts from './modules/contacts';
import Message from './modules/message';
import Groups from './modules/groups';
import SdkDiagnostics from './modules/sdkDiagnostics';
import UsersProfile from './modules/usersProfile';
import { SOURCE_TYPE } from './modules/usersProfile';
export default createStore({
  state: {
    loginState: false,
    networkStatus: true,
    isShowWarningTips: true,
    chatroomMembers: new Map(),
    // 只保存本次运行中由 SDK 5.0 加入/退出调用确认的成员关系；不是“已加入聊天室列表”。
    joinedChatroomIds: new Set(),
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
    getChatroomMembersMap: (state) => state.chatroomMembers,
  },
  mutations: {
    CLOSE_WARNING_TIPS: (state) => (state.isShowWarningTips = false),
    CHANGE_LOGIN_STATUS: (state, status) => {
      state.loginState = status;
    },
    CHANGE_NETWORK_STATUS: (state, status) => {
      state.networkStatus = status;
    },
    SET_CHATROOM_MEMBERS: (state, payload) => {
      const { chatRoomId, members } = payload;
      state.chatroomMembers.set(String(chatRoomId), [...members]);
    },
    SET_JOINED_CHATROOM_STATUS: (state, { chatRoomId, joined }) => {
      const key = chatRoomId == null || chatRoomId === '' ? '' : String(chatRoomId);
      if (!key) return;
      const nextJoinedChatroomIds = new Set(state.joinedChatroomIds);
      if (joined) {
        nextJoinedChatroomIds.add(key);
      } else {
        nextJoinedChatroomIds.delete(key);
      }
      state.joinedChatroomIds = nextJoinedChatroomIds;
    },
    CLEAR_JOINED_CHATROOM_IDS: (state) => {
      state.joinedChatroomIds = new Set();
    },

    SET_LOGIN_USER_INFO: (state, infos) => {
      state.loginUserInfo = Object.assign(state.loginUserInfo, infos);
    },
    SET_LOGIN_USER_ONLINE_STATUS: (state, payload) => {
      state.loginUserOnlineStatus = payload;
    },
  },
  actions: {
    //获取登陆用户的用户属性
    getMyUserInfo: async ({ commit }, userId) => {
      const users = await requireManager('userInfoManager').getUserInfoByUserId({
        userIds: [userId],
      });
      const user = users[0];
      if (!user) {
        console.warn('[getMyUserInfo] SDK 5.0 returned no user profile', {
          userId,
          users,
        });
        commit('SET_LOGIN_USER_INFO', { hxId: userId });
        return null;
      }
      const data = { ...user, hxId: userId };
      commit('SET_LOGIN_USER_INFO', data);
      commit(
        'UsersProfile/UPDATE_USER_PROFILE',
        {
          userId,
          sourceType: SOURCE_TYPE.CONTACT,
          profile: {
            ...data,
          },
        },
        { root: true },
      );
      return data;
    },
    //修改登陆用户的用户属性
    updateMyUserInfo: async ({ commit }, params) => {
      const data = await requireManager('userInfoManager').updateOwnInfo({ ...params });
      commit('SET_LOGIN_USER_INFO', data);
    },
    //查询登录用户自己的在线状态。只展示 SDK/服务端返回的真实状态，不做本地默认在线。
    fetchLoginUserPresenceStatus: async ({ commit, dispatch }, userId) => {
      const currentUserId = userId || getCurrentUserId();
      if (!currentUserId) {
        commit('SET_LOGIN_USER_ONLINE_STATUS', 'Unset');
        return null;
      }
      const list = await dispatch('fetchPresenceStatusByUsers', [currentUserId]);
      const presence = list.find((item) => item.uid === currentUserId) || list[0];
      commit('SET_LOGIN_USER_ONLINE_STATUS', presence?.ext || 'Unset');
      return presence || null;
    },
    //处理在线状态订阅变更（包含他人的用户状态）
    handlePresenceChanges: ({ commit }, status) => {
      const presenceUserId = status?.userId ?? status?.uid;
      const statusType = status?.ext ?? status?.description;
      if (presenceUserId === getCurrentUserId()) {
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
    SdkDiagnostics,
    UsersProfile,
  },
});
