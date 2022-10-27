import { ref, reactive, watch } from 'vue';
import { CALLSTATUS, CALL_ACTIONS_TYPE, ANSWER_TYPE, CALL_INVITE_TEXT } from '../constants'
import createUid from '../utils/createUid';
import CallKitMessages from '../utils/callMessages'
//弹出组件类型
const callComponents = ref('')
//频道基础信息
const callKitStatus = reactive({
    localClientStatus: CALLSTATUS.idle,//callkit状态
    channelInfos: {
        channelName: '',//频道名
        agoraChannelToken: '', //频道token
        agoraUserId: '', //频道用户id
        callType: null, //0 语音 1 视频 2 多人音视频
        callId: null,//会议ID
        channelUsers: {}, //频道内用户
        callerDevId: '',//主叫方设备ID
        calleeDevId: '',//被叫方设备ID
        callerIMName: '',//主叫方环信ID
        calleeIMName: ''//被叫方环信ID
    }

})
//CallKit timer
const callKitTimer = ref(null);
export default function useManageChannel(EaseIM = {}, conn = 'conn') {
    if (!EaseIM || !conn) throw 'EaseIM or conn must pass！'
    /* localClientStatus 监听处理 */
    watch(() => callKitStatus.localClientStatus, (newClientStatus, oldClientStatus) => {
        console.log('%c 监听到本地客户端状态的改变', 'color:red', newClientStatus, oldClientStatus)
        // if (callKitStatus.localClientStatus === newClientStatus) return
        handleClientStatusForAction(newClientStatus)
    })
    /* CallKit status 管理 */
    //初始化频道信息
    const initChannelInfos = () => {
        callComponents.value = ''
        callKitStatus.localClientStatus = CALLSTATUS.idle
        callKitStatus.channelInfos = {
            channelName: '',//频道名
            agoraChannelToken: '', //频道token
            agoraUid: '', //频道用户id
            callType: null, //0 语音 1 视频 2 多人音视频
            callId: null,//会议ID
            channelUsers: {}, //频道内用户
            callerDevId: '',//主叫方设备ID
            calleeDevId: '',//被叫方设备ID
            confrontId: '',//要处理的目标ID
            callerIMName: '',//主叫方环信ID
            calleeIMName: '',//被叫方环信ID

        }
    }
    //处理不同clientstatus执行不同的操作
    const handleClientStatusForAction = (clientStatus) => {
        switch (clientStatus) {
            case CALLSTATUS.idle:
                console.log('%c >>>监听新状态为空闲处理，执行初始化', 'color:red')
                initChannelInfos()
                break
            case CALLSTATUS.inviting:
                if (callKitStatus.channelInfos.callType < 2 > 0) {
                    console.log('>>>>>>>展示单人音视频组件')
                    callComponents.value = 'singleCall'
                }
                if (callKitStatus.channelInfos.callType === 2) {
                    console.log('》》》》》展示多人音视频组件')
                    callComponents.value = 'multiCall'
                }
                console.log('>>>>>可以展开邀请窗口');
                break
            case CALLSTATUS.receivedConfirmRing:
                console.log('>>>>新状态为弹出框，执行弹出待确认框')
                break
            case CALLSTATUS.answerCall:
                console.log('>>>>>可以弹出通话接听UI组件')
                if (callKitStatus.channelInfos.callType < 2 > 0) {
                    console.log('>>>>>>>展示单人音视频组件')
                    callComponents.value = 'singleCall'
                }
                if (callKitStatus.channelInfos.callType === 2) {
                    console.log('》》》》》展示多人音视频组件')
                    callComponents.value = 'multiCall'
                }
                break
            case CALLSTATUS.confirmCallee: {
                console.log('%c >>>>>可以加入房间了', 'color:green;')
                console.log('++++++将入的频道类型是', callKitStatus.channelInfos.callType)

            }
                break
            default:
                break
        }
    }
    //更新localStatus
    const updateLocalStatus = (typeCode) => {
        console.log('>>>>>开始变更本地状态为 typeCode', typeCode)
        callKitStatus.localClientStatus = typeCode
    }
    //更新频道信息
    const updateChannelInfos = (msgBody) => {
        console.log('触发更新频道信息');
        const { from, to, ext } = msgBody || {}
        const params = {
            channelName: ext.channelName || '',
            callId: ext.callId || '',
            callType: ext.type || 0,
            callerDevId: ext.callerDevId || '',
            calleeDevId: ext.calleeDevId || EaseIM[conn].context.jid.clientResource,
            callerIMName: from,
            calleeIMName: to
        }
        Object.assign(callKitStatus.channelInfos, params)
    }
    //发送邀请信息功能
    const SignalMsgs = new CallKitMessages({ IM: EaseIM, conn: conn })
    const sendInviteMessage = async (targetId, callType) => {
        if (!targetId) throw 'targetId must pass！'
        if (callType === undefined || callType === null || callType < 0) throw 'callType must pass！'
        if (Array.isArray(targetId) && targetId.length < 1 || targetId.length > 15) throw 'targetId length  > 15 or length < 1'
        const channelInfors = {
            channelName: `${callType}_${createUid()}`,//频道名
            callId: createUid(),
            inviteMsgContent: CALL_INVITE_TEXT[callType]
        }
        try {
            //如果为数组就遍历发送
            if (Array.isArray(targetId)) {
                targetId.forEach(userId => {
                    SignalMsgs.sendInviteMsg(userId, callType, channelInfors)
                })

                console.log('>>>>>群组多人邀请开始遍历发消息');
            } else {
                //非数组就单条发送
                await SignalMsgs.sendInviteMsg(targetId, callType, channelInfors)
            }
            console.log('channelInforschannelInfors', channelInfors);
            updateLocalStatus(CALLSTATUS.inviting)
        } catch (error) {
            console.log('%c邀请信息发送失败', 'color:red');
        }
        //更改部分ChannelInfos
        callKitStatus.channelInfos.channelName = channelInfors.channelName
        callKitStatus.channelInfos.callId = channelInfors.callId
        callKitStatus.channelInfos.callType = callType


    }
    /* 管理 CallKit Timer */
    const startCallKitTimer = () => {
        if (callKitTimer.value) clearInterval(callKitTimer.value)
        callKitTimer.value = setInterval(() => {
            console.log('>>>>>邀请开始计时');
        }, 1000)
    }
    return {
        callComponents,
        callKitStatus,
        initChannelInfos,
        updateLocalStatus,
        updateChannelInfos,
        sendInviteMessage
    }
}