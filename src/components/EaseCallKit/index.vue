<script setup>
import { ref, reactive, toRefs, watch, onUnmounted } from 'vue'
import { CALLSTATUS, CALL_ACTIONS_TYPE, ANSWER_TYPE } from './constants'
import CallKitMessages from './utils/callMessages'
import getAgoraRtcToken from './utils/getRtcToken'
/* 组件 */
//待确认弹出框
import AlertModal from './alertModal.vue'
//单人通话组件
import SingleCall from './components/singleCall.vue';
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
/* 环信相关初始化配置 */
const { EaseIM, connectionName } = toRefs(props)
const conn = connectionName.value
const msgLisnnerName = 'IM_MESSAGE'
EaseIM.value[conn].addEventHandler('IM_CONNECT', {
    onConnected: () => {
        console.log('%c>>>>EaseCallKitIM已连接', 'color:green;');
        setMessageListener()
    },
    onDisconnected: () => {
        console.log('%c>>>>EaseCallKitIM已断开连接', 'color:red;');
        removeMessageListener()

    }
})
//设置信令监听
const setMessageListener = () => {
    console.log('>>>>>IM信令监听挂载');
    let msgListener = {
        onTextMessage: (msg) => {
            const { ext } = msg;
            console.log('>>>>>收到文本信令消息', msg);
            if (ext && ext?.action === CALL_ACTIONS_TYPE.INVITE) handleCallKitInvite(msg);
        },
        onCmdMessage: (msg) => {
            console.log('>>>>>收到命令信令消息', msg);
            if (msg && msg?.action === CALL_ACTIONS_TYPE.RTC_CALL) handleCallKitCommand(msg);
        }
    }
    //防止重复设置监听，设置之前先执行移除
    removeMessageListener()
    EaseIM.value[conn].addEventHandler(msgLisnnerName, msgListener)
}
//移除信令监听
const removeMessageListener = () => EaseIM.value[conn].removeEventHandler(msgLisnnerName)

/* CallKit status */
const callCompsType = {
    'singleCall': SingleCall,
    'multiCall': MultiCall,
}
let callComponents = ref('multiCall')
let callKitStatus = reactive({
    localClientStatus: CALLSTATUS.idle,//callkit状态
    channelInfos: {
        channelName: '',//频道名
        agoraChannelToken: '', //频道token
        agoraUserId: '', //频道用户id
        callType: null, //0 语音 1 视频 2 多人音视频
        callId: null,//会议ID
        callerDevId: '',//主叫方设备ID
        calleeDevId: '',//被叫方设备ID
        callerIMName: '',//主叫方环信ID
        calleeIMName: ''//被叫方环信ID
    }

})
//初始化频道信息
const initChannelInfos = () => {
    callComponents.value = ''
    callKitStatus.localClientStatus = CALLSTATUS.idle
    callKitStatus.channelInfos = {
        channelName: "",//频道名
        agoraChannelToken: '', //频道token
        agoraUid: '', //频道用户id
        callType: null, //0 语音 1 视频 2 多人音视频
        callId: null,//会议ID
        callerDevId: '',//主叫方设备ID
        calleeDevId: '',//被叫方设备ID
        confrontId: '',//要处理的目标ID
        callerIMName: '',//主叫方环信ID
        calleeIMName: ''//被叫方环信ID
    }
}
/* localClientStatus 监听处理 */
watch(() => callKitStatus.localClientStatus, (newClientStatus, oldClientStatus) => {
    console.log('%c 监听到本地客户端状态的改变', 'color:yellow', newClientStatus, oldClientStatus);
    handleClientStatusForAction(newClientStatus)
})
//处理不同clientstatus执行不同的操作
const handleClientStatusForAction = (clientStatus) => {
    switch (clientStatus) {
        case CALLSTATUS.idle:
            console.log('%c >>>监听新状态为空闲处理，执行初始化', 'color:red');
            initChannelInfos()
            break;
        case CALLSTATUS.receivedConfirmRing:
            console.log('>>>>新状态为弹出框，执行弹出待确认框');
            break;
        case CALLSTATUS.answerCall:
            console.log('>>>>>可以弹出通话接听UI组件');
            if (callKitStatus.channelInfos.callType < 2 > 0) {
                console.log('>>>>>>>展示单人音视频组件');
                callComponents.value = 'singleCall'
            }
            if (callKitStatus.channelInfos.callType === 2) {
                console.log('》》》》》展示多人音视频组件');
                callComponents.value = 'multiCall'
            }
            break;
        case CALLSTATUS.confirmCallee: {
            console.log('%c >>>>>可以加入房间了', 'color:green;');
            console.log('++++++将入的频道类型是', callKitStatus.channelInfos.callType);

        }
            break;
        default:
            break;
    }
}
/* CallKit status 管理 */
//更新localStatus
const updateLocalStatus = (typeCode) => {
    console.log('>>>>>开始变更本地状态为 typeCode', typeCode);
    callKitStatus.localClientStatus = typeCode;
}
//更新频道信息
const updateChannelInfos = (msgBody) => {
    const { from, to, ext } = msgBody || {}
    let params = {
        channelName: ext.channelName || '',
        callId: ext.callId || '',
        callType: ext.type || 0,
        callerDevId: ext.callerDevId || '',
        calleeDevId: ext.calleeDevId || EaseIM.value[conn].context.jid.clientResource,
        callerIMName: from,
        calleeIMName: to
    }
    Object.assign(callKitStatus.channelInfos, params)
}
/* 信令部分 */
const SignalMsgs = new CallKitMessages({ IM: EaseIM.value, conn: conn })
//处理收到为文本的邀请信息
const handleCallKitInvite = (msgBody) => {
    // console.log('>>>>>开始处理被邀请消息');
    const { from, ext } = msgBody || {};
    //邀请消息发送者为自己则忽略
    if (from === EaseIM.value[conn].user) return;
    //非空闲回复busy
    if (callKitStatus.localClientStatus > CALLSTATUS.idle) {
        console.log('>>>>>回复忙碌');
        let payload = {
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
    console.log('>>>>开始处理command命令消息', msgBody);
    const cmdMsgBody = msgBody.ext || {}
    const { calleeDevId } = cmdMsgBody
    const clientResource = EaseIM.value[conn].context.jid.clientResource
    const { action } = cmdMsgBody
    switch (action) {
        case CALL_ACTIONS_TYPE.ALERT: //回复confirmring
            break;

        case CALL_ACTIONS_TYPE.CONFIRM_RING: {//调起confirm待接听界面
            if (calleeDevId !== clientResource) return //【多端情况】被叫方设备id 如果不为当前用户登陆设备ID，则不处理。
            if (!cmdMsgBody.status && callKitStatus.localClientStatus < CALLSTATUS.receivedConfirmRing) {
                updateLocalStatus(CALLSTATUS.idle) //重置为闲置状态
                //todo 设置为初始化状态
            } //邀请失效，不弹出接听确认框
            //有效邀请则设置状态为收到confirmRing
            console.log('%chandle confimring', 'color:blue;');
            updateLocalStatus(CALLSTATUS.receivedConfirmRing)
        }
            break;
        case CALL_ACTIONS_TYPE.ANSWER: {
            console.log('>>>>>');
            if (calleeDevId !== clientResource) return //【多端情况】被叫方设备id 如果不为当前用户登陆设备ID，则不处理。
            let params = {
                targetId: msgBody.from,
                sendBody: cmdMsgBody
            }
            if (!callKitStatus.channelInfos.calleeDevId && callKitStatus.channelInfos.callType !== 2) {
                //如果calleeDevId不存在，并且非多人音视频模式，主动更新频道信息
                updateChannelInfos(msgBody)
            } else if (callKitStatus.channelInfos.calleeDevId !== cmdMsgBody.calleeDevId && callKitStatus.channelInfos.callType !== 2) {
                //如果存在频道信息，但是与待呼叫确认的calleeDevId不一致直接发送拒绝应答。
                params.sendBody.result = ANSWER_TYPE.REFUSE
            }
            SignalMsgs.sendConfirmCallee(params)
            if (cmdMsgBody.result !== ANSWER_TYPE.ACCPET) {
                let resultStatus = {
                    '忙碌': ANSWER_TYPE.BUSY,
                    '拒绝': ANSWER_TYPE.REFUSE
                }
                console.log('>>>>>>对方应答结果为：', Object.values(resultStatus[cmdMsgBody.result]));
                if (callKitStatus.localClientStatus.callType !== 2) { //无论对方是忙碌还是拒接都讲通话状态更改为闲置。
                    return updateLocalStatus(CALLSTATUS.idle)
                }
            }

        }
            break;
        case CALL_ACTIONS_TYPE.CONFIRM_CALLEE: {
            if (cmdMsgBody.calleeDevId !== EaseIM.value[conn].context.jid.clientResource) {
                if (msgBody.to === EaseIM.value[conn].user) {
                    updateLocalStatus(CALLSTATUS.idle) //更改状态为闲置
                    console.log('%c 已在其他设备处理', 'color:red;');
                    return;
                }
                return;
            }
            // 防止通话中收到 busy refuse时挂断
            if (cmdMsgBody.result !== ANSWER_TYPE.ACCPET && callKitStatus.localClientStatus !== CALLSTATUS.confirmCallee) {
                return updateLocalStatus(CALLSTATUS.idle) //更改状态为闲置
            }
            //变更状态为confirmCallee
            updateLocalStatus(CALLSTATUS.confirmCallee)
        }
            break;
        case CALL_ACTIONS_TYPE.CANCEL:
            if (msgBody.from === EaseIM.value[conn].user) return //【多端情况】被叫方设备id 如果不为当前用户登陆设备ID，则不处理。
            if (msgBody.from === callKitStatus.channelInfos.callerIMName) return updateLocalStatus(CALLSTATUS.idle);
            break;

        default:
            console.log('>>>其他未知状态');
            break;
    }
}
//发送接听挂断信令
const handleSendAnswerMsg = (sendType) => {
    const channelInfos = callKitStatus.channelInfos;
    let payload = {
        targetId: channelInfos.callerIMName,
        sendBody: {
            callerDevId: channelInfos.callerDevId,
            callId: channelInfos.callId
        }
    }
    if (sendType === ANSWER_TYPE.ACCPET) {
        SignalMsgs.sendAnswerMsg(payload, ANSWER_TYPE.ACCPET)
        updateLocalStatus(CALLSTATUS.answerCall) //更改状态为已应答
        console.log('>>>>开始发送接听信令');
    }
    if (sendType === ANSWER_TYPE.REFUSE) {
        SignalMsgs.sendAnswerMsg(payload, ANSWER_TYPE.REFUSE)
        updateLocalStatus(CALLSTATUS.idle) //更改状态为闲置
        console.log('>>>>开始发送挂断信令');
    }
}

/* 获取agoraToken */
const getRtcToken = async (callback) => {
    const username = EaseIM.value[conn].user
    const channelName = callKitStatus.channelInfos.channelName
    if (!username && !channelName) return
    const { accessToken, agoraUserId } = await getAgoraRtcToken(EaseIM.value[conn], { username, channelName })
    console.log('+_+_+_+_+_+获取房间token成功', accessToken, agoraUserId);
    callKitStatus.channelInfos.agoraChannelToken = accessToken
    callKitStatus.channelInfos.agoraUserId = agoraUserId
    callback()
}

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
        <component :is="callCompsType[callComponents]" :callKitStatus="callKitStatus" @getRtcToken="getRtcToken"
            @updateLocalStatus="updateLocalStatus">
        </component>
    </div>
</template>



<style lang="scss" scoped>
.container {
    position: relative;
    left: 0;
    top: 0;
}
</style>