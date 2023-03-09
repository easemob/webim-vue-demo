<script setup>
import {
    ref,
    reactive,
    computed,
    watch,
    nextTick,
    toRaw,
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
import inviteIcon from '@/assets/callkit/invite_member@2x.png'
import microphone from '@/assets/callkit/microphone@2x.png'
import mutemicrophone from '@/assets/callkit/microphone-mute@2x.png'
import camera from '@/assets/callkit/camera@2x.png'
import closecamera from '@/assets/callkit/camera-close@2x.png'
/* vueUse */
//Draggable
import { useDraggable, useMouseInElement, useWindowSize } from '@vueuse/core'
const multiContainer = ref(null)
const { width, height } = useWindowSize()
const { style } = useDraggable(multiContainer, {
    initialValue: { x: 600, y: 40 },
    onMove: (position) => {
        if (position.x > width.value - 500) {
            position.x = width.value - 500
        }
        if (position.x < 0) {
            position.x = 0
        }
        if (position.y > height.value - 350) {
            position.y = height.value - 350
        }
        if (position.y < 0) {
            position.y = 0
        }
    },
    stopPropagation: true
})
/* 视频UI控制 */
//是否最小化
const isMiniSize = ref(false)
const changeMiniSize = (bol) => {
    isMiniSize.value = bol
}
//streamContral显隐
const streamContainer = ref(null)
const { isOutside } = useMouseInElement(streamContainer)
/* props */
const props = defineProps({
    callKitStatus: {
        type: Object,
        default: () => ({}),
        required: true
    },
    loginUserHxId: {
        type: String,
        default: '',
        required: true
    }
})
const { callKitStatus, loginUserHxId } = toRefs(props)
/* emits */
const emits = defineEmits([
    'getAgoraRtcToken',
    'getAgoraChannelDetails',
    'updateLocalStatus',
    'onInviteMembers',
    'handleCancelCall'
])
/* AgoraRTC */
//client 初始化
let CallKitClient = null
// CallKitClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
//使用H264协议是因为小程序仅支持H264协议
CallKitClient = AgoraRTC.createClient({ mode: 'live', codec: 'h264' })
//设置角色为主播
CallKitClient.setClientRole('host')
//本地音视频轨道
let localVoiceTrack = null
let localVideoTrack = null
const localStreamStatus = reactive({
    voice: false,
    video: false
})
//已在频道中的用户list
const inChannelUsersList = reactive([])
const setAgoraRtcListener = () => {
    console.log('>>>>>AgoraRtc监听挂载完毕')
    //监听到用用户加入了频道
    CallKitClient.on('user-joined', (user) => {
        const remoteUserId = user.uid.toString()
        handleRemoteContainer('create', remoteUserId)
        console.log('>>>>>加入频道的用户id', remoteUserId)
    })
    //监听用户发布流
    CallKitClient.on('user-published', async (user, mediaType) => {
        console.log('%c监听用户发布流', 'color:green')
        await CallKitClient.subscribe(user, mediaType)
        const remoteUserId = user.uid.toString()
        if (mediaType === 'video') {
            console.log('>>>>>>视频类型')
            const remoteVideoTrack = user.videoTrack
            nextTick(() => {
                const remotePlayerContainer =
                    document.getElementById(remoteUserId)
                if (remotePlayerContainer) {
                    setTimeout(() => {
                        remoteVideoTrack.play(remotePlayerContainer)
                    }, 300)
                } else {
                    console.log(
                        '+++++没有取到流容器remotePlayerContainer',
                        remotePlayerContainer
                    )
                    setTimeout(() => {
                        remoteVideoTrack.play(
                            document.getElementById(remoteUserId)
                        )
                    }, 500)
                }
                updateInChannelUserStatus('videoPlay', remoteUserId, true)
            })
        }
        if (mediaType === 'audio') {
            console.log('>>>>>>音视类型')
            const remoteAudioTrack = user.audioTrack
            // Play the remote audio track. No need to pass any DOM element.
            remoteAudioTrack.play()
            //更改状态为未闭麦
            updateInChannelUserStatus('muteStatus', remoteUserId, false)
        }
    })
    //监听用户发言音量
    //开启音量监听
    CallKitClient.enableAudioVolumeIndicator()
    CallKitClient.on('volume-indicator', (result) => {
        checkVolume(result)
    })
    //监听用户关闭推流
    CallKitClient.on('user-unpublished', (user, mediaType) => {
        console.log('>>>>>>监听到流移除', user, mediaType)
        const remoteUserId = user.uid.toString()
        if (mediaType === 'video') {
            console.log('>>>>>取消发布了视频流')
            updateInChannelUserStatus('videoPlay', remoteUserId, false)
        }
        if (mediaType === 'audio') {
            console.log('>>>>>>取消发布了音频流')
            //更改状态为已闭麦
            updateInChannelUserStatus('muteStatus', remoteUserId, true)
        }
    })
    //监听用户离开回调
    CallKitClient.on('user-left', (user, reason) => {
        console.log('>>>>>>用户离开回调触发,离开原因', reason)
        const remoteUserId = user.uid.toString()
        handleRemoteContainer('remove', remoteUserId)
        //如果频道内人数小于等于1则直接离开该频道
        if (inChannelUsersList.length === 0) {
            leaveChannel(remoteUserId)
        }
    })
}
//媒体设备检查
const checkMediaDevice = async (callType) => {
    console.log('%c开启媒体检查', 'color:green')
    const eventParams = {
        type: {},
        ext: {},
        callType: callType || CALL_TYPES.MULTI_VIDEO
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
    } else if (callType === CALL_TYPES.SINGLE_VIDEO || !callType) {
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
onMounted(() => {
    setAgoraRtcListener()
})
/* 对外发布频道内事件 */
const {
    EVENT_NAME,
    EVENT_LEVEL,
    CALLKIT_EVENT_TYPE,
    CALLKIT_EVENT_CODE,
    PUB_CHANNEL_EVENT
} = useCallKitEvent()
/* 频道控制 */
//监听本地端状态
watch(
    () => callKitStatus.value.localClientStatus,
    (newVal, oldVal) => {
        console.log('>>>>>>> multiCall组件监听是否可加入房间', newVal, oldVal)
        if (
            newVal === CALLSTATUS.confirmCallee &&
            oldVal !== CALLSTATUS.inviting
        ) {
            console.log('已应答加入')
            emitChannelToken()
        }
        if (newVal === CALLSTATUS.inviting) {
            console.log('邀请状态加入')
            setTimeout(() => {
                emitChannelToken()
            }, 500)
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
        joinChannel()
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
    return
}
const formatTime = computed(() => {
    const m = Math.floor(timeCount.value / 60)
    const s = timeCount.value % 60
    const h = Math.floor(m / 60)
    const remMin = m % 60
    // console.log('remMin', remMin);
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
    checkMediaDevice()
    try {
        await CallKitClient.join(
            AgoraAppId,
            channelName,
            agoraChannelToken,
            agoraUserId
        )
        startInChannelTimer()
        console.log('%c加入channel当中', 'color:green')
        inChannelUsersList.push({
            easeimUserId: loginUserHxId.value,
            agoraUserId: agoraUserId.toString(),
            volume: 0, //音量
            muteStatus: false,
            videoPlay: true
        })
        localVoiceTrack = await AgoraRTC.createMicrophoneAudioTrack()
        // Create a local video track from the video captured by a camera.
        localVideoTrack = await AgoraRTC.createCameraVideoTrack()
        if (localVoiceTrack && localVideoTrack)
            await CallKitClient.publish([localVoiceTrack, localVideoTrack])
        handleLocalStreamPublish('allPlay')
        setTimeout(() => {
            const myContainer = document.getElementById(`${agoraUserId}`)
            localVideoTrack.play(myContainer)
        }, 300)
        // console.log('>>>>>>音视频---本地轨道推流成功')
    } catch (error) {
        console.log('>>>>加入频道失败', error)
    }
}
//离开频道【挂断】
const leaveChannel = async () => {
    console.log('》》》》》挂断', callKitStatus.value.localClientStatus)
    if (
        [CALLSTATUS.inviting, CALLSTATUS.confirmRing].includes(
            callKitStatus.value.localClientStatus
        )
    ) {
        console.log('>>>>>>调用发送取消信令')
        await CallKitClient.leave()
        emits('handleCancelCall')
    } else {
        await CallKitClient.leave()
        const eventParams = {
            type: CALLKIT_EVENT_TYPE[CALLKIT_EVENT_CODE.HANGUP],
            ext: {
                message: `通话结束【${formatTime.value}】`,
                calltime_length: timeCount.value
            },
            callType: callKitStatus.value.channelInfos.callType,
            eventHxId: callKitStatus.value.channelInfos.groupId
        }
        PUB_CHANNEL_EVENT(EVENT_NAME, { ...eventParams })
    }
    emits('updateLocalStatus', CALLSTATUS.idle)
}
//处理DOM容器【包含创建以及移除】
const handleRemoteContainer = (handleType, userUid) => {
    if (handleType === 'create') {
        console.log('调用了创建视频容器', handleType, userUid)
        //查找该用户是否已在channellist中
        const isInChannel = inChannelUsersList.some(
            (item) => item.agoraUserId === userUid
        )
        if (isInChannel) return
        if (!isInChannel) {
            const channelUsers = callKitStatus.value.channelInfos.channelUsers
            if (channelUsers[userUid]) {
                console.log('>>>>包含该用户的对应信息')
                //包含直接进行添加
                inChannelUsersList.push({
                    easeimUserId: channelUsers[userUid],
                    agoraUserId: userUid.toString(),
                    volume: 0,
                    muteStatus: false,
                    videoPlay: false
                })
                return
            } else {
                console.log('>>>>不包含该用户的对应信息')
                const callback = () => {
                    const channelUsers =
                        callKitStatus.value.channelInfos.channelUsers
                    inChannelUsersList.push({
                        easeimUserId: channelUsers[userUid],
                        agoraUserId: userUid.toString(),
                        volume: 0,
                        muteStatus: false,
                        videoPlay: false
                    })
                    console.log('>>>>>执行添加一个新的容器', channelUsers)
                }
                emits('getAgoraChannelDetails', callback)
                return
            }
        }
    }
    if (handleType === 'remove') {
        if (document.getElementById(userUid)) {
            //从inChannelUserList中移除
            const _index = inChannelUsersList.findIndex(
                (item) => item.agoraUserId === userUid
            )
            if (_index > -1) inChannelUsersList.splice(_index, 1)
            const toBeRemoveChild = document.getElementById(userUid)
            streamContainer.value.removeChild(toBeRemoveChild)
        }
    }
}
//更新频道内用户推流以及音量状态
const updateInChannelUserStatus = (handleType, userUid, data) => {
    const channelUsers = callKitStatus.value.channelInfos.channelUsers
    const mapHxId = channelUsers[userUid]
    if (mapHxId) {
        const _index =
            inChannelUsersList.length > 0 &&
            inChannelUsersList.findIndex(
                (item) => item.easeimUserId === mapHxId
            )
        if (handleType === 'volume') {
            console.log('>>>>>更改音量状态', userUid, data)
            if (_index !== -1) {
                inChannelUsersList[_index].volume = data
            }
        }
        if (handleType === 'muteStatus') {
            if (_index !== -1) {
                inChannelUsersList[_index].muteStatus = data
            }
        }
        if (handleType === 'videoPlay') {
            if (_index !== -1) {
                inChannelUsersList[_index].videoPlay = data
            }
        }
    }
    // console.log('>>>>>开始更改状态', handleType, userUid, data);
}
//检查房间内音量
const checkVolume = (result) => {
    const channelUsers = callKitStatus.value.channelInfos.channelUsers
    result.forEach((volume) => {
        const { level } = volume
        const uid = volume.uid.toString()
        //uid对应的环信ID
        const mapHxId = channelUsers[uid]
        // console.log(`${index} UID ${uid} Level ${level}`);
        // console.log('%c inChannelUsersList', 'color:blue', toRaw(inChannelUsersList), 'uid+', uid);
        // console.log('channelUsers', Object.keys(channelUsers));
        if (mapHxId) {
            // console.log('+++++拿到具体的值', channelUsers[uid], loginUserHxId.value);
            const nowUidChannelInfo = inChannelUsersList.filter(
                (item) => item.easeimUserId === mapHxId
            )
            // console.log('nowUidChannelInfo', toRaw(nowUidChannelInfo[0]));
            if (toRaw(nowUidChannelInfo[0]).volume === 1 && level * 1 >= 5)
                return
            if (nowUidChannelInfo[0].muteStatus === true) {
                updateInChannelUserStatus('volume', uid, 0)
            }
            if (toRaw(nowUidChannelInfo[0]).volume === 0 && level * 1 >= 5) {
                updateInChannelUserStatus('volume', uid, 1)
            }
            if (toRaw(nowUidChannelInfo[0]).volume === 1 && level * 1 === 0) {
                updateInChannelUserStatus('volume', uid, 0)
            }
        }
    })
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
//邀请更多成员加入会议
const inviteMoreMembers = () => {
    const groupId = callKitStatus.value.channelInfos.groupId
    emits('onInviteMembers', { groupId })
}
//组件卸载
onBeforeUnmount(() => {
    //释放调用的媒体硬件权限
    localVoiceTrack && localVoiceTrack.close()
    localVideoTrack && localVideoTrack.close()
    console.log('>>>>>>监听到组件卸载')
    //清除通话计时
    inChannelTimer.value && clearInterval(inChannelTimer.value)
})
</script>
<template>
    <div>
        <div
            v-show="!isMiniSize"
            ref="multiContainer"
            class="app_container"
            :style="style"
            style="position: fixed"
        >
            <div class="mini_stream_icon" @click="changeMiniSize(true)"></div>
            <div class="time">{{ formatTime }}</div>
            <div class="stream_container" ref="streamContainer">
                <!-- 会议中流容器 -->
                <!-- inChannelUsersList -->
                <div
                    :class="[
                        inChannelUsersList.length <= 2
                            ? 'stream_two_user_container'
                            : 'stream_users_container'
                    ]"
                    v-for="item in inChannelUsersList"
                    :key="item.agoraUserId"
                    :id="item.agoraUserId"
                >
                    <div class="userInfo">
                        <!-- 用户名 暂时选择展示为环信ID，具体可自己定义。 -->
                        <span class="userIMId">{{ item.easeimUserId }}</span>
                        <span class="muteStatus" v-show="item.muteStatus"
                            >已闭麦</span
                        >
                        <img
                            class="volumeStatus"
                            v-show="item.volume > 0"
                            src="@/assets/callkit/talking@2x.png"
                        />
                    </div>
                </div>
                <!-- 会议中功能控制 -->
                <div v-show="!isOutside" class="stream_control">
                    <div class="stream_multiCall_btn">
                        <img
                            :src="inviteIcon"
                            alt=""
                            draggable="false"
                            @click="inviteMoreMembers"
                        />
                        <p class="btn_text">添加成员</p>
                    </div>
                    <div class="stream_multiCall_btn">
                        <img
                            :src="
                                localStreamStatus.voice
                                    ? microphone
                                    : mutemicrophone
                            "
                            @click="handleLocalStreamPublish('voice')"
                            alt=""
                            draggable="false"
                        />
                        <p class="btn_text">语音</p>
                    </div>
                    <div class="stream_multiCall_btn">
                        <img
                            src="@/assets/callkit/hangupCall@2x.png"
                            @click="leaveChannel"
                            alt=""
                            draggable="false"
                        />
                        <p class="btn_text">离开</p>
                    </div>
                    <div class="stream_multiCall_btn">
                        <img
                            :src="
                                localStreamStatus.video ? camera : closecamera
                            "
                            @click="handleLocalStreamPublish('video')"
                            alt=""
                            draggable="false"
                        />
                        <p class="btn_text">摄像头</p>
                    </div>
                </div>
            </div>
        </div>
        <div v-show="isMiniSize">
            <!--    mini通话容器-->
            <MiniStreamContainer
                v-show="isMiniSize"
                :show-type="1"
                :call-time="formatTime"
                @changeMiniSize="changeMiniSize"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.app_container {
    border-radius: 4px;
    overflow: hidden;
    padding: 5px;
    background: url('../../../assets/callkit/rtc-bg@2x.png') no-repeat;
    background-size: cover;
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

.time {
    position: absolute;
    top: 10px;
    left: 50%;
    margin-left: -250px;
    width: 100%;
    text-align: center;
    color: #fff;
    font-size: 12px;
    font-weight: 200;
    z-index: 999;
}

.stream_container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    width: 500px;
    min-height: 350px;
    border-radius: 4px;
    margin-top: 25px;
}

.stream_two_user_container {
    position: relative;
    width: 248px;
    height: 350px;
    margin: 5px 0;
    border-radius: 3px;
    background: url('../../../assets/callkit/rtc-bg@2x.png') no-repeat;
    background-size: 100% 100%;
    overflow: hidden;
}

.stream_users_container {
    position: relative;
    width: 200px;
    height: 200px;
    margin: 5px 0;
    border-radius: 3px;
    background: url('../../../assets/callkit/video-bg@2x.png') no-repeat;
    background-size: 100% 100%;
    overflow: hidden;
}

.userInfo {
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 99;
    background: rgba(255, 255, 255, 0.234);
    height: 35px;
    color: #fff;
    display: flex;
    flex-direction: row;
    width: 100%;
    align-items: center;
    justify-content: space-between;
}

.volumeStatus {
    width: 15px;
    height: 15px;
    margin-right: 3px;
}

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
    color: #fff;
}

.btn_text {
    color: #fff;
    font-size: 12px;
    font-weight: 300;
    margin-top: 5px;
}

.stream_multiCall_btn {
    width: 100px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.stream_multiCall_btn > img {
    width: 45px;
    height: 45px;
    transition: all 0.3s;
    cursor: pointer;
}
</style>
