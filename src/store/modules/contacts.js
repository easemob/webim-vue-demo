import { getCurrentUserId, requireManager } from '@/IM';
// import { useLocalStorage } from '@vueuse/core';
import { sortPinyinFriendItem, handlePresence } from '@/utils/handleSomeData';
import _ from 'lodash';
import { userProfileUtils, SOURCE_TYPE } from './usersProfile';

const contactManager = () => requireManager('contactManager');
const presenceManager = () => requireManager('presenceManager');
const userInfoManager = () => requireManager('userInfoManager');

const Contacts = {
  state: {
    contactsWithRemarkMap: new Map(),
    contactsUserInfosMap: new Map(),
    contactsUsersPresenceMap: new Map(),
    subscribedPresenceList: [],
    friendBlackList: [],
  },
  mutations: {
    SET_FRIEND_LIST: (state, payload) => {
      state.friendList = _.assign({}, payload);
    },
    SET_ADD_NEW_FRIEND: (state, payload) => {
      state.friendList = _.assign(state.friendList, payload);
    },
    SET_FRIEND_LIST_WITH_REMARK: (state, payload) => {
      const { friendList } = payload;
      const toObj = _.keyBy(friendList, 'userId');
      const toMap = new Map(Object.entries(toObj));
      state.contactsWithRemarkMap = toMap;
    },
    SET_FRIEND_LIST_USER_INFOS: function (state, payload) {
      const { userInfos } = payload;
      const userInfosToMap = new Map(Object.entries(userInfos));
      if (state.contactsUserInfosMap.size === 0) {
        state.contactsUserInfosMap = userInfosToMap;
      } else {
        state.contactsUserInfosMap = new Map([
          ...state.contactsUserInfosMap,
          ...userInfosToMap,
        ]);
      }
    },
    DELETE_CONTACTS_FROM_MAP: (state, payload) => {
      state.contactsWithRemarkMap.has(payload) &&
        state.contactsWithRemarkMap.delete(payload);
      state.contactsUserInfosMap.has(payload) &&
        state.contactsUserInfosMap.delete(payload);
    },
    SET_BLACK_LIST: (state, payload) => {
      state.friendBlackList = _.assign([], payload);
    },
    SET_SUBSCRIBED_PRESENCE_LIST: (state, payload) => {
      state.subscribedPresenceList = _.assign([], payload);
    },
    SET_CONTACTS_PRESENCE_TO_MAP: (state, usersPresenceList) => {
      usersPresenceList.length > 0 &&
        usersPresenceList.forEach((presenceItem) => {
          const commonStatus = handlePresence(presenceItem);
          const mapKey = commonStatus.uid;
          if (mapKey) {
            state.contactsUsersPresenceMap.set(mapKey, commonStatus);
          }
        });
    },
    DELETE_CONTACTS_PRESENCE_TO_MAP: (state, payload) => {
      state.contactsUsersPresenceMap.has(payload) &&
        state.contactsUsersPresenceMap.delete(payload);
    },
    SET_CONTACTS_REMARK_TO_MAP: (state, payload) => {
      const { userId, remark } = payload;
      state.contactsWithRemarkMap.set(userId, {
        userId,
        remark,
      });
    },
    ADD_NEW_CONTACT: (state, payload) => {
      state.contactsWithRemarkMap.set(payload.userId, payload);
    },
  },
  actions: {
    //获取好友列表
    fetchAllFriendListFromServer: async ({ dispatch, commit }) => {
      try {
        const contacts = contactManager().getContacts();
        const userIds = contacts.map((item) => item.userId);
        const friendListData = {};
        contacts.forEach(({ userId, userInfo, remark }) => {
          friendListData[userId] = { hxId: userId, ...userInfo, remark };
        });
        //获取好友列表对应的用户属性
        const friendListWithInfos = await dispatch('getOtherUserInfo', userIds);
        //合并两对象
        const mergedFriendList = _.merge(friendListData, friendListWithInfos);
        commit('SET_FRIEND_LIST', mergedFriendList);
        //提交之后订阅好友状态
        userIds.length > 0 && dispatch('subFriendsPresence', userIds);
        console.log('[Contacts] getContacts success', {
          count: contacts.length,
          currentUser: getCurrentUserId(),
          contacts,
        });
      } catch (error) {
        console.error('获取好友列表失败', error);
        throw error;
      }
    },
    //获取全部好友列表（包含好友备注）
    fetchAllContactsListWithRemarkFromServer: async ({ dispatch, commit }) => {
      try {
        const contacts = contactManager().getContacts();
        commit('SET_FRIEND_LIST_WITH_REMARK', {
          friendList: contacts,
        });
        if (contacts.length > 0) {
          const normalizedContacts = contacts.map(({ userId, remark, userInfo }) => ({
            userId,
            remark,
            ...userInfo,
            sourceType: SOURCE_TYPE.CONTACT,
          }));
          commit('UsersProfile/MERGE_USER_PROFILES', normalizedContacts, {
            root: true,
          });
          
          const userIds = contacts.map((item) => item.userId);
          if (userIds?.length > 0) {
            dispatch('fetchContactsUserInfos', userIds);
            // 登录后批量订阅好友在线状态，之后对方 publishPresence / 上下线会触发 onPresenceStatusChange
            dispatch('subFriendsPresence', userIds);
          }
        }
        console.log('[Contacts] getAllContacts success', {
          count: contacts.length,
          currentUser: getCurrentUserId(),
          contacts,
        });
      } catch (error) {
        console.error('好友列表获取失败', error);
        throw error;
      }
    },
    // SDK roster events have already patched the ContactManager snapshot.
    syncContactsFromSdkSnapshot: async ({ dispatch }) => {
      await dispatch('fetchAllContactsListWithRemarkFromServer');
    },
    //新增联系人
    onAddNewContact: async ({ dispatch, commit }, params) => {
      const { from: userId } = params;
      const newContactParams = {
        userId,
        remark: '',
      };
      commit('ADD_NEW_CONTACT', newContactParams);
      dispatch('fetchContactsUserInfos', [userId]);
      dispatch('subFriendsPresence', [userId]);
    },
    //好友关系解除
    onDeleteContact: async ({ dispatch, commit }, params) => {
      //取消订阅好友状态。
      const { from: userId } = params;
      dispatch('unsubFriendsPresence', userId);
      //从本地好友列表中删除此好友
      commit('DELETE_CONTACTS_FROM_MAP', userId);
    },
    //获取黑名单列表
    fetchBlackList: async ({ commit }) => {
      try {
        const users = await contactManager().getBlocklist();
        commit('SET_BLACK_LIST', users.map((item) => item.userId));
      } catch (error) {
        console.error('获取黑名单列表失败', error);
      }
    },
    //获取联系人用户属性
    fetchContactsUserInfos: async ({ commit }, users) => {
      /**
       * @param {String|Array} users - 用户id
       */
      let usersInfosObj = {};
      const requestTask = [];
      const usersArr = _.chunk([...users], 99); //分拆users 用户属性获取一次不能超过100个
      try {
        usersArr.length > 0 &&
          usersArr.map((userItem) =>
            requestTask.push(
              userInfoManager().getUserInfoByUserId({ userIds: userItem }),
            ),
          );
        const result = await Promise.all(requestTask);
        const usersInfos = _.flatten(result);
        usersInfos.forEach((item) => {
          usersInfosObj[item.userId] = item;
        });

        commit('SET_FRIEND_LIST_USER_INFOS', {
          userInfos: usersInfosObj,
        });
        const normalizedContacts = userProfileUtils.normalizeUserData(
          SOURCE_TYPE.CONTACT,
        )(usersInfosObj);
        commit('UsersProfile/MERGE_USER_PROFILES', normalizedContacts, {
          root: true,
        });
      } catch (error) {
        console.error('>>>获取联系人用户属性失败', error);
      }
    },
    //订阅好友的在线状态
    subFriendsPresence: async ({ commit }, users) => {
      const requestTask = [];
      const usersArr = _.chunk([...users], 100); //分拆users 订阅好友状态一次不能超过100个
      try {
        usersArr.length > 0 &&
          usersArr.map((userItem) =>
            requestTask.push(
              presenceManager().subscribePresence({
                userIds: userItem,
                expiry: 30 * 24 * 3600,
              }),
            ),
          );
        const resultData = await Promise.all(requestTask);
        const usersPresenceList = _.flatten(resultData);
        const list =
          usersPresenceList.length > 0
            ? usersPresenceList.filter((p) => p.publisher !== '')
            : [];
        if (list.length > 0) {
          commit('SET_CONTACTS_PRESENCE_TO_MAP', list);
        }
        console.log('[环信 Presence] subscribePresence 已请求', {
          userIds: users,
          snapshotCount: list.length,
          snapshot: list,
        });
      } catch (error) {
        console.error('[环信 Presence] subscribePresence 失败', error);
      }
    },
    //取消订阅
    unsubFriendsPresence: async ({ commit }, user) => {
      try {
        await presenceManager().unsubscribePresence({ userIds: [user] });
        commit('DELETE_CONTACTS_PRESENCE_TO_MAP', user);
      } catch (error) {
        console.error('取消订阅好友状态失败', error);
      }
    },
    //查询已订阅用户列表
    fetchSubscribedPresenceList: async (
      { commit },
      option = { pageNum: 0, pageSize: 50 },
    ) => {
      try {
        const list = await presenceManager().getSubscribedPresenceList(option);
        commit('SET_SUBSCRIBED_PRESENCE_LIST', list);
        return list;
      } catch (error) {
        console.error('[环信 Presence] getSubscribedPresenceList 失败', error);
        throw error;
      }
    },
    //主动查询指定用户当前在线状态
    fetchPresenceStatusByUsers: async ({ commit }, users = []) => {
      try {
        const userIds = Array.isArray(users) ? users : [users];
        if (userIds.length === 0) return [];
        const list = await presenceManager().getPresenceStatus({ userIds });
        if (list.length > 0) {
          commit('SET_CONTACTS_PRESENCE_TO_MAP', list);
        }
        return list.map((item) => handlePresence(item));
      } catch (error) {
        console.error('[环信 Presence] getPresenceStatus 失败', error);
        throw error;
      }
    },
    //设置联系人备注
    setContactsRemark: async ({ commit }, params) => {
      const { userId, remark } = params;
      if (!userId || typeof remark !== 'string') {
        throw new Error('userId and remark are required');
      }
      try {
        const result = await contactManager().setContactRemark({
          userId, // 添加备注的目标好友的用户 ID
          remark, // 好友备注
        });
        commit('SET_CONTACTS_REMARK_TO_MAP', { userId, remark });
        commit(
          'UsersProfile/UPDATE_USER_PROFILE',
          {
            userId,
            sourceType: SOURCE_TYPE.BASE,
            profile: {
              remark,
            },
          },
          { root: true },
        );
        return result;
      } catch (error) {
        console.error('设置联系人备注失败', error);
        throw error;
      }
    },
  },
  getters: {
    //返回排序后的好友列表
    //legacy
    sortedFriendList: (state) => {
      return sortPinyinFriendItem(state.friendList);
    },
    //获取基础好友列表 //legacy
    getFriendList: (state) => {
      return state.friendList;
    },
    getContactsUserInfosMap: (state) => {
      return state.contactsUserInfosMap;
    },
    getContactsWithRemarkMap: (state) => {
      return state.contactsWithRemarkMap;
    },
    getContactsUsersPresenceMap: (state) => {
      return state.contactsUsersPresenceMap;
    },
    getSubscribedPresenceList: (state) => {
      return state.subscribedPresenceList;
    },
  },
};

export default Contacts;
