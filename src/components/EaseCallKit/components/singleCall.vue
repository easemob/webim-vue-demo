<script setup>
import { ref, watch, toRefs, onMounted, onUnmounted } from 'vue'
import { AgoraAppId, AgoraRTC } from '../config/initAgoraRtc'
import { CALLSTATUS } from '../constants'
/* vueUse */
//Draggable
import { useDraggable, useMouseInElement } from '@vueuse/core'
const singleContainer = ref(null)
const { style } = useDraggable(singleContainer, {
    initialValue: { x: 600, y: 40 },
})
//streamContral显隐
const streamContainer = ref(null)
const { isOutside } = useMouseInElement(streamContainer)
/* props */
const props = defineProps({
    callKitStatus: {
        type: Object,
        default: () => ({}),
        required: true,
    }
})
const { callKitStatus } = toRefs(props)
/* 视频UI控制 */
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
CallKitClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
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
                console.log('%c 远端流已播放', 'color:green');
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
        joinChannel()
    }
    emits('getAgoraRtcToken', callback)

}
//取消呼叫
const cancelCall = () => {
    emits('handleCancelCall')
}
//加入频道【接听】
const joinChannel = async () => {
    const channelInfos = callKitStatus.value.channelInfos
    const channelName = channelInfos.channelName
    const agoraChannelToken = channelInfos.agoraChannelToken
    const agoraUserId = channelInfos.agoraUserId
    const callType = channelInfos.callType
    try {
        await CallKitClient.join(AgoraAppId, channelName, agoraChannelToken, agoraUserId)
        localVoiceTrack = await AgoraRTC.createMicrophoneAudioTrack()
        // Create a local video track from the video captured by a camera.
        localVideoTrack = await AgoraRTC.createCameraVideoTrack()
        console.log('>>>>加入频道成功')
        if (callType === 0) {
            localVoiceTrack && await CallKitClient.publish(localVoiceTrack)
            console.log('%c---本地轨道音频推流成功', 'color:green')
        }
        if (callType === 1) {
            if (localVoiceTrack && localVideoTrack) await CallKitClient.publish([localVoiceTrack, localVideoTrack])
            setTimeout(() => {
                localVideoTrack.play(smallContainer.value)
            }, 300)
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
    // localVoiceTrack && localVoiceTrack.close()
    // localVoiceTrack && localVideoTrack.close()
    await CallKitClient.leave()
    emits('updateLocalStatus', CALLSTATUS.idle)
}
//切换视频流容器
const defaultStreamContainerClass = ref(true)
const changeStreamContainer = () => defaultStreamContainerClass.value = !defaultStreamContainerClass.value
//组件卸载
onUnmounted(() => {
    localVoiceTrack && localVoiceTrack.close()
    localVoiceTrack && localVideoTrack.close()
    console.log('>>>>>>监听到组件卸载')
})
</script>
<template>
    <div ref="singleContainer" class="app_container" :style="style" style="position: fixed">
        <!-- <div v-show="!isStreamPlay" class="wait_stream_play_container">
            呼叫建立中...
        </div> -->
        <div class="stream_container" ref="streamContainer">
            <template v-if="callKitStatus.localClientStatus === CALLSTATUS.confirmCallee">
                <div class="stream_audio_container" v-show="callKitStatus.channelInfos.callType === 0">
                    <p>语音通话中...</p>
                </div>
                <div class="stream_video_container" v-show="callKitStatus.channelInfos.callType === 1">
                    <!-- mainContainer smallContainer-->
                    <div :class="[defaultStreamContainerClass ? 'smallContainer' : 'mainContainer']"
                        ref="smallContainer" @click="() => defaultStreamContainerClass && changeStreamContainer()">
                    </div>
                    <div :class="[!defaultStreamContainerClass ? 'smallContainer' : 'mainContainer']"
                        ref="mainContainer" @click="() => !defaultStreamContainerClass && changeStreamContainer()">
                    </div>
                </div>
            </template>
            <template v-if="callKitStatus.localClientStatus === CALLSTATUS.inviting">
                <p>等待对方接受邀请中...</p>
                <p>{{ callKitStatus.inviteTarget }}</p>
            </template>
            <div v-show="!isOutside" class="stream_control">
                <button v-if="callKitStatus.localClientStatus === CALLSTATUS.confirmCallee"
                    @click="leaveChannel">挂断</button>
                <button v-if="callKitStatus.localClientStatus === CALLSTATUS.inviting" @click="cancelCall">取消呼叫</button>
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
    background-color: rgb(204, 204, 204);
}

.wait_stream_play_container {
    height: 100%;
}

.stream_container {
    width: 100%;
    height: 100%;
    border-radius: 4px;
}

.stream_audio_container {
    width: 100%;
    height: 100%;
    background: pink;
}

.stream_video_container {
    width: 100%;
    height: 100%;
    background: green;
}

.smallContainer {
    position: absolute;
    right: 0;
    top: 0;
    z-index: 99;
    width: 80px;
    height: 100px;
    background: #000;
}

.mainContainer {
    width: 100%;
    height: 100%;
    background: green;
}

.stream_control {
    position: absolute;
    left: 0;
    z-index: 99;
    bottom: 0;
    width: 100%;
    height: 100px;
    background: #FFF;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
}
</style>