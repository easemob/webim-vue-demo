/** 操作类型：<br/>
 * create： 当前用户在其他设备上创建群组时触发。<br/>
 * destroy： 当群组销毁时触发。<br/>
 * requestToJoin：当有人申请加群时触发。只有群主和管理员会收到这个事件。<br/>
 * acceptRequest：当你的加群申请被通过时会触发。只有申请人会收到这个事件。<br/>
 * joinPublicGroupDeclined：当你的加群申请被拒绝时会触发。只有申请人会收到这个事件。<br/>
 * inviteToJoin：当收到加群邀请时触发。<br/>
 * acceptInvite：受邀人接受加群邀请时触发。<br/>
 * rejectInvite：当受邀人拒绝你的加群邀请时触发。<br/>
 * removeMember： 当被移除群组或被加入黑名单时触发。只有被移除的人会收到这个事件。<br/>
 * unblockMember： 当被从黑名单中移除时触发。只有被移除的人会收到这个事件。<br/>
 * updateInfo： 当修改群组信息时触发。<br/>
 * memberPresence：当有人加入群组时触发。 <br/>
 * memberAbsence： 当有人离开群组时触发。<br/>
 * directJoined：当不需要你的确认直接被拉进群时触发。
 * changeOwner：当转让群组时触发。只有新老群主会收到这个事件。
 * setAdmin： 当被设为管理员时触发。只有被设为管理员的人会收到这个事件。<br/>
 * removeAdmin：当被移除管理员时触发。只有被移除管理人员的人会收到这个事件。 <br/>
 * muteMember： 当被禁言时触发。只有被禁言的人会收到这个事件。<br/>
 * unmuteMember：当被解除禁言时触发。只有被解除禁言的人会收到这个事件。 <br/>
 * updateAnnouncement：当群组公告更新时触发。 <br/>
 * deleteAnnouncement：当删除群组公告时触发。 <br/>
 * uploadFile：当上传群组共享文件时触发。 <br/>
 * deleteFile：当删除群组共享文件时触发。 <br/>
 * addUserToAllowlist：当被加入群组白名单时触发。 <br/>
 * removeAllowlistMember：当被从群组白名单移除时触发。 <br/>
 * muteAllMembers：当群组全员禁言时触发。 <br/>
 * unmuteAllMembers：当群组解除全员禁言时触发。 <br/>
 * memberAttributesUpdate: 当群成员属性更新时触发。 <br/>
 */
export const GROUP_OPERATION_TYPE = {
  CREATE: 'create',
  DESTROY: 'destroy',
  REQUEST_TO_JOIN: 'requestToJoin',
  ACCEPT_REQUEST: 'acceptRequest',
  JOIN_PUBLIC_GROUP_DECLINED: 'joinPublicGroupDeclined',
  INVITE_TO_JOIN: 'inviteToJoin',
  ACCEPT_INVITE: 'acceptInvite',
  REJECT_INVITE: 'rejectInvite',
  REMOVE_MEMBER: 'removeMember',
  UNBLOCK_MEMBER: 'unblockMember',
  UPDATE_INFO: 'updateInfo',
  MEMBER_PRESENCE: 'memberPresence',
  MEMBER_ABSENCE: 'memberAbsence',
  DIRECT_JOINED: 'directJoined',
  CHANGE_OWNER: 'changeOwner',
  SET_ADMIN: 'setAdmin',
  REMOVE_ADMIN: 'removeAdmin',
  MUTE_MEMBER: 'muteMember',
  UNMUTE_MEMBER: 'unmuteMember',
  UPDATE_ANNOUNCEMENT: 'updateAnnouncement',
  DELETE_ANNOUNCEMENT: 'deleteAnnouncement',
  UPLOAD_FILE: 'uploadFile',
  DELETE_FILE: 'deleteFile',
  ADD_USER_TO_ALLOWLIST: 'addUserToAllowlist',
  REMOVE_ALLOWLIST_MEMBER: 'removeAllowlistMember',
  MUTE_ALL_MEMBERS: 'muteAllMembers',
  UNMUTE_ALL_MEMBERS: 'unmuteAllMembers',
  REMOVE_ALLOWLIST_MEMBER: 'removeAllowlistMember',
  MUTE_ALL_MEMBERS: 'muteAllMembers',
  UNMUTE_ALL_MEMBERS: 'unmuteAllMembers',
  MEMBER_ATTRIBUTES_UPDATE: 'memberAttributesUpdate',
};
export const GROUP_ROLE_TYPE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
};
