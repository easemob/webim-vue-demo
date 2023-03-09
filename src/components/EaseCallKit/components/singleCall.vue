<script setup>
import {
    ref,
    watch,
    reactive,
    computed,
    toRefs,
    onMounted,
    onBeforeUnmount
} from 'vue'
import { AgoraAppId, AgoraRTC } from '../config/initAgoraRtc'
import { CALLSTATUS, CALL_TYPES } from '../constants'
/* hooks */
import { useCallKitEvent } from '../hooks'
/*mini组件*/
import MiniStreamContainer from './miniStreamContainer'
/* image url */
import microphone from '@/assets/callkit/microphone@2x.png'
import mutemicrophone from '@/assets/callkit/microphone-mute@2x.png'
/* vueUse */
//Draggable
import { useDraggable, useMouseInElement, useWindowSize } from '@vueuse/core'

const { width, height } = useWindowSize()
const singleContainer = ref(null)
const { style } = useDraggable(singleContainer, {
    initialValue: { x: width.value / 2 - 292 / 2, y: height.value - 750 },
    onMove: (position) => {
        if (position.x > width.value - 292) {
            position.x = width.value - 292
        }
        if (position.x < 0) {
            position.x = 0
        }
        if (position.y > height.value - 500) {
            position.y = height.value - 500
        }
        if (position.y < 0) {
            position.y = 0
        }
    },
    stopPropagation: true
})
//streamContral显隐
const streamContainer = ref(null)
const { isOutside } = useMouseInElement(streamContainer)
/* props */
const props = defineProps({
    callKitStatus: {
        type: Object,
        default: () => ({}),
        required: true
    }
})
const { callKitStatus } = toRefs(props)
/* 对外发布频道内事件 */
const {
    EVENT_NAME,
    CALLKIT_EVENT_TYPE,
    CALLKIT_EVENT_CODE,
    PUB_CHANNEL_EVENT
} = useCallKitEvent()
/* 视频UI控制 */
//是否最小化
const isMiniSize = ref(false)
const changeMiniSize = (bol) => {
    isMiniSize.value = bol
}
//channel是否接通
const isStreamPlay = ref(false)
//流播放容器
const smallContainer = ref(null)
const mainContainer = ref(null)
/* emits */
const emits = defineEmits([
    'getAgoraRtcToken',
    'updateLocalStatus',
    'handleCancelCall',
    'handleVideoToVioce'
])
/* AgoraRTC */
//client 初始化
let CallKitClient = null
let localVoiceTrack = null
let localVideoTrack = null
const localStreamStatus = reactive({
    voice: false,
    video: false
})
// CallKitClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
//使用H264协议是因为小程序仅支持H264协议
CallKitClient = AgoraRTC.createClient({ mode: 'live', codec: 'h264' })
//设置角色为主播
CallKitClient.setClientRole('host')
//媒体设备检查
const checkMediaDevice = async (callType) => {
    console.log('%c开启媒体检查', 'color:green')
    const eventParams = {
        type: {},
        ext: {},
        callType: callType
    }

    if (callType === CALL_TYPES.SINGLE_VOICE) {
        const devices = await AgoraRTC.getMicrophones()
        if (!devices.length) {
            eventParams.type =
                CALLKIT_EVENT_TYPE[CALLKIT_EVENT_CODE.NOT_HAVE_MICROPHONE]
            eventParams.ext.message = '未发现音频输入设备，请检查麦克风'
            PUB_CHANNEL_EVENT(EVENT_NAME, { ...eventParams })
        }
        console.log('getMicrophones devices', devices)
    }
    if (callType === CALL_TYPES.SINGLE_VIDEO) {
        const devices = await AgoraRTC.getCameras()
        const devices2 = await AgoraRTC.getMicrophones()
        if (!devices.length) {
            eventParams.type =
                CALLKIT_EVENT_TYPE[CALLKIT_EVENT_CODE.NOT_HAVE_CAMERA]
            eventParams.ext.message = '未发现视频输入设备，请检查摄像头'
            PUB_CHANNEL_EVENT(EVENT_NAME, { ...eventParams })
        }
        if (!devices2) {
            eventParams.type =
                CALLKIT_EVENT_TYPE[CALLKIT_EVENT_CODE.NOT_HAVE_MICROPHONE]
            eventParams.ext.message = '未发现音频输入设备，请检查麦克风'
            PUB_CHANNEL_EVENT(EVENT_NAME, { ...eventParams })
        }
        console.log('getCameras devices', devices, devices2)
    }
}
//Agora listenner
const setAgoraRtcListener = () => {
    console.log('>>>>>AgoraRtc监听挂载完毕')
    //监听用户发布流
    CallKitClient.on('user-published', async (user, mediaType) => {
        await CallKitClient.subscribe(user, mediaType)
        if (mediaType === 'video') {
            console.log('>>>>>>视频类型')
            const remoteVideoTrack = user.videoTrack
            console.log('remoteVideoTrack', remoteVideoTrack)
            setTimeout(() => {
                remoteVideoTrack.play(mainContainer.value)
                console.log('%c 远端流已播放', 'color:green')
            }, 300)
        }
        if (mediaType === 'audio') {
            console.log('>>>>>>音视类型')
            const remoteAudioTrack = user.audioTrack
            // Play the remote audio track. No need to pass any DOM element.
            remoteAudioTrack.play()
        }
    })
    //监听用户关闭推流
    CallKitClient.on('user-unpublished', (user, mediaType) => {
        console.log('>>>>>>监听到流移除', user, mediaType)
        if (mediaType === 'video') {
            console.log('>>>>>取消发布了视频流')
        }
        if (mediaType === 'audio') {
            console.log('>>>>>>取消发布了音频流')
        }
    })
    //监听用户离开回调
    CallKitClient.on('user-left', (user, reason) => {
        console.log('>>>>>>用户离开回调触发,离开原因', reason)
        leaveChannel(false)
    })
}

//挂载Agora监听
onMounted(() => {
    setAgoraRtcListener()
})
/* 频道控制 */
//监听本地端状态
watch(
    () => callKitStatus.value.localClientStatus,
    (newVal, oldVal) => {
        console.log('>>>>>>> single组件监听是否可加入房间', newVal, oldVal)
        if (newVal === CALLSTATUS.confirmCallee) {
            emitChannelToken()
        }
    },
    {
        immediate: true
    }
)

//通知获取频道token
const emitChannelToken = () => {
    const callback = async () => {
        console.log('>>>>触发了子组件的callback')
        await joinChannel()
    }
    emits('getAgoraRtcToken', callback)
}
//开启通话计时
const inChannelTimer = ref(null)
const timeCount = ref(0)
const startInChannelTimer = () => {
    inChannelTimer.value && clearInterval(inChannelTimer.value)
    inChannelTimer.value = setInterval(() => {
        timeCount.value++
        // console.log('%c通话计时开启中...', 'color:green', timeCount);
    }, 1000)
}
const formatTime = computed(() => {
    const m = Math.floor(timeCount.value / 60)
    const s = timeCount.value % 60
    const h = Math.floor(m / 60)
    const remMin = m % 60
    return `${h > 0 ? h + ':' : ''}${remMin < 10 ? '0' + remMin : remMin}:${
        s < 10 ? '0' + s : s
    }`
})
//加入频道【接听】
const joinChannel = async () => {
    const channelInfos = callKitStatus.value.channelInfos
    const channelName = channelInfos.channelName
    const agoraChannelToken = channelInfos.agoraChannelToken
    const agoraUserId = channelInfos.agoraUserId
    const callType = channelInfos.callType
    try {
        checkMediaDevice(callType)
        await CallKitClient.join(
            AgoraAppId,
            channelName,
            agoraChannelToken,
            agoraUserId
        )
        console.log('>>>>加入频道成功')
        //开启房间通话计时
        startInChannelTimer()
        localVoiceTrack = await AgoraRTC.createMicrophoneAudioTrack()
        // Create a local video track from the video captured by a camera.
        localVideoTrack = await AgoraRTC.createCameraVideoTrack()

        if (callType === CALL_TYPES.SINGLE_VOICE) {
            localVoiceTrack && (await CallKitClient.publish(localVoiceTrack))
            handleLocalStreamPublish('voice')
            console.log('%c---本地轨道音频推流成功', 'color:green')
        }
        if (callType === CALL_TYPES.SINGLE_VIDEO) {
            if (localVoiceTrack && localVideoTrack)
                await CallKitClient.publish([localVoiceTrack, localVideoTrack])
            setTimeout(() => {
                localVideoTrack.play(smallContainer.value)
            }, 300)
            handleLocalStreamPublish('allPlay')
            console.log('%c---本地轨道音频以及视频推流成功', 'color:green')
        }
        isStreamPlay.value = true
    } catch (error) {
        localVoiceTrack && localVoiceTrack.close()
        localVideoTrack && localVideoTrack.close()
        console.log('%c>>>>加入频道失败', 'color:red', error)
    }
}
//取消呼叫
const cancelCall = () => {
    //handleCancelCall 方法内会进行事件发送
    emits('handleCancelCall')
}
//离开频道【挂断&对方挂断】
const leaveChannel = async (isHangUp) => {
    console.log('》》》》》挂断')
    await CallKitClient.leave()
    //leaveType 主动挂断发送cannel信令
    if (isHangUp) {
        cancelCall()
    }
    const eventParams = {
        type: CALLKIT_EVENT_TYPE[CALLKIT_EVENT_CODE.HANGUP],
        ext: {
            message: `通话结束【${formatTime.value}】`,
            calltime_length: timeCount.value
        },
        callType: callKitStatus.value.channelInfos.callType,
        eventHxId: callKitStatus.value.channelInfos.callerIMName
    }
    PUB_CHANNEL_EVENT(EVENT_NAME, { ...eventParams })
    emits('updateLocalStatus', CALLSTATUS.idle)
}
//操纵publish & unpublish voiceStream videoStream
const handleLocalStreamPublish = (handleType) => {
    if (handleType === 'allPlay') {
        localStreamStatus.voice = true
        localStreamStatus.video = true
    }
    if (handleType === 'voice') {
        const voiceStatus = localStreamStatus.voice
        localVoiceTrack.setEnabled(!voiceStatus)
        localStreamStatus.voice = !voiceStatus
    }
    if (handleType === 'video') {
        const videoStatus = localStreamStatus.video
        localVideoTrack.setEnabled(!videoStatus)
        localStreamStatus.video = !videoStatus
    }
}
//切换视频流容器
const defaultStreamContainerClass = ref(true)
const changeStreamContainer = () =>
    (defaultStreamContainerClass.value = !defaultStreamContainerClass.value)
//组件卸载
onBeforeUnmount(() => {
    console.log('>>>>>>监听到组件卸载')
    localVoiceTrack && localVoiceTrack.close()
    localVideoTrack && localVideoTrack.close()
    //清除通话计时
    inChannelTimer.value && clearInterval(inChannelTimer.value)
})
</script>
<template>
    <div>
        <div
            v-show="!isMiniSize"
            ref="singleContainer"
            class="app_container"
            :style="style"
            style="position: fixed"
        >
            <div class="mini_stream_icon" @click="changeMiniSize(true)"></div>
            <div class="stream_container" ref="streamContainer">
                <!--  邀请页面    -->
                <template
                    v-if="
                        callKitStatus.localClientStatus === CALLSTATUS.inviting
                    "
                >
                    <div class="stream_invite_box" title="取消呼叫">
                        <img
                            class="invite_avatar"
                            src="@/assets/callkit/avatar-big@2x.png"
                            alt="头像"
                            draggable="false"
                        />
                        <p class="invite_name">
                            {{ callKitStatus.inviteTarget || '' }}
                        </p>
                        <p class="invite_text">
                            正在等待对方接收邀请<span class="dot"> ...</span>
                        </p>
                    </div>
                </template>
                <!-- 通话容器页面 -->
                <template
                    v-if="
                        callKitStatus.localClientStatus ===
                        CALLSTATUS.confirmCallee
                    "
                >
                    <div class="time">{{ formatTime }}</div>
                    <!--  语音通话      -->
                    <div
                        class="stream_audio_container"
                        v-show="callKitStatus.channelInfos.callType === 0"
                    >
                        <img
                            class="audio_avatar"
                            src="@/assets/callkit/avatar-big@2x.png"
                            alt="头像"
                        />
                        <p class="audio_name">
                            {{
                                callKitStatus.inviteTarget ||
                                callKitStatus.channelInfos.callerIMName
                            }}
                        </p>
                    </div>
                    <!--  视频通话      -->
                    <div
                        class="stream_video_container"
                        v-show="callKitStatus.channelInfos.callType === 1"
                    >
                        <div
                            :class="[
                                defaultStreamContainerClass
                                    ? 'smallContainer'
                                    : 'mainContainer'
                            ]"
                            ref="smallContainer"
                            @click="
                                () =>
                                    defaultStreamContainerClass &&
                                    changeStreamContainer()
                            "
                        ></div>
                        <div
                            :class="[
                                !defaultStreamContainerClass
                                    ? 'smallContainer'
                                    : 'mainContainer'
                            ]"
                            ref="mainContainer"
                            @click="
                                () =>
                                    !defaultStreamContainerClass &&
                                    changeStreamContainer()
                            "
                        ></div>
                    </div>
                </template>
                <!--      通话聊天控制按钮-->
                <div v-show="!isOutside" class="stream_control">
                    <template
                        v-if="
                            callKitStatus.localClientStatus ===
                            CALLSTATUS.inviting
                        "
                    >
                        <div class="stream_invite_btn" @click="cancelCall">
                            <img
                                src="@/assets/callkit/hangupCall@2x.png"
                                alt="取消"
                                draggable="false"
                            />
                            <p class="btn_text">取消</p>
                        </div>
                    </template>
                    <template
                        v-if="
                            callKitStatus.localClientStatus ===
                            CALLSTATUS.confirmCallee
                        "
                    >
                        <div
                            class="stream_calling_btn"
                            @click="handleLocalStreamPublish('voice')"
                        >
                            <img
                                :src="
                                    localStreamStatus.voice
                                        ? microphone
                                        : mutemicrophone
                                "
                                alt=""
                                draggable="false"
                            />
                            <p class="btn_text">语音</p>
                        </div>
                        <div
                            class="stream_calling_btn"
                            @click="leaveChannel(true)"
                        >
                            <img
                                src="@/assets/callkit/hangupCall@2x.png"
                                alt="挂断"
                                draggable="false"
                            />
                            <p class="btn_text">挂断</p>
                        </div>
                        <div
                            v-show="callKitStatus.channelInfos.callType === 1"
                            class="stream_calling_btn"
                            @click="
                                () => {
                                    emits('handleVideoToVioce')
                                }
                            "
                        >
                            <img
                                src="@/assets/callkit/change.png"
                                alt="转语音"
                                draggable="false"
                            />
                            <p class="btn_text">转语音</p>
                        </div>
                    </template>
                </div>
            </div>
        </div>
        <!--    mini通话容器-->
        <MiniStreamContainer
            v-show="isMiniSize"
            :show-type="isStreamPlay ? 1 : 0"
            :call-time="formatTime"
            @changeMiniSize="changeMiniSize"
        />
    </div>
</template>

<style lang="scss" scoped>
.app_container {
    width: 292px;
    height: 500px;
    border-radius: 4px;
    overflow: hidden;
    background: url('../../../assets/callkit/rtc-bg@2x.png') no-repeat;
    background-size: 100% 100%;
    cursor: move;
}

.mini_stream_icon {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 9999;
    width: 35px;
    height: 35px;
    background: url('../../../assets/callkit/narrow@2x.png');
    background-size: 100% 100%;
    cursor: pointer;
}

.stream_container {
    width: 100%;
    height: 100%;
    border-radius: 4px;
}

.time {
    position: absolute;
    top: 10px;
    left: 50%;
    margin-left: -146px;
    width: 100%;
    text-align: center;
    color: #fff;
    font-size: 12px;
    font-weight: 200;
    z-index: 999;
}

/* 邀请中页面 */
.stream_invite_box {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #fff;
    margin-top: 80px;
}

.invite_avatar {
    width: 72px;
    height: 72px;
    margin: 10px;
}

.invite_name {
    font-size: 17px;
    font-weight: 400;
    margin: 10px auto;
}

.invite_text {
    font-size: 12px;
    font-weight: 300;
}

/* 流播放页面 */
.stream_audio_container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #ffffff;
}

.audio_avatar {
    width: 72px;
    height: 72px;
    margin-top: 30px;
}

.audio_name {
    font-size: 17px;
    font-weight: 400;
    margin: 10px auto;
}

.stream_video_container {
    width: 100%;
    height: 100%;
}

.smallContainer {
    position: absolute;
    right: 0;
    top: 0;
    z-index: 99;
    width: 80px;
    height: 100px;
    background: url('../../../assets/callkit/video-bg@2x.png') no-repeat;
    background-size: 100% 100%;
    cursor: pointer;
}

.mainContainer {
    width: 100%;
    height: 100%;
}

/* 频道控制 */
.stream_control {
    position: absolute;
    left: 0;
    z-index: 99;
    bottom: 0;
    width: 100%;
    height: 100px;
    background: rgba(255, 255, 255, 0.108);
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    border-radius: 10px 10px 0 0;
}

.stream_invite_btn {
    width: 100px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.btn_text {
    color: #fff;
    font-size: 12px;
    font-weight: 300;
    margin-top: 5px;
}

.stream_invite_btn > img {
    width: 45px;
    height: 45px;
    transition: all 0.3s;
    cursor: pointer;
}

.stream_invite_btn > img:hover {
    transform: scale(1.2);
}

.stream_calling_btn {
    width: 100px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.stream_calling_btn > img {
    width: 45px;
    height: 45px;
    transition: all 0.3s;
    cursor: pointer;
}

.stream_calling_btn > img:hover {
    transform: scale(1.2);
}

.dot {
    font-family: simsun;
    animation: dot 1s infinite step-start;
    display: inline-block;
    width: 1.5em;
    vertical-align: bottom;
    overflow: hidden;
}

@keyframes dot {
    0% {
        width: 0;
        margin-right: 1.5em;
    }

    33% {
        width: 0.5em;
        margin-right: 1em;
    }

    66% {
        width: 1em;
        margin-right: 0.5em;
    }

    100% {
        width: 1.5em;
        margin-right: 0;
    }
}
</style>
