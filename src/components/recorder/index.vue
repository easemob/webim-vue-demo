<template>
	<div>
		<a-modal
		:title="null"
		:closable="false"
		v-model="recoderVisible"
		width="0"
		centered
		:footer="null">
			<div class="recoder" v-show="recoderVisible">
				<div class="sound-waves">
					<div
						v-for="(iheight, index) in randomheight"
						:key="index"
						class="wavesItem"
						:style="{'height': iheight + 'px'}"
					></div>
				</div>
				<div class="tipText">按住开始录音</div>
				<a-button
					type="primary"
					class="holdBtn"
					@touchstart="mouseStart"
					@touchend="mouseEnd('audio')"
					@mousedown.prevent="mouseStart"
					@mouseup.prevent="mouseEnd('audio')"
				>
					<svg t="1571062524943" class="icon microphone" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2945" width="200" height="200"><path d="M714 605.9v-338c0-111.4-90.6-202-202-202s-202 90.6-202 202v338c0 104.6 80 190.9 182 201v111.2H379c-11 0-20 9-20 20s9 20 20 20h266c11 0 20-9 20-20s-9-20-20-20H532V806.9c102-10.1 182-96.4 182-201z m-202-500c89.3 0 162 72.7 162 162v318H350v-318c0-89.4 72.7-162 162-162z m-160.8 520h321.5c-9.9 79.9-78.2 142-160.8 142s-150.8-62.1-160.7-142z" fill="#565656" p-id="2946"></path><path d="M455.4 193.8m-18.4 0a18.4 18.4 0 1 0 36.8 0 18.4 18.4 0 1 0-36.8 0Z" fill="#565656" p-id="2947"></path><path d="M455.4 303.5m-18.4 0a18.4 18.4 0 1 0 36.8 0 18.4 18.4 0 1 0-36.8 0Z" fill="#565656" p-id="2948"></path><path d="M455.4 413.2m-18.4 0a18.4 18.4 0 1 0 36.8 0 18.4 18.4 0 1 0-36.8 0Z" fill="#565656" p-id="2949"></path><path d="M455.4 522.9m-18.4 0a18.4 18.4 0 1 0 36.8 0 18.4 18.4 0 1 0-36.8 0Z" fill="#565656" p-id="2950"></path><path d="M398.9 248.7m-18.4 0a18.4 18.4 0 1 0 36.8 0 18.4 18.4 0 1 0-36.8 0Z" fill="#565656" p-id="2951"></path><path d="M398.9 358.4m-18.4 0a18.4 18.4 0 1 0 36.8 0 18.4 18.4 0 1 0-36.8 0Z" fill="#565656" p-id="2952"></path><path d="M398.9 468.1m-18.4 0a18.4 18.4 0 1 0 36.8 0 18.4 18.4 0 1 0-36.8 0Z" fill="#565656" p-id="2953"></path><path d="M512 248.7m-18.4 0a18.4 18.4 0 1 0 36.8 0 18.4 18.4 0 1 0-36.8 0Z" fill="#565656" p-id="2954"></path><path d="M512 358.4m-18.4 0a18.4 18.4 0 1 0 36.8 0 18.4 18.4 0 1 0-36.8 0Z" fill="#565656" p-id="2955"></path><path d="M512 468.1m-18.4 0a18.4 18.4 0 1 0 36.8 0 18.4 18.4 0 1 0-36.8 0Z" fill="#565656" p-id="2956"></path><path d="M568.6 193.8m-18.4 0a18.4 18.4 0 1 0 36.8 0 18.4 18.4 0 1 0-36.8 0Z" fill="#565656" p-id="2957"></path><path d="M568.6 303.5m-18.4 0a18.4 18.4 0 1 0 36.8 0 18.4 18.4 0 1 0-36.8 0Z" fill="#565656" p-id="2958"></path><path d="M568.6 413.2m-18.4 0a18.4 18.4 0 1 0 36.8 0 18.4 18.4 0 1 0-36.8 0Z" fill="#565656" p-id="2959"></path><path d="M568.6 522.9m-18.4 0a18.4 18.4 0 1 0 36.8 0 18.4 18.4 0 1 0-36.8 0Z" fill="#565656" p-id="2960"></path><path d="M625.1 248.7m-18.4 0a18.4 18.4 0 1 0 36.8 0 18.4 18.4 0 1 0-36.8 0Z" fill="#565656" p-id="2961"></path><path d="M625.1 358.4m-18.4 0a18.4 18.4 0 1 0 36.8 0 18.4 18.4 0 1 0-36.8 0Z" fill="#565656" p-id="2962"></path><path d="M625.1 468.1m-18.4 0a18.4 18.4 0 1 0 36.8 0 18.4 18.4 0 1 0-36.8 0Z" fill="#565656" p-id="2963"></path></svg></a-button>
			</div>
		</a-modal>

		<div class="wrap">
			<!-- <input
				type="button"
				@mousedown.prevent="mouseStart"
				@mouseup.prevent="mouseEnd('audio')"
				v-model="form.time"
			/> -->
			<!-- <input
			value="语音识别"
			type="button"
			@mousedown.prevent="mouseStart"
			@mouseup.prevent="mouseEnd('turnText')"
			/> -->
			<!-- <audio
			id="audioInput"
			v-if="audioSrc"
			:src="audioSrc"
			controls="controls"
			class="content-audio"
			style="display: block;"
			>语音</audio> -->
			<mic-icon :style="{fontSize: '20px', cursor: 'pointer'}" @click.native="show" />
		</div>
		
	</div>
 
</template>
<style scoped>
	.recoder{
		/* position: fixed;
		left: calc(50% - 100px);
		top: calc(50% - 100px); */
		position: relative;
		box-shadow: 0 0 32px rgba(0, 0, 0, 0.15);
		width: 200px;
		height: 200px;
		background: #fff;
	}
	.sound-waves{
		display: flex;
		justify-content: center;
		align-items: center;
		height: 70px;
	}
	.wavesItem{
		border: 1px solid #f2f2f2;
		width: 4px;
		background: green;
		margin: 2px;
	}
	.tipText{
		text-align: center;
		font-size: 14px;
		position: absolute;
		bottom: 70px;
		width: 100%;
	}
	.holdBtn{
		width: 50px;
		height: 50px;
		border-radius: 25px;
		text-align: center;
		padding: 0;
		position: absolute;
		bottom: 10px;
		left: calc(50% - 25px);
		background: green;
	}
	.microphone{
		height: 50px;
		width: 30px;
		margin: 0 !important;
	}
</style>

<script>
import recording from './recordAudio.js';
import { mapActions } from 'vuex';
const micSVG = {
	template: `
		<svg class="icon" width="200px" height="200.00px" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
			<path fill="#333333" d="M480 704h160q27.008-0.992 44.992-19.008T704 640v-32h-96q-14.016 0-23.008-8.992T576 576t8.992-23.008T608 544h96v-96h-96q-14.016 0-23.008-8.992T576 416t8.992-23.008T608 384h96V288h-96q-14.016 0-23.008-8.992T576 256t8.992-23.008T608 224h96V192q-0.992-27.008-19.008-44.992T640 128h-256q-27.008 0.992-44.992 19.008T320 192v32h96q14.016 0 23.008 8.992T448 256t-8.992 23.008T416 288h-96v96h96q14.016 0 23.008 8.992T448 416t-8.992 23.008T416 448h-96v96h96q14.016 0 23.008 8.992T448 576t-8.992 23.008T416 608h-96v32q0.992 27.008 19.008 44.992T384 704h96z m64 64v128h192q14.016 0 23.008 8.992T768 928t-8.992 23.008T736 960H288q-14.016 0-23.008-8.992T256 928t8.992-23.008T288 896h192v-128h-96q-54.016-0.992-90.496-37.504T256 640V192q0.992-54.016 37.504-90.496T384 64h256q54.016 0.992 90.496 37.504T768 192v448q-0.992 54.016-37.504 90.496T640 768h-96z" />
		</svg>
	`
}
const micIcon = {
	template: `
		<a-icon :component="micSVG" />
	`,
	data(){
		return {
			micSVG
		}
	}
}
export default{
	components: {
		micIcon
	},
	data(){
		return {
			form: {
				time: '按住说话(60秒)',
				audioUrl: ''
			},
			num: 60, // 按住说话时间
			recorder: null,
			mediaStream: null,
			interval: '',
			audioFileList: [], // 上传语音列表
			startTime: '', // 语音开始时间
			endTime: '', // 语音结束
			audioSrc: '',

			randomheight: [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
			runAnimation: false,
			recoderVisible: false
		};
	},
	methods: {
		...mapActions(['sendRecorder']),
		// 清除定时器
		clearTimer(){
			if(this.interval){
				this.num = 60;
				clearInterval(this.interval);
			}
		},
		onRandom(){
			let me = this;
			let _randomheight = this.randomheight.concat([]);
			let i = 0;
			this.$data.randomheight = _randomheight;
			if(this.runAnimation){
				for(i; i < this.randomheight.length; i++){
					_randomheight[i] = (60 * Math.random().toFixed(2)) + 10;
				}
				setTimeout(function(){me.onRandom(); }, 500);
			}
		},
		hide(){
			this.recoderVisible = false;
		},
		show(){
			this.recoderVisible = true;
		},
		// 长按说话
		mouseStart(e){
			e.preventDefault();
			this.$data.runAnimation = true;
			this.onRandom();
			this.clearTimer();
			this.startTime = new Date().getTime();
      
			recording.get((rec, val) => {
				// 当首次按下时，要获取浏览器的麦克风权限，所以这时要做一个判断处理
				if(rec && val){
					// 首次按下，只调用一次
					if(this.flag){
						this.mouseEnd();
						this.flag = false;
					}
					else{
						this.recorder = rec;
						this.mediaStream = val
						this.interval = setInterval(() => {
							if(this.num <= 0){
								const tracks = this.mediaStream.getAudioTracks()
								tracks[0].stop()
								this.recorder.stop();
								this.num = 60;
								this.clearTimer();
							}
							else{
								this.num--;
								this.time = '松开结束（' + this.num + '秒）';
								this.recorder.start();
							}
						}, 1000);
					}
				}
			});
		},

		// 松开时上传语音
		mouseEnd(type){
			this.$data.runAnimation = false;
			// eslint-disable-next-line no-return-assign
			this.$data.randomheight = this.randomheight.map(i => i = 30);
			this.hide();
			this.clearTimer();
			this.endTime = new Date().getTime();
			if(this.recorder && this.mediaStream){
				const tracks = this.mediaStream.getAudioTracks()
				tracks[0].stop()
				this.recorder.stop();
				// 重置说话时间
				this.num = 60;
				this.time = '按住说话（' + this.num + '秒）';
				// 获取语音二进制文件
				let blob = this.recorder.getBlob();
				// 发送语音功能
				if(type === 'audio'){
					this.$data.audioSrc = WebIM.utils.parseDownloadResponse.call(WebIM.conn, blob);
					const { name, params } = Vue.$route;

					// let file = new File(
					// 	[blob],
					// 	"msr-" + new Date().toISOString().replace(/:|\./g, "-") + ".webm",
					// 	{
					// 		type: "video/webm"
					// 	}
					// );

					let uri = {
						url: WebIM.utils.parseDownloadResponse.call(WebIM.conn, blob),
						filename: 'audio',
						filetype: 'audio',
						data: blob
					};
					this.sendRecorder({
						type: name,
						useId: params.id,
						file: uri
					});
				}

				// 语音识别功能
				// if(type === "turnText"){
				// 	const apiURL = `https://mproxy.microduino.cn/baidu/asr`;
				// 	let formData = new FormData();
				// 	formData.append("file", bold);
				// 	formData.append("format", "wav");
				// 	formData.append("rate", 16000);

				// 	let audioApi = fetch(apiURL, { method: "POST", body: formData })
				// 	.then(response => {
				// 		return response.json().then(json => ({ json, response }));
				// 	})
				// 	.then(({ json, response }) => {
				// 		if(!response.ok){
				// 			return Promise.reject(json);
				// 		}
				// 		return json;
				// 	});
				// 	audioApi
				// 	.then(res => {
				// 		console.log("res>>>", res);
				// 		let txt = JSON.stringify(res);
				// 		console.log("txt=", txt);
				// 	})
				// 	["catch"](err => {
				// 		console.error("baidu api err = ", err);
				// 	});
				// }
			}
		}
	}
};
</script>
