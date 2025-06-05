/** 消息类型：subscribe: 请求加好友，unsubscribed： 取消或拒绝加好友，subscribed： 加好友成功。 */
export const CONTACT_OPERATION_TYPE = {
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBED: 'unsubscribed',
  SUBSCRIBED: 'subscribed',
};
/**
 * 由于联系人事件监听回调操作类型只有以上三种类型，但是在UI上需要区分更多的类型，
 * 因此基于SDK事件类型自行区分不同回调类型 */
export const CONTACT_OPERATION_CUSTOM_TYPE = {
  CONTACT_INVITED: 'contact_invited', // 收到好友邀请
  CONTACT_ADDED: 'contact_added', // 新增联系人
  CONTACT_DELETED: 'contact_deleted', // 删除联系人
  CONTACT_REFUSE: 'contact_refuse', // 好友请求被拒绝
  CONTACT_AGREED: 'contact_agreed', // 好友请求被同意
};
