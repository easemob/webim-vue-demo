import defaultContactAvatar from '@/assets/images/avatar/theme2x.png';
import { requireManager } from '@/IM';

export const USER_INFO_EVENT_HANDLER_ID = 'sdk5-user-info-profile-listener';
export const USER_INFO_ATTRIBUTES = [
  'nickname',
  'avatarUrl',
  'mail',
  'phone',
  'gender',
  'sign',
  'birth',
  'ext',
];

export const SOURCE_TYPE = {
  BASE: 'base',
  CONTACT: 'contact',
  GROUP: 'group',
  MESSAGE: 'message',
};
const userInfoManager = () => requireManager('userInfoManager');

const buildErrorRecord = (action, context, error) => ({
  action,
  context,
  name: error?.name,
  message: error?.message || String(error),
  statusCode: error?.statusCode,
  code: error?.code,
  rawError: error,
});

// 新增数据规范化方法
const normalizeUserData = (sourceType) => (data) => {
  // 处理好友列表备注列表格式：[{userId, remark}]
  if (Array.isArray(data)) {
    return data.map((item) => ({
      userId: item.userId,
      remark: item.remark || null,
    }));
  }

  // 处理用户信息对象格式：{userId: {profile}}
  if (typeof data === 'object' && !Array.isArray(data)) {
    return Object.entries(data).map(([userId, profile]) => ({
      userId,
      sourceType,
      ...profile,
    }));
  }

  return [];
};
// 新增哈希生成工具
const generateMessageExtensionHash = (message) => {
  const info = message?.ext?.ease_chat_uikit_user_info || {};
  return [info.nickname || '', info.avatarURL || ''].join('|');
};

// 在模块导出中暴露该方法
export const userProfileUtils = {
  normalizeUserData,
  generateMessageExtensionHash,
};
const state = () => ({
  userProfiles: new Map(), // 结构：{
  //   [userId]: {
  //     baseInfo: { nickname, avatarurl }, // 基础信息
  //     contacts: { remark },              // 联系人备注
  //     groupInfos: Map(                   // 群组专属信息
  //       [groupId]: { nickname }
  //     ),
  //     messageExt: { nickname,avatarulr }                // 消息扩展内信息
  //     _meta: { lastMessageHash } // 消息扩展信息哈希值
  //   }
  // }
  userInfoEventLogs: [],
  userInfoAttributeQueryResult: [],
  subscribedUsersInfo: [],
  userInfoOperationResult: null,
  userInfoOperationError: null,
});
const mutations = {
  ADD_USER_INFO_EVENT_LOG(state, event) {
    state.userInfoEventLogs = [
      {
        receivedAt: new Date().toISOString(),
        ...event,
      },
      ...state.userInfoEventLogs,
    ].slice(0, 20);
  },
  SET_USER_INFO_ATTRIBUTE_QUERY_RESULT(state, users) {
    state.userInfoAttributeQueryResult = [...users];
  },
  SET_SUBSCRIBED_USERS_INFO(state, users) {
    state.subscribedUsersInfo = [...users];
  },
  SET_USER_INFO_OPERATION_RESULT(state, payload) {
    state.userInfoOperationResult = payload;
    state.userInfoOperationError = null;
  },
  SET_USER_INFO_OPERATION_ERROR(state, payload) {
    state.userInfoOperationError = payload;
  },
  MERGE_USER_PROFILES(state, users) {
    users.forEach(({ userId, sourceType, groupId, ...profile }) => {
      const userProfile = state.userProfiles.get(userId) || {
        baseInfo: {},
        contacts: {},
        groupInfos: new Map(),
        _meta: { lastMessageHash: '', lastMessageTimestamp: 0 },
      };
      // 根据来源类型合并数据
      switch (sourceType) {
        case SOURCE_TYPE.CONTACT: // 联系人信息（含备注）
          userProfile.contacts = { ...userProfile.contacts, ...profile };
          break;
        case SOURCE_TYPE.GROUP: // 群组信息
          if (groupId) {
            const groupProfile = userProfile.groupInfos.get(groupId) || {};
            userProfile.groupInfos.set(groupId, {
              ...groupProfile,
              ...profile,
            });
          }
          break;
        default: // 基础用户信息
          userProfile.baseInfo = { ...userProfile.baseInfo, ...profile };
      }
      state.userProfiles.set(userId, userProfile);
    });
  },
  UPDATE_USER_PROFILE(state, { userId, sourceType, groupId, profile }) {
    const userProfile = state.userProfiles.get(userId) || {
      baseInfo: {},
      contacts: {},
      groupInfos: new Map(),
      _meta: { lastMessageHash: '', lastMessageTimestamp: 0 },
    };

    switch (sourceType) {
      case SOURCE_TYPE.CONTACT:
        userProfile.contacts = {
          ...userProfile.contacts,
          ...profile,
        };
        break;
      case SOURCE_TYPE.GROUP:
        if (groupId) {
          const groupProfile = userProfile.groupInfos.get(groupId) || {};
          userProfile.groupInfos.set(groupId, {
            ...groupProfile,
            ...profile,
          });
        }
        break;
      default:
        userProfile.baseInfo = {
          ...userProfile.baseInfo,
          ...profile,
        };
    }

    state.userProfiles.set(userId, userProfile);
  },
  UPDATE_MESSAGE_EXT(state, { userId, message }) {
    const userProfile = state.userProfiles.get(userId) || {
      baseInfo: {},
      contacts: {},
      groupInfos: new Map(),
      messageExt: {},
      _meta: { lastMessageHash: '', lastMessageTimestamp: 0 },
    };
    const newHash = generateMessageExtensionHash(message);
    // 哈希值相同则跳过更新
    if (newHash === userProfile._meta.lastMessageHash) return;
    const extInfo = message.ext?.ease_chat_uikit_user_info || {};
    userProfile.messageExt = {
      nickname: extInfo.nickname,
      avatarURL: extInfo.avatarURL,
    };
    userProfile._meta.lastMessageHash = newHash;
    userProfile._meta.lastMessageTimestamp = message.timestamp;
    state.userProfiles.set(userId, userProfile);
  },
};
const actions = {
  registerUserInfoEventHandler({ commit }) {
    const manager = userInfoManager();
    manager.removeEventHandler(USER_INFO_EVENT_HANDLER_ID);
    manager.addEventHandler(USER_INFO_EVENT_HANDLER_ID, {
      onOwnInfoUpdated(userInfo) {
        console.log('[UserInfoManager event] onOwnInfoUpdated', { userInfo });
        commit('ADD_USER_INFO_EVENT_LOG', {
          eventName: 'onOwnInfoUpdated',
          payload: userInfo,
        });
        if (userInfo?.userId) {
          commit('UPDATE_USER_PROFILE', {
            userId: userInfo.userId,
            sourceType: SOURCE_TYPE.BASE,
            profile: userInfo,
          });
          commit('SET_LOGIN_USER_INFO', userInfo, { root: true });
        }
      },
      onUserInfoUpdated(userInfos) {
        console.log('[UserInfoManager event] onUserInfoUpdated', { userInfos });
        commit('ADD_USER_INFO_EVENT_LOG', {
          eventName: 'onUserInfoUpdated',
          payload: userInfos,
        });
        if (Array.isArray(userInfos)) {
          userInfos.forEach((userInfo) => {
            if (!userInfo?.userId) return;
            commit('UPDATE_USER_PROFILE', {
              userId: userInfo.userId,
              sourceType: SOURCE_TYPE.BASE,
              profile: userInfo,
            });
          });
        }
      },
    });
  },
  removeUserInfoEventHandler() {
    userInfoManager().removeEventHandler(USER_INFO_EVENT_HANDLER_ID);
  },
  fetchUserInfoByAttribute: async ({ commit }, { userIds, attributes }) => {
    const action = 'getUserInfoByAttribute';
    try {
      const users = await userInfoManager().getUserInfoByAttribute({
        userIds,
        attributes,
      });
      commit('SET_USER_INFO_ATTRIBUTE_QUERY_RESULT', users);
      commit('SET_USER_INFO_OPERATION_RESULT', {
        action,
        params: { userIds, attributes },
        result: users,
      });
      return users;
    } catch (error) {
      console.error('[UserInfoManager operation failed]', {
        action,
        params: { userIds, attributes },
        error,
      });
      commit(
        'SET_USER_INFO_OPERATION_ERROR',
        buildErrorRecord(action, { userIds, attributes }, error),
      );
      throw error;
    }
  },
  subscribeUsersInfo: async ({ commit }, { userIds }) => {
    const action = 'subscribeUsersInfo';
    try {
      const result = await userInfoManager().subscribeUsersInfo({ userIds });
      commit('SET_USER_INFO_OPERATION_RESULT', {
        action,
        params: { userIds },
        result,
      });
      return result;
    } catch (error) {
      console.error('[UserInfoManager operation failed]', {
        action,
        params: { userIds },
        error,
      });
      commit(
        'SET_USER_INFO_OPERATION_ERROR',
        buildErrorRecord(action, { userIds }, error),
      );
      throw error;
    }
  },
  unsubscribeUsersInfo: async ({ commit }, { userIds }) => {
    const action = 'unsubscribeUsersInfo';
    try {
      const result = await userInfoManager().unsubscribeUsersInfo({ userIds });
      commit('SET_USER_INFO_OPERATION_RESULT', {
        action,
        params: { userIds },
        result,
      });
      return result;
    } catch (error) {
      console.error('[UserInfoManager operation failed]', {
        action,
        params: { userIds },
        error,
      });
      commit(
        'SET_USER_INFO_OPERATION_ERROR',
        buildErrorRecord(action, { userIds }, error),
      );
      throw error;
    }
  },
  fetchSubscribedUsersInfo: async ({ commit }) => {
    const action = 'getSubscribedUsers';
    try {
      const users = await userInfoManager().getSubscribedUsers();
      commit('SET_SUBSCRIBED_USERS_INFO', users);
      commit('SET_USER_INFO_OPERATION_RESULT', {
        action,
        params: {},
        result: users,
      });
      return users;
    } catch (error) {
      console.error('[UserInfoManager operation failed]', { action, error });
      commit(
        'SET_USER_INFO_OPERATION_ERROR',
        buildErrorRecord(action, {}, error),
      );
      throw error;
    }
  },
  updateOwnInfoByAttribute: async ({ commit }, { attribute, value }) => {
    const action = 'updateOwnInfoByAttribute';
    try {
      const userInfo = await userInfoManager().updateOwnInfoByAttribute(
        attribute,
        value,
      );
      commit('SET_LOGIN_USER_INFO', userInfo, { root: true });
      if (userInfo?.userId) {
        commit('UPDATE_USER_PROFILE', {
          userId: userInfo.userId,
          sourceType: SOURCE_TYPE.BASE,
          profile: userInfo,
        });
      }
      commit('SET_USER_INFO_OPERATION_RESULT', {
        action,
        params: { attribute, value },
        result: userInfo,
      });
      return userInfo;
    } catch (error) {
      console.error('[UserInfoManager operation failed]', {
        action,
        params: { attribute, value },
        error,
      });
      commit(
        'SET_USER_INFO_OPERATION_ERROR',
        buildErrorRecord(action, { attribute, value }, error),
      );
      throw error;
    }
  },
  processMessageExt({ commit, state }, payload) {
    const messages = Array.isArray(payload) ? payload : [payload];
    console.log('[Store Message Ext] processMessageExt input', {
      isArray: Array.isArray(payload),
      messageCount: messages.filter(Boolean).length,
      messageIds: messages.filter(Boolean).map(
        (message) => message.msgServerId || message.msgLocalId,
      ),
      conversationIds: messages.filter(Boolean).map(
        (message) => message.conversationId,
      ),
      conversationTypes: messages.filter(Boolean).map(
        (message) => message.conversationType,
      ),
      senderUserIds: messages.filter(Boolean).map(
        (message) => message.sender?.userId,
      ),
      timestamps: messages.filter(Boolean).map(
        (message) => message.timestamp,
      ),
      rawPayload: payload,
    });
    messages.forEach((message, index) => {
      try {
        const userId = message?.sender?.userId;
        if (!userId || typeof message?.timestamp !== 'number') return;

        const userMeta = state.userProfiles.get(userId)?._meta ?? {};
        const currentHash = userMeta.lastMessageHash ?? '';
        const currentTimestamp = userMeta.lastMessageTimestamp ?? 0;
        const newHash = generateMessageExtensionHash(message);
        if (
          newHash !== '' &&
          newHash !== currentHash &&
          message.timestamp > currentTimestamp
        ) {
          commit('UPDATE_MESSAGE_EXT', { userId, message });
        }
      } catch (error) {
        console.error('[Message Ext] process message ext failed', {
          index,
          messageId: message?.msgServerId || message?.msgLocalId,
          conversationId: message?.conversationId,
          conversationType: message?.conversationType,
          senderUserId: message?.sender?.userId,
          timestamp: message?.timestamp,
          error,
          rawMessage: message,
        });
      }
    });
  },
};
const getters = {
  getDisplayRemark: (state) => (userId) => {
    const user = state.userProfiles.get(userId) || {};
    return user.baseInfo?.remark || '';
  },
  getDisplayContactsNickname: (state) => (userId) => {
    const user = state.userProfiles.get(userId) || {};
    return user.contacts?.nickname || '';
  },
  getDisplayName: (state) => (userId) => {
    const user = state.userProfiles.get(userId) || {};
    // 优先级判定链
    return (
      user.baseInfo?.remark || // 联系人备注
      user.contacts?.nickname || // 基础昵称
      user.messageExt?.nickname || // 消息扩展昵称
      userId
    ); // 最终回退
  },
  getContactsDisplayNickName: (state) => (userId) => {
    const user = state.userProfiles.get(userId) || {};
    // 优先级判定链
    return (
      user.baseInfo?.remark || // 联系人昵称
      user.contacts?.nickname || // 消息扩展昵称
      userId
    ); // 最终回退
  },
  getContactsDisplayAvatarUrl: (state) => (userId) => {
    const user = state.userProfiles.get(userId) || {};
    // 优先级判定链
    return (
      user.contacts?.avatarurl || // 消息扩展头像
      defaultContactAvatar // 默认空值
    );
  },
  getAvatarUrl: (state) => (userId) => {
    const user = state.userProfiles.get(userId) || {};
    // 优先级判定链
    return (
      user.contacts?.avatarurl || // 联系人头像
      user.messageExt?.avatarURL || // 消息扩展头像
      defaultContactAvatar // 默认空值
    );
  },
  getGroupDisplayName: (state) => (userId, groupId) => {
    // 专为群组场景优化的获取方式
    const user = state.userProfiles.get(userId);
    return (
      user?.groupInfos?.get(groupId)?.nickName ||
      user?.baseInfo?.remark ||
      user?.contacts?.nickname ||
      user?.messageExt?.nickname ||
      userId
    );
  },
  getInTheGroupInfo: (state) => (userId, groupId) => {
    const user = state.userProfiles.get(userId);
    return user?.groupInfos?.get(groupId) || {};
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
