import { CALL_ACTIONS_TYPE, ANSWER_TYPE, MSG_TYPE } from '../constants'
export default class CallKitMessages {
    constructor(params) {
        const { IM, conn } = params
        this.action = 'rtcCall'
        this.IM = IM
        this.conn = IM[conn]
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
                callerDevId: this.conn.context.jid.clientResource, // 主叫方设备Id
                callId: callId, // 随机uuid，每次呼叫都不同，代表一次呼叫
                ts: Date.now(),
                msgType: MSG_TYPE,
                callerIMName: this.conn.context.jid.name,
            }
        }
        return new Promise((resolve, reject) => {
            const msg = this.IM.message.create(option)
            // // 调用 `send` 方法发送该透传消息。
            this.conn.send(msg).then((res) => {
                // 消息成功发送回调。
                console.log('invite Success', res)
                resolve(res)
            }).catch((e) => {
                // 消息发送失败回调。
                console.log('invite Fail', e)
                reject(e)
            })
        })
    }
    //发送告知主叫方confim确认中
    //发送视频转语音信令
    //发送给对方确认后的结果
    sendConfirmCallee(payload) {
        const { targetId, sendBody } = payload
        console.log('sendConfirmCalllee', payload)
        const option = {
            type: 'cmd',
            chatType: 'singleChat',
            to: targetId,
            action: this.action,
            ext: {
                action: CALL_ACTIONS_TYPE.ANSWER,
                result: sendBody.result,
                callerDevId: sendBody.callerDevId,
                calleeDevId: this.conn.context.jid.clientResource,
                callId: sendBody.callId,
                ts: Date.now(),
                msgType: MSG_TYPE
            }
        }
        const msg = this.IM.message.create(option)
        // // 调用 `send` 方法发送该透传消息。
        this.conn.send(msg).then((res) => {
            // 消息成功发送回调。
            console.log('answer Success', res)
        }).catch((e) => {
            // 消息发送失败回调。
            console.log('anser Fail', e)
        })
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
                calleeDevId: this.conn.context.jid.clientResource,
                callerDevId: ext.callerDevId,
                callId: ext.callId,
                ts: Date.now(),
                msgType: MSG_TYPE
            }
        }
        console.log('>>>>>>>option', option)
        const msg = this.IM.message.create(option)
        // // 调用 `send` 方法发送该透传消息。
        this.conn.send(msg).then((res) => {
            // 消息成功发送回调。
            console.log('answer Success', res)
        }).catch((e) => {
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
                calleeDevId: this.conn.context.jid.clientResource,
                callId: sendBody.callId,
                ts: Date.now(),
                msgType: MSG_TYPE
            }

        }
        const msg = this.IM.message.create(option)
        // // 调用 `send` 方法发送该透传消息。
        this.conn.send(msg).then((res) => {
            // 消息成功发送回调。
            console.log('answer Success', res)
        }).catch((e) => {
            // 消息发送失败回调。
            console.log('anser Fail', e)
        })
    }
}