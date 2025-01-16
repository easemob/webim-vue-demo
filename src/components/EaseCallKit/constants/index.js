const MSG_TYPE = 'rtcCallWithAgora';
const CALL_INVITE_TEXT = {
  0: '邀请您进行语音通话',
  1: '邀请您进行视频通话',
  2: '邀请您进行多人通话',
};
const CALL_TYPES = {
  SINGLE_VOICE: 0,
  SINGLE_VIDEO: 1,
  MULTI_VIDEO: 2,
};
const CALL_TYPE = {
  [CALL_TYPES.SINGLE_VOICE]: 0, //一对一语音
  [CALL_TYPES.SINGLE_VIDEO]: 1, //一对一视频
  [CALL_TYPES.MULTI_VIDEO]: 2, //多人音视频
};
const CALLSTATUS = {
  idle: 0, //闲置
  inviting: 1, //邀请中
  alerting: 2, //弹窗中
  confirmRing: 3, // caller
  receivedConfirmRing: 4, // callee
  answerCall: 5,
  receivedAnswerCall: 6,
  confirmCallee: 7,
};

const CALL_ACTIONS_TYPE = {
  INVITE: 'invite', //邀请
  RTC_CALL: 'rtcCall', //rtcCall
  CANCEL: 'cancelCall', //取消
  ANSWER: 'answerCall', //答复
  ALERT: 'alert', //弹出通话窗口
  CONFIRM_RING: 'confirmRing', //窗口响铃待确认
  CONFIRM_CALLEE: 'confirmCallee', //被叫方确认
  VIDEO_TO_VOICE: 'videoToVoice', //视频转语音
};

const ANSWER_TYPE = {
  BUSY: 'busy', //忙碌
  ACCPET: 'accept', //同意
  REFUSE: 'refuse', //拒绝
};
export {
  MSG_TYPE,
  CALL_TYPES,
  CALL_TYPE,
  CALL_INVITE_TEXT,
  CALLSTATUS,
  CALL_ACTIONS_TYPE,
  ANSWER_TYPE,
};
