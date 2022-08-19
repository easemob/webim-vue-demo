<template>
    <Draggable v-show="emediaModalVisible" id='drag1'>
        <div v-bind:class="{rtcVoiceContent: streamType=='语音', rtcVideoContent: streamType=='视频'}" >
            <div v-if="callerWaitVisible" class="mask">正在等待{{contact}}接受邀请</div>
            <div v-if="calleeWaitVisible" class="mask">{{contact}}请求{{streamType}}通话</div>
            <div v-if="voiceCallVisible" class="voiceCall">正在与{{contact}}通话</div>
            <video v-show="streamType == '视频'" ref='localVideo' v-bind:class="{localVideo: toggle, remoteVideo: !toggle}" autoPlay muted playsInline/>
            <video v-show="streamType == '视频'" ref='remoteVideo' v-bind:class="{localVideo: !toggle, remoteVideo: toggle}"  autoPlay playsInline/>
            <!-- <i v-show="showMute" class="el-icon-turn-off-microphone font microphone" isopen="true" ref='audio' @click="controlStream('audioControl')"></i> -->
						<mic-close-icon v-show="showMute" class="font microphone" isopen="true" ref='audio' @click="controlStream('audioControl')" />
						<a-icon v-show="showAccept" class="font accept" isopen="true" type="phone" @click="accept" />
            <a-icon v-show="showMute && streamType=='视频'" class="font camera" ref='video' isopen="true" type="video-camera" @click="controlStream('videoControl')"/>
            <a-icon v-show="showMute" class="font mute" type="sound" ref="mute" @click="mute"/>
						<a-icon class="close" @click="close" type="poweroff" />
						<a-icon v-show="showMute && streamType=='视频'" class="font toggle" @click="toggleClick" type="sync" />
        </div>
    </Draggable>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import './index.less';
import Draggable from '../draggable';
import WebIM from '../../utils/WebIM';
const micCloseSVG = {
	template: `
		<svg class="icon" width="200px" height="200.00px" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
			<path fill="#333333" d="M511.221776 675.709549c-91.010807 0-164.984588-74.021877-164.984588-164.984588L346.237187 227.894384c0-90.986247 73.973782-164.984588 164.984588-164.984588 90.959641 0 164.982542 73.998341 164.982542 164.984588L676.204317 510.72496C676.204317 601.687672 602.181417 675.709549 511.221776 675.709549zM511.221776 110.047372c-64.956408 0-117.847012 52.892651-117.847012 117.847012L393.374764 510.72496c0 64.951291 52.890604 117.844965 117.847012 117.844965 64.954361 0 117.845988-52.893674 117.845988-117.844965L629.067764 227.894384C629.067764 162.940023 576.176137 110.047372 511.221776 110.047372zM817.620118 510.72496c0-13.006222-10.590196-23.570835-23.567765-23.570835-12.982686 0-23.569812 10.564613-23.569812 23.570835 0 142.980435-116.28033 259.259742-259.259742 259.259742-142.980435 0-259.261789-116.28033-259.261789-259.259742 0-13.006222-10.5421-23.570835-23.568788-23.570835-13.028735 0-23.568788 10.564613-23.568788 23.570835 0 161.02337 124.889405 293.415656 282.829554 305.47839l0 95.196129-70.707388 0c-13.028735 0-23.569812 10.588149-23.569812 23.570835 0 12.979616 10.540054 23.567765 23.569812 23.567765l188.553377 0c12.979616 0 23.569812-10.589173 23.569812-23.567765 0-12.983709-10.591219-23.570835-23.569812-23.570835l-70.708412 0 0-95.196129C692.775738 804.140617 817.620118 671.748331 817.620118 510.72496zM811.024909 781.523503 213.162356 192.250582c-11.019984-10.861372-11.122315-28.576849-0.285502-39.570227 10.842952-11.000542 28.54922-11.147898 39.569204-0.286526l597.862553 589.272921c10.968819 10.81123 11.130502 28.569686 0.287549 39.571251C839.76037 792.232402 821.992705 792.334733 811.024909 781.523503z" />
		</svg>
	`
}
const micCloseIcon = {
	template: `
		<a-icon :component="micCloseSVG" />
	`,
	data(){
		return {
			micCloseSVG
		}
	}
}
export default{
	data(){
		return {
			emediaModalVisible: false,
			showAccept: false,
			showMute: false,
			callerWaitVisible: false,
			calleeWaitVisible: false,
			voiceCallVisible: false,
			contact: '',
			streamType: '视频',
			toggle: true,
			serverStyle: {
				width: '360px',
				height: '360px'
			}
		};
	},
	watch: {
		emediaModalVisible: {
			deep: true,
			handler: function(newV, oldV){
				if(newV){
					this.$emit('changeIsVideoState', true);
				}
				else{
					this.$emit('changeIsVideoState', false);
				}
			}
		}
	},
	methods: {
		...mapActions([
			'showMultiAVModal',
			'hideMultiAVModal'
		]),
		initWebRTC(){
			// if (WebIM.call) {
			//     return
			// }
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
						console.log('from open:', opened, ' voice .', from);
					},
					onOtherUserOpenVideo: function(from, opened){
						console.log('from open:', opened, ' voideo .', from);
					},
					onAcceptCall: function(from, options, enableVoice, enableVideo){
						console.log('onAcceptCall', from, options, enableVoice, enableVideo);
					},
					onGotRemoteStream: function(stream, streamType){
						if(streamType == 'VOICE'){
							me.$data.voiceCallVisible = true;
							me.$data.streamType = '语音';
						}
						else{
							me.$data.voiceCallVisible = false;
							me.$data.streamType = '视频';
						}
						me.$refs.remoteVideo.srcObject = stream;
						me.$data.callerWaitVisible = false;
					},
					onGotLocalStream: function(stream, streamType){
						if(streamType == 'VOICE'){
							me.$data.voiceCallVisible = true;
							me.$data.streamType = '语音';
						}
						else{
							me.$data.voiceCallVisible = false;
							me.$data.streamType = '视频';
						}
						me.$refs.localVideo.srcObject = stream;
						me.$data.calleeWaitVisible = false;
					},
					onRinging: function(caller, streamType){
						console.log('onRinging', caller);
						if(streamType != 'VOICE'){
							me.$data.calleeWaitVisible = true;
							me.$data.streamType = '视频';
						}
						else{
							me.$data.calleeWaitVisible = true;
							me.$data.streamType = '语音';
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
						console.log('onTermCall', reason);
						if(reason && (reason == 'busy' || reason == 'BUSY')){
							me.$message.error('Target is busy. Try it later.');
						}
						if(reason && (reason == 'timeout' || reason == 'noresponse')){
							me.$message.error('Target no response. Try it later.');
						}
						if(reason && (reason == 'decline' || reason == 'reject')){
							me.$message.error('Target reject.');
						}
						if(reason && (reason == 'failed-transport' || reason == 'fail')){
							me.$message.error('Call failed. Try it later.');
						}
						if(reason && (reason == 'ok' || reason == 'success' || reason == 'hangup')){
							me.$message.success('Target hangup. ');
						}

						WebIM.call.caller = '';
						WebIM.call.callee = '';
						me.closeEmediaModal();
						me.$data.emediaModalVisible = false;
						me.$data.showAccept = false;
						me.$data.showMute = false;
						me.$data.callerWaitVisible = false;
						me.$data.calleeWaitVisible = false;
						me.$data.voiceCallVisible = false;
						me.$data.contact = '';
						me.$refs.audio.isopen = true;
						me.$refs.video.isopen = true;
						me.$refs.remoteVideo.muted = false;
						me.$refs.video.style.color = '#2c3e50';
						me.$refs.audio.style.color = '#2c3e50';
						me.$refs.mute.style.color = '#2c3e50';
					},
					onIceConnectionStateChange: function(iceState){
						console.log('onIceConnectionStateChange');

						if(iceState == 'disconnected'){
							if(!me.rtcTimeoutID){
								// console.warn("Warn. disconnect. notify offline");

								me.rtcTimeoutID = setTimeout(function(){
									if(!(WebIM.call.pattern && WebIM.call.pattern.hangup)){
										me.$message.success('Target is offline');
										me.closeEmediaModal();
									}
								}, 10000);
							}
						}
						else if(iceState == 'connected'){
							if(me.rtcTimeoutID){
								clearTimeout(me.rtcTimeoutID);
								me.rtcTimeoutID = null;
							}
						}
					},
					onError: function(e){
						var close = false;
						var closeButton = document.getElementById('webrtc_close');
						if(e && e.message){
							switch(e.message){
							case 'CALLLING_EACH_OTHER_AT_THE_SAME_TIME':
								e.message = 'Target is calling. Please try again later.';
								close = true;
								break;
							case 'TARGET_OFFLINE':
								e.message = 'Target is offline.';
								break;
							default:
								break;
							}
							if(close){
								closeButton && closeButton.click();
							}
						}
						me.$message.error(e && e.message ? e.message : 'An error occured when calling webrtc');
						me.closeEmediaModal();
					},
					onInvite: function(from, rtcOption){
						const { confrId, password, gid } = rtcOption;
                        
						const { appkey } = WebIM.config
                   
						let host = WebIM.conn.url && WebIM.conn.url.split('.')
						if(host.length && host.length > 2) host = '@' + host[1] + '.' + host[2];
                        
						from = from.replace(appkey + '_', '');
						from = from.replace(host, '');
						let callback = (confr) => {
							me.$confirm(from + '邀请您进入多人会议', '提示', {
								confirmButtonText: '确认',
								cancelButtonText: '拒绝',
								type: 'info'
							}).then(() => {
								me.showMultiAVModal(confr);
								setTimeout(() => {
									const tkt = confr.ticket;
									WebIM.EMService.joinConferenceWithTicket(confr.confrId, tkt, 'user ext field').then(function(){
										WebIM.EMService.publish({ audio: true, video: true }, 'user ext field')['catch'](function(e){
											console.error(e);
										});
									})['catch'](function(e){
										console.error(e);
									});
								}, 0);

							})['catch'](action => {
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
				console.log('endCall error1:', e);
			}
		},
		toggleClick(){
			this.$data.toggle = !this.$data.toggle;
		},
		mute(){
			let muted = this.$refs.remoteVideo.muted;
			if(muted){
				this.$refs.mute.style.color = '#2c3e50';
				this.$refs.remoteVideo.muted = false;
			}
			else{
				this.$refs.mute.style.color = '#4eb1f4';
				this.$refs.remoteVideo.muted = true;
			}
		},
		controlStream(type){
			let controlType;
			let to = WebIM.call.callee.split('@')[0].split('_')[1];
			if(type === 'audioControl'){
				controlType = this.$refs.audio.isopen ? 0 : 1;
				this.$refs.audio.style.color = this.$refs.audio.isopen ? '#2c3e50' : '#4eb1f4';
				this.$refs.audio.isopen = !this.$refs.audio.isopen;
			}
			else{
				controlType = this.$refs.video.isopen ? 3 : 2;
				this.$refs.video.style.color = this.$refs.video.isopen ? '#2c3e50' : '#4eb1f4';
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
		Draggable,
		micCloseIcon
	},
	mounted(){
		if(WebIM.config.isWebRTC && WebIM.WebRTC){
			this.initWebRTC();
			// this.channel = new RTCChannel(this.refs.rtcWrapper, this.props.collapsed)
		}
		var video = this.$refs.localVideo;
		video.addEventListener('loadedmetadata', this.loadedmetadataLocalHandler);
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
