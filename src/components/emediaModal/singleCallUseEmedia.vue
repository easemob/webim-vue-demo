<template>
    <Draggable v-if="visible" id='drag2'>
        <div class="call-wrapper PC">
            <div class="title">{{title}}</div>
            <video ref='localVideo' class='main' autoPlay muted playsInline/>
            <video ref='remoteVideo' class="small" autoPlay playsInline />

            <!-- <div class="mask">正在等待{{contact}}接受邀请</div>
            <div class="mask">{{contact}}请求{{streamType}}通话</div>
            <div class="voiceCall">正在与{{contact}}通话</div>

             -->

                <!-- v-bind:class="{localVideo: !toggle, remoteVideo: toggle}"   -->
            <div class="media-action-wrapper">
                <i 
                    class="el-icon-turn-off-microphone font"
                    :class="{close: mic_close}" 
                    @click="controlAudio()"></i>
                <i class="el-icon-video-camera font camera" 
                    :class="{close: camera_close}" 
                    @click="controlVideo()"></i>

                <a-icon 
                    class="font mute" 
                    :class="{close: sound_close}"
                    type="sound" 
                    @click="controlSound"/>
            </div>

            <i class="el-icon-phone font accept" @click="accept"></i>
            <i class="el-icon-switch-button close" @click="hangup"></i>

        </div>

        <!--  -->
        <!-- <i v-show="showMute" class="el-icon-headset font mute" ref="mute" @click="mute"></i> -->

        <!-- 
        
        <a-icon v-show="showMute && streamType=='视频'" class="font camera" ref='video' isopen="true" type="video-camera" @click="controlStream('videoControl')"/>
        <a-icon v-show="showMute" class="font mute" type="sound" ref="mute" @click="mute"/>
        <i v-show="showMute && streamType=='视频'" class="el-icon-refresh font toggle" @click="toggleClick"></i> -->

        <!-- <div v-bind:class="{rtcVoiceContent: streamType=='语音', rtcVideoContent: streamType=='视频'}" >
        </div> -->
    </Draggable>
</template>

<script>
import "./index.less";
import Draggable from "../draggable";
import WebIM from "../../utils/WebIM";
export default{
	data(){
		return {
			visible: false,
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
            pushedStream: null,
            callType: 'video',

            title: '正在邀请谁',
            mic_close: false,
            camera_close: false,
            sound_close: false
		};
    },
    
	methods: {
		

        // 开始实现 
        // 整个程序收到消息 判断是否请求通话
        receivedMsg(msg) {
            console.log('call com onMsg', msg);
            // judge msg 类型 busy | invite


        },
        // 随机生成密码
        get_uuid_psw (){ 
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 6 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(6);
            })
        },
        // 邀请他人
        invite(to, callType) {
            this.$data.callType = callType;
            this.$data.visible = true;


            let _this = this;
            (async ()=> {
                try {
                    await this.ready_call();
                    
                    this.emedia.streamBindVideo(this.$data.pushedStream, this.$refs.localVideo);

                    await this.send_invite_msg(to)
                } catch (error) {

                    _this.hangup();

                    console.error('invite error', error);
                    _this.$message.error('发起呼叫失败，请重新发起');

                }

            })()
        },

        async ready_call() {
            const confr_info = await this._create()
            this.$data.confr_info = confr_info;

            const join_info = await this.join();
            this.$data.join_info = join_info;

            const pushedStream = await this.publish()
            this.$data.pushedStream = pushedStream;

        },
        // 发起呼叫
        send_invite_msg(to) {

            let id = WebIM.conn.getUniqueId();    
            let msg = new WebIM.message('txt', id);  

            let { confr_info } = this.$data;


            return new Promise((resolve,reject) => {
                if(!confr_info) reject('not have confr_info');

                let { confrId, password} = confr_info;

                let set_options = {
                    msg: 'invite call',
                    to,                          
                    chatType: 'singleChat',
                    ext: { confrId, password },
                    success: function (id, serverMsgId) {
                        resolve('send invite success')  
                    },                              
                    fail: function(e){
                        reject("Send invite error");  
                    }   
                }
            })


            msg.set(set_options);
            WebIM.conn.send(msg.body);
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

        _destroy() {
            let confr_info = this.$data.confr_info;

            if(confr_info && confr_info.id) {
                this.emedia.destroyConference(confr_info.id)
            }
        }, 
        join() {
            if(!this.$data.confr_info) {
                throw Error('not have confr_info')
            }

            let { confrId, password } = this.$data.confr_info;

            return this.emedia.joinUsePassword(confrId, password); 
        },

        publish() {
            let constraints = this.$data.callType == 'voice' ? {audio: true, video:false} : {audio: true, video:true}

            return this.emedia.publish({audio: true, video:true});

        },
        onStreamAdded(member,stream) {
            console.log('streamAdd', stream);
        },
        onConferenceExit(reason, failed) {

        },

        // 控制视频流
        controlAudio() {
            this.$data.mic_close = !this.$data.mic_close
        },
        controlVideo() {
            this.$data.camera_close = !this.$data.camera_close
        },
        controlSound() {
            this.$data.sound_close = !this.$data.sound_close
        },
        // 重置
        reset() {

            this._destroy();

            this.$data.callType = 'video';
            this.$data.confr_info = null;
            this.$data.join_info = null;
            this.$data.pushedStream = null;

        },
        // 挂断
        hangup() {
            this.$data.visible = false;
            this.reset()
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
.call-wrapper {
    background: #dadada;
}
.PC {
    width: 500px;
    height: 400px;
}
.phone {
    width: 100%;
    height: 100%;
}
.title {
    text-align: center;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;

    font-size: 16px;
}

video.main {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
}
video.small {
    position: absolute;
    width: 25%;
    height: 20%;
    top: 10%;
    right: 5%;
}

.media-action-wrapper {
    position: absolute;
    left: 0;
    bottom: 15px;
    height: 30px;
    padding-left:20px ;
}

.media-action-wrapper i {
    position: static;
    margin-right:10px ;
    cursor: pointer;
    color: #2c3e50;
}

.media-action-wrapper i.close {
    color: #4eb1f4;
} 

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
