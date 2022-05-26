const INFORM_NAME = {
  FRIEND_INVITE: '好友申请',
  FRIEND_BUILD: '已成为好友',
  FRIEND_DELETED: '好友关系解除',
  FRIEND_APPLY_REFUSE: '好友申请被拒绝',
  FRIEND_APPLY_AGREE: '好友申请已通过',
};
const INFORM_TYPE = {
  subscribe: INFORM_NAME.FRIEND_INVITE,
  subscribed: INFORM_NAME.FRIEND_BUILD,
  unsubscribed: INFORM_NAME.FRIEND_DELETED,
  other_person_refuse: INFORM_NAME.FRIEND_APPLY_REFUSE,
  other_person_agree: INFORM_NAME.FRIEND_APPLY_AGREE,
};
const INFORM_FROM = {
  FRIEND: 'friend',
  GROUP: 'group',
};
export default {
  INFORM_TYPE,
  INFORM_FROM,
};
