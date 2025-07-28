import { ElMessage } from 'element-plus';
import { GROUP_OPERATION_TYPE, GROUP_ROLE_TYPE } from '@/IM/constant';
import { EMClient } from '@/IM';
const Groups = {
  state: {
    groupsInfos: {}, //计划废弃
    joinedGroup: {
      pagingParams: {
        pageNum: 0,
        pageSize: 20,
      },
      joinedGroupList: [],
      joinedGroupListTotal: 0,
    },
    groupDetails: new Map(), //key:groupId value:groupDetail
    groupMembers: new Map(), //key:groupId value:groupMemberList
  },
  mutations: {
    SET_JOINED_GROUP: (state, payload) => {
      const { total, entities: joinedGroupList } = payload;
      state.joinedGroup.pagingParams.pageNum++;
      state.joinedGroup.joinedGroupListTotal = total;
      state.joinedGroup.joinedGroupList = _.unionBy(
        [...joinedGroupList],
        [...state.joinedGroup.joinedGroupList],
        (g) => g.groupId,
      );
    },
    SET_GROUP_DETAILS: (state, payload) => {
      const { groupDetailsList } = payload;
      groupDetailsList.length > 0 &&
        groupDetailsList.forEach((groupDetail) => {
          state.groupDetails.set(groupDetail.id, groupDetail);
        });
    },
    SET_GROUPS_MEMBERS: (state, payload) => {
      const { groupId, members } = payload;
      state.groupMembers.set(groupId, [...members]);
      //同步更新群组列表里面的群人数
      if (state.joinedGroup.joinedGroupList.length) {
        state.joinedGroup.joinedGroupList.map((groupItem) => {
          if (groupItem.groupId === groupId) {
            groupItem.affiliationsCount = members.length;
          }
        });
      }
    },
    SET_GROUPS_BLIACK_LIST: (state, payload) => {
      const { groupId, blacklist } = payload;
      if (!state.groupDetails.has(groupId)) {
        state.groupDetails.set(groupId, { blacklist });
      }
      state.groupDetails.get(groupId).blacklist = blacklist;
    },
    SET_GROUPS_MUTE_LIST: (state, payload) => {
      const { groupId, mutelist } = payload;
      if (!state.groupDetails.has(groupId)) {
        state.groupDetails.set(groupId, { mutelist });
      }
      state.groupDetails.get(groupId).mutelist = mutelist;
    },
    SET_GROUPS_ANNOUN: (state, payload) => {
      const { groupId, announcement } = payload;
      if (!state.groupDetails.has(groupId)) {
        state.groupDetails.set(groupId, { announcement: announcement });
      }
      state.groupDetails.get(groupId).announcement = announcement;
    },
    //设置用户在群组中的群组属性
    SET_GROUP_MEMBERS_INFO: (state, payload) => {
      const { groupId, inGroupInfo } = payload;
      let groupMemberInfo = {};
      inGroupInfo.length > 0 &&
        inGroupInfo.map(
          (item) => (groupMemberInfo = Object.assign(groupMemberInfo, item)),
        );
      if (!state.groupDetails.has(groupId)) {
        state.groupDetails.set(groupId, { groupMemberInfo });
      }
      state.groupDetails.get(groupId).groupMemberInfo = groupMemberInfo;
    },
    //更新本地缓存群组信息
    UPDATE_CACHE_GROUP_INFO: (state, payload) => {
      const { groupId, type, params } = payload;
      console.log('>>>>>执行更新', payload);
      //更新群组列表内数据
      if (type === 'groupName') {
        state.joinedGroup.joinedGroupList.length > 0 &&
          state.joinedGroup.joinedGroupList.map((groupItem) => {
            if (groupItem.groupId === groupId) {
              return (groupItem.groupName = params);
            }
          });
        state.groupDetails.has(groupId) &&
          (state.groupDetails.get(groupId).name = params);
      }
      //更新群组详情内的数据
      if (type === 'groupDescription') {
        state.joinedGroup.joinedGroupList.length > 0 &&
          state.joinedGroup.joinedGroupList.map((groupItem) => {
            if (groupItem.groupId === groupId) {
              return (groupItem.description = params);
            }
          });
        state.groupDetails.has(groupId) &&
          (state.groupDetails.get(groupId).description = params);
      }
      //更新群成员数
      if (type === 'groupMemberCount') {
        state.joinedGroup.joinedGroupList.length > 0 &&
          state.joinedGroup.joinedGroupList.map((groupItem) => {
            return (groupItem.affiliationsCount = params);
          });
        state.groupDetails.has(groupId) &&
          (state.groupDetails.get(groupId).affiliations_count = params);
      }
    },
    //更新本地缓存群组成员
    UPDATE_GROUP_MEMBERS: (state, payload) => {
      const { groupId, member, type } = payload;
      switch (type) {
        case GROUP_OPERATION_TYPE.MEMBER_PRESENCE:
          {
            state.groupMembers.has(groupId) &&
              state.groupMembers.get(groupId).push({ member });
          }
          break;
        case GROUP_OPERATION_TYPE.MEMBER_ABSENCE:
          {
            if (
              state.groupMembers.has(groupId) &&
              state.groupMembers.get(groupId).length > 0
            ) {
              const _index = state.groupMembers
                .get(groupId)
                .findIndex((item) => item === member);
              state.groupMembers.get(groupId).splice(_index, 1);
            }
          }
          break;
        default:
          break;
      }
    },
    //更新群组管理员
    UPDATE_GORUPS_ADMIN: (state, payload) => {
      const { type, groupId, userId } = payload;
      state.joinedGroup.joinedGroupList.length > 0 &&
        state.joinedGroup.joinedGroupList.map((groupItem) => {
          if (groupItem.groupId === groupId) {
            if (type === GROUP_OPERATION_TYPE.SET_ADMIN) {
              return (groupItem.role = GROUP_ROLE_TYPE.ADMIN);
            } else if (type === GROUP_OPERATION_TYPE.REMOVE_ADMIN) {
              return (groupItem.role = GROUP_ROLE_TYPE.MEMBER);
            }
          }
        });
      if (type === GROUP_OPERATION_TYPE.SET_ADMIN) {
        state.groupDetails.has(groupId) &&
          (state.groupDetails.get(groupId).adminlist = [userId]);
      } else if (type === GROUP_OPERATION_TYPE.REMOVE_ADMIN) {
        if (
          state.groupDetails.has(groupId) &&
          state.groupDetails.get(groupId).adminlist?.length > 0
        ) {
          const _index = state.groupDetails
            .get(groupId)
            .adminlist.findIndex((item) => item === userId);
          state.groupDetails.get(groupId).adminlist.splice(_index, 1);
        }
      }
    },
    //删除缓存群组列表
    DELETE_JOINED_GROUP_LIST: (state, payload) => {
      const { groupId } = payload;
      if (state.joinedGroup.joinedGroupList.length > 0) {
        const _index = state.joinedGroup.joinedGroupList.findIndex(
          (item) => item.groupId === groupId,
        );
        state.joinedGroup.joinedGroupList.splice(_index, 1);
        state.joinedGroup.joinedGroupListTotal--;
      }
    },
  },
  actions: {
    //从服务端获取加入的群组列表
    fetchJoinedGroupListFromServer: async (
      { state, dispatch, commit },
      params = {},
    ) => {
      const {
        pagingParams: { pageNum, pageSize },
      } = state.joinedGroup;
      const { startPageNum } = params;
      try {
        const { total, entities } = await EMClient.getJoinedGroups({
          pageNum: startPageNum !== undefined ? startPageNum : pageNum,
          pageSize: pageSize,
          needAffiliations: true,
          needRole: true,
        });
        if (entities?.length === 0) return;
        commit('SET_JOINED_GROUP', { total, entities });
        const groupIds = _.map(entities, 'groupId');
        if (groupIds?.length === 0) return;
        dispatch('fetchGroupDetailFromServer', groupIds);
      } catch (error) {
        console.error('加入的群组列表获取失败', error);
      }
    },
    //从服务端获取群组详情
    fetchGroupDetailFromServer: async ({ commit }, groupIds = []) => {
      let groupDetails = [];
      async function fetchDetailsForGroupIds(groupIdArray) {
        try {
          const result = await EMClient.getGroupInfo({
            groupId: groupIdArray,
          });
          groupDetails = groupDetails.concat(result.data);
          commit('SET_GROUP_DETAILS', {
            groupDetailsList: groupDetails,
          });
        } catch (error) {
          console.error('>>>群详情获取失败', error);
          if (error?.data) {
            const { error_description } = JSON.parse(error.data);
            if (error_description.includes('do not find this group:')) {
              // 使用正则表达式截取不存在的群组ID
              const groupIdMatch = error_description.match(/group:(\d+)/);
              if (groupIdMatch) {
                const nonExistentGroupId = groupIdMatch[1];
                // 从groupIds数组中去除不存在的群组ID
                _.pull(groupIdArray, nonExistentGroupId);
                // 重新发起请求
                await fetchDetailsForGroupIds(groupIdArray);
              }
            } else {
              // 如果是其他类型的错误，可以在这里处理
              console.error('发生未知错误:', error);
            }
          }
        }
      }

      if (groupIds.length > 1) {
        const groupIdsArr = _.chunk([...groupIds], 20);
        for (const groupIdsChunk of groupIdsArr) {
          await fetchDetailsForGroupIds(groupIdsChunk);
        }
      } else {
        await fetchDetailsForGroupIds(groupIds);
      }
    },
    //获取群组成员
    fetchGroupsMemberFromServer: async ({ dispatch, commit }, groupId) => {
      console.log('>>>>>获取群组成员');
      //此接口支持分页，如果群组成员大于100人，需要分页获取,Demo仅展示获取100位群组成员。
      // 自 SDK 4.15.0 开始，所有群成员均可调用 getGroupMembers 方法获取群成员信息，包括用户 ID 和用户角色。原方法 listGroupMembers 废弃。
      const options = {
        pageNum: 1,
        pageSize: 100,
        groupId: groupId,
      };
      try {
        const { data } = await EMClient.listGroupMembers(options);
        /* 基于群组属性功能的调用，由于Demo演示其他端暂不展示群组内属性，此功能暂时注释 */
        // dispatch('fetchGroupMemberAttributesFromServer', {
        //   groupId,
        //   members: data,
        // });
        commit('SET_GROUPS_MEMBERS', {
          groupId: groupId,
          members: data,
        });
      } catch (error) {
        console.error('>>>>>群组成员获取失败', error);
      }
    },
    //获取登录用户在某群内的群组属性
    fetchInTheGroupInfoFromServer: async ({ dispatch, commit }, groupId) => {
      try {
        let options = {
          groupId: groupId,
          userId: EMClient.user,
        };
        const { data } = await EMClient.getGroupMemberAttributes(options);
        commit('SET_GROUP_MEMBERS_INFO', {
          groupId: groupId,
          inGroupInfo: [{ [EMClient.user]: { nickName: data.nickName } }],
        });
      } catch (error) {
        console.error('>>>>>群组属性获取失败', error);
      }
    },
    //批量获取群成员群内群组属性
    fetchGroupMemberAttributesFromServer: async (
      { dispatch, commit },
      params,
    ) => {
      const { groupId, members } = params;
      const membersList = _.chunk(members, 10);

      // 添加并发控制
      const MAX_CONCURRENT = 5;
      const queue = [];
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); // 新增延迟函数

      while (membersList.length) {
        const chunk = membersList.splice(0, MAX_CONCURRENT);
        const requests = chunk.map((list) =>
          EMClient.getGroupMembersAttributes({
            groupId,
            userIds: _.flatten(_.map(list, _.values)),
          }).catch((e) => {
            console.error('Partial request failed:', e);
            return null;
          }),
        );

        const results = await Promise.all(requests);
        queue.push(...results.filter(Boolean));

        // 添加间隔延迟（最后一个批次不等待）
        if (membersList.length > 0) {
          await delay(1000); // 每个并发批次间隔1秒
        }
      }

      if (queue.length > 0) {
        const groupUsersInfo = _.compact(_.flatMap(queue, 'data'));
        // 处理嵌套数据结构并提交到用户信息模块
        _.forEach(groupUsersInfo, (userObj) => {
          _.forEach(userObj, (info, userId) => {
            if (info?.nickName) {
              commit('UsersProfile/UPDATE_USER_PROFILE', {
                userId,
                sourceType: 'group',
                groupId: params.groupId,
                profile: { nickName: info.nickName },
              });
            }
          });
        });
      }
    },
    //设置登录用户在某群的群组属性
    setInTheGroupInfo: async ({ commit }, params) => {
      const { groupId, nickName } = params;
      try {
        await EMClient.setGroupMemberAttributes({
          groupId: groupId,
          userId: EMClient.user,
          memberAttributes: {
            nickName,
          },
        });
        //通知用户信息管理模块更新群内用户属性。
        commit('UsersProfile/UPDATE_USER_PROFILE', {
          userId: EMClient.user,
          sourceType: 'group',
          groupId: params.groupId,
          profile: { nickName: nickName },
        });
      } catch (error) {
        console.error(error);
      }
    },
    //获取群公告
    fetchAnnounmentFromServer: async ({ dispatch, commit }, groupId) => {
      const option = {
        groupId: groupId,
      };
      try {
        const { data } = await EMClient.fetchGroupAnnouncement(option);
        commit('SET_GROUPS_ANNOUN', {
          groupId: groupId,
          announcement: data.announcement,
        });
      } catch (error) {
        console.error('>>>>>群组公告获取失败', error);
      }
    },
    //群黑名单
    fetchGroupsBlackListFromServer: async ({ commit }, groupId) => {
      try {
        const { data } = await EMClient.getGroupBlocklist({
          groupId: groupId,
        });
        commit('SET_GROUPS_BLIACK_LIST', {
          groupId: groupId,
          blacklist: data,
        });
      } catch (error) {
        console.error(error);
      }
    },
    //群禁言列表
    fetchGroupsMuteListFromServer: async ({ dispatch, commit }, params) => {
      try {
        const { data } = await EMClient.getGroupMuteList({
          groupId: params,
        });
        commit('SET_GROUPS_MUTE_LIST', {
          groupId: params,
          mutelist: data,
        });
      } catch (error) {
        console.error(error);
      }
    },
    // 修改群名或者群描述
    modifyGroupInfo: async ({ dispatch, commit }, params) => {
      const { groupId, modifyType, content } = params;
      //0 是修改群名
      if (modifyType === 0) {
        const option = {
          groupId: groupId,
          groupName: content,
        };
        await EMClient.modifyGroup(option);
        //更新本地缓存数据
        commit('UPDATE_CACHE_GROUP_INFO', {
          groupId: groupId,
          type: 'groupName',
          params: content,
        });
      }
      //1 是修改群详情
      if (modifyType === 1) {
        const option = {
          groupId: groupId,
          description: content,
        };
        await EMClient.modifyGroup(option);
        //更新本地缓存数据
        commit('UPDATE_CACHE_GROUP_INFO', {
          groupId: groupId,
          type: 'groupDescription',
          params: content,
        });
      }
    },
    // 设置/修改群组公告
    modifyGroupAnnouncement: async ({ dispatch }, params) => {
      //SDK入参属性名是确定的此示例直接将属性名改为了SDK所识别的参数如果修改，具体请看文档。
      const { groupId, announcement } = params;
      try {
        await EMClient.updateGroupAnnouncement({ ...params });
        dispatch('fetchAnnounmentFromServer', groupId);
      } catch (error) {
        console.error('群公告修改失败', error);
      }
    },
    //邀请群成员
    inviteUserJoinTheGroup: async ({ dispatch }, params) => {
      //SDK入参属性名是确定的此示例直接将属性名改为了SDK所识别的参数如果修改，具体请看文档。
      const { users, groupId } = params;
      try {
        await EMClient.inviteUsersToGroup({ users: [users], groupId });
        ElMessage({
          message: '群组邀请成功送出~',
          type: 'success',
        });
      } catch (error) {
        console.log('>>>>邀请失败', error);
        ElMessage({
          message: '群组邀请失败，请稍后重试~',
          type: 'error',
        });
      }
    },
    //移出群成员
    removeTheGroupMember: async ({ dispatch }, params) => {
      //SDK入参属性名是确定的此示例直接将属性名改为了SDK所识别的参数如果修改，具体请看文档。
      const { username, groupId } = params;
      try {
        await EMClient.removeGroupMember({ username, groupId });
        ElMessage({
          message: `已将${username}移出群组!`,
          type: 'success',
        });
        //更新群成员
        dispatch('fetchGroupsMemberFromServer', groupId);
      } catch (error) {
        ElMessage({
          message: '该群成员移出失败，请稍后重试！',
          type: 'error',
        });
      }
    },
    //添加用户到黑名单
    addMemberToBlackList: async ({ dispatch }, params) => {
      const { groupId, usernames } = params;
      try {
        //SDK入参属性名是确定的此示例直接将属性名改为了SDK所识别的参数如果修改，具体请看文档。
        //   let option = {
        //     groupId: "groupId",
        //     usernames: ["user1", "user2"]
        // };
        await EMClient.blockGroupMembers({ groupId, usernames });
        ElMessage({
          message: '黑名单添加成功~',
          type: 'success',
        });
        //重新获取黑名单列表
        dispatch('fetchGroupsBlackListFromServer', groupId);
        //重新获取成员列表
        dispatch('fetchGroupsMemberFromServer', groupId);
      } catch (error) {
        ElMessage({
          message: '黑名单添加失败，请稍后重试~',
          type: 'error',
        });
      }
    },
    //从黑名单中移出
    removeTheMemberFromBlackList: async ({ dispatch }, params) => {
      const { groupId, usernames } = params;
      try {
        await EMClient.unblockGroupMembers({ groupId, usernames });
        ElMessage({
          message: '黑名单移除成功~',
          type: 'success',
        });
        //重新获取黑名单列表
        dispatch('fetchGroupsBlackListFromServer', groupId);
      } catch (error) {
        console.log('error', error);
        ElMessage({
          message: '黑名单移除失败，请稍后重试~',
          type: 'error',
        });
      }
    },
    //添加用户到禁言列表
    addMemberToMuteList: async ({ dispatch }, params) => {
      const { groupId, username } = params;

      try {
        await EMClient.muteGroupMember({
          groupId,
          username: username,
          muteDuration: 886400000,
        });
        ElMessage({
          message: '禁言成功~',
          type: 'success',
        });
        setTimeout(() => {
          dispatch('fetchGroupsMuteListFromServer', groupId);
        }, 800);
      } catch (error) {
        console.log('>>>>>error', error);
        ElMessage({
          message: '禁言失败，请稍后重试~',
          type: 'error',
        });
      }

      // let option = {
      //   groupId: 'groupId',
      //   username: 'user',
      //   muteDuration: 886400000, // 禁言时长，单位为毫秒。
      // };
      // await EMClient.muteGroupMember(option);
    },
    //从禁言列表中移出
    removeTheMemberFromMuteList: async ({ dispatch }, params) => {
      const { groupId, username } = params;
      try {
        await EMClient.unmuteGroupMember({
          groupId,
          username: username,
        });
        ElMessage({
          message: '移除禁言成功~',
          type: 'success',
        });
        setTimeout(() => {
          dispatch('fetchGroupsMuteListFromServer', groupId);
        }, 800);
      } catch (error) {
        console.log('>>>>>error', error);
        ElMessage({
          message: '移除禁言失败，请稍后重试~',
          type: 'error',
        });
      }
    },
    //退出群组
    leaveIntheGroup: async ({ commit }, params) => {
      if (!params.groupId) return;
      const { groupId } = params;
      return new Promise((resolve, reject) => {
        EMClient.leaveGroup({
          groupId: groupId,
        })
          .then((res) => {
            commit('DELETE_JOINED_GROUP_LIST', {
              groupId: groupId,
            });
            resolve(res);
          })
          .catch((err) => {
            reject(err);
          });
      });
    },
    //解散群组
    destroyInTheGroup: async ({ commit }, params) => {
      if (!params.groupId) return;
      const { groupId } = params;
      return new Promise((resolve, reject) => {
        const option = {
          groupId: groupId,
        };
        EMClient.destroyGroup(option)
          .then((res) => {
            resolve(res);
            commit('DELETE_JOINED_GROUP_LIST', {
              groupId: groupId,
            });
          })
          .catch((err) => {
            reject(err);
          });
      });
    },
  },
  getters: {
    getGroupDetailMap: (state) => state.groupDetails,
    getGroupMembersMap: (state) => state.groupMembers,
    getJoinedGroupList: (state) => state.joinedGroup.joinedGroupList,
    getJoinedGroupTotal: (state) => state.joinedGroup.joinedGroupListTotal,
    //获取加入的群组名
    getGroupName: (state) => (groupId) => {
      const group = state.joinedGroup.joinedGroupList.find(
        (item) => item.groupId === groupId,
      );
      const groupInfo = state.groupDetails.get(groupId) || {};
      return group?.groupName || groupInfo?.name || groupId;
    },
  },
};

export default Groups;
