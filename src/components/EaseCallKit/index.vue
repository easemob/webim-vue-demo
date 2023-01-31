<script setup>
import { ref, toRaw, onUnmounted } from 'vue'
import {
    CALLSTATUS,
    CALL_ACTIONS_TYPE,
    ANSWER_TYPE,
    CALL_TYPES
} from './constants'
import CallKitMessages from './utils/callMessages'
import { _setImClient } from './constants/imClient'
import { useManageChannel, useCallKitEvent } from './hooks'
import getRtcToken from './utils/getRtcToken'
import getChannelDetails from './utils/getChannelDetails'
/* 组件 */
//待确认弹出框
import AlertModal from './alertModal.vue'
//单人通话组件
import SingleCall from './components/singleCall.vue'
import MultiCall from './components/multiCall.vue'
/** 
                                ** 呼叫流程 **
    caller            -------------------------------------->          callee
            ----------inviting--------------->
                                        <-------------alerting-------
            ----------confirmRing------------>
                                        <-------------answerCall-----
            ----------confirmCallee---------->
*/

/* props */
const props = defineProps({
    //实力化后的SDK
    EaseIMClient: {
        type: Object,
        default: () => ({}),
        required: true
    },
    //消息创建方法
    msgCreateFunc: {
        type: Function,
        default: () => ({}),
        required: true
    }
})
/* emits */
const emits = defineEmits(['onInviteMembers'])
/* 环信相关初始化配置 */
// const { EaseIM, connectionName } = toRefs(props)
const { EaseIMClient, msgCreateFunc } = props
_setImClient(EaseIMClient, msgCreateFunc)
const msgListenerName = 'IM_MESSAGE'
EaseIMClient.addEventHandler('IM_CONNECT', {
    onConnected: () => {
        console.log('%c>>>>EaseCallKitIM已连接', 'color:green;')
        setMessageListener()
    },
    onDisconnected: () => {
        console.log('%c>>>>EaseCallKitIM已断开连接', 'color:red;')
        removeMessageListener()
    }
})
//设置信令监听
const setMessageListener = () => {
    console.log('>>>>>IM信令监听挂载')
    const msgListener = {
        onTextMessage: (msg) => {
            const { ext } = msg
            console.log('>>>>>收到文本信令消息', msg)
            if (ext && ext?.action === CALL_ACTIONS_TYPE.INVITE)
                handleCallKitInvite(msg)
        },
        onCmdMessage: (msg) => {
            console.log('>>>>>收到命令信令消息', msg)
            if (msg && msg?.action === CALL_ACTIONS_TYPE.RTC_CALL)
                handleCallKitCommand(msg)
        }
    }
    //防止重复设置监听，设置之前先执行移除
    removeMessageListener()
    EaseIMClient.addEventHandler(msgListenerName, msgListener)
    //初始化当前登录ID
    setLoginUserHxId()
}
//移除信令监听
const removeMessageListener = () =>
    EaseIMClient.removeEventHandler(msgListenerName)
//当前登录用户ID
const loginUserHxId = ref('')
const setLoginUserHxId = () => (loginUserHxId.value = EaseIMClient.user || '')
/* CallKit status */
const callCompsType = {
    singleCall: SingleCall,
    multiCall: MultiCall
}
const {
    callComponents,
    callKitStatus,
    callKitTimer,
    updateLocalStatus,
    updateChannelInfos,
    sendInviteMessage,
    inMultiChanelSendInviteMsg
} = useManageChannel()
const {
    EVENT_NAME,
    EVENT_LEVEL,
    CALLKIT_EVENT_TYPE,
    CALLKIT_EVENT_CODE,
    PUB_CHANNEL_EVENT
} = useCallKitEvent()
/* 信令部分 */
const SignalMsgs = new CallKitMessages()
//处理收到为文本的邀请信息
const handleCallKitInvite = (msgBody) => {
    console.log('>>>>>开始处理被邀请消息')
    const { from, ext } = msgBody || {}
    //邀请消息发送者为自己则忽略
    if (from === EaseIMClient.user) return
    //非空闲回复busy
    if (callKitStatus.localClientStatus > CALLSTATUS.idle) {
        console.log('>>>>>回复忙碌')
        const payload = {
            targetId: from,
            sendBody: ext
        }
        SignalMsgs.sendAnswerMsg(payload, ANSWER_TYPE.BUSY)
    } else {
        //更新当前频道信息
        updateChannelInfos(msgBody)
        //更新呼叫状态为alerting
        updateLocalStatus(CALLSTATUS.alerting)
        //通知呼叫方可以调起通话窗口
        SignalMsgs.sendAlertMsg(msgBody)
    }
}
//处理接收到通话交互过程的CMD命令消息
const handleCallKitCommand = (msgBody) => {
    //多端状态下信令消息发送者为自己则忽略
    if (msgBody.from === EaseIMClient.user) return
    console.log('>>>>开始处理command命令消息', msgBody)
    const cmdMsgBody = Object.assign({}, msgBody.ext) || {}
    const { calleeDevId, callerDevId } = cmdMsgBody
    const clientResource = EaseIMClient.context.jid.clientResource
    const { action } = cmdMsgBody
    const { localClientStatus, channelInfos } = callKitStatus
    //当前有效会议ID
    const currentCallKitCallId = callKitStatus.channelInfos.callId
    //返回给对方的confirmRing状态
    let status = true
    const params = {
        targetId: msgBody.from,
        sendBody: cmdMsgBody,
        status
    }
    //对方发布事件所需参数
    const eventParams = {
        type: {},
        ext: {},
        callType: 0,
        eventHxId: ''
    }
    switch (action) {
    case CALL_ACTIONS_TYPE.ALERT: //回复confirmring
        updateLocalStatus(CALLSTATUS.alerting)
        console.log(
            '%c>>>>>收到alert信令',
            'color:blue',
            currentCallKitCallId,
            status
        )
        // console.log('>>>>>收到alert信令', currentCallKitCallId)
        if (cmdMsgBody.callId !== currentCallKitCallId) {
            status = false
            console.warn('callId 于当前呼叫端callId 不一致')
            return
        }
        if (
            localClientStatus > CALLSTATUS.receivedConfirmRing &&
                channelInfos.callType !== 2
        ) {
            status = false
        }
        if (callerDevId !== clientResource) {
            console.warn('callerDevId 设备不相同')
            status = false
        }
        //如果status为true表明为有效的邀请，再更改为inviting,false表示无效邀请则更改为空闲状态。
        if (status) {
            SignalMsgs.sendConfirmRing(params)
            updateLocalStatus(CALLSTATUS.inviting)
        } else {
            SignalMsgs.sendConfirmRing(params)
            updateLocalStatus(CALLSTATUS.idle)
        }

        break
    case CALL_ACTIONS_TYPE.CONFIRM_RING:
        {
            //调起confirm待接听界面
            if (calleeDevId !== clientResource) return //【多端情况】被叫方设备id 如果不为当前用户登陆设备ID，则不处理。
            if (
                !cmdMsgBody.status &&
                    callKitStatus.localClientStatus <
                        CALLSTATUS.receivedConfirmRing
            ) {
                updateLocalStatus(CALLSTATUS.idle) //重置为闲置状态
                //todo 设置为初始化状态
            } //邀请失效，不弹出接听确认框
            //有效邀请则设置状态为收到confirmRing
            console.log('%chandle confimring', 'color:blue;')
            updateLocalStatus(CALLSTATUS.receivedConfirmRing)
        }
        break
    case CALL_ACTIONS_TYPE.ANSWER:
        {
            console.log('>>>>>cmdMsgBody', cmdMsgBody)
            if (callerDevId !== clientResource) return //【多端情况】被叫方设备id 如果不为当前用户登陆设备ID，则不处理。
            updateLocalStatus(CALLSTATUS.receivedAnswerCall)
            callKitTimer.value && clearTimeout(callKitTimer.value)
            const params = {
                targetId: msgBody.from,
                sendBody: cmdMsgBody
            }
            if (
                !callKitStatus.channelInfos.calleeDevId &&
                    callKitStatus.channelInfos.callType !== 2
            ) {
                //如果calleeDevId不存在，并且非多人音视频模式，主动更新频道信息
                if (cmdMsgBody.videoToVoice) {
                    callKitStatus.channelInfos.callType = 0
                }
                updateChannelInfos(msgBody)
            } else if (
                callKitStatus.channelInfos.calleeDevId !==
                        cmdMsgBody.calleeDevId &&
                    callKitStatus.channelInfos.callType !== 2
            ) {
                console.log(
                    'callKitStatus.channelInfos.calleeDevId',
                    callKitStatus.channelInfos.calleeDevId
                )
                //如果存在频道信息，但是与待呼叫确认的calleeDevId不一致直接发送拒绝应答。
                params.sendBody.result = ANSWER_TYPE.REFUSE
            }
            SignalMsgs.sendConfirmCallee(params)
            updateLocalStatus(CALLSTATUS.confirmCallee)
            if (cmdMsgBody.result !== ANSWER_TYPE.ACCPET) {
                console.log(
                    'callKitStatus.channelInfos.callType ',
                    callKitStatus.channelInfos.callType
                )
                if (callKitStatus.channelInfos.callType !== 2) {
                    //无论对方是忙碌还是拒接都讲通话状态更改为闲置。
                    if (cmdMsgBody.result === ANSWER_TYPE.BUSY) {
                        eventParams.type =
                                CALLKIT_EVENT_TYPE[
                                    CALLKIT_EVENT_CODE.CALLEE_BUSY
                                ]
                        eventParams.ext = { message: '对方正忙' }
                    }
                    if (cmdMsgBody.result === ANSWER_TYPE.REFUSE) {
                        eventParams.type =
                                CALLKIT_EVENT_TYPE[
                                    CALLKIT_EVENT_CODE.CALLEE_REFUSE
                                ]
                        eventParams.ext = { message: '对方拒绝接听' }
                    }
                    eventParams.callType =
                            callKitStatus.channelInfos.callType
                    eventParams.eventHxId = msgBody.from || ''
                    PUB_CHANNEL_EVENT(EVENT_NAME, { ...eventParams })
                    //修改当前状态为空闲
                    console.log('>>>>>修改当前状态为空闲')
                    return updateLocalStatus(CALLSTATUS.idle)
                }
            }
        }
        break
    case CALL_ACTIONS_TYPE.CONFIRM_CALLEE:
        {
            if (cmdMsgBody.calleeDevId !== clientResource) {
                if (msgBody.to === EaseIMClient.user) {
                    updateLocalStatus(CALLSTATUS.idle) //更改状态为闲置
                    console.log('%c 已在其他设备处理', 'color:red;')
                    eventParams.type =
                            CALLKIT_EVENT_TYPE[CALLKIT_EVENT_CODE.OTHER_HANDLE]
                    eventParams.ext = { message: '已在其他设备处理' }
                    eventParams.callType =
                            callKitStatus.channelInfos.callType
                    eventParams.eventHxId = msgBody.from || ''
                    PUB_CHANNEL_EVENT(EVENT_NAME, { ...eventParams })
                    return
                }
                return
            }
            // 防止通话中收到 busy refuse时挂断
            if (
                cmdMsgBody.result !== ANSWER_TYPE.ACCPET &&
                    callKitStatus.localClientStatus !== CALLSTATUS.confirmCallee
            ) {
                return updateLocalStatus(CALLSTATUS.idle) //更改状态为闲置
            }
            //变更状态为confirmCallee
            updateLocalStatus(CALLSTATUS.confirmCallee)
        }
        break
    case CALL_ACTIONS_TYPE.CANCEL: {
        if (msgBody.from === EaseIMClient.user) return //【多端情况】被叫方设备id 如果不为当前用户登陆设备ID，则不处理。
        if (msgBody.from === callKitStatus.channelInfos.callerIMName)
            return updateLocalStatus(CALLSTATUS.idle)
        eventParams.type =
                CALLKIT_EVENT_TYPE[CALLKIT_EVENT_CODE.CALLER_CANCEL]
        eventParams.ext = { message: '对方取消呼叫' }
        eventParams.callType = callKitStatus.channelInfos.callType
        eventParams.eventHxId = msgBody.from || ''
        PUB_CHANNEL_EVENT(EVENT_NAME, { ...eventParams })
        break
    }
    case CALL_ACTIONS_TYPE.VIDEO_TO_VOICE: {
        console.log('视频转语音通知')
        if (cmdMsgBody.callId !== callKitStatus.channelInfos.callType)
            return
        callKitStatus.channelInfos.callType = CALL_TYPES.SINGLE_VOICE
        break
    }

    default:
        console.log('>>>其他未知状态')
        break
    }
}
//发送接听或者拒接信令
const handleSendAnswerMsg = (sendType) => {
    const channelInfos = callKitStatus.channelInfos
    const payload = {
        targetId: channelInfos.callerIMName,
        sendBody: {
            callerDevId: channelInfos.callerDevId,
            callId: channelInfos.callId
        }
    }
    if (sendType === ANSWER_TYPE.ACCPET) {
        SignalMsgs.sendAnswerMsg(payload, ANSWER_TYPE.ACCPET)
        updateLocalStatus(CALLSTATUS.answerCall) //更改状态为已应答
        console.log('>>>>开始发送接听信令')
        //对外频道接听事件发布事件
        const eventParams = {
            type: CALLKIT_EVENT_TYPE[CALLKIT_EVENT_CODE.CALLEE_ACCPET],
            ext: { message: '通话已接听' },
            callType: callKitStatus.channelInfos.callType,
            eventHxId: channelInfos.callerIMName
        }
        //如果是多人就取对应群组ID
        if (callKitStatus.channelInfos.callType === 2) {
            eventParams.eventHxId = callKitStatus.channelInfos.groupId
        }
        PUB_CHANNEL_EVENT(EVENT_NAME, { ...eventParams })
    }
    if (sendType === ANSWER_TYPE.REFUSE) {
        SignalMsgs.sendAnswerMsg(payload, ANSWER_TYPE.REFUSE)
        updateLocalStatus(CALLSTATUS.idle) //更改状态为闲置
        console.log('>>>>开始发送挂断信令')
        //对外频道接听事件发布事件
        const eventParams = {
            type: CALLKIT_EVENT_TYPE[CALLKIT_EVENT_CODE.CALLEE_REFUSE],
            ext: { message: '已拒绝通话邀请' },
            callType: callKitStatus.channelInfos.callType,
            eventHxId: channelInfos.callerIMName
        }
        //如果是多人就取对应群组ID
        if (callKitStatus.channelInfos.callType === 2) {
            eventParams.eventHxId = callKitStatus.channelInfos.groupId
        }
        PUB_CHANNEL_EVENT(EVENT_NAME, { ...eventParams })
    }
}
//挂断信令
const handleCancelCall = () => {
    const targetId = callKitStatus.inviteTarget
    if (!targetId) return console.log('>>>挂断目标ID为空', targetId)
    //多人遍历发送取消
    if (callKitStatus.channelInfos.callType === CALL_TYPES.MULTI_VIDEO) {
        targetId.length &&
            targetId.forEach((userHxId) => {
                SignalMsgs.sendCannelMsg({
                    targetId: userHxId,
                    callId: callKitStatus.channelInfos.callId
                })
            })
        //对外频道接听事件发布事件
        const eventParams = {
            type: CALLKIT_EVENT_TYPE[CALLKIT_EVENT_CODE.CANCEL],
            ext: { message: '多人音视频通话已取消' },
            callType: CALL_TYPES.MULTI_VIDEO,
            eventHxId: callKitStatus.channelInfos.groupId
        }
        PUB_CHANNEL_EVENT(EVENT_NAME, { ...eventParams })
        updateLocalStatus(CALLSTATUS.idle)
    } else {
        SignalMsgs.sendCannelMsg({
            targetId,
            callId: callKitStatus.channelInfos.callId
        })
        //对外频道接听事件发布事件
        const eventParams = {
            type: CALLKIT_EVENT_TYPE[CALLKIT_EVENT_CODE.CANCEL],
            ext: { message: '通话已取消' },
            callType: callKitStatus.channelInfos.callType,
            eventHxId: targetId
        }
        PUB_CHANNEL_EVENT(EVENT_NAME, { ...eventParams })
        updateLocalStatus(CALLSTATUS.idle)
    }
}
//视频转语音
const handleVideoToVioce = () => {
    const { calleeIMName, callerIMName, callId } = callKitStatus.channelInfos
    const targetId =
        calleeIMName === EaseIMClient.user ? callerIMName : calleeIMName
    SignalMsgs.sendVideoToVioce(targetId, callId)
    callKitStatus.channelInfos.callType = CALL_TYPES.SINGLE_VOICE
}
/* 获取agoraToken */
const getAgoraRtcToken = async (callback) => {
    const username = EaseIMClient.user
    const channelName = callKitStatus.channelInfos.channelName
    console.log('channelNamechannelNamechannelName', channelName)
    if (!username && !channelName) return
    const { accessToken, agoraUserId } = await getRtcToken(EaseIMClient, {
        username,
        channelName
    })
    console.log('+_+_+_+_+_+获取房间token成功', accessToken, agoraUserId)
    callKitStatus.channelInfos.agoraChannelToken = accessToken
    callKitStatus.channelInfos.agoraUserId = agoraUserId
    callback()
}
/* 获取channel信息 */
const getAgoraChannelDetails = async (callback) => {
    console.log('>>>>>调用获取channel信息')
    const username = EaseIMClient.user
    const channelName = callKitStatus.channelInfos.channelName
    if (!username && !channelName) return
    const { result } = await getChannelDetails(EaseIMClient, {
        username,
        channelName
    })
    console.log('+_+_+_+_+_+获取房间内用户信息', result)
    callKitStatus.channelInfos.channelUsers = { ...result }
    callback()
}

/* 对外通知触发邀请事件 */
const onInviteMembers = ({ groupId }) => {
    emits('onInviteMembers', { groupId })
    console.log('可以对通知触发了邀请事件')
}
defineExpose({
    sendInviteMessage,
    inMultiChanelSendInviteMsg
})
/* 组件卸载操作 */
onUnmounted(() => {
    //移除消息监听
    removeMessageListener()
})
</script>
<template>
    <div class="container">
        <!-- 待确认弹出框 -->
        <AlertModal
            v-if="
                callKitStatus.localClientStatus ===
                CALLSTATUS.receivedConfirmRing
            "
            :callKitStatus="callKitStatus"
            @updateLocalStatus="updateLocalStatus"
            @handleSendAnswerMsg="handleSendAnswerMsg"
        />
        <!-- 音视频UI展示组件 -->
        <component
            :is="callCompsType[callComponents]"
            :callKitStatus="callKitStatus"
            :loginUserHxId="loginUserHxId"
            @getAgoraRtcToken="getAgoraRtcToken"
            @getAgoraChannelDetails="getAgoraChannelDetails"
            @updateLocalStatus="updateLocalStatus"
            @onInviteMembers="onInviteMembers"
            @handleCancelCall="handleCancelCall"
            @handleVideoToVioce="handleVideoToVioce"
        >
        </component>
    </div>
</template>

<style lang="scss" scoped>
// .container {
//     position: relative;
//     left: 0;
//     top: 0;
// }
</style>
