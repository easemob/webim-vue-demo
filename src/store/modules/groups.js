import { ElMessage } from 'element-plus';
import { getCurrentUserId, requireManager } from '@/IM';

const DEFAULT_GROUP_MEMBERS_PAGE_SIZE = 50;

const groupManager = () => requireManager('groupManager');

const Groups = {
  state: {
    joinedGroups: [],
    groupSummaries: new Map(),
    groupDetails: new Map(),
    groupMembers: new Map(),
    groupAdmins: new Map(),
    groupBlocklists: new Map(),
    groupMuteLists: new Map(),
    groupMuteListMembership: new Map(),
    groupAnnouncements: new Map(),
    groupSharedFiles: new Map(),
    groupMemberAttributes: new Map(),
    groupAllowlists: new Map(),
    groupAllowlistMembership: new Map(),
  },
  mutations: {
    SET_JOINED_GROUPS: (state, groups) => {
      state.joinedGroups = groups;
    },
    UPSERT_JOINED_GROUP: (state, group) => {
      state.joinedGroups = [
        group,
        ...state.joinedGroups.filter((item) => item.groupId !== group.groupId),
      ];
    },
    REMOVE_GROUP: (state, groupId) => {
      state.joinedGroups = state.joinedGroups.filter(
        (group) => group.groupId !== groupId,
      );
      state.groupSummaries.delete(groupId);
      state.groupDetails.delete(groupId);
      state.groupMembers.delete(groupId);
      state.groupAdmins.delete(groupId);
      state.groupBlocklists.delete(groupId);
      state.groupMuteLists.delete(groupId);
      state.groupMuteListMembership.delete(groupId);
      state.groupAnnouncements.delete(groupId);
      state.groupSharedFiles.delete(groupId);
      state.groupMemberAttributes.delete(groupId);
      state.groupAllowlists.delete(groupId);
      state.groupAllowlistMembership.delete(groupId);
    },
    SET_GROUP_DETAILS: (state, { groupDetails }) => {
      groupDetails.forEach((groupDetail) => {
        state.groupDetails.set(groupDetail.groupId, groupDetail);
      });
    },
    SET_GROUP_SUMMARY: (state, { groupId, summary }) => {
      state.groupSummaries.set(groupId, summary);
    },
    SET_GROUP_MEMBERS: (state, { groupId, members }) => {
      state.groupMembers.set(groupId, members);
    },
    SET_GROUP_ADMINS: (state, { groupId, admins }) => {
      state.groupAdmins.set(groupId, admins);
    },
    SET_GROUP_BLOCKLIST: (state, { groupId, blocklist }) => {
      state.groupBlocklists.set(groupId, blocklist);
    },
    SET_GROUP_MUTE_LIST: (state, { groupId, muteList }) => {
      state.groupMuteLists.set(groupId, muteList);
    },
    SET_GROUP_MUTE_LIST_MEMBERSHIP: (state, { groupId, inMuteList }) => {
      state.groupMuteListMembership.set(groupId, inMuteList);
    },
    SET_GROUP_ANNOUNCEMENT: (state, { groupId, announcement }) => {
      state.groupAnnouncements.set(groupId, announcement);
    },
    SET_GROUP_SHARED_FILES: (state, { groupId, result }) => {
      state.groupSharedFiles.set(groupId, result.items);
    },
    SET_GROUP_MEMBER_ATTRIBUTES: (state, { groupId, attributes }) => {
      state.groupMemberAttributes.set(groupId, {
        ...(state.groupMemberAttributes.get(groupId) || {}),
        ...(attributes || {}),
      });
    },
    SET_GROUP_ALLOWLIST: (state, { groupId, allowlist }) => {
      state.groupAllowlists.set(groupId, allowlist);
    },
    SET_GROUP_ALLOWLIST_MEMBERSHIP: (state, { groupId, inAllowlist }) => {
      state.groupAllowlistMembership.set(groupId, inAllowlist);
    },
  },
  actions: {
    addCreatedGroupToJoinedList: async ({ commit }, groupId) => {
      const groupDetail = await groupManager().getGroup(groupId).getDetail();
      commit('UPSERT_JOINED_GROUP', groupDetail);
      commit('SET_GROUP_DETAILS', { groupDetails: [groupDetail] });
      console.log('[SDK 5.0 Group] getDetail after create', {
        groupId,
        currentUser: getCurrentUserId(),
        groupDetail,
      });
      return groupDetail;
    },
    readJoinedGroupSnapshot: async ({ dispatch, commit }) => {
      try {
        const groups = groupManager().getJoinedGroupList();
        commit('SET_JOINED_GROUPS', groups);
        console.log('[SDK 5.0 Group] getJoinedGroupList success', {
          currentUser: getCurrentUserId(),
          groups,
        });
        if (groups.length > 0) {
          await dispatch(
            'fetchGroupDetailFromServer',
            groups.map((group) => group.groupId),
          );
        }
        return groups;
      } catch (error) {
        console.error('[SDK 5.0 Group] getJoinedGroupList failed', {
          currentUser: getCurrentUserId(),
          error,
        });
        throw error;
      }
    },
    fetchJoinedGroupListFromServer: async ({ dispatch }) => {
      return dispatch('readJoinedGroupSnapshot');
    },
    readGroupSummarySnapshot: async ({ commit }, groupId) => {
      try {
        const summary = groupManager().getGroup(groupId).getSummary();
        commit('SET_GROUP_SUMMARY', { groupId, summary });
        console.log('[SDK 5.0 Group] getSummary success', {
          groupId,
          currentUser: getCurrentUserId(),
          summary,
        });
        return summary;
      } catch (error) {
        console.error('[SDK 5.0 Group] getSummary failed', {
          groupId,
          currentUser: getCurrentUserId(),
          error,
        });
        throw error;
      }
    },
    fetchGroupDetailFromServer: async ({ commit }, groupIds = []) => {
      const fulfilledGroupDetails = [];
      const failedGroupDetails = [];

      for (const groupIdsChunk of _.chunk(groupIds, 20)) {
        const results = await Promise.allSettled(
          groupIdsChunk.map(async (groupId) => ({
            groupId,
            groupDetail: await groupManager().getGroup(groupId).getDetail(),
          })),
        );

        results.forEach((result, index) => {
          const groupId = groupIdsChunk[index];
          if (result.status === 'fulfilled') {
            fulfilledGroupDetails.push(result.value.groupDetail);
            return;
          }
          failedGroupDetails.push({ groupId, error: result.reason });
        });
      }

      if (fulfilledGroupDetails.length > 0) {
        commit('SET_GROUP_DETAILS', { groupDetails: fulfilledGroupDetails });
      }
      if (failedGroupDetails.length > 0) {
        console.error('[SDK 5.0 Group] getDetail partial failed', {
          groupIds,
          failedGroupDetails,
          currentUser: getCurrentUserId(),
        });
      }
      return { fulfilledGroupDetails, failedGroupDetails };
    },
    fetchGroupsMemberFromServer: async ({ commit }, { groupId }) => {
      if (!getCurrentUserId()) {
        console.error('[SDK 5.0 Group] getMembers skipped without login', { groupId });
        return;
      }
      try {
        let cursor = '';
        const members = [];
        do {
          const result = await groupManager().getGroup(groupId).getMembers({
            cursor,
            pageSize: DEFAULT_GROUP_MEMBERS_PAGE_SIZE,
          });
          members.push(...result.items);
          cursor = result.cursor;
        } while (cursor);
        commit('SET_GROUP_MEMBERS', { groupId, members });
        console.log('[SDK 5.0 Group] getMembers success', {
          groupId,
          currentUser: getCurrentUserId(),
          members,
        });
        return members;
      } catch (error) {
        console.error('[SDK 5.0 Group] getMembers failed', {
          groupId,
          currentUser: getCurrentUserId(),
          error,
        });
        throw error;
      }
    },
    fetchGroupAdminsFromServer: async ({ commit }, groupId) => {
      try {
        const admins = await groupManager().getGroup(groupId).getAdmins();
        commit('SET_GROUP_ADMINS', { groupId, admins });
        console.log('[SDK 5.0 Group] getAdmins success', {
          groupId,
          currentUser: getCurrentUserId(),
          admins,
        });
        return admins;
      } catch (error) {
        console.error('[SDK 5.0 Group] getAdmins failed', {
          groupId,
          currentUser: getCurrentUserId(),
          error,
        });
        ElMessage.error(error.message);
        throw error;
      }
    },
    fetchGroupMembersAttributesFromServer: async (
      { commit },
      { groupId, userIds, keys },
    ) => {
      try {
        const result = await groupManager().getGroup(groupId).getMembersAttributes({
          userIds,
          keys,
        });
        commit('SET_GROUP_MEMBER_ATTRIBUTES', {
          groupId,
          attributes: result.items,
        });
        console.log('[SDK 5.0 Group] getMembersAttributes success', {
          groupId,
          userIds,
          keys,
          result,
        });
        return result;
      } catch (error) {
        console.error('[SDK 5.0 Group] getMembersAttributes failed', {
          groupId,
          userIds,
          keys,
          currentUser: getCurrentUserId(),
          error,
        });
        ElMessage.error(error.message);
        throw error;
      }
    },
    setGroupMemberAttributes: async (
      { dispatch },
      { groupId, userId, memberAttributes },
    ) => {
      try {
        await groupManager().getGroup(groupId).setMemberAttributes({
          userId,
          memberAttributes,
        });
        ElMessage.success('群成员属性设置成功');
        console.log('[SDK 5.0 Group] setMemberAttributes success', {
          groupId,
          userId,
          memberAttributes,
        });
        return await dispatch('fetchGroupMembersAttributesFromServer', {
          groupId,
          userIds: [userId],
          keys: Object.keys(memberAttributes),
        });
      } catch (error) {
        console.error('[SDK 5.0 Group] setMemberAttributes failed', {
          groupId,
          userId,
          memberAttributes,
          currentUser: getCurrentUserId(),
          error,
        });
        ElMessage.error(error.message);
        throw error;
      }
    },
    fetchJoinedGroupCountFromServer: async ({ dispatch }) => {
      const groups = await dispatch('readJoinedGroupSnapshot');
      return groups.length;
    },
    fetchAnnounmentFromServer: async ({ commit }, groupId) => {
      try {
        const announcement = await groupManager()
          .getGroup(groupId)
          .getAnnouncement();
        commit('SET_GROUP_ANNOUNCEMENT', { groupId, announcement });
        console.log('[SDK 5.0 Group] getAnnouncement success', {
          groupId,
          announcement,
        });
        return announcement;
      } catch (error) {
        console.error('[SDK 5.0 Group] getAnnouncement failed', { groupId, error });
        throw error;
      }
    },
    fetchGroupsBlackListFromServer: async ({ commit }, groupId) => {
      try {
        const blocklist = await groupManager().getGroup(groupId).getBlocklist();
        commit('SET_GROUP_BLOCKLIST', { groupId, blocklist });
        console.log('[SDK 5.0 Group] getBlocklist success', { groupId, blocklist });
        return blocklist;
      } catch (error) {
        console.error('[SDK 5.0 Group] getBlocklist failed', { groupId, error });
        throw error;
      }
    },
    fetchGroupsAllowListFromServer: async ({ commit }, groupId) => {
      try {
        const allowlist = await groupManager().getGroup(groupId).getAllowlist();
        commit('SET_GROUP_ALLOWLIST', { groupId, allowlist });
        console.log('[SDK 5.0 Group] getAllowlist success', {
          groupId,
          allowlist,
        });
        return allowlist;
      } catch (error) {
        console.error('[SDK 5.0 Group] getAllowlist failed', {
          groupId,
          currentUser: getCurrentUserId(),
          error,
        });
        ElMessage.error(error.message);
        throw error;
      }
    },
    checkCurrentUserInGroupAllowList: async ({ commit }, groupId) => {
      try {
        const inAllowlist = await groupManager()
          .getGroup(groupId)
          .checkIfInAllowList();
        commit('SET_GROUP_ALLOWLIST_MEMBERSHIP', { groupId, inAllowlist });
        console.log('[SDK 5.0 Group] checkIfInAllowList success', {
          groupId,
          currentUser: getCurrentUserId(),
          inAllowlist,
        });
        return inAllowlist;
      } catch (error) {
        console.error('[SDK 5.0 Group] checkIfInAllowList failed', {
          groupId,
          currentUser: getCurrentUserId(),
          error,
        });
        ElMessage.error(error.message);
        throw error;
      }
    },
    fetchGroupsMuteListFromServer: async ({ commit }, groupId) => {
      try {
        const muteList = await groupManager().getGroup(groupId).getMuteList();
        commit('SET_GROUP_MUTE_LIST', { groupId, muteList });
        console.log('[SDK 5.0 Group] getMuteList success', { groupId, muteList });
        return muteList;
      } catch (error) {
        console.error('[SDK 5.0 Group] getMuteList failed', { groupId, error });
        ElMessage.error(error.message);
        throw error;
      }
    },
    checkCurrentUserInGroupMuteList: async ({ commit }, groupId) => {
      try {
        const inMuteList = await groupManager().getGroup(groupId).checkIfInMuteList();
        commit('SET_GROUP_MUTE_LIST_MEMBERSHIP', { groupId, inMuteList });
        console.log('[SDK 5.0 Group] checkIfInMuteList success', {
          groupId,
          currentUser: getCurrentUserId(),
          inMuteList,
        });
        return inMuteList;
      } catch (error) {
        console.error('[SDK 5.0 Group] checkIfInMuteList failed', {
          groupId,
          currentUser: getCurrentUserId(),
          error,
        });
        ElMessage.error(error.message);
        throw error;
      }
    },
    modifyGroupInfo: async ({ commit }, { groupId, ...groupInfo }) => {
      await groupManager().getGroup(groupId).updateInfo(groupInfo);
      const groupDetail = await groupManager().getGroup(groupId).refresh();
      commit('SET_GROUP_DETAILS', { groupDetails: [groupDetail] });
      commit('UPSERT_JOINED_GROUP', groupDetail);
      console.log('[SDK 5.0 Group] updateInfo refresh success', {
        groupId,
        groupInfo,
        groupDetail,
      });
      return groupDetail;
    },
    updateGroupConfigs: async ({ commit }, { groupId, configs }) => {
      try {
        await groupManager().getGroup(groupId).updateConfigs(configs);
        const groupDetail = await groupManager().getGroup(groupId).refresh();
        commit('SET_GROUP_DETAILS', { groupDetails: [groupDetail] });
        commit('UPSERT_JOINED_GROUP', groupDetail);
        console.log('[SDK 5.0 Group] updateConfigs refresh success', {
          groupId,
          configs,
          groupDetail,
        });
        return groupDetail;
      } catch (error) {
        console.error('[SDK 5.0 Group] updateConfigs failed', {
          groupId,
          configs,
          currentUser: getCurrentUserId(),
          error,
        });
        throw error;
      }
    },
    changeGroupOwner: async ({ commit }, { groupId, newOwner }) => {
      try {
        await groupManager().getGroup(groupId).changeOwner({ newOwner });
        const groupDetail = await groupManager().getGroup(groupId).refresh();
        commit('SET_GROUP_DETAILS', { groupDetails: [groupDetail] });
        commit('UPSERT_JOINED_GROUP', groupDetail);
        console.log('[SDK 5.0 Group] changeOwner refresh success', {
          groupId,
          newOwner,
          groupDetail,
        });
        return groupDetail;
      } catch (error) {
        console.error('[SDK 5.0 Group] changeOwner failed', {
          groupId,
          newOwner,
          currentUser: getCurrentUserId(),
          error,
        });
        throw error;
      }
    },
    modifyGroupAnnouncement: async ({ dispatch }, { groupId, announcement }) => {
      try {
        await groupManager().getGroup(groupId).updateAnnouncement({ announcement });
        return await dispatch('fetchAnnounmentFromServer', groupId);
      } catch (error) {
        console.error('[SDK 5.0 Group] updateAnnouncement failed', {
          groupId,
          announcement,
          error,
        });
        throw error;
      }
    },
    fetchGroupSharedFilesFromServer: async ({ commit }, { groupId, pageNum = 1, pageSize = 20 }) => {
      try {
        const result = await groupManager()
          .getGroup(groupId)
          .getSharedFileList({ pageNum, pageSize });
        commit('SET_GROUP_SHARED_FILES', { groupId, result });
        console.log('[SDK 5.0 Group] getSharedFileList success', { groupId, result });
        return result;
      } catch (error) {
        console.error('[SDK 5.0 Group] getSharedFileList failed', {
          groupId,
          currentUser: getCurrentUserId(),
          error,
        });
        throw error;
      }
    },
    uploadGroupSharedFile: async ({ dispatch }, { groupId, file, onFileUploadProgress }) => {
      try {
        await groupManager().getGroup(groupId).uploadSharedFile({
          file,
          onFileUploadProgress,
        });
        return await dispatch('fetchGroupSharedFilesFromServer', { groupId });
      } catch (error) {
        console.error('[SDK 5.0 Group] uploadSharedFile failed', { groupId, error });
        throw error;
      }
    },
    downloadGroupSharedFile: async (_, { groupId, fileId }) => {
      let blob;
      await groupManager().getGroup(groupId).downloadSharedFile({
        fileId,
        onFileDownloadComplete: (data) => {
          blob = data;
        },
      });
      console.log('[SDK 5.0 Group] downloadSharedFile completed', { groupId, fileId, blob });
      return blob;
    },
    deleteGroupSharedFile: async ({ dispatch }, { groupId, fileId }) => {
      try {
        await groupManager().getGroup(groupId).deleteSharedFile({ fileId });
        return await dispatch('fetchGroupSharedFilesFromServer', { groupId });
      } catch (error) {
        console.error('[SDK 5.0 Group] deleteSharedFile failed', {
          groupId,
          fileId,
          error,
        });
        throw error;
      }
    },
    inviteUserJoinTheGroup: async (_, { groupId, userIds }) => {
      try {
        await groupManager().inviteUsersToGroup({ groupId, userIds });
        ElMessage.success('群组邀请成功送出~');
      } catch (error) {
        console.error('[SDK 5.0 Group] inviteUsersToGroup failed', {
          groupId,
          userIds,
          currentUser: getCurrentUserId(),
          error,
        });
        ElMessage.error(error.message);
        throw error;
      }
    },
    removeTheGroupMember: async ({ dispatch }, { groupId, userIds }) => {
      try {
        await groupManager().getGroup(groupId).removeMembers({ userIds });
        await dispatch('fetchGroupsMemberFromServer', { groupId });
        ElMessage.success('群成员已移除');
      } catch (error) {
        console.error('[SDK 5.0 Group] removeMembers failed', {
          groupId,
          userIds,
          error,
        });
        ElMessage.error(error.message);
        throw error;
      }
    },
    addGroupAdmin: async ({ dispatch }, { groupId, userId }) => {
      try {
        await groupManager().getGroup(groupId).addAdmin({ userId });
        const [admins] = await Promise.all([
          dispatch('fetchGroupAdminsFromServer', groupId),
          dispatch('fetchGroupsMemberFromServer', { groupId }),
        ]);
        ElMessage.success('群管理员添加成功~');
        return admins;
      } catch (error) {
        console.error('[SDK 5.0 Group] addAdmin failed', {
          groupId,
          userId,
          currentUser: getCurrentUserId(),
          error,
        });
        ElMessage.error(error.message);
        throw error;
      }
    },
    removeGroupAdmin: async ({ dispatch }, { groupId, userId }) => {
      try {
        await groupManager().getGroup(groupId).removeAdmin({ userId });
        const [admins] = await Promise.all([
          dispatch('fetchGroupAdminsFromServer', groupId),
          dispatch('fetchGroupsMemberFromServer', { groupId }),
        ]);
        ElMessage.success('群管理员移除成功~');
        return admins;
      } catch (error) {
        console.error('[SDK 5.0 Group] removeAdmin failed', {
          groupId,
          userId,
          currentUser: getCurrentUserId(),
          error,
        });
        ElMessage.error(error.message);
        throw error;
      }
    },
    addMemberToBlackList: async ({ dispatch }, { groupId, userIds }) => {
      try {
        await groupManager().getGroup(groupId).blockMembers({ userIds });
        await Promise.all([
          dispatch('fetchGroupsBlackListFromServer', groupId),
          dispatch('fetchGroupsMemberFromServer', { groupId }),
        ]);
        ElMessage.success('黑名单添加成功~');
      } catch (error) {
        console.error('[SDK 5.0 Group] blockMembers failed', { groupId, userIds, error });
        ElMessage.error(error.message);
        throw error;
      }
    },
    removeTheMemberFromBlackList: async ({ dispatch }, { groupId, userIds }) => {
      try {
        await groupManager().getGroup(groupId).unblockMembers({ userIds });
        await dispatch('fetchGroupsBlackListFromServer', groupId);
        ElMessage.success('黑名单移除成功~');
      } catch (error) {
        console.error('[SDK 5.0 Group] unblockMembers failed', { groupId, userIds, error });
        ElMessage.error(error.message);
        throw error;
      }
    },
    addMemberToAllowList: async ({ dispatch }, { groupId, userIds }) => {
      try {
        await groupManager().getGroup(groupId).addUsersToAllowlist({ userIds });
        await Promise.all([
          dispatch('fetchGroupsAllowListFromServer', groupId),
          dispatch('checkCurrentUserInGroupAllowList', groupId),
        ]);
        ElMessage.success('白名单添加成功~');
      } catch (error) {
        console.error('[SDK 5.0 Group] addUsersToAllowlist failed', {
          groupId,
          userIds,
          error,
        });
        ElMessage.error(error.message);
        throw error;
      }
    },
    removeTheMemberFromAllowList: async ({ dispatch }, { groupId, userIds }) => {
      try {
        await groupManager().getGroup(groupId).removeUsersFromAllowlist({ userIds });
        await Promise.all([
          dispatch('fetchGroupsAllowListFromServer', groupId),
          dispatch('checkCurrentUserInGroupAllowList', groupId),
        ]);
        ElMessage.success('白名单移除成功~');
      } catch (error) {
        console.error('[SDK 5.0 Group] removeUsersFromAllowlist failed', {
          groupId,
          userIds,
          error,
        });
        ElMessage.error(error.message);
        throw error;
      }
    },
    addMemberToMuteList: async ({ dispatch }, { groupId, userIds, muteDuration }) => {
      try {
        await groupManager()
          .getGroup(groupId)
          .muteMembers({ userIds, muteDuration });
        await Promise.all([
          dispatch('fetchGroupsMuteListFromServer', groupId),
          dispatch('checkCurrentUserInGroupMuteList', groupId),
        ]);
        ElMessage.success('禁言成功~');
      } catch (error) {
        console.error('[SDK 5.0 Group] muteMembers failed', {
          groupId,
          userIds,
          muteDuration,
          error,
        });
        ElMessage.error(error.message);
        throw error;
      }
    },
    removeTheMemberFromMuteList: async ({ dispatch }, { groupId, userIds }) => {
      try {
        await groupManager().getGroup(groupId).unmuteMembers({ userIds });
        await Promise.all([
          dispatch('fetchGroupsMuteListFromServer', groupId),
          dispatch('checkCurrentUserInGroupMuteList', groupId),
        ]);
        ElMessage.success('移除禁言成功~');
      } catch (error) {
        console.error('[SDK 5.0 Group] unmuteMembers failed', { groupId, userIds, error });
        ElMessage.error(error.message);
        throw error;
      }
    },
    muteAllGroupMembers: async ({ commit, dispatch }, groupId) => {
      try {
        await groupManager().getGroup(groupId).muteAllMembers();
        const groupDetail = await groupManager().getGroup(groupId).refresh();
        commit('SET_GROUP_DETAILS', { groupDetails: [groupDetail] });
        commit('UPSERT_JOINED_GROUP', groupDetail);
        await Promise.all([
          dispatch('fetchGroupsMuteListFromServer', groupId),
          dispatch('checkCurrentUserInGroupMuteList', groupId),
        ]);
        ElMessage.success('群全员禁言已开启');
        console.log('[SDK 5.0 Group] muteAllMembers refresh success', {
          groupId,
          currentUser: getCurrentUserId(),
          groupDetail,
        });
        return groupDetail;
      } catch (error) {
        console.error('[SDK 5.0 Group] muteAllMembers failed', {
          groupId,
          currentUser: getCurrentUserId(),
          error,
        });
        ElMessage.error(error.message);
        throw error;
      }
    },
    unmuteAllGroupMembers: async ({ commit, dispatch }, groupId) => {
      try {
        await groupManager().getGroup(groupId).unmuteAllMembers();
        const groupDetail = await groupManager().getGroup(groupId).refresh();
        commit('SET_GROUP_DETAILS', { groupDetails: [groupDetail] });
        commit('UPSERT_JOINED_GROUP', groupDetail);
        await Promise.all([
          dispatch('fetchGroupsMuteListFromServer', groupId),
          dispatch('checkCurrentUserInGroupMuteList', groupId),
        ]);
        ElMessage.success('群全员禁言已解除');
        console.log('[SDK 5.0 Group] unmuteAllMembers refresh success', {
          groupId,
          currentUser: getCurrentUserId(),
          groupDetail,
        });
        return groupDetail;
      } catch (error) {
        console.error('[SDK 5.0 Group] unmuteAllMembers failed', {
          groupId,
          currentUser: getCurrentUserId(),
          error,
        });
        ElMessage.error(error.message);
        throw error;
      }
    },
    leaveIntheGroup: async ({ commit }, { groupId }) => {
      await groupManager().getGroup(groupId).leave();
      commit('REMOVE_GROUP', groupId);
    },
    destroyInTheGroup: async ({ commit }, { groupId }) => {
      await groupManager().getGroup(groupId).destroy();
      commit('REMOVE_GROUP', groupId);
    },
  },
  getters: {
    getGroupSummaryMap: (state) => state.groupSummaries,
    getGroupDetailMap: (state) => state.groupDetails,
    getGroupMembersMap: (state) => state.groupMembers,
    getGroupAdminsMap: (state) => state.groupAdmins,
    getGroupBlocklistMap: (state) => state.groupBlocklists,
    getGroupMuteListMap: (state) => state.groupMuteLists,
    getGroupMuteListMembershipMap: (state) => state.groupMuteListMembership,
    getGroupAnnouncementMap: (state) => state.groupAnnouncements,
    getGroupSharedFilesMap: (state) => state.groupSharedFiles,
    getGroupMemberAttributesMap: (state) => state.groupMemberAttributes,
    getGroupAllowlistMap: (state) => state.groupAllowlists,
    getGroupAllowlistMembershipMap: (state) => state.groupAllowlistMembership,
    getJoinedGroupList: (state) => state.joinedGroups,
    getJoinedGroupTotal: (state) => state.joinedGroups.length,
    getJoinedGroupCount: (state) => state.joinedGroups.length,
    getGroupName: (state) => (groupId) => {
      const detail = state.groupDetails.get(groupId);
      if (detail) return detail.name;
      return state.joinedGroups.find((group) => group.groupId === groupId)?.name;
    },
  },
};

export default Groups;
