<script setup>
import { ref, reactive, watch, toRaw, toRefs, onMounted, onBeforeUnmount } from 'vue'
import { AgoraAppId, AgoraRTC } from '../config/initAgoraRtc'
import { CALLSTATUS } from '../constants'
/* vueUse */
//Draggable
import { useDraggable, useMouseInElement } from '@vueuse/core'
const multiContainer = ref(null)
const { style } = useDraggable(multiContainer, {
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
    },
    loginUserHxId: {
        type: String,
        default: '',
        required: true,
    }
})
const { callKitStatus, loginUserHxId } = toRefs(props)
/* emits */
const emits = defineEmits(['getAgoraRtcToken', 'getAgoraChannelDetails', 'updateLocalStatus', 'onInviteMembers'])
/* AgoraRTC */
//client 初始化
let CallKitClient = null
CallKitClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
//本地音视频轨道
let localVoiceTrack = null
let localVideoTrack = null
let localStreamStatus = reactive({
    voice: false,
    video: false
})
//已在频道中的用户list
let inChannelUsersList = reactive([])
const setAgoraRtcListener = () => {
    console.log('>>>>>AgoraRtc监听挂载完毕')
    //监听到用用户加入了频道
    CallKitClient.on('user-joined', user => {
        const remoteUserId = user.uid.toString()
        handleRemoteContainer('create', remoteUserId)
        console.log('>>>>>加入频道的用户id', remoteUserId);

    })
    //监听用户发布流
    CallKitClient.on('user-published', async (user, mediaType) => {
        await CallKitClient.subscribe(user, mediaType)
        const remoteUserId = user.uid.toString();
        if (mediaType === 'video') {
            console.log('>>>>>>视频类型')
            const remoteVideoTrack = user.videoTrack
            const remotePlayerContainer = document.getElementById(remoteUserId)
            if (remotePlayerContainer) {
                setTimeout(() => {
                    remoteVideoTrack.play(remotePlayerContainer)
                }, 300)
            } else {
                setTimeout(() => {
                    remoteVideoTrack.play(remotePlayerContainer)
                }, 300)
            }
            updateInChannelUserStatus('videoPlay', remoteUserId, true)

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
    CallKitClient.on('volume-indicator', result => {
        checkVolume(result)
    })
    //监听用户关闭推流
    CallKitClient.on('user-unpublished', (user, mediaType) => {
        console.log('>>>>>>监听到流移除', user, mediaType)
        const remoteUserId = user.uid.toString();
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
        const remoteUserId = user.uid.toString();
        handleRemoteContainer('remove', remoteUserId)
        //如果频道内人数小于等于1则直接离开该频道
        if (inChannelUsersList.length === 0) {
            leaveChannel(remoteUserId)
        }
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
    if (newVal === CALLSTATUS.inviting) {
        setTimeout(() => {
            emitChannelToken()
        }, 500)
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
    emits('getAgoraRtcToken', callback)

}
//加入频道【接听】
const joinChannel = async () => {
    const channelInfos = callKitStatus.value.channelInfos
    const channelName = channelInfos.channelName
    const agoraChannelToken = channelInfos.agoraChannelToken
    const agoraUserId = channelInfos.agoraUserId
    try {
        await CallKitClient.join(AgoraAppId, channelName, agoraChannelToken, agoraUserId)
        console.log('%c加入channel当中', 'color:green');
        inChannelUsersList.push({
            easeimUserId: loginUserHxId.value,
            agoraUserId: agoraUserId.toString(),
            volume: 0,//音量
            muteStatus: false,
            videoPlay: true,
        })
        localVoiceTrack = await AgoraRTC.createMicrophoneAudioTrack()
        // Create a local video track from the video captured by a camera.
        localVideoTrack = await AgoraRTC.createCameraVideoTrack()
        if (localVoiceTrack && localVideoTrack) await CallKitClient.publish([localVoiceTrack, localVideoTrack])
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
//离开频道【挂断&对方挂断】
const leaveChannel = async () => {
    console.log('》》》》》挂断', callKitStatus.value.localClientStatus)
    if ([CALLSTATUS.inviting, CALLSTATUS.confirmRing].includes(callKitStatus.value.localClientStatus)) {
        console.log('>>>>>>调用发送取消信令');
    }
    await CallKitClient.leave()
    emits('updateLocalStatus', CALLSTATUS.idle)
}
//处理DOM容器【包含创建以及移除】
const handleRemoteContainer = (handleType, userUid) => {
    if (handleType === 'create') {
        console.log('调用了创建视频容器', handleType, userUid);
        //查找该用户是否已在channellist中
        const isInChannel = inChannelUsersList.some(item => item.agoraUserId === userUid)
        if (isInChannel) return
        if (!isInChannel) {
            const channelUsers = callKitStatus.value.channelInfos.channelUsers
            if (channelUsers[userUid]) {
                console.log('>>>>包含该用户的对应信息');
                //包含直接进行添加
                inChannelUsersList.push({
                    easeimUserId: channelUsers[userUid],
                    agoraUserId: userUid.toString(),
                    volume: 0,
                    muteStatus: false,
                    videoPlay: false,
                })
                return
            } else {
                console.log('>>>>不包含该用户的对应信息');
                const callback = () => {
                    const channelUsers = callKitStatus.value.channelInfos.channelUsers
                    inChannelUsersList.push({
                        easeimUserId: channelUsers[userUid],
                        agoraUserId: userUid.toString(),
                        volume: 0,
                        muteStatus: false,
                        videoPlay: false,
                    })
                    console.log('>>>>>执行添加一个新的容器', channelUsers);
                }
                emits('getAgoraChannelDetails', callback)
                return
            }

        }
    }
    if (handleType === 'remove') {
        if (document.getElementById(userUid)) {
            //从inChannelUserList中移除
            const _index = inChannelUsersList.findIndex(item => item.agoraUserId === userUid)
            if (_index > -1) inChannelUsersList.splice(_index, 1)
            const toBeRemoveChild = document.getElementById(userUid)
            streamContainer.value.removeChild(toBeRemoveChild)
        };
    }
}
//更新频道内用户推流以及音量状态
const updateInChannelUserStatus = (handleType, userUid, data) => {
    const channelUsers = callKitStatus.value.channelInfos.channelUsers
    const mapHxId = channelUsers[userUid]
    if (mapHxId) {
        let _index = inChannelUsersList.length > 0 && inChannelUsersList.findIndex(item => item.easeimUserId === mapHxId);
        if (handleType === 'volume') {
            console.log('>>>>>更改音量状态', userUid, data);
            if (_index !== -1) { inChannelUsersList[_index].volume = data }
        }
        if (handleType === 'muteStatus') {
            if (_index !== -1) { inChannelUsersList[_index].muteStatus = data }
        }
        if (handleType === 'videoPlay') {
            if (_index !== -1) { inChannelUsersList[_index].videoPlay = data }
        }
    }
    // console.log('>>>>>开始更改状态', handleType, userUid, data);

}
//检查房间内音量
const checkVolume = (result) => {
    const channelUsers = callKitStatus.value.channelInfos.channelUsers
    result.forEach((volume, index) => {
        const { level } = volume
        const uid = volume.uid.toString()
        //uid对应的环信ID
        const mapHxId = channelUsers[uid]
        // console.log(`${index} UID ${uid} Level ${level}`);
        // console.log('%c inChannelUsersList', 'color:blue', toRaw(inChannelUsersList), 'uid+', uid);
        // console.log('channelUsers', Object.keys(channelUsers));
        if (mapHxId) {
            // console.log('+++++拿到具体的值', channelUsers[uid], loginUserHxId.value);
            const nowUidChannelInfo = inChannelUsersList.filter(item => item.easeimUserId === mapHxId)
            // console.log('nowUidChannelInfo', toRaw(nowUidChannelInfo[0]));
            if (toRaw(nowUidChannelInfo[0]).volume === 1 && level * 1 >= 5) return
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

    });
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
    localVoiceTrack && localVideoTrack.close()
    console.log('>>>>>>监听到组件卸载')
})
</script>
<template>
    <div ref="multiContainer" class="app_container" :style="style" style="position: fixed">
        <div  class="stream_container" ref="streamContainer">
            <div class="myContainer" v-for="item in inChannelUsersList" :key="item.agoraUserId" :id="item.agoraUserId">
                <div class="userInfo">
                    <span class="userIMId">{{ item.easeimUserId }}</span>
                    <span class="muteStatus" v-if="item.muteStatus">已闭麦</span>
                    <span class="volumeStatus" v-if="item.volume > 0">📢</span>

                </div>
            </div>
            <div v-show="!isOutside" class="stream_control">
                <button @click="handleLocalStreamPublish('voice')">{{ localStreamStatus.voice ? '开启静音' : '关闭静音'
                }}</button>
                <button @click="leaveChannel">挂断</button>
                <button @click="inviteMoreMembers">邀请</button>
                <button @click="handleLocalStreamPublish('video')">{{ localStreamStatus.video ? '关闭摄像头' : '开启摄像头'
                }}</button>
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
    position: relative;
    width: 150px;
    height: 150px;
    background: #000;
    margin: 5px 0;
}

.userInfo {
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 99;
    background: rgba(255, 255, 255, 0.234);
    height: 35px;
    color: #FFF;
    display: flex;
    flex-direction: row;
    width: 100%;
    align-items: center;
    justify-content: space-between;
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