<template>
  <div class="rtc-alert-box">
    <div class="rtc-alert-item">
      <div class="rtc-alert-avatar">
        <img src="../../../static/img/avatar@2x.png" />
      </div>
      <div class="rtc-alert-name">{{ callerIMName }}</div>
    </div>
    <div class="rtc-alert-item">
      <div class="rtc-alert-text">邀请你{{ text }}通话...</div>
      <div class="rtc-alert-button">
        <div>
          <img src="../../../static/img/hangupCall@2x.png" @click="refuse" />
        </div>
        <div>
          <img src="../../../static/img/acceptCall@2x.png" @click="accept" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import './webrtc.less';
import { mapActions, mapGetters } from 'vuex';

export default{
	data(){
		return {
		};
	},
	computed: {
		callerIMName(){
			return this.$store.state.agora.confr.callerIMName;
		},
		text(){
			let type = this.$store.state.agora.confr.type
			let text = type == 0 ? '语音' : type == 1 ? '视频' : '多人视频'
			return text;
		},
	},

	methods: {
		...mapActions(['updateConfr', 'answerCall', 'setCallStatus', 'hangup']),

		// 同意
		accept(){
			const answerCallStatus = 5;
			this.answerCall({ result: 'accept' });
			this.setCallStatus(answerCallStatus);
		},
		// 拒绝
		refuse(){
			this.answerCall({ result: 'refuse' });
			if(Vue.$store.getters.getAgora.callStatus < 7){
				this.hangup();
			}
		},
	},

	components: {
		// Draggable,
	},

	mounted(){},
};
</script>

