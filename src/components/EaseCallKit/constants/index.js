const MSG_TYPE = 'rtcCallWithAgora'
const CALL_INVITE_TEXT = {
    0: '邀请您进行语音通话~',
    1: '邀请您进行视频通话~',
    2: '邀请您进行多人会议~'
}
const CALL_TYPE = {
    0: 0,
    1: 1,
    2: 2
}
const CALLSTATUS = {
    idle: 0,//闲置
    inviting: 1,//邀请中
    alerting: 2,//弹窗中
    confirmRing: 3, // caller
    receivedConfirmRing: 4, // callee
    answerCall: 5,
    receivedAnswerCall: 6,
    confirmCallee: 7
}

const CALL_ACTIONS_TYPE = {
    INVITE: 'invite', //邀请
    RTC_CALL: 'rtcCall',//rtcCall
    CANCEL: 'cancelCall',//取消
    ANSWER: 'answerCall',//答复
    ALERT: 'alert',//弹出通话窗口
    CONFIRM_RING: 'confirmRing',//窗口响铃待确认
    CONFIRM_CALLEE: 'confirmCallee', //被叫方确认
    Video_TO_VOICE: 'videoToVoice'//视频转语音
}

const ANSWER_TYPE = {
    BUSY: 'busy', //忙碌
    ACCPET: 'accept',//同意
    REFUSE: 'refuse',//拒绝
}
export {
    MSG_TYPE,
    CALL_TYPE,
    CALL_INVITE_TEXT,
    CALLSTATUS,
    CALL_ACTIONS_TYPE,
    ANSWER_TYPE
}