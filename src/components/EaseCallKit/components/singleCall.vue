<script setup>
import {ref, watch, reactive, computed, toRefs, onMounted, onBeforeUnmount} from 'vue'
import {AgoraAppId, AgoraRTC} from '../config/initAgoraRtc'
import {CALLSTATUS} from '../constants'
/* image url */
import microphone from '@/assets/callkit/microphone@2x.png'
import mutemicrophone from '@/assets/callkit/microphone-mute@2x.png'
import camera from '@/assets/callkit/camera@2x.png'
import closecamera from '@/assets/callkit/camera-close@2x.png'
/* vueUse */
//Draggable
import {useDraggable, useMouseInElement} from '@vueuse/core'

const singleContainer = ref(null)
const {style} = useDraggable(singleContainer, {
    initialValue: {x: 600, y: 40},
})
//streamContral显隐
const streamContainer = ref(null)
const {isOutside} = useMouseInElement(streamContainer)
/* props */
const props = defineProps({
    callKitStatus: {
        type: Object,
        default: () => ({}),
        required: true,
    }
})
const {callKitStatus} = toRefs(props)
/* 视频UI控制 */
//是否最小化
// const isMiniSize = ref(false)
//channel是否接通
const isStreamPlay = ref(false)
//流播放容器
const smallContainer = ref(null)
const mainContainer = ref(null)
/* emits */
const emits = defineEmits(['getAgoraRtcToken', 'updateLocalStatus', 'handleCancelCall'])
/* AgoraRTC */
//client 初始化
let CallKitClient = null
let localVoiceTrack = null
let localVideoTrack = null
const localStreamStatus = reactive({
    voice: false,
    video: false
})
CallKitClient = AgoraRTC.createClient({mode: 'rtc', codec: 'vp8'})
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
        leaveChannel()
    })
}
onMounted(() => {
    setAgoraRtcListener()
})

/* 频道控制 */

//监听本地端状态
watch(() => callKitStatus.value.localClientStatus, (newVal, oldVal) => {
    console.log('>>>>>>> single组件监听是否可加入房间', newVal, oldVal)
    if (newVal === CALLSTATUS.confirmCallee) {
        emitChannelToken()
    }
    //单人一对一通话，对方应答之后再选择加入频道中
    // if (newVal === CALLSTATUS.inviting) {
    //     setTimeout(() => {
    //         emitChannelToken()
    //     }, 500)
    // }
}, {
    immediate: true
})

//通知获取频道token
const emitChannelToken = () => {
    const callback = async () => {
        console.log('>>>>触发了子组件的callback')
        await joinChannel()
    }
    emits('getAgoraRtcToken', callback)

}
//取消呼叫
const cancelCall = () => {
    emits('handleCancelCall')
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
    return `${h > 0 ? h + ':' : ''}${remMin < 10 ? '0' + remMin : remMin}:${s < 10 ? '0' + s : s}`
})
//加入频道【接听】
const joinChannel = async () => {
    const channelInfos = callKitStatus.value.channelInfos
    const channelName = channelInfos.channelName
    const agoraChannelToken = channelInfos.agoraChannelToken
    const agoraUserId = channelInfos.agoraUserId
    const callType = channelInfos.callType
    try {
        await CallKitClient.join(AgoraAppId, channelName, agoraChannelToken, agoraUserId)
        console.log('>>>>加入频道成功')
        //开启房间通话计时
        startInChannelTimer()
        localVoiceTrack = await AgoraRTC.createMicrophoneAudioTrack()
        // Create a local video track from the video captured by a camera.
        localVideoTrack = await AgoraRTC.createCameraVideoTrack()

        if (callType === 0) {
            localVoiceTrack && await CallKitClient.publish(localVoiceTrack)
            handleLocalStreamPublish('voice')
            console.log('%c---本地轨道音频推流成功', 'color:green')
        }
        if (callType === 1) {
            if (localVoiceTrack && localVideoTrack) await CallKitClient.publish([localVoiceTrack, localVideoTrack])
            setTimeout(() => {
                localVideoTrack.play(smallContainer.value)
            }, 300)
            handleLocalStreamPublish('allPlay')
            console.log('%c---本地轨道音频以及视频推流成功', 'color:green')
        }
        isStreamPlay.value = true
    } catch (error) {
        console.log('%c>>>>加入频道失败', 'color:red', error)
    }

}
//离开频道【挂断&对方挂断】
const leaveChannel = async () => {
    console.log('》》》》》挂断')
    await CallKitClient.leave()
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
const changeStreamContainer = () => defaultStreamContainerClass.value = !defaultStreamContainerClass.value
//组件卸载
onBeforeUnmount(() => {
    console.log('>>>>>>监听到组件卸载')
    localVoiceTrack && localVoiceTrack.close()
    localVoiceTrack && localVideoTrack.close()
    //清除通话计时
    inChannelTimer.value && clearInterval(inChannelTimer.value)
})
</script>
<template>
  <div ref="singleContainer" class="app_container" :style="style" style="position: fixed">
    <div class="stream_container" ref="streamContainer">
      <!--  邀请页面    -->
      <template v-if="callKitStatus.localClientStatus === CALLSTATUS.inviting">
        <div class="stream_invite_box" title="取消呼叫">
          <img class="invite_avatar" src="@/assets/callkit/avatar-big@2x.png" alt="头像">
          <p class="invite_name">{{ callKitStatus.inviteTarget || '' }}</p>
          <p class="invite_text">正在等待对方接收邀请<span class="dot"> ...</span></p>
        </div>
      </template>
      <!-- 通话容器页面 -->
      <template v-if=" callKitStatus.localClientStatus === CALLSTATUS.confirmCallee">
        <div class="time">{{ formatTime }}</div>
        <!--  语音通话      -->
        <div class="stream_audio_container" v-show=" callKitStatus.channelInfos.callType === 0">
          <img class="audio_avatar" src="@/assets/callkit/avatar-big@2x.png" alt="头像">
          <p class="audio_name">{{ callKitStatus.inviteTarget || callKitStatus.channelInfos.callerIMName }}</p>
        </div>
        <!--  视频通话      -->
        <div class="stream_video_container" v-show="callKitStatus.channelInfos.callType === 1">
          <div :class="[defaultStreamContainerClass ? 'smallContainer' : 'mainContainer']"
               ref="smallContainer" @click="() => defaultStreamContainerClass && changeStreamContainer()">
          </div>
          <div :class="[!defaultStreamContainerClass ? 'smallContainer' : 'mainContainer']"
               ref="mainContainer" @click="() => !defaultStreamContainerClass && changeStreamContainer()">
          </div>
        </div>
      </template>
<!--      通话聊天控制按钮-->
      <div v-show="!isOutside" class="stream_control">
        <template v-if="callKitStatus.localClientStatus === CALLSTATUS.inviting">
          <div class="stream_invite_btn" @click="cancelCall">
            <img src="@/assets/callkit/hangupCall@2x.png" alt="">
            <p class="btn_text">取消</p>
          </div>
        </template>
        <template v-if="callKitStatus.localClientStatus === CALLSTATUS.confirmCallee">
          <div class="stream_calling_btn" @click="handleLocalStreamPublish('voice')">
            <img :src="localStreamStatus.voice ? microphone : mutemicrophone" alt="">
            <p class="btn_text">语音</p>
          </div>
          <div class="stream_calling_btn" @click="leaveChannel">
            <img src="@/assets/callkit/hangupCall@2x.png" alt="">
            <p class="btn_text">挂断</p>
          </div>
          <div v-show="callKitStatus.channelInfos.callType === 1" class="stream_calling_btn"
               @click="handleLocalStreamPublish('video')">
            <img :src="localStreamStatus.video ? camera : closecamera" alt="">
            <p class="btn_text">视频</p>
          </div>
        </template>
      </div>
    </div>
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
}

.wait_stream_play_container {
  height: 100%;
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
  color: #FFF;
  font-size: 12px;
  font-weight: 200;
  z-index: 999;
}

/* 邀请页面 */
.stream_invite_box {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #FFF;
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
  color: #FFFFFF;

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
  color: #FFF;
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
    width: .5em;
    margin-right: 1em;
  }

  66% {
    width: 1em;
    margin-right: .5em;
  }

  100% {
    width: 1.5em;
    margin-right: 0;
  }
}
</style>