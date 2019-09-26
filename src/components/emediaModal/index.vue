<template>
    <Draggable v-show="emediaModalVisible">
        <div v-bind:class="{rtcVoiceContent: streamType=='语音', rtcVideoContent: streamType=='视频'}" >
        <div v-if="callerWaitVisible" class="mask">正在等待{{contact}}接受邀请</div>
        <div v-if="calleeWaitVisible" class="mask">{{contact}}请求{{streamType}}通话</div>
        <div v-if="voiceCallVisible" class="voiceCall">正在与{{contact}}通话</div>
        <video v-show="streamType == '视频'" ref='localVideo' v-bind:class="{localVideo: toggle, remoteVideo: !toggle}" autoPlay playsInline/>
        <video v-show="streamType == '视频'" ref='remoteVideo' v-bind:class="{localVideo: !toggle, remoteVideo: toggle}"  autoPlay playsInline/>
        <i v-show="showMute" class="el-icon-turn-off-microphone font microphone" isopen="true" ref='audio' @click="controlStream('audioControl')"></i>
        <i v-show="showAccept" class="el-icon-phone font accept" isopen="true" @click="accept"></i>
        <i v-show="showMute && streamType=='视频'" class="el-icon-video-camera font camera" ref='video' isopen="true" @click="controlStream('videoControl')"></i>
        <i v-show="showMute" class="el-icon-headset font mute" ref="mute" @click="mute"></i>
        <i class="el-icon-switch-button close" @click="close"></i>
        <i v-show="showMute && streamType=='视频'" class="el-icon-refresh font toggle" @click="toggleClick"></i>
        </div>
    </Draggable>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import "./index.less";
import Draggable from '../draggable'
import WebIM from '../../utils/WebIM';
export default{
    data(){
        return{
            emediaModalVisible: false,
            showAccept: false,
            showMute: false,
            callerWaitVisible: false,
            calleeWaitVisible: false,
            voiceCallVisible: false,
            contact: '',
            streamType: '视频',
            toggle: true,
            serverStyle:{
                width: "360px",
                height: "360px"
            }
        }
    },
    methods: {
        ...mapActions([
            "showMultiAVModal",
            "hideMultiAVModal"
        ]),
        initWebRTC() {
            console.log('InitWebRTC..........')
            // if (WebIM.call) {
            //     return
            // }
            console.log('InitWebRTC end..........')
            const me = this

            WebIM.call = new WebIM.WebRTC.Call({
                connection: WebIM.conn,

                // 自定义分辨率 采样率
                // mediaStreamConstaints: {
                //     audio: {
                //         sampleRate: 44100,
                //         sampleSize: 16
                //     },
                //     video: {
                //         width: {
                //             exact: 1280
                //         },
                //         height: {
                //             exact: 720
                //         }
                //     }
                // },

                mediaStreamConstaints: {
                    audio: true,
                    video: true
                },

                listener: {
                    onOtherUserOpenVoice: function (from, opened) {
                        console.log('from open:', opened, ' voice .', from)
                    },
                    onOtherUserOpenVideo: function (from, opened) {
                        console.log('from open:', opened, ' voideo .', from)
                    },
                    onAcceptCall: function (from, options, enableVoice, enableVideo) {
                        console.log('onAcceptCall', from, options, enableVoice, enableVideo)
                    },
                    onGotRemoteStream: function (stream, streamType) {
                        if(streamType == 'VOICE'){
                            me.$data.voiceCallVisible = true
                            me.$data.streamType = '语音'
                        }else{
                            me.$data.voiceCallVisible = false
                            me.$data.streamType = '视频'
                        }
                        me.$refs.remoteVideo.srcObject = stream
                        me.$data.callerWaitVisible = false
                    },
                    onGotLocalStream: function (stream, streamType) {
                        if(streamType == 'VOICE'){
                            me.$data.voiceCallVisible = true
                            me.$data.streamType = '语音'
                        }else{
                            me.$data.voiceCallVisible = false
                            me.$data.streamType = '视频'
                        }
                        me.$refs.localVideo.srcObject = stream
                        me.$data.calleeWaitVisible = false
                    },
                    onRinging: function (caller, streamType) {
                        console.log('onRinging', caller)
                        if(streamType != 'VOICE'){
                            me.$data.calleeWaitVisible = true
                            me.$data.streamType = '视频'
                        }else{
                            me.$data.calleeWaitVisible = true
                            me.$data.streamType = '语音'
                        }
                        me.$data.contact = caller
                        me.$data.emediaModalVisible = true;
                        me.$data.showAccept = true;
                        me.$data.showMute = false;
                    },
                    onTermCall: function (reason){
                        //"ok"      -> 'HANGUP'     "success" -> 'HANGUP'   "timeout"          -> 'NORESPONSE'
                        //"decline" -> 'REJECT'     "busy"    -> 'BUSY'     "failed-transport" -> 'FAIL'
                        // TODO reason undefine if reason is busy
                        console.log('onTermCall', reason)
                        if (reason && (reason == 'busy' || reason == 'BUSY')) {
                            me.$message.error('Target is busy. Try it later.')
                        }
                        if (reason && (reason == 'timeout' || reason == 'noresponse')) {
                            me.$message.error('Target no response. Try it later.')
                        }
                        if (reason && (reason == 'decline' || reason == 'reject')) {
                            me.$message.error('Target reject.') 
                        }
                        if (reason && (reason == 'failed-transport' || reason == 'fail')) {
                            me.$message.error('Call failed. Try it later.')
                        }
                        if (reason && (reason == 'ok' || reason == 'success' || reason == 'hangup')) {
                            me.$message.success('Target hangup. ')
                        }

                        WebIM.call.caller = ''
                        WebIM.call.callee = ''
                        me.closeEmediaModal()
                        //me.channel.close()
                    },
                    onIceConnectionStateChange: function (iceState) {
                        console.log('onIceConnectionStateChange')

                        if (iceState == 'disconnected') {
                            if (!me.rtcTimeoutID) {
                                //console.warn("Warn. disconnect. notify offline");

                                me.rtcTimeoutID = setTimeout(function () {
                                    if (!(WebIM.call.pattern && WebIM.call.pattern.hangup)) {
                                        me.$message.success('Target is offline')
                                        me.closeEmediaModal()
                                    }
                                }, 10000)
                            }
                        } else if (iceState == 'connected') {
                            if (me.rtcTimeoutID) {
                                clearTimeout(me.rtcTimeoutID)
                                me.rtcTimeoutID = null
                            }
                        }
                    },
                    onError: function (e) {
                        if (e && e.message) {
                            var close = false
                            switch (e.message) {
                            case 'CALLLING_EACH_OTHER_AT_THE_SAME_TIME':
                                e.message = 'Target is calling. Please try again later.'
                                close = true
                                break
                            case 'TARGET_OFFLINE':
                                e.message = 'Target is offline.'
                                break
                            }
                            if (close) {
                                var closeButton = document.getElementById('webrtc_close')
                                closeButton && closeButton.click()
                            }
                        }
                        me.$message.error(e && e.message ? e.message : 'An error occured when calling webrtc')
                        me.closeEmediaModal()
                    },
                    onInvite: function (from, rtcOption) {
                        const { confrId, password, gid } = rtcOption
                        const { appkey, xmppURL } = WebIM.config
                        //const { avModal, multiAV } = me.props
                        let host = xmppURL.split('.')
                        host = '@' + host[1] + '.' + host[2]
                        from = from.replace(appkey + '_', '')
                        from = from.replace(host, '')
                        let callback = (confr) => {
                            me.$confirm(from + '邀请您进入多人会议', '提示', {
                                confirmButtonText: '确认',
                                cancelButtonText: '拒绝',
                                type: 'info'
                            }).then(() => {
                                me.showMultiAVModal()
                                setTimeout(() => {
                                    const tkt = confr.ticket
                                    WebIM.EMService.joinConferenceWithTicket(confr.confrId, tkt, 'user ext field').then(function () {
                                        WebIM.EMService.publish({ audio: true, video: true }, 'user ext field').catch(function (e) {
                                            console.error(e)
                                        })
                                    }).catch(function (e) {
                                        console.error(e)
                                    })
                                }, 0)

                            }).catch(action => {
                            });
                        }
                        emedia.mgr.getConferenceTkt(confrId, password).then(function (confr) {
                            callback(confr)
                        })
                    }
                }
            })
        },
        close: function(){
            this.closeEmediaModal()
            try {
                WebIM.call.endCall()
            } catch (e) {
                console.log('endCall error1:', e)
            }
        },
        toggleClick(){
            this.$data.toggle = !this.$data.toggle
        },
        mute(){
            this.$refs.remoteVideo.muted = !this.$refs.remoteVideo.muted
            const muted = this.$refs.remoteVideo.muted
            if (muted) {
                this.$refs.mute.style.color = '#4eb1f4'
            } else {
                this.$refs.mute.style.color = '#eeeeee'
            }
        },
        controlStream(type){
            let controlType
            if(type === 'audioControl'){
                controlType = this.$refs.audio.isopen?0:1
                this.$refs.audio.style.color = this.$refs.audio.isopen?'#eeeeee':'#4eb1f4'
                this.$refs.audio.isopen = !this.$refs.audio.isopen
            }else{
                controlType = this.$refs.video.isopen?3:2
                this.$refs.video.style.color = this.$refs.video.isopen?'#eeeeee':'#4eb1f4'
                this.$refs.video.isopen = !this.$refs.video.isopen
            }
            console.log('controlType', controlType)
            var to = WebIM.call.callee.split('@')[0].split('_')[1]
            WebIM.call.controlStream(controlType, to)
        },
        showEmediaModal() {
            this.$data.emediaModalVisible = true;
        },
        closeEmediaModal() {
            this.$data.emediaModalVisible = false;
        },
        accept() {
            WebIM.call.acceptCall()
        },
        loadedmetadataLocalHandler() {
            this.$data.showMute = true
            this.$data.showAccept = false;
            // this.$data.serverStyle = {
            //     width: 360 + "px",
            //     height: 360 + "px"
            // }
        },
        showCallerWait(to){
            this.$data.callerWaitVisible = true
            this.$data.contact = to
        }
    },
    components: {
        Draggable
    },
    mounted () {
        if (WebIM.config.isWebRTC && WebIM.WebRTC) {
            this.initWebRTC()
            //this.channel = new RTCChannel(this.refs.rtcWrapper, this.props.collapsed)
        }
        var video = this.$refs.localVideo
        video.addEventListener('loadedmetadata', this.loadedmetadataLocalHandler)
    },
}
</script>
<style scoped>
.rtcVoiceContent{
    min-width: 360px;
    min-height: 90px;
}
.rtcVideoContent{
    min-width: 360px;
    min-height: 360px;
}
.mask{
    height: 100%;
    width: 100%;
    position: absolute;
    cursor: default;
    left: 0;
    background: #ccc;
    z-index: 3;
}
.voiceCall{
    height: 200px;
    background: #ccc;
    z-index: 3;
}
</style>
