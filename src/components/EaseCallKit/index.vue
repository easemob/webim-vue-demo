<script setup>
import { ref, toRefs, onUnmounted } from 'vue'
import { CALLSTATUS, CALL_ACTIONS_TYPE, ANSWER_TYPE } from './constants'
import CallKitMessages from './utils/callMessages'
import { useManageChannel, useChannelEvent } from './hooks';
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
    //IMSDK对象
    EaseIM: {
        type: Object,
        default: () => ({}),
        required: true
    },
    //connection name （IMSDK实例化存放的对象名）
    connectionName: {
        type: String,
        default: () => 'conn',
        required: true
    }
})
/* emits */
const emits = defineEmits(['onInviteMembers'])
/* 环信相关初始化配置 */
const { EaseIM, connectionName } = toRefs(props)
const conn = connectionName.value
const msgLisnnerName = 'IM_MESSAGE'
EaseIM.value[conn].addEventHandler('IM_CONNECT', {
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
            if (ext && ext?.action === CALL_ACTIONS_TYPE.INVITE) handleCallKitInvite(msg)
        },
        onCmdMessage: (msg) => {
            console.log('>>>>>收到命令信令消息', msg)
            if (msg && msg?.action === CALL_ACTIONS_TYPE.RTC_CALL) handleCallKitCommand(msg)
        }
    }
    //防止重复设置监听，设置之前先执行移除
    removeMessageListener()
    EaseIM.value[conn].addEventHandler(msgLisnnerName, msgListener)
    //初始化当前登录ID
    setLoginUserHxId()
}
//移除信令监听
const removeMessageListener = () => EaseIM.value[conn].removeEventHandler(msgLisnnerName)
//当前登录用户ID
const loginUserHxId = ref('')
const setLoginUserHxId = () => loginUserHxId.value = EaseIM.value[conn].user || ''
//频道事件发布相关
const EVENT_NAME = 'EASECALLKIT'
const EVENT_LEVEL = {
    0: 'SUCCESS',
    1: "WARNING",
    2: "FAIL",
    3: "INFO"
}
/* CallKit status */
const callCompsType = {
    'singleCall': SingleCall,
    'multiCall': MultiCall,
}
const {
    callComponents,
    callKitStatus,
    callKitTimer,
    updateLocalStatus,
    updateChannelInfos,
    sendInviteMessage,
    inMultiChanelSendInviteMsg
} = useManageChannel(EaseIM.value, conn)
const { PUB_CHANNEL_ENENT } = useChannelEvent()
/* 信令部分 */
const SignalMsgs = new CallKitMessages({ IM: EaseIM.value, conn: conn })
//处理收到为文本的邀请信息
const handleCallKitInvite = (msgBody) => {
    console.log('>>>>>开始处理被邀请消息');
    const { from, ext } = msgBody || {}
    //邀请消息发送者为自己则忽略
    if (from === EaseIM.value[conn].user) return
    //非空闲回复busy
    if (callKitStatus.localClientStatus > CALLSTATUS.idle) {
        console.log('>>>>>回复忙碌')
        const payload = {
            targetId: from,
            sendBody: ext
        }
        SignalMsgs.sendAnswerMsg(payload, ANSWER_TYPE.BUSY)
        return
    } else {
        //更新当前频道信息
        updateChannelInfos(msgBody)
        //更新呼叫状态为alerting
        updateLocalStatus(CALLSTATUS.alerting)
        //通知呼叫方可以调起通话窗口
        SignalMsgs.sendAlertMsg(msgBody)
        return
    }

}
//处理接收到通话交互过程的CMD命令消息
const handleCallKitCommand = (msgBody) => {
    console.log('>>>>开始处理command命令消息', msgBody)
    const cmdMsgBody = Object.assign({}, msgBody.ext) || {}
    const { calleeDevId, callerDevId } = cmdMsgBody
    const clientResource = EaseIM.value[conn].context.jid.clientResource
    const { action } = cmdMsgBody
    switch (action) {
        case CALL_ACTIONS_TYPE.ALERT: //回复confirmring
            updateLocalStatus(CALLSTATUS.alerting)
            const { localClientStatus, channelInfos } = callKitStatus
            //当前有效会议ID
            const currentCallKitCallId = callKitStatus.channelInfos.callId
            //返回给对方的confirmRing状态
            let status = true;
            console.log('>>>>>收到alert信令', currentCallKitCallId);
            if (cmdMsgBody.callId !== currentCallKitCallId) {
                status = false;
                console.warn('callId 于当前呼叫端callId 不一致')
            };
            if (localClientStatus > CALLSTATUS.receivedConfirmRing && channelInfos.callType !== 2)
                status = false;
            if (callerDevId !== clientResource) {
                console.warn('callerDevId 设备不相同');
                return;
            }
            let params = {
                targetId: msgBody.from,
                sendBody: cmdMsgBody,
                status
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
        case CALL_ACTIONS_TYPE.CONFIRM_RING: {//调起confirm待接听界面
            if (calleeDevId !== clientResource) return //【多端情况】被叫方设备id 如果不为当前用户登陆设备ID，则不处理。
            if (!cmdMsgBody.status && callKitStatus.localClientStatus < CALLSTATUS.receivedConfirmRing) {
                updateLocalStatus(CALLSTATUS.idle) //重置为闲置状态
                //todo 设置为初始化状态
            } //邀请失效，不弹出接听确认框
            //有效邀请则设置状态为收到confirmRing
            console.log('%chandle confimring', 'color:blue;')
            updateLocalStatus(CALLSTATUS.receivedConfirmRing)
        }
            break
        case CALL_ACTIONS_TYPE.ANSWER: {
            console.log('>>>>>cmdMsgBody', cmdMsgBody)
            if (callerDevId !== clientResource) return //【多端情况】被叫方设备id 如果不为当前用户登陆设备ID，则不处理。
            updateLocalStatus(CALLSTATUS.receivedAnswerCall)
            callKitTimer.value && clearTimeout(callKitTimer.value)
            const params = {
                targetId: msgBody.from,
                sendBody: cmdMsgBody
            }
            if (!callKitStatus.channelInfos.calleeDevId && callKitStatus.channelInfos.callType !== 2) {
                //如果calleeDevId不存在，并且非多人音视频模式，主动更新频道信息
                if (cmdMsgBody.videoToVoice) { callKitStatus.channelInfos.callType = 0 }
                updateChannelInfos(msgBody)
            } else if (callKitStatus.channelInfos.calleeDevId !== cmdMsgBody.calleeDevId && callKitStatus.channelInfos.callType !== 2) {
                console.log('callKitStatus.channelInfos.calleeDevId', callKitStatus.channelInfos.calleeDevId);
                //如果存在频道信息，但是与待呼叫确认的calleeDevId不一致直接发送拒绝应答。
                params.sendBody.result = ANSWER_TYPE.REFUSE
            }
            SignalMsgs.sendConfirmCallee(params)
            updateLocalStatus(CALLSTATUS.confirmCallee)
            if (cmdMsgBody.result !== ANSWER_TYPE.ACCPET) {
                console.log('callKitStatus.channelInfos.callType ', callKitStatus.channelInfos.callType);
                if (callKitStatus.channelInfos.callType !== 2) { //无论对方是忙碌还是拒接都讲通话状态更改为闲置。
                    let msgText = {
                        'busy': '对方忙碌中',
                        'refuse': '对方拒绝接听'
                    }
                    PUB_CHANNEL_ENENT(EVENT_NAME, { type: EVENT_LEVEL[2], message: `${msgText[cmdMsgBody.result] || '未接听...'}` })
                    console.log('>>>>>修改当前状态为空闲');
                    return updateLocalStatus(CALLSTATUS.idle)
                }
            }

        }
            break
        case CALL_ACTIONS_TYPE.CONFIRM_CALLEE: {
            if (cmdMsgBody.calleeDevId !== clientResource) {
                if (msgBody.to === EaseIM.value[conn].user) {
                    updateLocalStatus(CALLSTATUS.idle) //更改状态为闲置
                    console.log('%c 已在其他设备处理', 'color:red;')
                    return
                }
                return
            }
            // 防止通话中收到 busy refuse时挂断
            if (cmdMsgBody.result !== ANSWER_TYPE.ACCPET && callKitStatus.localClientStatus !== CALLSTATUS.confirmCallee) {
                return updateLocalStatus(CALLSTATUS.idle) //更改状态为闲置
            }
            //变更状态为confirmCallee
            updateLocalStatus(CALLSTATUS.confirmCallee)
        }
            break
        case CALL_ACTIONS_TYPE.CANCEL: {
            if (msgBody.from === EaseIM.value[conn].user) return //【多端情况】被叫方设备id 如果不为当前用户登陆设备ID，则不处理。
            if (msgBody.from === callKitStatus.channelInfos.callerIMName) return updateLocalStatus(CALLSTATUS.idle)
            break
        }
        case CALL_ACTIONS_TYPE.VIDEO_TO_VOICE: {
            console.log('视频转语音通知');
            callKitStatus.channelInfos.callType = 0
            break;
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
    }
    if (sendType === ANSWER_TYPE.REFUSE) {
        SignalMsgs.sendAnswerMsg(payload, ANSWER_TYPE.REFUSE)
        updateLocalStatus(CALLSTATUS.idle) //更改状态为闲置
        console.log('>>>>开始发送挂断信令')
    }
}
//挂断信令
const handleCancelCall = () => {
    const targetId = callKitStatus.inviteTarget
    if (!targetId) return console.log('>>>挂断目标ID为空');
    SignalMsgs.sendCannelMsg({ targetId, callId: callKitStatus.channelInfos.callId })
    updateLocalStatus(CALLSTATUS.idle)
}
/* 获取agoraToken */
const getAgoraRtcToken = async (callback) => {
    const username = EaseIM.value[conn].user
    const channelName = callKitStatus.channelInfos.channelName
    console.log('channelNamechannelNamechannelName', channelName);
    if (!username && !channelName) return
    const { accessToken, agoraUserId } = await getRtcToken(EaseIM.value[conn], { username, channelName })
    console.log('+_+_+_+_+_+获取房间token成功', accessToken, agoraUserId)
    callKitStatus.channelInfos.agoraChannelToken = accessToken
    callKitStatus.channelInfos.agoraUserId = agoraUserId
    callback()
}
/* 获取channel信息 */
const getAgoraChannelDetails = async (callback) => {
    console.log('>>>>>调用获取channel信息');
    const username = EaseIM.value[conn].user
    const channelName = callKitStatus.channelInfos.channelName
    if (!username && !channelName) return
    const { result } = await getChannelDetails(EaseIM.value[conn], { username, channelName })
    console.log('+_+_+_+_+_+获取房间内用户信息', result)
    callKitStatus.channelInfos.channelUsers = { ...result }
    callback()

}

/* 对外通知触发邀请事件 */
const onInviteMembers = ({ groupId }) => {
    emits('onInviteMembers', { groupId })
    console.log('可以对通知触发了邀请事件');
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
        <AlertModal v-if="callKitStatus.localClientStatus === CALLSTATUS.receivedConfirmRing"
            :callKitStatus="callKitStatus" @updateLocalStatus="updateLocalStatus"
            @handleSendAnswerMsg="handleSendAnswerMsg" />
        <!-- 音视频UI展示组件 -->
        <component :is="callCompsType[callComponents]" :callKitStatus="callKitStatus" :loginUserHxId="loginUserHxId"
            @getAgoraRtcToken="getAgoraRtcToken" @getAgoraChannelDetails="getAgoraChannelDetails"
            @updateLocalStatus="updateLocalStatus" @onInviteMembers="onInviteMembers"
            @handleCancelCall="handleCancelCall">
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