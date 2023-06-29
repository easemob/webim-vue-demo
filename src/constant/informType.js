const INFORM_NAME = {
    FRIEND_INVITE: '好友申请',
    FRIEND_BUILD: '已成为好友',
    FRIEND_DELETED: '好友关系解除',
    FRIEND_APPLY_REFUSE: '好友申请被拒绝',
    FRIEND_APPLY_AGREE: '好友申请已通过',
    GROUP_JOIN_SUCCESS: '成员入群成功',
    GROUP_QUIT_SUCCESS: '成员退出群组成功',
    GROUP_INVITE_JOIN: '邀请加入群组',
    GROUP_REQUESTTOJOIN: '申请加入群组',
    GROUP_REMOVE_MEMBER: '移出了群成员',
    GROUP_DIRECT_MEMBER: '被直接拉入群组',
    GROUP_UPDATE_ANNOUNCEMENT: '更新了群组公告',
    GROUP_SET_ADMIN: '设定为管理员',
    GROUP_REMOVE_ADMIN: '移除管理员',
    GROUP_MUTE_MEMBER: '禁言成员',
    GROUP_UNMUTE_MEMBER: '移除成员禁言',
    GROUP_DESTORY: '解散群组',
    GROUP_ACCEPTREQUEST: '同意入群申请',
    GROUP_UPDATE_INFO: '更新群组信息',
    GROUP_UPDATE_MEMBER_ATTRIBUTES: '群组成员属性更新'
}
const INFORM_TYPE = {
    subscribe: INFORM_NAME.FRIEND_INVITE,
    subscribed: INFORM_NAME.FRIEND_BUILD,
    unsubscribed: INFORM_NAME.FRIEND_DELETED,
    other_person_refuse: INFORM_NAME.FRIEND_APPLY_REFUSE,
    other_person_agree: INFORM_NAME.FRIEND_APPLY_AGREE,
    memberPresence: INFORM_NAME.GROUP_JOIN_SUCCESS,
    memberAbsence: INFORM_NAME.GROUP_QUIT_SUCCESS,
    inviteToJoin: INFORM_NAME.GROUP_INVITE_JOIN,
    removeMember: INFORM_NAME.GROUP_REMOVE_MEMBER,
    directJoined: INFORM_NAME.GROUP_DIRECT_MEMBER,
    updateAnnouncement: INFORM_NAME.GROUP_UPDATE_ANNOUNCEMENT,
    setAdmin: INFORM_NAME.GROUP_SET_ADMIN,
    removeAdmin: INFORM_NAME.GROUP_REMOVE_ADMIN,
    muteMember: INFORM_NAME.GROUP_MUTE_MEMBER,
    unmuteMember: INFORM_NAME.GROUP_UNMUTE_MEMBER,
    destroy: INFORM_NAME.GROUP_DESTORY,
    requestToJoin: INFORM_NAME.GROUP_REQUESTTOJOIN,
    acceptRequest: INFORM_NAME.GROUP_ACCEPTREQUEST,
    updateInfo: INFORM_NAME.GROUP_UPDATE_INFO,
    memberAttributesUpdate: INFORM_NAME.GROUP_UPDATE_MEMBER_ATTRIBUTES
}
const INFORM_FROM = {
    FRIEND: 'friend',
    GROUP: 'group'
}
export default {
    INFORM_TYPE,
    INFORM_FROM
}
