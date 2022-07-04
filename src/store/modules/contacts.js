import EaseIM from '@/IM/initwebsdk';
import { useLocalStorage } from '@vueuse/core';
import _ from 'lodash';
const Contacts = {
  state: {
    friendList: useLocalStorage('friendList', {}),
    groupList: useLocalStorage('groupList', {}),
  },
  mutations: {
    SET_FRIEND_LIST: (state, payload) => {
      state.friendList = _.assign({}, payload);
    },
    SET_GROUP_LIST: (state, payload) => {
      //init 为初始化获取 replenish 补充群列表（包括补充群详情）
      const { setType, data } = payload;
      if (setType === 'init') {
        state.groupList = _.assign({}, data);
      }
      if (setType === 'replenish') {
        const { id, name, disabled } = data;
        if (state.groupList[id]) {
          state.groupList[id].groupDetail = data;
        } else {
          state.groupList[id] = {
            groupid: id,
            groupname: name,
            disabled: disabled,
            groupDetail: data,
          };
        }
        console.log('>>>>>补充群详情', data);
      }
    },
  },
  actions: {
    //获取好友列表
    fetchFriendList: async ({ dispatch, commit }, params) => {
      let friendListData = {};
      try {
        //获取好友列表
        let { data } = await EaseIM.conn.getContacts();
        data.length > 0 &&
          data.map((item) => (friendListData[item] = { hxId: item }));
        //获取好友列表对应的用户属性
        let friendListWithInfos = await dispatch('getOtherUserInfo', data);
        //合并两对象
        let mergedFriendList = _.merge(friendListData, friendListWithInfos);
        commit('SET_FRIEND_LIST', mergedFriendList);
      } catch (error) {
        //异常一般为获取会话异常，直接提交好友列表
        commit('SET_FRIEND_LIST', friendListData);
      }
    },
    //获取他人用户属性
    getOtherUserInfo: async ({ commit }, users) => {
      /**
       * @param {String|Array} users - 用户id
       */

      return new Promise(async (resolve, reject) => {
        let usersInfosObj = {};
        let requestTask = [];
        let usersArr = _.chunk([...users], 99); //分拆users 用户属性获取一次不能超过100个
        try {
          usersArr.length > 0 &&
            usersArr.map((userItem) =>
              requestTask.push(EaseIM.conn.fetchUserInfoById(userItem))
            );
          let result = await Promise.all(requestTask);
          let usersInfos = _.map(result, 'data');
          usersInfos.length > 0 &&
            usersInfos.map(
              (item) => (usersInfosObj = Object.assign(usersInfosObj, item))
            );
          console.log('usersInfosObj', usersInfosObj);
          resolve(usersInfosObj);
        } catch (error) {
          reject(error);
        }
      });
    },
    //获取群组列表
    fetchGroupList: async ({ commit }, params) => {
      let res = await EaseIM.conn.getJoinedGroups({
        ...params,
      });
      let goupListData = _.keyBy(res.data, 'groupid');
      console.log('>>>>>>处理后的数据', goupListData);
      commit('SET_GROUP_LIST', { setType: 'init', data: goupListData });
    },
    //获取指定群详情
    getAssignGroupDetail: async ({ commit }, goupsId) => {
      let options = {
        groupId: goupsId, // 群组id
      };
      let result = await EaseIM.conn.getGroupInfo(options);
      // console.log('>>>>>>>群详情获取成功result', result);
      result.data &&
        commit('SET_GROUP_LIST', {
          setType: 'replenish',
          data: result.data[0],
        });
    },
  },
};

export default Contacts;
