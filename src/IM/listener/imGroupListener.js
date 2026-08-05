import { getCurrentUserId, requireManager } from '../index';
import store from '@/store';
import { wrapImEventHandler } from '@/utils/safeCall';

const GROUP_EVENT_HANDLER_ID = 'groupEvent';

export const imGroupListener = () => {
  const recordGroupEvent = (eventName, payload) => {
    const receivedAt = Date.now();
    console.log('[SDK 5.0 Group Event] received', {
      eventName,
      groupId: payload?.groupId,
      currentUserId: getCurrentUserId(),
      rawEvent: payload,
    });
    Promise.resolve(
      store.dispatch('recordSdkEvent', {
        domain: 'group',
        eventName,
        payload,
        currentUserId: getCurrentUserId(),
        receivedAt,
      }),
    ).catch((error) => console.error('[imGroupListener.recordSdkEvent]', error));
    Promise.resolve(
      store.dispatch('createNewInform', {
        eventName,
        payload,
        domain: 'group',
        receivedAt,
      }),
    ).catch((error) => console.error('[imGroupListener.createNewInform]', error));
  };

  const refreshGroupDetail = (groupId) => {
    if (!groupId) return;
    Promise.resolve(store.dispatch('fetchGroupDetailFromServer', [groupId])).catch(
      (error) => console.error('[SDK 5.0 Group Event] refresh detail failed', {
        groupId,
        error,
      }),
    );
  };

  const refreshGroupMembers = (groupId) => {
    if (!groupId) return;
    Promise.resolve(store.dispatch('fetchGroupsMemberFromServer', { groupId })).catch(
      (error) => console.error('[SDK 5.0 Group Event] refresh members failed', {
        groupId,
        error,
      }),
    );
  };

  const refreshGroupMuteStatus = (groupId) => {
    if (!groupId) return;
    Promise.resolve(store.dispatch('fetchGroupsMuteListFromServer', groupId)).catch(
      (error) => console.error('[SDK 5.0 Group Event] refresh mute list failed', {
        groupId,
        error,
      }),
    );
    Promise.resolve(store.dispatch('checkCurrentUserInGroupMuteList', groupId)).catch(
      (error) => console.error('[SDK 5.0 Group Event] refresh mute membership failed', {
        groupId,
        error,
      }),
    );
  };

  const refreshGroupAdmins = (groupId) => {
    if (!groupId) return;
    Promise.resolve(store.dispatch('fetchGroupAdminsFromServer', groupId)).catch(
      (error) => console.error('[SDK 5.0 Group Event] refresh admins failed', {
        groupId,
        error,
      }),
    );
  };

  const refreshJoinedGroups = () => {
    Promise.resolve(store.dispatch('fetchJoinedGroupListFromServer')).catch((error) =>
      console.error('[SDK 5.0 Group Event] refresh joined groups failed', error),
    );
  };

  const mountGroupEventListener = () => {
    const manager = requireManager('groupManager');
    manager.removeEventHandler(GROUP_EVENT_HANDLER_ID);
    manager.addEventHandler(
      GROUP_EVENT_HANDLER_ID,
      wrapImEventHandler({
        onInvitationReceived: (payload) => {
          recordGroupEvent('onInvitationReceived', payload);
        },
        onRequestToJoinReceived: (payload) => {
          recordGroupEvent('onRequestToJoinReceived', payload);
        },
        onRequestToJoinAccepted: (payload) => {
          recordGroupEvent('onRequestToJoinAccepted', payload);
          refreshJoinedGroups();
          refreshGroupDetail(payload.groupId);
          refreshGroupMembers(payload.groupId);
        },
        onRequestToJoinDeclined: (payload) => {
          recordGroupEvent('onRequestToJoinDeclined', payload);
        },
        onInvitationAccepted: (payload) => {
          recordGroupEvent('onInvitationAccepted', payload);
          refreshGroupDetail(payload.groupId);
          refreshGroupMembers(payload.groupId);
        },
        onInvitationDeclined: (payload) => {
          recordGroupEvent('onInvitationDeclined', payload);
        },
        onUserRemoved: (payload) => {
          recordGroupEvent('onUserRemoved', payload);
          store.commit('REMOVE_GROUP', payload.groupId);
        },
        onGroupDestroyed: (payload) => {
          recordGroupEvent('onGroupDestroyed', payload);
          store.commit('REMOVE_GROUP', payload.groupId);
        },
        onAutoAcceptInvitationFromGroup: (payload) => {
          recordGroupEvent('onAutoAcceptInvitationFromGroup', payload);
          refreshJoinedGroups();
          refreshGroupDetail(payload.groupId);
          refreshGroupMembers(payload.groupId);
        },
        onMuteListAdded: (payload) => {
          recordGroupEvent('onMuteListAdded', payload);
          refreshGroupMuteStatus(payload.groupId);
        },
        onMuteListRemoved: (payload) => {
          recordGroupEvent('onMuteListRemoved', payload);
          refreshGroupMuteStatus(payload.groupId);
        },
        onAllowListAdded: (payload) => {
          recordGroupEvent('onAllowListAdded', payload);
          store.dispatch('fetchGroupsAllowListFromServer', payload.groupId);
          store.dispatch('checkCurrentUserInGroupAllowList', payload.groupId);
        },
        onAllowListRemoved: (payload) => {
          recordGroupEvent('onAllowListRemoved', payload);
          store.dispatch('fetchGroupsAllowListFromServer', payload.groupId);
          store.dispatch('checkCurrentUserInGroupAllowList', payload.groupId);
        },
        onAllMemberMuteStateChanged: (payload) => {
          recordGroupEvent('onAllMemberMuteStateChanged', payload);
          refreshGroupDetail(payload.groupId);
          store.dispatch('checkCurrentUserInGroupMuteList', payload.groupId);
        },
        onAdminAdded: (payload) => {
          recordGroupEvent('onAdminAdded', payload);
          refreshGroupDetail(payload.groupId);
          refreshGroupAdmins(payload.groupId);
          refreshGroupMembers(payload.groupId);
        },
        onAdminRemoved: (payload) => {
          recordGroupEvent('onAdminRemoved', payload);
          refreshGroupDetail(payload.groupId);
          refreshGroupAdmins(payload.groupId);
          refreshGroupMembers(payload.groupId);
        },
        onOwnerChanged: (payload) => {
          recordGroupEvent('onOwnerChanged', payload);
          refreshGroupDetail(payload.groupId);
        },
        onMembersJoined: (payload) => {
          recordGroupEvent('onMembersJoined', payload);
          refreshJoinedGroups();
          refreshGroupDetail(payload.groupId);
          refreshGroupMembers(payload.groupId);
        },
        onMembersExited: (payload) => {
          recordGroupEvent('onMembersExited', payload);
          refreshGroupDetail(payload.groupId);
          refreshGroupMembers(payload.groupId);
        },
        onAnnouncementChanged: (payload) => {
          recordGroupEvent('onAnnouncementChanged', payload);
          store.dispatch('fetchAnnounmentFromServer', payload.groupId);
        },
        onSharedFileAdded: (payload) => {
          recordGroupEvent('onSharedFileAdded', payload);
          store.dispatch('fetchGroupSharedFilesFromServer', {
            groupId: payload.groupId,
          });
        },
        onSharedFileDeleted: (payload) => {
          recordGroupEvent('onSharedFileDeleted', payload);
          store.dispatch('fetchGroupSharedFilesFromServer', {
            groupId: payload.groupId,
          });
        },
        onGroupInfoChanged: (payload) => {
          recordGroupEvent('onGroupInfoChanged', payload);
          refreshGroupDetail(payload.groupId);
        },
        onGroupDisabledChanged: (payload) => {
          recordGroupEvent('onGroupDisabledChanged', payload);
          refreshGroupDetail(payload.groupId);
        },
        onGroupMemberAttributeChanged: (payload) => {
          recordGroupEvent('onGroupMemberAttributeChanged', payload);
          refreshGroupMembers(payload.groupId);
        },
        onUserGroupNamecardUpdated: (payload) => {
          recordGroupEvent('onUserGroupNamecardUpdated', payload);
          refreshGroupMembers(payload.groupId);
        },
      }),
    );
  };

  return {
    mountGroupEventListener,
  };
};
