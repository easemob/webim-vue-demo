const MSG_TYPE = 'rtcCallWithAgora'
const CALLSTATUS = {
	idle: 0,//闲置
	inviting: 1,//邀请中
	alerting: 2,//弹窗中
	confirmRing: 3, // caller
	receivedConfirmRing: 4, // callee
	answerCall: 5,
	receivedAnswerCall: 6,
	confirmCallee: 7
};

const CALL_ACTIONS_TYPE = {
	INVITE: 'invite', //邀请
	RTC_CALL: 'rtcCall',//rtcCall
	CANCEL: 'cancelCall',//取消
	ANSWER: 'answerCall',//答复
	ALERT: 'alert',//弹出通话窗口
	CONFIRM_RING: 'confirmRing',//窗口响铃待确认
	CONFIRM_CALLEE: "confirmCallee" //被叫方确认
}

const ANSWER_TYPE = {
	BUSY: 'busy', //忙碌
	ACCPET: 'accept',//同意
	REFUSE: 'refuse',//拒绝
}
export {
	MSG_TYPE,
	CALLSTATUS,
	CALL_ACTIONS_TYPE,
	ANSWER_TYPE
}