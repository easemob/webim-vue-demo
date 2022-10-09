<script setup>
import { ref, reactive, watch, toRefs, onMounted, onUnmounted } from 'vue'
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
//流播放容器
const myContainer = ref(null)
/* emits */
const emits = defineEmits(['getRtcToken', 'updateLocalStatus'])
/* AgoraRTC */
//client 初始化
let CallKitClient = null
CallKitClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
//本地音视频轨道
let localVoiceTrack = null
let localVideoTrack = null
//已在频道中的用户list
let inChannelUsersIdList = reactive([])
const setAgoraRtcListener = () => {
    console.log('>>>>>AgoraRtc监听挂载完毕')
    //监听到用用户加入了频道
    CallKitClient.on('user-joined', user => {
        const remoteUserId = user.uid.toString()
        console.log('>>>>>加入频道的用户id', remoteUserId);
        if (remoteUserId && !inChannelUsersIdList.includes(remoteUserId)) {
            inChannelUsersIdList.push(remoteUserId)
            console.log('>>>>可以创建一个新的dom容器了');
            handleRemoteContainer('create', remoteUserId)
        }

    })
    //监听用户发布流
    CallKitClient.on('user-published', async (user, mediaType) => {
        await CallKitClient.subscribe(user, mediaType)
        if (mediaType === 'video') {
            console.log('>>>>>>视频类型')
            const remoteUserId = user.uid.toString();
            const remoteVideoTrack = user.videoTrack
            const remotePlayerContainer = document.getElementById(remoteUserId)
            if (remotePlayerContainer) {
                setTimeout(() => {
                    remoteVideoTrack.play(remotePlayerContainer)
                }, 300)
            } else {
                handleRemoteContainer('create', remoteUserId)
                setTimeout(() => {
                    remoteVideoTrack.play(remotePlayerContainer)
                }, 300)
            }
            console.log('remoteVideoTrack', remoteVideoTrack)


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
        const remoteUserId = user.uid.toString();
        handleRemoteContainer('remove', remoteUserId)
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

}, {
    immediate: true
})

//通知获取频道token
const emitChannelToken = () => {
    const callback = async () => {
        console.log('>>>>触发了子组件的callback')
        joinChannel()
    }
    emits('getRtcToken', callback)

}
//加入频道【接听】
const joinChannel = async () => {
    const channelInfos = callKitStatus.value.channelInfos
    const channelName = channelInfos.channelName
    const agoraChannelToken = channelInfos.agoraChannelToken
    const agoraUserId = channelInfos.agoraUserId
    try {
        await CallKitClient.join(AgoraAppId, channelName, agoraChannelToken, agoraUserId)
        localVoiceTrack = await AgoraRTC.createMicrophoneAudioTrack()
        // Create a local video track from the video captured by a camera.
        localVideoTrack = await AgoraRTC.createCameraVideoTrack()
        console.log('>>>>加入频道成功')
        localVoiceTrack && await CallKitClient.publish(localVoiceTrack)
        console.log('>>>>>>音频---本地轨道推流成功')
        if (localVoiceTrack && localVideoTrack) await CallKitClient.publish([localVoiceTrack, localVideoTrack])
        setTimeout(() => {
            localVideoTrack.play(myContainer.value)
        }, 300)
        console.log('>>>>>>音视频---本地轨道推流成功')
        inChannelUsersIdList.push(agoraUserId.toString())
    } catch (error) {
        console.log('>>>>加入频道失败', error)
    }

}
//离开频道【挂断&对方挂断】
const leaveChannel = async () => {
    console.log('》》》》》挂断')
    localVoiceTrack && localVoiceTrack.close()
    localVoiceTrack && localVideoTrack.close()
    await CallKitClient.leave()
    emits('updateLocalStatus', CALLSTATUS.idle)
}
//处理DOM容器【包含创建以及移除】
const handleRemoteContainer = (handleType, userUid) => {
    let elementId = ''
    userUid && (elementId = userUid)
    if (handleType === 'create') {
        if (document.getElementById(elementId)) return;
        const remotePlayerContainer = document.createElement("div");
        remotePlayerContainer.id = elementId;
        remotePlayerContainer.style.width = "150px";
        remotePlayerContainer.style.height = "150px";
        remotePlayerContainer.style.background = "black";
        streamContainer.value.append(remotePlayerContainer)
    }
    if (handleType === 'remove') {
        if (document.getElementById(elementId)) {
            const toBeRemoveChild = document.getElementById(elementId)
            streamContainer.value.removeChild(toBeRemoveChild)
        };
    }
}
//组件卸载
onUnmounted(() => {
    console.log('>>>>>>监听到组件卸载')
})
</script>
<template>
    <div ref="singleContainer" class="app_container" :style="style" style="position: fixed">
        <div class="stream_container" ref="streamContainer">
            <div class="myContainer" ref="myContainer">
            </div>
            <div v-show="!isOutside" class="stream_control">
                <button @click="leaveChannel">挂断</button>
            </div>
        </div>
    </div>
</template>


<style lang="scss" scoped>
.app_container {
    border-radius: 4px;
    overflow: hidden;
    background-color: rgb(204, 204, 204);
    padding: 5px;
}

.stream_container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    width: 500px;
    min-height: 350px;
    // background: green;
    border-radius: 4px;
}

.myContainer {
    width: 150px;
    height: 150px;
    background: #000;
    margin: 5px 0;
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