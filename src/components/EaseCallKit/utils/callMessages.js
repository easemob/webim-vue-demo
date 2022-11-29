import { IMClient, MsgCreateFn } from '../constants/imClient'
import { CALL_ACTIONS_TYPE, MSG_TYPE } from '../constants'

export default class CallKitMessages {
    constructor() {
        this.action = 'rtcCall'
        this.IMClient = IMClient
        this.msgCreateFn = MsgCreateFn
    }
    //发送邀请信令
    sendInviteMsg(targetId, callType, channelInfors) {
        const { channelName, callId, inviteMsgContent } = channelInfors
        const option = {
            type: 'txt',
            chatType: 'singleChat',
            msg: inviteMsgContent,
            to: targetId,
            ext: {
                action: CALL_ACTIONS_TYPE.INVITE,
                channelName: channelName,
                type: callType, // 0为1v1音频，1为1v1视频，2为多人通话
                callerDevId: this.IMClient.context.jid.clientResource, // 主叫方设备Id
                callId: callId, // 随机uuid，每次呼叫都不同，代表一次呼叫
                ts: Date.now(),
                msgType: MSG_TYPE,
                callerIMName: this.IMClient.context.jid.name,
            },
        }
        //如果是多人邀请并且groupId有参数时，在ext扩展字段中再增加一个ext并传入groupId
        if (callType === 2 && channelInfors.groupId) {
            option.ext.ext = { groupId: channelInfors.groupId }
        }
        return new Promise((resolve, reject) => {
            const msg = this.msgCreateFn.create(option)
            // 调用 `send` 方法发送该透传消息。
            this.IMClient.send(msg)
                .then((res) => {
                    // 消息成功发送回调。
                    console.log('invite Success', res)
                    resolve(res)
                })
                .catch((e) => {
                    // 消息发送失败回调。
                    console.log('invite Fail', e)
                    reject(e)
                })
        })
    }
    //发送告知主叫方confim确认中
    sendConfirmRing(payload) {
        const { status, targetId, sendBody } = payload
        console.log('>>>>>告知对方确认响铃', payload)
        const option = {
            type: 'cmd',
            chatType: 'singleChat',
            to: targetId,
            action: this.action,
            ext: {
                action: CALL_ACTIONS_TYPE.CONFIRM_RING,
                status: status,
                callerDevId: sendBody.callerDevId,
                calleeDevId: sendBody.calleeDevId,
                callId: sendBody.callId,
                ts: Date.now(),
                msgType: MSG_TYPE,
            },
        }
        const msg = this.msgCreateFn.create(option)
        // // 调用 `send` 方法发送该透传消息。
        this.IMClient.send(msg)
            .then((res) => {
                // 消息成功发送回调。
                console.log('ConfirmRing Success', res)
            })
            .catch((e) => {
                // 消息发送失败回调。
                console.log('ConfirmRing Fail', e)
            })
    }
    //发送视频转语音信令
    sendVideoToVioce(targetId, callId) {
        console.log('targetId', targetId)
        try {
            const option = {
                type: 'cmd',
                chatType: 'singleChat',
                to: targetId,
                action: this.action,
                ext: {
                    action: CALL_ACTIONS_TYPE.VIDEO_TO_VOICE,
                    callId: callId,
                    ts: Date.now(),
                    msgType: MSG_TYPE,
                },
            }
            const msg = this.msgCreateFn.create(option)
            this.IMClient.send(msg)
                .then((res) => {
                    // 消息成功发送回调。
                    console.log('videotovioce Success', res)
                })
                .catch((e) => {
                    // 消息发送失败回调。
                    console.log('videotovioc Fail', e)
                })
        } catch (error) {
            console.log('>>>>>失败', error)
        }
    }
    //发送给对方确认后的结果
    sendConfirmCallee(payload) {
        const { targetId, sendBody } = payload
        console.log('sendConfirmCalllee', payload)
        try {
            const option = {
                type: 'cmd',
                chatType: 'singleChat',
                to: targetId,
                action: this.action,
                ext: {
                    action: CALL_ACTIONS_TYPE.CONFIRM_CALLEE,
                    result: sendBody.result,
                    callerDevId: this.IMClient.context.jid.clientResource,
                    calleeDevId: sendBody.calleeDevId,
                    callId: sendBody.callId,
                    ts: Date.now(),
                    msgType: MSG_TYPE,
                },
            }
            const msg = this.msgCreateFn.create(option)
            console.log('%ccallee msg', 'color:purple', msg)
            // // 调用 `send` 方法发送该透传消息。
            this.IMClient.send(msg)
                .then((res) => {
                    // 消息成功发送回调。
                    console.log('Calllee Success', res)
                })
                .catch((e) => {
                    // 消息发送失败回调。
                    console.log('Calllee Fail', e)
                })
        } catch (error) {
            console.log('>>>>>失败', error)
        }
    }
    //发送通知弹出待接听窗口信令
    sendAlertMsg(payload) {
        const { from, ext } = payload
        const option = {
            type: 'cmd',
            chatType: 'singleChat',
            to: from,
            action: this.action,
            ext: {
                action: CALL_ACTIONS_TYPE.ALERT,
                calleeDevId: this.IMClient.context.jid.clientResource,
                callerDevId: ext.callerDevId,
                callId: ext.callId,
                ts: Date.now(),
                msgType: MSG_TYPE,
            },
        }
        console.log('>>>>>>>option', option)
        const msg = this.msgCreateFn.create(option)
        // // 调用 `send` 方法发送该透传消息。
        this.IMClient.send(msg)
            .then((res) => {
                // 消息成功发送回调。
                console.log('answer Success', res)
            })
            .catch((e) => {
                // 消息发送失败回调。
                console.log('anser Fail', e)
            })
    }
    //发送应答消息
    sendAnswerMsg(payload, answerType) {
        const { targetId, sendBody } = payload
        const option = {
            type: 'cmd',
            chatType: 'singleChat',
            // 设置消息接收方的用户 ID。
            to: targetId,
            // 设置自定义动作。对于透传消息，该字段必填。
            action: this.action,
            // 设置消息扩展信息。
            ext: {
                action: CALL_ACTIONS_TYPE.ANSWER,
                result: answerType,
                callerDevId: sendBody.callerDevId,
                calleeDevId: this.IMClient.context.jid.clientResource,
                callId: sendBody.callId,
                ts: Date.now(),
                msgType: MSG_TYPE,
            },
        }
        const msg = this.msgCreateFn.create(option)
        // // 调用 `send` 方法发送该透传消息。
        this.IMClient.send(msg)
            .then((res) => {
                // 消息成功发送回调。
                console.log('answer Success', res)
            })
            .catch((e) => {
                // 消息发送失败回调。
                console.log('anser Fail', e)
            })
    }
    //发送取消呼叫消息
    sendCannelMsg(payload) {
        console.log('>>>>>>>发送取消通话信令', payload)
        const { targetId, callId } = payload
        const option = {
            type: 'cmd',
            chatType: 'singleChat',
            // 设置消息接收方的用户 ID。
            to: targetId,
            // 设置自定义动作。对于透传消息，该字段必填。
            action: this.action,
            // 设置消息扩展信息。
            ext: {
                action: CALL_ACTIONS_TYPE.CANCEL,
                callerDevId: this.IMClient.context.jid.clientResource,
                callId: callId || '',
                ts: Date.now(),
                msgType: MSG_TYPE,
            },
        }
        const msg = this.msgCreateFn.create(option)
        // // 调用 `send` 方法发送该透传消息。
        this.IMClient.send(msg)
            .then((res) => {
                // 消息成功发送回调。
                console.log('Cannel Success', res)
            })
            .catch((e) => {
                // 消息发送失败回调。
                console.log('Cannel Fail', e, option)
            })
    }
}
