import { requireManager } from '../index';
import { INFORM_FROM, INFORM_TYPE } from '@/constant';
import store from '@/store';
import { GROUP_OPERATION_TYPE } from '../constant';
import { wrapImEventHandler } from '@/utils/safeCall';

export const imGroupListener = () => {
  const submitInformData = (fromType, informContent) => {
    Promise.resolve(
      store.dispatch('createNewInform', { fromType, informContent }),
    ).catch((err) => console.error('[imGroupListener.createNewInform]', err));
  };
  const refreshGroupDetailFromServer = (groupId) => {
    if (!groupId) return;
    store.dispatch('fetchGroupDetailFromServer', [groupId]).catch(() => {});
  };
  const getSdk5UserId = (user) => {
    if (typeof user === 'string') return user;
    return typeof user?.userId === 'string' ? user.userId : '';
  };
  const normalizeSdk5UserIds = (users) => {
    if (!Array.isArray(users)) return [];
    return [...new Set(users.map(getSdk5UserId).filter(Boolean))];
  };
  const normalizeGroupEventMembers = (groupevent) => {
    const members = [
      groupevent?.member,
      groupevent?.user,
      groupevent?.username,
      ...normalizeSdk5UserIds(groupevent?.members),
      ...normalizeSdk5UserIds(groupevent?.users),
    ].map(getSdk5UserId).filter(Boolean);
    return [...new Set(members)];
  };
  // SDK 5.0 emits typed, named group callbacks. Normalize only their public
  // fields so the existing system-notification model can render them.
  const normalizeSdk5GroupEvent = (eventName, payload) => {
    const base = {
      id: payload.groupId,
      groupId: payload.groupId,
      from: '',
      to: '',
      members: [],
      reason: payload.reason || '',
    };
    switch (eventName) {
      case 'onInvitationReceived':
        return { ...base, operation: GROUP_OPERATION_TYPE.INVITE_TO_JOIN, from: payload.inviter?.userId };
      case 'onRequestToJoinReceived':
        return { ...base, operation: GROUP_OPERATION_TYPE.REQUEST_TO_JOIN, from: payload.applicant?.userId };
      case 'onRequestToJoinAccepted':
        return { ...base, operation: GROUP_OPERATION_TYPE.ACCEPT_REQUEST, from: payload.accepter?.userId };
      case 'onRequestToJoinDeclined':
        return { ...base, operation: GROUP_OPERATION_TYPE.JOIN_PUBLIC_GROUP_DECLINED, from: payload.decliner?.userId, to: payload.applicant?.userId };
      case 'onInvitationAccepted':
        return { ...base, operation: GROUP_OPERATION_TYPE.ACCEPT_INVITE, from: payload.invitee?.userId };
      case 'onInvitationDeclined':
        return { ...base, operation: GROUP_OPERATION_TYPE.REJECT_INVITE, from: payload.invitee?.userId };
      case 'onUserRemoved':
        return { ...base, operation: GROUP_OPERATION_TYPE.REMOVE_MEMBER };
      case 'onGroupDestroyed':
        return { ...base, operation: GROUP_OPERATION_TYPE.DESTROY };
      case 'onAutoAcceptInvitationFromGroup':
        return { ...base, operation: GROUP_OPERATION_TYPE.DIRECT_JOINED, from: payload.inviter?.userId, reason: payload.inviteMessage || '' };
      case 'onMuteListAdded':
        return { ...base, operation: GROUP_OPERATION_TYPE.MUTE_MEMBER, members: normalizeSdk5UserIds(payload.mutes) };
      case 'onMuteListRemoved':
        return { ...base, operation: GROUP_OPERATION_TYPE.UNMUTE_MEMBER, members: normalizeSdk5UserIds(payload.mutes) };
      case 'onAllowListAdded':
        return { ...base, operation: GROUP_OPERATION_TYPE.ADD_USER_TO_ALLOWLIST, members: normalizeSdk5UserIds(payload.allowlist) };
      case 'onAllowListRemoved':
        return { ...base, operation: GROUP_OPERATION_TYPE.REMOVE_ALLOWLIST_MEMBER, members: normalizeSdk5UserIds(payload.allowlist) };
      case 'onAllMemberMuteStateChanged':
        return { ...base, operation: payload.isMuted ? GROUP_OPERATION_TYPE.MUTE_ALL_MEMBERS : GROUP_OPERATION_TYPE.UNMUTE_ALL_MEMBERS };
      case 'onAdminAdded':
        return { ...base, operation: GROUP_OPERATION_TYPE.SET_ADMIN, to: payload.administrator?.userId };
      case 'onAdminRemoved':
        return { ...base, operation: GROUP_OPERATION_TYPE.REMOVE_ADMIN, to: payload.administrator?.userId };
      case 'onOwnerChanged':
        return { ...base, operation: GROUP_OPERATION_TYPE.CHANGE_OWNER, from: payload.oldOwner?.userId, to: payload.newOwner?.userId };
      case 'onMembersJoined':
        return { ...base, operation: GROUP_OPERATION_TYPE.MEMBERS_PRESENCE, members: normalizeSdk5UserIds(payload.members) };
      case 'onMembersExited':
        return { ...base, operation: GROUP_OPERATION_TYPE.MEMBERS_ABSENCE, members: normalizeSdk5UserIds(payload.members) };
      case 'onAnnouncementChanged':
        return { ...base, operation: payload.announcement ? GROUP_OPERATION_TYPE.UPDATE_ANNOUNCEMENT : GROUP_OPERATION_TYPE.DELETE_ANNOUNCEMENT };
      case 'onSharedFileAdded':
        return { ...base, operation: GROUP_OPERATION_TYPE.UPLOAD_FILE };
      case 'onSharedFileDeleted':
        return { ...base, operation: GROUP_OPERATION_TYPE.DELETE_FILE };
      case 'onGroupInfoChanged':
      case 'onGroupDisabledChanged':
        return { ...base, operation: GROUP_OPERATION_TYPE.UPDATE_INFO };
      case 'onGroupMemberAttributeChanged':
        return { ...base, operation: GROUP_OPERATION_TYPE.MEMBER_ATTRIBUTES_UPDATE, from: payload.user?.userId || payload.from || '', attributes: payload.attribute || {} };
      default:
        return null;
    }
  };
  const describeGroupEvent = (groupevent) => {
    const operation = groupevent?.operation || '';
    return {
      eventName: INFORM_TYPE[operation] || operation || '未知群组事件',
      operation: operation,
      groupId: groupevent?.id || groupevent?.groupId || '',
      operator: groupevent?.from || groupevent?.operator || '',
      members: normalizeGroupEventMembers(groupevent),
      invitee: groupevent?.invitee || '',
      applicant: groupevent?.applicant || '',
      owner: groupevent?.owner || '',
      memberCount: groupevent?.memberCount ?? '',
      reason: groupevent?.reason || '',
      attributes: groupevent?.attributes || {},
      rawEvent: groupevent,
    };
  };
  const onDispatchGroupEvent = (groupevent) => {
    if (!groupevent || typeof groupevent !== 'object') {
      console.warn('[onDispatchGroupEvent] 无效 groupevent', groupevent);
      return;
    }
    const { operation, id: groupId, from } = groupevent;
    switch (operation) {
      case GROUP_OPERATION_TYPE.CREATE:
      case GROUP_OPERATION_TYPE.DIRECT_JOINED:
      case GROUP_OPERATION_TYPE.ACCEPT_REQUEST:
      case GROUP_OPERATION_TYPE.ACCEPT_INVITE:
      case GROUP_OPERATION_TYPE.MEMBERS_PRESENCE:
        {
          store.dispatch('fetchJoinedGroupListFromServer', {
            startPageNum: 0,
            reset: true,
          });
          refreshGroupDetailFromServer(groupId);
          store.dispatch('fetchGroupsMemberFromServer', {
            groupId,
            chatType: 'groupChat',
          });
        }
        break;
      case GROUP_OPERATION_TYPE.MEMBER_PRESENCE:
      case GROUP_OPERATION_TYPE.MEMBER_ABSENCE:
      case GROUP_OPERATION_TYPE.MEMBERS_ABSENCE:
        {
          store.dispatch('fetchGroupsMemberFromServer', {
            groupId,
            chatType: 'groupChat',
          });
          refreshGroupDetailFromServer(groupId);
        }
        break;
      //群组公告更新
      case GROUP_OPERATION_TYPE.UPDATE_ANNOUNCEMENT:
      case GROUP_OPERATION_TYPE.DELETE_ANNOUNCEMENT:
        {
          store.dispatch('fetchAnnounmentFromServer', groupId);
        }
        break;
      case GROUP_OPERATION_TYPE.UPLOAD_FILE:
      case GROUP_OPERATION_TYPE.DELETE_FILE:
        {
          store.dispatch('fetchGroupSharedFilesFromServer', { groupId });
        }
        break;
      //群组管理员设置
      case GROUP_OPERATION_TYPE.SET_ADMIN:
        {
          store.commit('UPDATE_GORUPS_ADMIN', {
            type: GROUP_OPERATION_TYPE.SET_ADMIN,
            groupId,
            userId: from,
          });
        }
        break;
      //群组管理员取消
      case GROUP_OPERATION_TYPE.REMOVE_ADMIN:
        {
          store.commit('UPDATE_GORUPS_ADMIN', {
            type: GROUP_OPERATION_TYPE.REMOVE_ADMIN,
            groupId,
            userId: from,
          });
          refreshGroupDetailFromServer(groupId);
        }
        break;
      //群组成员禁言
      case GROUP_OPERATION_TYPE.MUTE_MEMBER:
        {
          store.dispatch('fetchGroupsMuteListFromServer', groupId);
        }
        break;
      //群组成员解除禁言
      case GROUP_OPERATION_TYPE.UNMUTE_MEMBER:
        {
          store.dispatch('fetchGroupsMuteListFromServer', groupId);
        }
        break;
      case GROUP_OPERATION_TYPE.MUTE_ALL_MEMBERS:
      case GROUP_OPERATION_TYPE.UNMUTE_ALL_MEMBERS:
      case GROUP_OPERATION_TYPE.ADD_USER_TO_ALLOWLIST:
      case GROUP_OPERATION_TYPE.REMOVE_ALLOWLIST_MEMBER:
      case GROUP_OPERATION_TYPE.UNBLOCK_MEMBER:
      case GROUP_OPERATION_TYPE.CHANGE_OWNER:
      case GROUP_OPERATION_TYPE.UPDATE_INFO:
        {
          refreshGroupDetailFromServer(groupId);
        }
        break;
      //被移出群组
      case GROUP_OPERATION_TYPE.REMOVE_MEMBER:
        {
          //从群组列表中删除某群
          store.commit('DELETE_JOINED_GROUP_LIST', {
            groupId: groupId,
          });
        }
        break;
      //群组解散
      case GROUP_OPERATION_TYPE.DESTROY:
        {
          //从群组列表中删除某群
          store.commit('DELETE_JOINED_GROUP_LIST', {
            groupId: groupId,
          });
        }
        break;
      //群成员更新了群组内成员属性
      case GROUP_OPERATION_TYPE.MEMBER_ATTRIBUTES_UPDATE:
        {
          store.commit('UsersProfile/UPDATE_USER_PROFILE', {
            userId: from,
            sourceType: 'group',
            groupId: groupId,
            profile: { nickName: groupevent?.attributes?.nickName },
          });
        }
        break;
      default:
        break;
    }
  };
  const mountGroupEventListener = () => {
    const onSdk5GroupEvent = (eventName, payload) => {
      const groupevent = normalizeSdk5GroupEvent(eventName, payload);
      if (eventName === 'onMembersExited') {
        console.log('[SDK 5.0 Group Event] onMembersExited', {
          groupId: payload.groupId,
          members: payload.members,
          rawEvent: payload,
        });
      }
      console.log('[SDK 5.0 Group Event] received', {
        eventName,
        rawEvent: payload,
        normalizedEvent: groupevent,
      });
      if (!groupevent) return;
      submitInformData(INFORM_FROM.GROUP, {
        ...groupevent,
        sdk5EventName: eventName,
        sdk5Payload: payload,
      });
      onDispatchGroupEvent(groupevent);
    };
    requireManager('groupManager').addEventHandler(
      'groupEvent',
      wrapImEventHandler({
        onInvitationReceived: (payload) => onSdk5GroupEvent('onInvitationReceived', payload),
        onRequestToJoinReceived: (payload) => onSdk5GroupEvent('onRequestToJoinReceived', payload),
        onRequestToJoinAccepted: (payload) => onSdk5GroupEvent('onRequestToJoinAccepted', payload),
        onRequestToJoinDeclined: (payload) => onSdk5GroupEvent('onRequestToJoinDeclined', payload),
        onInvitationAccepted: (payload) => onSdk5GroupEvent('onInvitationAccepted', payload),
        onInvitationDeclined: (payload) => onSdk5GroupEvent('onInvitationDeclined', payload),
        onUserRemoved: (payload) => onSdk5GroupEvent('onUserRemoved', payload),
        onGroupDestroyed: (payload) => onSdk5GroupEvent('onGroupDestroyed', payload),
        onAutoAcceptInvitationFromGroup: (payload) => onSdk5GroupEvent('onAutoAcceptInvitationFromGroup', payload),
        onMuteListAdded: (payload) => onSdk5GroupEvent('onMuteListAdded', payload),
        onMuteListRemoved: (payload) => onSdk5GroupEvent('onMuteListRemoved', payload),
        onAllowListAdded: (payload) => onSdk5GroupEvent('onAllowListAdded', payload),
        onAllowListRemoved: (payload) => onSdk5GroupEvent('onAllowListRemoved', payload),
        onAllMemberMuteStateChanged: (payload) => onSdk5GroupEvent('onAllMemberMuteStateChanged', payload),
        onAdminAdded: (payload) => onSdk5GroupEvent('onAdminAdded', payload),
        onAdminRemoved: (payload) => onSdk5GroupEvent('onAdminRemoved', payload),
        onOwnerChanged: (payload) => onSdk5GroupEvent('onOwnerChanged', payload),
        onMembersJoined: (payload) => onSdk5GroupEvent('onMembersJoined', payload),
        onMembersExited: (payload) => onSdk5GroupEvent('onMembersExited', payload),
        onAnnouncementChanged: (payload) => onSdk5GroupEvent('onAnnouncementChanged', payload),
        onSharedFileAdded: (payload) => onSdk5GroupEvent('onSharedFileAdded', payload),
        onSharedFileDeleted: (payload) => onSdk5GroupEvent('onSharedFileDeleted', payload),
        onGroupInfoChanged: (payload) => onSdk5GroupEvent('onGroupInfoChanged', payload),
        onGroupDisabledChanged: (payload) => onSdk5GroupEvent('onGroupDisabledChanged', payload),
        onGroupMemberAttributeChanged: (payload) => onSdk5GroupEvent('onGroupMemberAttributeChanged', payload),
      }),
    );
  };
  return {
    mountGroupEventListener,
  };
};
