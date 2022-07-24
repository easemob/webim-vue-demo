import { ElMessage } from 'element-plus';
import EaseIM from '@/IM/initwebsdk';
const Groups = {
  state: {
    groupsInfos: {},
  },
  mutations: {
    SET_GORUPS_ADMINS: (state, payload) => {
      console.log('>>>>>开始赋值群组管理员', payload);
      const { groupId, admin } = payload;
      if (state.groupsInfos[groupId]) {
        state.groupsInfos[groupId].admin = admin;
      } else {
        state.groupsInfos[groupId] = {};
        state.groupsInfos[groupId].admin = admin;
      }
    },
    SET_GOUPS_MEMBERS: (state, payload) => {
      const { groupId, members } = payload;
      if (state.groupsInfos[groupId]) {
        state.groupsInfos[groupId].members = members;
      } else {
        state.groupsInfos[groupId] = {};
        state.groupsInfos[groupId].members = members;
      }
    },
    SET_GROUPS_BLIACK_LIST: (state, payload) => {
      const { groupId, blacklist } = payload;
      if (state.groupsInfos[groupId]) {
        state.groupsInfos[groupId].blacklist = blacklist;
      } else {
        state.groupsInfos[groupId] = {};
        state.groupsInfos[groupId].blacklist = blacklist;
      }
    },
    SET_GOUPS_MUTE_LIST: (state, payload) => {
      const { groupId, mutelist } = payload;
      if (state.groupsInfos[groupId]) {
        state.groupsInfos[groupId].mutelist = mutelist;
      } else {
        state.groupsInfos[groupId] = {};
        state.groupsInfos[groupId].mutelist = mutelist;
      }
    },
    SET_GOUPS_ANNOUN: (state, payload) => {
      const { groupId, announcement } = payload;
      if (state.groupsInfos[groupId]) {
        state.groupsInfos[groupId].announcement = announcement;
      } else {
        state.groupsInfos[groupId] = {};
        state.groupsInfos[groupId].announcement = announcement;
      }
    },
  },
  actions: {
    //初始群信息需要多个请求
    fetchMultiGoupsInfos: async ({ dispatch }, groupid) => {
      dispatch('fetchGoupsAdmin', groupid);
      dispatch('fetchAnnounment', groupid);
      dispatch('fetchGoupsBlackList', groupid);
      dispatch('fetchGoupsMember', groupid);
      //普通群成员无权调用禁言列表
      // dispatch('fetchGoupsMuteList', groupid);
    },
    //群管理员
    fetchGoupsAdmin: async ({ commit }, params) => {
      let { data } = await EaseIM.conn.getGroupAdmin({ groupId: params });
      commit('SET_GORUPS_ADMINS', { groupId: params, admin: data });
    },
    //群组成员
    fetchGoupsMember: async ({ dispatch, commit }, params) => {
      //暂时定死就获取1000个
      let pageNum = 1,
        pageSize = 1000;
      let options = {
        pageNum: pageNum,
        pageSize: pageSize,
        groupId: params,
      };
      let { data } = await EaseIM.conn.listGroupMembers(options);
      commit('SET_GOUPS_MEMBERS', { groupId: params, members: data });
    },
    //获取群公告
    fetchAnnounment: async ({ dispatch, commit }, params) => {
      let option = {
        groupId: params,
      };
      let { data } = await EaseIM.conn.fetchGroupAnnouncement(option);
      commit('SET_GOUPS_ANNOUN', {
        groupId: params,
        announcement: data.announcement,
      });
    },
    //群黑名单
    fetchGoupsBlackList: async ({ dispatch, commit }, params) => {
      let { data } = await EaseIM.conn.getGroupBlacklist({ groupId: params });
      commit('SET_GROUPS_BLIACK_LIST', { groupId: params, blacklist: data });
    },
    //群禁言列表
    fetchGoupsMuteList: async ({ dispatch, commit }, params) => {
      let { data } = await EaseIM.conn.getGroupMuteList({ groupId: params });
      commit('SET_GOUPS_MUTE_LIST', { groupId: params, mutelist: data });
    },
    // 修改群名或者群详情
    modifyGroupInfo: async ({ dispatch, commit }, params) => {
      const { groupid, modifyType, content } = params;
      //0 是修改群名
      if (modifyType === 0) {
        let option = {
          groupId: groupid,
          groupName: content,
        };
        await EaseIM.conn.modifyGroup(option);
        console.log('>>>>>>修改群组名称成功');
      }
      //1 是修改群详情
      if (modifyType === 1) {
        let option = {
          groupId: groupid,
          description: content,
        };
        await EaseIM.conn.modifyGroup(option);
      }
      //通知更新群详情
      dispatch('getAssignGroupDetail', groupid);
    },
    // 设置/修改群组公告
    modifyGroupAnnouncement: async ({ dispatch, commit }, params) => {
      await EaseIM.conn.updateGroupAnnouncement(params);
      dispatch('fetchAnnounment', params.groupId);
    },
    //邀请群成员
    inviteUserJoinTheGroup: async ({ dispatch, commit }, params) => {
      const { users, groupId } = params;
      try {
        await EaseIM.conn.inviteUsersToGroup({ users, groupId });
        ElMessage({
          message: '群组邀请成功送出~',
          type: 'success',
        });
        //通知更新群详情
        dispatch('getAssignGroupDetail', groupId);
        //更新群成员
        dispatch('fetchGoupsMember', groupId);
      } catch (error) {
        console.log('>>>>群组邀请失败', error);
        ElMessage({
          message: '群组邀请失败，请稍后重试~',
          type: 'error',
        });
      }
    },
    //移出群成员
    removeTheGroupMember: async ({ dispatch, commit }, params) => {
      const { username, groupId } = params;
      try {
        await EaseIM.conn.removeGroupMember({ username, groupId });
        ElMessage({
          message: `已将${username}移出群组!`,
          type: 'success',
        });
        //通知更新群详情
        dispatch('getAssignGroupDetail', groupId);
        //更新群成员
        dispatch('fetchGoupsMember', groupId);
      } catch (error) {
        ElMessage({
          message: `该群成员移出失败，请稍后重试！`,
          type: 'error',
        });
        console.log('<<>>>>>>>>移出失败', error);
      }
    },
  },
  getters: {},
};

export default Groups;
