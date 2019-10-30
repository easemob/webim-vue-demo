<template>
    <Draggable v-show="emediaModalVisible" id='drag1'>
        <div v-bind:class="{rtcVoiceContent: streamType=='语音', rtcVideoContent: streamType=='视频'}" >
            <div v-if="callerWaitVisible" class="mask">正在等待{{contact}}接受邀请</div>
            <div v-if="calleeWaitVisible" class="mask">{{contact}}请求{{streamType}}通话</div>
            <div v-if="voiceCallVisible" class="voiceCall">正在与{{contact}}通话</div>
            <video v-show="streamType == '视频'" ref='localVideo' v-bind:class="{localVideo: toggle, remoteVideo: !toggle}" autoPlay muted playsInline/>
            <video v-show="streamType == '视频'" ref='remoteVideo' v-bind:class="{localVideo: !toggle, remoteVideo: toggle}"  autoPlay playsInline/>
            <i v-show="showMute" class="el-icon-turn-off-microphone font microphone" isopen="true" ref='audio' @click="controlStream('audioControl')"></i>
            <i v-show="showAccept" class="el-icon-phone font accept" isopen="true" @click="accept"></i>
            <!-- <i v-show="showMute && streamType=='视频'" class="el-icon-video-camera font camera" ref='video' isopen="true" @click="controlStream('videoControl')"></i> -->
            <a-icon v-show="showMute && streamType=='视频'" class="font camera" ref='video' isopen="true" type="video-camera" @click="controlStream('videoControl')"/>
            <!-- <i v-show="showMute" class="el-icon-headset font mute" ref="mute" @click="mute"></i> -->
            <a-icon v-show="showMute" class="font mute" type="sound" ref="mute" @click="mute"/>
            <i class="el-icon-switch-button close" @click="close"></i>
            <i v-show="showMute && streamType=='视频'" class="el-icon-refresh font toggle" @click="toggleClick"></i>
        </div>
    </Draggable>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import "./index.less";
import Draggable from "../draggable";
import WebIM from "../../utils/WebIM";
export default{
	data(){
		return {
			emediaModalVisible: false,
			showAccept: false,
			showMute: false,
			callerWaitVisible: false,
			calleeWaitVisible: false,
			voiceCallVisible: false,
			contact: "",
			streamType: "视频",
			toggle: true,
			serverStyle: {
				width: "360px",
				height: "360px"
			}
		};
	},
	watch: {
    'emediaModalVisible': {
      deep: true,
      handler: function(newV, oldV) {
		if (newV) {
			this.$emit("changeIsVideoState",true); 
		}else{
			this.$emit("changeIsVideoState",false); 
		}
      }
    }
  },
	methods: {
		...mapActions([
			"showMultiAVModal",
			"hideMultiAVModal"
		]),
		initWebRTC(){
			console.log("InitWebRTC..........");
			// if (WebIM.call) {
			//     return
			// }
			console.log("InitWebRTC end..........");
			const me = this;

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
					onOtherUserOpenVoice: function(from, opened){
						console.log("from open:", opened, " voice .", from);
					},
					onOtherUserOpenVideo: function(from, opened){
						console.log("from open:", opened, " voideo .", from);
					},
					onAcceptCall: function(from, options, enableVoice, enableVideo){
						console.log("onAcceptCall", from, options, enableVoice, enableVideo);
					},
					onGotRemoteStream: function(stream, streamType){
						if(streamType == "VOICE"){
							me.$data.voiceCallVisible = true;
							me.$data.streamType = "语音";
						}
						else{
							me.$data.voiceCallVisible = false;
							me.$data.streamType = "视频";
						}
						me.$refs.remoteVideo.srcObject = stream;
						me.$data.callerWaitVisible = false;
					},
					onGotLocalStream: function(stream, streamType){
						if(streamType == "VOICE"){
							me.$data.voiceCallVisible = true;
							me.$data.streamType = "语音";
						}
						else{
							me.$data.voiceCallVisible = false;
							me.$data.streamType = "视频";
						}
						me.$refs.localVideo.srcObject = stream;
						me.$data.calleeWaitVisible = false;
					},
					onRinging: function(caller, streamType){
						console.log("onRinging", caller);
						if(streamType != "VOICE"){
							me.$data.calleeWaitVisible = true;
							me.$data.streamType = "视频";
						}
						else{
							me.$data.calleeWaitVisible = true;
							me.$data.streamType = "语音";
						}
						me.$data.contact = caller;
						me.$data.emediaModalVisible = true;
						me.$data.showAccept = true;
						me.$data.showMute = false;
					},
					onTermCall: function(reason){
						// "ok"      -> 'HANGUP'     "success" -> 'HANGUP'   "timeout"          -> 'NORESPONSE'
						// "decline" -> 'REJECT'     "busy"    -> 'BUSY'     "failed-transport" -> 'FAIL'
						// TODO reason undefine if reason is busy
						console.log("onTermCall", reason);
						if(reason && (reason == "busy" || reason == "BUSY")){
							me.$message.error("Target is busy. Try it later.");
						}
						if(reason && (reason == "timeout" || reason == "noresponse")){
							me.$message.error("Target no response. Try it later.");
						}
						if(reason && (reason == "decline" || reason == "reject")){
							me.$message.error("Target reject.");
						}
						if(reason && (reason == "failed-transport" || reason == "fail")){
							me.$message.error("Call failed. Try it later.");
						}
						if(reason && (reason == "ok" || reason == "success" || reason == "hangup")){
							me.$message.success("Target hangup. ");
						}

						WebIM.call.caller = "";
						WebIM.call.callee = "";
						me.closeEmediaModal();
						me.$data.emediaModalVisible = false;
						me.$data.showAccept = false;
						me.$data.showMute = false;
						me.$data.callerWaitVisible = false;
						me.$data.calleeWaitVisible = false;
						me.$data.voiceCallVisible = false;
						me.$data.contact = "";
						me.$refs.audio.isopen = true;
						me.$refs.video.isopen = true;
						me.$refs.remoteVideo.muted = false;
						me.$refs.video.style.color = "#2c3e50";
						me.$refs.audio.style.color = "#2c3e50";
						me.$refs.mute.style.color = "#2c3e50";
					},
					onIceConnectionStateChange: function(iceState){
						console.log("onIceConnectionStateChange");

						if(iceState == "disconnected"){
							if(!me.rtcTimeoutID){
								// console.warn("Warn. disconnect. notify offline");

								me.rtcTimeoutID = setTimeout(function(){
									if(!(WebIM.call.pattern && WebIM.call.pattern.hangup)){
										me.$message.success("Target is offline");
										me.closeEmediaModal();
									}
								}, 10000);
							}
						}
						else if(iceState == "connected"){
							if(me.rtcTimeoutID){
								clearTimeout(me.rtcTimeoutID);
								me.rtcTimeoutID = null;
							}
						}
					},
					onError: function(e){
						var close = false;
						var closeButton = document.getElementById("webrtc_close");
						if(e && e.message){
							switch(e.message){
							case "CALLLING_EACH_OTHER_AT_THE_SAME_TIME":
								e.message = "Target is calling. Please try again later.";
								close = true;
								break;
							case "TARGET_OFFLINE":
								e.message = "Target is offline.";
								break;
							default:
								break;
							}
							if(close){
								closeButton && closeButton.click();
							}
						}
						me.$message.error(e && e.message ? e.message : "An error occured when calling webrtc");
						me.closeEmediaModal();
					},
					onInvite: function(from, rtcOption){
						const { confrId, password, gid } = rtcOption;
						const { appkey, xmppURL } = WebIM.config;
						// const { avModal, multiAV } = me.props
						let host = xmppURL.split(".");
						host = "@" + host[1] + "." + host[2];
						from = from.replace(appkey + "_", "");
						from = from.replace(host, "");
						let callback = (confr) => {
							me.$confirm(from + "邀请您进入多人会议", "提示", {
								confirmButtonText: "确认",
								cancelButtonText: "拒绝",
								type: "info"
							}).then(() => {
								me.showMultiAVModal();
								setTimeout(() => {
									const tkt = confr.ticket;
									WebIM.EMService.joinConferenceWithTicket(confr.confrId, tkt, "user ext field").then(function(){
										WebIM.EMService.publish({ audio: true, video: true }, "user ext field")["catch"](function(e){
											console.error(e);
										});
									})["catch"](function(e){
										console.error(e);
									});
								}, 0);

							})["catch"](action => {
							});
						};
						emedia.mgr.getConferenceTkt(confrId, password).then(function(confr){
							callback(confr);
						});
					}
				}
			});
		},
		close: function(){
			this.closeEmediaModal();
			try{
				WebIM.call.endCall();
			}
			catch(e){
				console.log("endCall error1:", e);
			}
		},
		toggleClick(){
			this.$data.toggle = !this.$data.toggle;
		},
		mute(){
			let muted = this.$refs.remoteVideo.muted;
			if(muted){
				this.$refs.mute.style.color = "#2c3e50";
				this.$refs.remoteVideo.muted = false;
			}
			else{
				this.$refs.mute.style.color = "#4eb1f4";
				this.$refs.remoteVideo.muted = true;
			}
		},
		controlStream(type){
			let controlType;
			let to = WebIM.call.callee.split("@")[0].split("_")[1];
			if(type === "audioControl"){
				controlType = this.$refs.audio.isopen ? 0 : 1;
				this.$refs.audio.style.color = this.$refs.audio.isopen ? "#2c3e50" : "#4eb1f4";
				this.$refs.audio.isopen = !this.$refs.audio.isopen;
			}
			else{
				controlType = this.$refs.video.isopen ? 3 : 2;
				this.$refs.video.style.color = this.$refs.video.isopen ? "#2c3e50" : "#4eb1f4";
				this.$refs.video.isopen = !this.$refs.video.isopen;
			}
			WebIM.call.controlStream(controlType, to);
		},
		showEmediaModal(){
			this.$data.emediaModalVisible = true;
		},
		closeEmediaModal(){
			this.$data.emediaModalVisible = false;
		},
		accept(){
			WebIM.call.acceptCall();
		},
		loadedmetadataLocalHandler(){
			this.$data.showMute = true;
			this.$data.showAccept = false;
			// this.$data.serverStyle = {
			//     width: 360 + "px",
			//     height: 360 + "px"
			// }
		},
		showCallerWait(to){
			this.$data.callerWaitVisible = true;
			this.$data.contact = to;
		}
	},
	components: {
		Draggable
	},
	mounted(){
		if(WebIM.config.isWebRTC && WebIM.WebRTC){
			this.initWebRTC();
			// this.channel = new RTCChannel(this.refs.rtcWrapper, this.props.collapsed)
		}
		var video = this.$refs.localVideo;
		video.addEventListener("loadedmetadata", this.loadedmetadataLocalHandler);
	},
};
</script>
<style scoped>
.rtcVoiceContent{
    min-width: 350px;
    min-height: 90px;
    border-radius: 5px;
}
.rtcVideoContent{
    min-width: 350px;
    min-height: 350px;
    margin: auto;
}
.mask{
    height: 100%;
    width: 100%;
    position: absolute;
    cursor: default;
    left: 0;
    background: #ccc;
    z-index: 3;
    border-radius: 5px;
}
.voiceCall{
    height: 150px;
    background: #e2e2e2;
    z-index: 3;
    border-radius: 5px;
    border-radius: 5px;
    line-height: 50px;
    color: rgba(0,0,0,0.65);
}
</style>
