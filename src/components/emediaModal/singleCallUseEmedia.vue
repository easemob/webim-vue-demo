<template>
    <Draggable v-show="emediaModalVisible" id='drag2'>
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
            },
            

            //开始实现
            confr_info: null,
            join_info: null,
            pushedStream: null
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
		

        // 开始实现 
        // 随机生成密码
        get_uuid_psw (){ 
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 6 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(6);
            })
        },
        // 邀请他人
        invite(to) {
            console.log('to', to); // 创建会议并加入并推流、保存会议信息和自己的信息

            let _this = this;
            (async ()=> {

                try {
                    const confr_info = await _this._create()
                    _this.$data.confr_info = confr_info;

                    const join_info = await _this.join();
                    _this.$data.join_info = join_info;

                    const pushedStream = await _this.publish()
                    _this.$data.pushedStream = pushedStream;

                } catch (error) {
                    console.error('invite err', error);
                }
            })()
        },
        // 创建会议
        _create() {
            let _this = this;
            let password = _this.get_uuid_psw();
            let create_options =  {
                confrType: 10, 
                password , 
                supportWechatMiniProgram: true
            }
            return this.emedia.createConference(create_options);

        },
        join() {
            if(!this.$data.confr_info) {
                throw Error('not have confr_info')
            }

            let { confrId, password } = this.$data.confr_info;

            return this.emedia.joinUsePassword(confrId, password); 
        },

        publish() {
            return this.emedia.publish({audio: true, video:true});

        },
        onStreamAdded(member,stream) {
            console.log('streamAdd', stream);
        },
        onConferenceExit(reason, failed) {

        },

        // 挂断
        hangup() {
            
        }
	},
	components: {
		Draggable
	},
	mounted(){
        console.log('WebIm', WebIM);
        this.emedia = WebIM.EMService; // 多人会议 SDK --- 不包含 1v1


        // 初始化会议监听
        this.emedia.onMemberJoined = this.onMemberJoined; // 有人加入
        this.emedia.onStreamAdded = this.onStreamAdded; // 有流加入
        this.emedia.onConferenceExit = this.onConferenceExit; // 有流加入
		// if(WebIM.config.isWebRTC && WebIM.WebRTC){
		// 	this.initWebRTC();
		// 	// this.channel = new RTCChannel(this.refs.rtcWrapper, this.props.collapsed)
		// }
		// var video = this.$refs.localVideo;
		// video.addEventListener("loadedmetadata", this.loadedmetadataLocalHandler);
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
