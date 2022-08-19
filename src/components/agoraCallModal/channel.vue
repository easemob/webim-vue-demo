<template>
  <Draggable id="drag2">
    <div ref="rtc" class="webim-rtc-video">
      <!-- <div class="rtc-narrow">
					<img src="../../../static/img/narrow@2x.png" alt="最小化" @click="minisize" />
				</div> -->

      <div class="rtc-avatar">
        <img src="../../../static/img/avatar-big@2x.png" />
      </div>

      <div class="rtc-text">
        <div>{{ title }}</div>
        <div>{{ text }}</div>
      </div>

      <div class="rtc-control">
        <div :style="{ display: mute_display }">
          <img ref='audio' :src="muteBtnIcon" :isopen="{isopen}"  @click="controlStream('audioControl')" />
          <p>语音</p>
        </div>
        <div>
          <p class="rtc-time" :style="{ display: mute_display }">{{ time }}</p>
          <img src="../../../static/img/hangupCall@2x.png" @click="close" />
          <p>挂断</p>
        </div>
      </div>
      <div class="video corner" :style="{'display':video_display}" ref='localVideo' id="local-player"></div>
      <div class="video full" :style="{'display': video_display}" ref='remoteVideo' id="remote-player"></div>
    </div>
  </Draggable>
</template>

<script>
import './webrtc.less';
import Draggable from '../draggable';
import WebIM from '../../utils/WebIM';
import microphone from '../../../static/img/microphone@2x.png'
import microphoneMute from '../../../static/img/microphone-mute@2x.png'
import { mapActions, mapGetters } from 'vuex';
const rtc = WebIM.rtc;
const AgoraRTC = WebIM.AgoraRTC;
export default{
	data(){
		return {
			full_width: 360,
			full_height: 360,
			toggle_right: 0,
			toggle_top: 0,
			toggle_display: 'block',
			close_right: 0,
			close_bottom: 0,
			accept_left: 0,
			accept_bottom: 0,
			accept_display: 'block',
			mute_left: 0,
			mute_bottom: 6,
			hasVideo: false,
			localFullRemoteCorner: true,
			showCallVal: false,

			muteBtnIcon: microphone,
			isopen: true
		};
	},

	computed: {
		title(){
			let myName = WebIM.conn.context.jid.name;
			let callerIMName = this.$store.state.agora.confr.callerIMName;
			let calleeIMName = this.$store.state.agora.confr.calleeIMName;
			return callerIMName == myName ? calleeIMName : callerIMName;
		},
		text(){
			const { callStatus } = this.$store.state.agora;
			return callStatus > 4 ? '正在通话中...' : '正在等待对方接受邀请...';
		},
		mute_display(){
			const { callStatus } = this.$store.state.agora;
			let statu = callStatus > 4 ? 'block' : 'none';
			return statu;
		},
		time(){
			return this.$store.state.agora.callDuration;
		},
		onSetCallStatus(){
			return this.$store.state.agora.callStatus;
		},
		video_display(){
			const { confr } = this.$store.state.agora;
			return (confr.type == 1) ? 'block' : 'none';
		},
	},

	mounted(){
		const { callStatus } = this.$store.state.agora;
		rtc.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
		this.addListener();
		if(callStatus == 5 || callStatus == 3){
			// 5 被叫加入
			this.join();
		}
	},

	beforeDestroy(){
		console.log('执行卸载');
		const { callStatus } = this.$store.state.agora;
		if(callStatus != 0){
			this.hangup();
		}
		this.intervalID && clearInterval(this.intervalID);
	},

	methods: {
		...mapActions([
			'updateConfr',
			'setCallStatus',
			'hangup',
			'cancelCall',
			'setCallDuration',
			'getRtctoken'
		]),

		addListener(){
			rtc.client.on('user-published', async (user, mediaType) => {
				// 开始订阅远端用户。
				await rtc.client.subscribe(user, mediaType);

				// 表示本次订阅的是视频。
				if(mediaType === 'video'){
					// 订阅完成后，从 `user` 中获取远端视频轨道对象。
					const remoteVideoTrack = user.videoTrack;

					// 也可以只传入该 DIV 节点的 ID。
					remoteVideoTrack.play('remote-player');
					this.$data.localFullRemoteCorner = false;
				}

				// 表示本次订阅的是音频。
				if(mediaType === 'audio'){
					// 订阅完成后，从 `user` 中获取远端音频轨道对象。
					const remoteAudioTrack = user.audioTrack;
					rtc.other = user;
					// 播放音频因为不会有画面，不需要提供 DOM 元素的信息。
					remoteAudioTrack.play();
				}
			});

			rtc.client.on('user-left', () => {
				this.hangup();
			});
		},

		async join(){
			const { confr } = this.$store.state.agora;
			let { channel, token, type } = confr;
			const appId = WebIM.config.AgoraAppId;
			let imUserName = WebIM.conn.context.jid.name;

			let params = {
				username: imUserName,
				channelName: channel,
				appkey: WebIM.conn.appKey,
			};
			const { accessToken, agoraUserId } = await this.getRtctoken(params);
			const uid = await rtc.client.join(
				appId,
				channel,
				accessToken,
				agoraUserId
			);

			// 通过麦克风采集的音频创建本地音频轨道对象。
			rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();

			// 将这些音视频轨道对象发布到频道中。

			let config = [rtc.localAudioTrack];

			if(type === 0){
				await rtc.client.publish(config);
				// rtc.localAudioTrack.play();
			}
			else{
				// 通过摄像头采集的视频创建本地视频轨道对象。
				rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
				config.push(rtc.localVideoTrack);
				await rtc.client.publish(config);
				rtc.localVideoTrack.play('local-player');
			}

			this.interval();
		},

		async close(){
			const { confr } = this.$store.state.agora;
			rtc.localAudioTrack && rtc.localAudioTrack.close();
			rtc.localVideoTrack && rtc.localVideoTrack.close();
			if(confr.callerIMName === WebIM.conn.context.jid.name){
				this.cancelCall();
			}
			this.hangup();
			await rtc.client.leave();
		},

		interval(){
			let hour = 0,
				minute = 0,
				second = 0;
			this.intervalID = setInterval(() => {
				second += 1;
				if(second === 60){
					second = 0;
					minute += 1;
					if(minute === 60){
						minute = 0;
						hour += 1;
						if(hour == 24){
							hour = 0;
						}
					}
				}
				let time = this.loadTime(hour, minute, second);
				this.setCallDuration(time);
			}, 1000);
		},
		loadTime(hour, minute, second){
			const n2s = (n) => {
				let s = '';
				if(n >= 0 && n < 10){
					s = '0' + n;
				}
				else{
					s = n + '';
				}
				return s;
			};
			let str = '';
			let hs = n2s(hour),
				ms = n2s(minute),
				ss = n2s(second);
			str = hs == '00' ? ms + ':' + ss : hs + ':' + ms + ':' + ss;
			return str;
		},
		controlStream(type){
			if(type === 'audioControl'){
        	this.$refs.audio.isopen ? rtc.localAudioTrack.setEnabled(true) : rtc.localAudioTrack.setEnabled(false);
				this.muteBtnIcon = this.$refs.audio.isopen ? microphone : microphoneMute

				this.$refs.audio.isopen = !this.$refs.audio.isopen
			}
			else{
        	this.$refs.video.isopen ? rtc.localVideoTrack.setEnabled(true) : rtc.localVideoTrack.setEnabled(false);
				this.$refs.video.style.color = this.$refs.video.isopen ? '#eeeeee' : '#4eb1f4'
				this.$refs.video.isopen = !this.$refs.video.isopen
			}
		}
	},

	components: {
		Draggable,
	},
};
</script>

