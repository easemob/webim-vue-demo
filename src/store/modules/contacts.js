import EaseIM from '@/IM/initwebsdk';
import { useLocalStorage } from '@vueuse/core';
import _ from 'lodash';
const Contacts = {
  state: {
    friendList: [],
    groupList: useLocalStorage('groupList', {}),
  },
  mutations: {
    SET_FRIEND_LIST: (state, payload) => {
      state.friendList = _.assign([], payload);
    },
    SET_GROUP_LIST: (state, payload) => {
      state.groupList = _.assign({}, payload);
    },
  },
  actions: {
    fetchFriendList: async ({ commit }, params) => {
      let { data } = await EaseIM.conn.getContacts();
      let friendListData = data;
      commit('SET_FRIEND_LIST', friendListData);
    },
    fetchGroupList: async ({ commit }, params) => {
      let res = await EaseIM.conn.getJoinedGroups({
        ...params,
      });
      let goupListData = _.keyBy(res.data, 'groupid');
      console.log('>>>>>>处理后的数据', goupListData);
      commit('SET_GROUP_LIST', goupListData);
    },
  },
};

export default Contacts;
