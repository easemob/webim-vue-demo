import { getCurrentUserId, requireManager } from '../index';
import store from '@/store';
import eventEmitter from '@/utils/eventEmitter';
import { wrapImEventHandler } from '@/utils/safeCall';

const CHATROOM_EVENT_HANDLER_ID = 'chatroomEvent';

export const imChatroomListener = () => {
  const recordChatroomEvent = (eventName, payload) => {
    console.log('[SDK 5.0 ChatRoom Event] received', {
      handlerId: CHATROOM_EVENT_HANDLER_ID,
      eventName,
      chatRoomId: payload?.chatRoomId,
      currentUserId: getCurrentUserId(),
      rawEvent: payload,
    });
    Promise.resolve(
      store.dispatch('recordSdkEvent', {
        domain: 'chatRoom',
        eventName,
        payload,
        currentUserId: getCurrentUserId(),
      }),
    ).catch((error) => console.error('[imChatroomListener.recordSdkEvent]', error));
  };

  const mountChatroomEventListener = () => {
    const manager = requireManager('chatRoomManager');
    manager.removeEventHandler(CHATROOM_EVENT_HANDLER_ID);
    manager.addEventHandler(
      CHATROOM_EVENT_HANDLER_ID,
      wrapImEventHandler({
        onChatRoomDestroyed: (payload) => recordChatroomEvent('onChatRoomDestroyed', payload),
        onMembersJoined: (payload) => {
          recordChatroomEvent('onMembersJoined', payload);
          eventEmitter.emit('chatroomMembersJoined', payload);
        },
        onMembersExited: (payload) => recordChatroomEvent('onMembersExited', payload),
        onRemovedFromChatRoom: (payload) =>
          recordChatroomEvent('onRemovedFromChatRoom', payload),
        onMuteListAdded: (payload) => recordChatroomEvent('onMuteListAdded', payload),
        onMuteListRemoved: (payload) => recordChatroomEvent('onMuteListRemoved', payload),
        onAllowListAdded: (payload) => recordChatroomEvent('onAllowListAdded', payload),
        onAllowListRemoved: (payload) => recordChatroomEvent('onAllowListRemoved', payload),
        onAllMemberMuteStateChanged: (payload) =>
          recordChatroomEvent('onAllMemberMuteStateChanged', payload),
        onAdminAdded: (payload) => recordChatroomEvent('onAdminAdded', payload),
        onAdminRemoved: (payload) => recordChatroomEvent('onAdminRemoved', payload),
        onOwnerChanged: (payload) => recordChatroomEvent('onOwnerChanged', payload),
        onAnnouncementChanged: (payload) =>
          recordChatroomEvent('onAnnouncementChanged', payload),
        onChatRoomInfoChanged: (payload) =>
          recordChatroomEvent('onChatRoomInfoChanged', payload),
        onAttributesUpdate: (payload) => recordChatroomEvent('onAttributesUpdate', payload),
        onAttributesRemoved: (payload) =>
          recordChatroomEvent('onAttributesRemoved', payload),
      }),
    );
  };

  return {
    mountChatroomEventListener,
  };
};
