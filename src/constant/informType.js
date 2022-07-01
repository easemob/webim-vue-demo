const INFORM_NAME = {
  FRIEND_INVITE: '好友申请',
  FRIEND_BUILD: '已成为好友',
  FRIEND_DELETED: '好友关系解除',
  FRIEND_APPLY_REFUSE: '好友申请被拒绝',
  FRIEND_APPLY_AGREE: '好友申请已通过',
  GROUP_JOIN_SUCCESS: '成员入群成功',
  GROUP_QUIT_SUCCESS: '成员退出群组成功',
  GROUP_INVITE_JOIN: '邀请加入群组',
  GROUP_REMOVE_MEMBER: '移出了群成员',
  GROUP_DIRECT_MEMBER: '被直接拉入群组',
};
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
};
const INFORM_FROM = {
  FRIEND: 'friend',
  GROUP: 'group',
};
export default {
  INFORM_TYPE,
  INFORM_FROM,
};
