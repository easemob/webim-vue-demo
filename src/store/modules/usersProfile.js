import { setMessageKey } from '@/utils/handleSomeData';
import defaultContactAvatar from '@/assets/images/avatar/theme2x.png';
import defaultGroupAvatar from '@/assets/images/avatar/jiaqun2x.png';
export const SOURCE_TYPE = {
  BASE: 'base',
  CONTACT: 'contact',
  GROUP: 'group',
  MESSAGE: 'message',
};
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
const generateMsgHash = (msg) => {
  const info = msg?.ext?.ease_chat_uikit_user_info || {};
  return [info.nickname || '', info.avatarURL || ''].join('|');
};

// 在模块导出中暴露该方法
export const userProfileUtils = {
  normalizeUserData,
  generateMsgHash,
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
});
const mutations = {
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
  UPDATE_MESSAGE_EXT(state, { userId, msg }) {
    const userProfile = state.userProfiles.get(userId) || {
      baseInfo: {},
      contacts: {},
      groupInfos: new Map(),
      messageExt: {},
      _meta: { lastMessageHash: '', lastMessageTimestamp: msg?.time },
    };
    const newHash = generateMsgHash(msg);
    // 哈希值相同则跳过更新
    if (newHash === userProfile._meta.lastMessageHash) return;
    const extInfo = msg.ext?.ease_chat_uikit_user_info || {};
    userProfile.messageExt = {
      nickname: extInfo.nickname,
      avatarURL: extInfo.avatarURL,
    };
    userProfile._meta.lastMessageHash = newHash;
    state.userProfiles.set(userId, userProfile);
  },
};
const actions = {
  processMessageExt({ commit, state }, msg) {
    console.log('>>>>>处理消息扩展', msg);
    if (Array.isArray(msg)) {
      msg.map((msgItem, idx) => {
        try {
          const userId = msgItem?.from;
          const userMeta = state.userProfiles.get(userId)?._meta ?? {};
          const currentHash = userMeta.lastMessageHash ?? '';
          const currentMsgTime = userMeta.lastMessageTimestamp ?? 0;
          const newHash = generateMsgHash(msgItem);
          if (
            newHash !== '' &&
            newHash !== currentHash &&
            msgItem.time > currentMsgTime
          ) {
            commit('UPDATE_MESSAGE_EXT', { userId, msg: msgItem });
          }
        } catch (e) {
          console.log(`第 ${idx} 条消息处理异常`, e, msgItem);
        }
      });
      return;
    }
    const userId = msg?.from;
    if (!userId) return;
    const currentHash =
      state.userProfiles.get(userId)?._meta?.lastMessageHash || '';
    const currentMsgTime =
      state.userProfiles.get(userId)?._meta?.lastMessageTimestamp || 0;
    const newHash = generateMsgHash(msg);
    // 哈希值不同时且消息晚于更新过的消息才提交更新
    if (
      newHash !== currentHash &&
      newHash !== '' &&
      msg.time > currentMsgTime
    ) {
      commit('UPDATE_MESSAGE_EXT', { userId, msg });
    }
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
      user?.groupInfos.get(groupId)?.nickName ||
      user?.baseInfo?.remark ||
      user?.contacts?.nickname ||
      user?.messageExt?.nickname ||
      userId
    );
  },
  getInTheGroupInfo: (state) => (userId, groupId) => {
    const user = state.userProfiles.get(userId);
    return user?.groupInfos.get(groupId) || {};
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
