export const SESSION_MESSAGE_TYPE = {
  img: '[图片]',
  file: '[文件]',
  audio: '[语音]',
  loc: '[位置]',
  video: '[视频]',
};

export const CUSTOM_MSG_EVENT_TYPE = {
  userCard: '个人名片',
};
export const ALL_MESSAGE_TYPE = {
  TEXT: 'txt',
  IMAGE: 'img',
  AUDIO: 'audio',
  LOCAL: 'loc',
  VIDEO: 'video',
  FILE: 'file',
  CUSTOM: 'custom',
  CMD: 'cmd',
  INFORM: 'inform', //这个类型不在环信消息类型内，属于自己定义的一种系统通知类的消息。
};
export const CUSTOM_MESSAGE_TYPE = {
  INFORM: 'inform', //这个类型不在环信消息类型内，属于自己定义的一种系统通知类的消息。
};
export const CHAT_TYPE = {
  SINGLE: 'singleChat',
  GROUP: 'groupChat',
};

export const MENTION_ALL = {
  TEXT: '所有人',
  VALUE: 'ALL',
};
export const CHANGE_MESSAGE_BODAY_TYPE = {
  RECALL: 0,
  DELETE: 1,
  MODIFY: 2,
};

export const MESSAGE_STATUS = {
  SUCCESS: 'success',
  FAIL: 'fail',
  SENDING: 'sending',
};
export const MESSAGE_STATUS_TYPE = {
  READ_STATUS: 'readStatus',
  SEND_STATUS: 'sendStatus',
  CHANLE_STATUS: 'chanleStatus',
};

//单个消息列表最大长度
export const MAX_MESSAGE_LIST_COUNT = 100;
export default {
  SESSION_MESSAGE_TYPE,
  CUSTOM_MSG_EVENT_TYPE,
  ALL_MESSAGE_TYPE,
  CHAT_TYPE,
  MENTION_ALL,
  CHANGE_MESSAGE_BODAY_TYPE,
  MESSAGE_STATUS,
  MESSAGE_STATUS_TYPE,
};
