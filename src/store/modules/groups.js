import { ElMessage } from 'element-plus';
import {
  CHAT_TYPE,
  GROUP_OPERATION_TYPE,
  GROUP_ROLE_TYPE,
} from '@/IM/constant';
import { getCurrentUserId, requireManager } from '@/IM';
import {
  DEFAULT_GROUP_MEMBERS_PAGE_SIZE,
  buildModifyGroupPayload,
  normalizeFetchedGroupMembers,
  getNextJoinedGroupsPage,
  normalizeGroupSharedFileList,
} from '@/utils/groupDocAdapters';
const groupManager = () => requireManager('groupManager');
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
      publicPagingCursor: '',
      publicGroupList: [],
      publicGroupListTotal: 0,
      joinedGroupCount: 0,
    },
    groupDetails: new Map(), //key:groupId value:groupDetail
    groupMembers: new Map(), //key:groupId value:groupMemberList
    groupSharedFiles: new Map(), //key:groupId value:sharedFileList
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
      state.joinedGroup.joinedGroupCount = total;
    },
    RESET_JOINED_GROUP_LIST: (state, payload = {}) => {
      const { pageNum = 0 } = payload;
      state.joinedGroup.pagingParams.pageNum = pageNum;
      state.joinedGroup.joinedGroupList = [];
      state.joinedGroup.joinedGroupListTotal = 0;
    },
    SET_JOINED_GROUP_COUNT: (state, total) => {
      state.joinedGroup.joinedGroupCount = Number(total || 0);
    },
    SET_PUBLIC_GROUPS: (state, payload) => {
      const { cursor = '', entities = [], isInit = false } = payload;
      state.joinedGroup.publicPagingCursor = cursor;
      state.joinedGroup.publicGroupList = isInit
        ? [...entities]
        : _.unionBy(
            [...state.joinedGroup.publicGroupList],
            [...entities],
            (group) => group.groupid,
          );
      state.joinedGroup.publicGroupListTotal =
        state.joinedGroup.publicGroupList.length;
    },
    UPDATE_GROUP_SHIELD_STATUS: (state, payload) => {
      const { groupId, shieldgroup } = payload;
      state.joinedGroup.joinedGroupList.forEach((groupItem) => {
        if (groupItem.groupId === groupId) {
          groupItem.shieldgroup = Boolean(shieldgroup);
        }
      });
      if (!state.groupDetails.has(groupId)) {
        state.groupDetails.set(groupId, { shieldgroup: Boolean(shieldgroup) });
      } else {
        state.groupDetails.get(groupId).shieldgroup = Boolean(shieldgroup);
      }
    },
    SET_GROUP_DETAILS: (state, payload) => {
      const { groupDetailsList } = payload;
      groupDetailsList.length > 0 &&
        groupDetailsList.forEach((groupDetail) => {
          state.groupDetails.set(groupDetail.groupId, groupDetail);
        });
    },
    SET_GROUPS_MEMBERS: (state, payload) => {
      const { groupId, members } = payload;
      state.groupMembers.set(groupId, [...members]);
      //同步更新群组列表里面的群人数
      if (state.joinedGroup.joinedGroupList.length) {
        state.joinedGroup.joinedGroupList.forEach((groupItem) => {
          if (groupItem.groupId === groupId) {
            groupItem.memberCount = members.length;
          }
        });
      }
    },
    SET_GROUPS_BLIACK_LIST: (state, payload) => {
      const { groupId, blacklist } = payload;
      const normalizedBlacklist = (blacklist || []).map((entry) => entry?.user?.userId).filter(Boolean);
      if (!state.groupDetails.has(groupId)) {
        state.groupDetails.set(groupId, { blacklist: normalizedBlacklist });
      }
      state.groupDetails.get(groupId).blacklist = normalizedBlacklist;
    },
    SET_GROUPS_MUTE_LIST: (state, payload) => {
      const { groupId, mutelist } = payload;
      const normalizedMutelist = (mutelist || []).map((item) => ({
        userId: item.user.userId,
        muteExpire: item.muteExpire,
        muteDuration: item.muteDuration,
      }));
      if (!state.groupDetails.has(groupId)) {
        state.groupDetails.set(groupId, { mutelist: normalizedMutelist });
      }
      state.groupDetails.get(groupId).mutelist = normalizedMutelist;
    },
    SET_GROUPS_ANNOUN: (state, payload) => {
      const { groupId, announcement } = payload;
      if (!state.groupDetails.has(groupId)) {
        state.groupDetails.set(groupId, { announcement: announcement });
      }
      state.groupDetails.get(groupId).announcement = announcement;
    },
    SET_GROUP_SHARED_FILES: (state, payload) => {
      const { groupId, files } = payload;
      state.groupSharedFiles.set(groupId, [...files]);
    },
    //设置用户在群组中的群组属性
    SET_GROUP_MEMBERS_INFO: (state, payload) => {
      const { groupId, inGroupInfo } = payload;
      let groupMemberInfo = {};
      inGroupInfo.length > 0 &&
        inGroupInfo.forEach(
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
      //更新群组列表内数据
      if (type === 'name') {
        state.joinedGroup.joinedGroupList.length > 0 &&
          state.joinedGroup.joinedGroupList.forEach((groupItem) => {
            if (groupItem.groupId === groupId) {
              groupItem.name = params;
            }
          });
        state.groupDetails.has(groupId) &&
          (state.groupDetails.get(groupId).name = params);
      }
      //更新群组详情内的数据
      if (type === 'groupDescription') {
        state.joinedGroup.joinedGroupList.length > 0 &&
          state.joinedGroup.joinedGroupList.forEach((groupItem) => {
            if (groupItem.groupId === groupId) {
              groupItem.description = params;
            }
          });
        state.groupDetails.has(groupId) &&
          (state.groupDetails.get(groupId).description = params);
      }
      if (type === 'groupAvatar') {
        state.joinedGroup.joinedGroupList.length > 0 &&
          state.joinedGroup.joinedGroupList.forEach((groupItem) => {
            if (groupItem.groupId === groupId) {
              groupItem.avatarUrl = params;
            }
          });
        state.groupDetails.has(groupId) &&
          (state.groupDetails.get(groupId).avatarUrl = params);
      }
      if (type === 'groupExt') {
        state.joinedGroup.joinedGroupList.length > 0 &&
          state.joinedGroup.joinedGroupList.forEach((groupItem) => {
            if (groupItem.groupId === groupId) {
              groupItem.ext = params;
            }
          });
        if (state.groupDetails.has(groupId)) {
          state.groupDetails.get(groupId).ext = params;
          state.groupDetails.get(groupId).custom = params;
        }
      }
      //更新群成员数
      if (type === 'groupMemberCount') {
        state.joinedGroup.joinedGroupList.length > 0 &&
          state.joinedGroup.joinedGroupList.forEach((groupItem) => {
            if (groupItem.groupId === groupId) {
              groupItem.memberCount = params;
            }
          });
        state.groupDetails.has(groupId) &&
          (state.groupDetails.get(groupId).memberCount = params);
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
                .findIndex(
                  (item) =>
                    (item.member || item.owner || item.userId) === member,
                );
              if (_index > -1) {
                state.groupMembers.get(groupId).splice(_index, 1);
              }
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
        state.joinedGroup.joinedGroupList.forEach((groupItem) => {
          if (groupItem.groupId === groupId && userId === getCurrentUserId()) {
            if (type === GROUP_OPERATION_TYPE.SET_ADMIN) {
              groupItem.role = GROUP_ROLE_TYPE.ADMIN;
            } else if (type === GROUP_OPERATION_TYPE.REMOVE_ADMIN) {
              groupItem.role = GROUP_ROLE_TYPE.MEMBER;
            }
          }
        });
      if (type === GROUP_OPERATION_TYPE.SET_ADMIN) {
        if (state.groupDetails.has(groupId)) {
          const adminlist = state.groupDetails.get(groupId).adminlist || [];
          if (!adminlist.includes(userId)) {
            state.groupDetails.get(groupId).adminlist = [...adminlist, userId];
          }
        }
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
        if (_index > -1) {
          state.joinedGroup.joinedGroupList.splice(_index, 1);
          state.joinedGroup.joinedGroupListTotal = Math.max(
            state.joinedGroup.joinedGroupListTotal - 1,
            0,
          );
          state.joinedGroup.joinedGroupCount = Math.max(
            state.joinedGroup.joinedGroupCount - 1,
            0,
          );
        }
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
        pagingParams: { pageSize },
      } = state.joinedGroup;
      const { startPageNum, reset = false } = params;
      try {
        const shouldReset = reset || startPageNum === 0;
        if (shouldReset) {
          commit('RESET_JOINED_GROUP_LIST', {
            pageNum: startPageNum !== undefined ? startPageNum : 0,
          });
        }
        const nextPageNum =
          startPageNum !== undefined
            ? startPageNum
            : getNextJoinedGroupsPage(state.joinedGroup);
        const entities = groupManager().getJoinedGroupList();
        const total = entities.length;
        commit('SET_JOINED_GROUP_COUNT', total);
        if (entities?.length === 0) return;
        commit('SET_JOINED_GROUP', { total, entities });
        const groupIds = _.map(entities, 'groupId');
        if (groupIds?.length === 0) return;
        dispatch('fetchGroupDetailFromServer', groupIds).catch(() => {});
      } catch (error) {
        console.error('加入的群组列表获取失败', error);
      }
    },
    //从服务端获取群组详情
    fetchGroupDetailFromServer: async ({ commit }, groupIds = []) => {
      let groupDetails = [];
      async function fetchDetailsForGroupIds(groupIdArray) {
        try {
          const results = await Promise.all(
            groupIdArray.map((groupId) => groupManager().getGroupInfo({ groupId })),
          );
          groupDetails = groupDetails.concat(results);
          commit('SET_GROUP_DETAILS', {
            groupDetailsList: groupDetails,
          });
        } catch (error) {
          console.error('[Group Details] fetchGroupDetailFromServer failed', {
            groupIds: groupIdArray,
            currentUser: getCurrentUserId(),
            error,
          });
          throw error;
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
    fetchGroupsMemberFromServer: async (
      { dispatch, commit },
      { groupId, chatType },
    ) => {
      if (!getCurrentUserId()) {
        console.error('[Group Members] 用户未登录，无法获取群组成员', {
          groupId,
          chatType,
        });
        return;
      }
      // 仅群聊调用 getGroupInfo；与 CHAT_TYPE.GROUP（'groupChat'）对齐
      if (chatType !== CHAT_TYPE.GROUP) {
        return;
      }
      try {
        let cursor = '';
        let members = [];
        do {
          const result = await groupManager().getGroup(groupId).getMembers({
            cursor,
            pageSize: DEFAULT_GROUP_MEMBERS_PAGE_SIZE,
          });
          const fetchedMembers = normalizeFetchedGroupMembers(
            result?.items || [],
          );
          members = members.concat(fetchedMembers);
          cursor = result?.cursor || '';
        } while (cursor);
        commit('SET_GROUPS_MEMBERS', {
          groupId,
          members,
        });
      } catch (error) {
        console.error('[Group Members] getGroupMembers failed', {
          groupId,
          chatType,
          error,
        });
      }
    },
    fetchPublicGroupListFromServer: async ({ state, commit }, params = {}) => {
      const { limit = 20, cursor, reset = false } = params;
      try {
        const nextCursor =
          cursor !== undefined
            ? cursor
            : reset
            ? ''
            : state.joinedGroup.publicPagingCursor;
        const result = await groupManager().getPublicGroupList({
          pageSize: limit,
          cursor: nextCursor,
        });
        commit('SET_PUBLIC_GROUPS', {
          cursor: result?.cursor || '',
          entities: result?.items || [],
          isInit: reset || nextCursor === '',
        });
        return result || {};
      } catch (error) {
        console.error('公开群列表获取失败', error);
        throw error;
      }
    },
    fetchJoinedGroupCountFromServer: async ({ commit }) => {
      try {
        const total = groupManager().getJoinedGroupList().length;
        commit('SET_JOINED_GROUP_COUNT', total);
        return total;
      } catch (error) {
        console.error('群组数量获取失败', error);
        throw error;
      }
    },
    //获取登录用户在某群内的群组属性
    fetchInTheGroupInfoFromServer: async ({ dispatch, commit }, groupId) => {
      try {
        let options = {
          groupId: groupId,
          userId: getCurrentUserId(),
        };
        const data = await groupManager().getGroupMembersAttributes(options);
        commit('SET_GROUP_MEMBERS_INFO', {
          groupId: groupId,
          inGroupInfo: [{ [getCurrentUserId()]: { nickName: data.nickName } }],
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

      const queue = [];
      while (membersList.length) {
        const list = membersList.shift();
        const result = await groupManager().getGroupMembersAttributes({
            groupId,
            userIds: _.flatten(_.map(list, _.values)),
          });
        queue.push(result);
      }

      if (queue.length > 0) {
        const groupUsersInfo = _.compact(queue);
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
        await groupManager().setGroupMemberAttributes({
          groupId: groupId,
          userId: getCurrentUserId(),
          memberAttributes: {
            nickName,
          },
        });
        //通知用户信息管理模块更新群内用户属性。
        commit('UsersProfile/UPDATE_USER_PROFILE', {
          userId: getCurrentUserId(),
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
        const data = await groupManager().getGroupAnnouncement(option);
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
        const data = await groupManager().getGroup(groupId).getBlocklist();
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
        const data = await groupManager().getGroupMuteList({
          groupId: params,
        });
        commit('SET_GROUPS_MUTE_LIST', {
          groupId: params,
          mutelist: data,
        });
      } catch (error) {
        let errorMsg = '获取禁言列表失败，请稍后重试';
        if (error?.data) {
          const errorData =
            typeof error.data === 'string'
              ? error.data
              : JSON.stringify(error.data);
          if (
            errorData.includes('group_authorization') ||
            errorData.includes('group owner permission')
          ) {
            errorMsg = '没有权限获取禁言列表，只有聊天室所有者才能执行此操作';
          }
        }
        ElMessage.error(errorMsg);
      }
    },
    // 修改群名、群描述、群头像或者群扩展信息
    modifyGroupInfo: async ({ dispatch, commit }, params) => {
      const { groupId, modifyType, content } = params;
      const modifyMap = {
        0: { field: 'name', cacheType: 'name' },
        1: { field: 'description', cacheType: 'groupDescription' },
        2: { field: 'avatar', cacheType: 'groupAvatar' },
        3: { field: 'ext', cacheType: 'groupExt' },
      };
      const config = modifyMap[modifyType];
      if (!config) {
        throw new Error(`Unsupported group modify type: ${modifyType}`);
      }
      const option = buildModifyGroupPayload({
        groupId,
        [config.field]: content,
      });
      await groupManager().updateGroupInfo(option);
      commit('UPDATE_CACHE_GROUP_INFO', {
        groupId,
        type: config.cacheType,
        params: content,
      });
      dispatch('fetchGroupDetailFromServer', [groupId]);
    },
    // 设置/修改群组公告
    modifyGroupAnnouncement: async ({ dispatch }, params) => {
      //SDK入参属性名是确定的此示例直接将属性名改为了SDK所识别的参数如果修改，具体请看文档。
      const { groupId, announcement } = params;
      try {
        await groupManager().updateGroupAnnouncement({ ...params });
        dispatch('fetchAnnounmentFromServer', groupId);
      } catch (error) {
        console.error('群公告修改失败', error);
        throw error;
      }
    },
    fetchGroupSharedFilesFromServer: async ({ commit }, params) => {
      const option =
        typeof params === 'string'
          ? { groupId: params }
          : { pageNum: 1, pageSize: 20, ...params };
      try {
        const result = await groupManager().getGroupSharedFileList(option);
        const files = normalizeGroupSharedFileList({ entities: result.items });
        commit('SET_GROUP_SHARED_FILES', {
          groupId: option.groupId,
          files,
        });
        return files;
      } catch (error) {
        console.error('群共享文件列表获取失败', {
          groupId: option.groupId,
          currentUser: getCurrentUserId(),
          error,
        });
        throw error;
      }
    },
    uploadGroupSharedFile: async ({ dispatch }, params) => {
      const { groupId, file, onFileUploadProgress } = params;
      await groupManager().uploadGroupSharedFile({
        groupId,
        file,
        onFileUploadProgress,
      });
      await dispatch('fetchGroupSharedFilesFromServer', { groupId });
    },
    downloadGroupSharedFile: async (_, params) => {
      const { groupId, fileId, secret } = params;
      let downloaded;
      await groupManager().downloadGroupSharedFile({
        groupId,
        fileId,
        secret,
        onFileDownloadComplete: (data) => {
          downloaded = data;
        },
      });
      return downloaded;
    },
    deleteGroupSharedFile: async ({ dispatch }, params) => {
      const { groupId, fileId } = params;
      try {
        const result = await groupManager().deleteGroupSharedFile({
          groupId,
          fileId,
        });
        await dispatch('fetchGroupSharedFilesFromServer', { groupId });
        return result;
      } catch (error) {
        console.error('群共享文件删除失败', {
          groupId,
          fileId,
          currentUser: getCurrentUserId(),
          error,
        });
        throw error;
      }
    },
    blockGroupMessage: async ({ commit }, groupId) => {
      throw new Error('SDK 5.0 current package does not expose group message blocking; no fallback is configured.');
    },
    unblockGroupMessage: async ({ commit }, groupId) => {
      throw new Error('SDK 5.0 current package does not expose group message blocking; no fallback is configured.');
    },
    //邀请群成员
    inviteUserJoinTheGroup: async ({ dispatch }, params) => {
      //SDK入参属性名是确定的此示例直接将属性名改为了SDK所识别的参数如果修改，具体请看文档。
      const { users, groupId } = params;
      const userIds = (Array.isArray(users) ? users : [users])
        .map((userId) => String(userId || '').trim())
        .filter(Boolean);
      try {
        await groupManager().inviteUsersToGroup({ groupId, userIds });
        ElMessage({
          message: '群组邀请成功送出~',
          type: 'success',
        });
      } catch (error) {
        console.error('[Group Invite] inviteUsersToGroup failed', {
          groupId,
          userIds,
          currentUser: getCurrentUserId(),
          error,
        });
        ElMessage({
          message: `群组邀请失败：${error?.message || 'unknown error'}`,
          type: 'error',
        });
      }
    },
    //移出群成员
    removeTheGroupMember: async ({ dispatch }, params) => {
      //SDK入参属性名是确定的此示例直接将属性名改为了SDK所识别的参数如果修改，具体请看文档。
      const { username, groupId } = params;
      try {
        await groupManager().removeGroupMembers({ userIds: [username], groupId });
        ElMessage({
          message: `已将${username}移出群组!`,
          type: 'success',
        });
        //更新群成员
        dispatch('fetchGroupsMemberFromServer', {
          groupId,
          chatType: 'groupChat',
        });
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
        await groupManager().blockGroupMembers({ groupId, userIds: usernames });
        ElMessage({
          message: '黑名单添加成功~',
          type: 'success',
        });
        //重新获取黑名单列表
        dispatch('fetchGroupsBlackListFromServer', groupId);
        //重新获取成员列表
        dispatch('fetchGroupsMemberFromServer', {
          groupId,
          chatType: 'groupChat',
        });
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
        await groupManager().unblockGroupMembers({ groupId, userIds: usernames });
        ElMessage({
          message: '黑名单移除成功~',
          type: 'success',
        });
        //重新获取黑名单列表
        dispatch('fetchGroupsBlackListFromServer', groupId);
      } catch (error) {
        console.error('[Group Blocklist] unblockGroupMembers failed', {
          groupId,
          usernames,
          error,
        });
        ElMessage({
          message: '黑名单移除失败，请稍后重试~',
          type: 'error',
        });
      }
    },
    //添加用户到禁言列表
    addMemberToMuteList: async ({ dispatch }, params) => {
      const { groupId, username } = params;
      const targetUsername = Array.isArray(username) ? username[0] : username;

      try {
        await groupManager().muteGroupMembers({
          groupId,
          userIds: [targetUsername],
          muteDuration: 886400,
        });
        ElMessage({
          message: '禁言成功~',
          type: 'success',
        });
        setTimeout(() => {
          dispatch('fetchGroupsMuteListFromServer', groupId);
        }, 800);
      } catch (error) {
        console.error('[Group Mutelist] muteGroupMember failed', {
          groupId,
          username: targetUsername,
          error,
        });
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
    },
    //从禁言列表中移出
    removeTheMemberFromMuteList: async ({ dispatch }, params) => {
      const { groupId, username } = params;
      const targetUsername = Array.isArray(username) ? username[0] : username;
      try {
        await groupManager().unmuteGroupMembers({
          groupId,
          userIds: [targetUsername],
        });
        ElMessage({
          message: '移除禁言成功~',
          type: 'success',
        });
        setTimeout(() => {
          dispatch('fetchGroupsMuteListFromServer', groupId);
        }, 800);
      } catch (error) {
        console.error('[Group Mutelist] unmuteGroupMember failed', {
          groupId,
          username: targetUsername,
          error,
        });
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
      await groupManager().leaveGroup({ groupId });
      commit('DELETE_JOINED_GROUP_LIST', { groupId });
    },
    //解散群组
    destroyInTheGroup: async ({ commit }, params) => {
      if (!params.groupId) return;
      const { groupId } = params;
      await groupManager().destroyGroup({ groupId });
      commit('DELETE_JOINED_GROUP_LIST', { groupId });
    },
  },
  getters: {
    getGroupDetailMap: (state) => state.groupDetails,
    getGroupMembersMap: (state) => state.groupMembers,
    getGroupSharedFilesMap: (state) => state.groupSharedFiles,
    getJoinedGroupList: (state) => state.joinedGroup.joinedGroupList,
    getJoinedGroupTotal: (state) => state.joinedGroup.joinedGroupListTotal,
    getJoinedGroupCount: (state) => state.joinedGroup.joinedGroupCount,
    getPublicGroupList: (state) => state.joinedGroup.publicGroupList,
    getPublicGroupCursor: (state) => state.joinedGroup.publicPagingCursor,
    //获取加入的群组名
    getGroupName: (state) => (groupId) => {
      const group = state.joinedGroup.joinedGroupList.find(
        (item) => item.groupId === groupId,
      );
      const groupInfo = state.groupDetails.get(groupId) || {};
      return group?.name || groupInfo?.name || groupId;
    },
  },
};

export default Groups;
