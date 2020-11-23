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
            <div class="media-action-wrapper" v-if="pushedStream">
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

            <i 
                v-if="call_status == 'calling'"
                class="el-icon-phone font accept"
                @click="accept"></i>
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
import message from '../../../../test-samples/uni-app/components/uni-popup/message';

let call_log = '' // 上穿日志
function call_report_log() {

}

export default{
	data(){
		return {
			visible: false,
			// showAccept: false,
			// showMute: false,
			// contact: "",
			// streamType: "视频",
			// toggle: true,
			// serverStyle: {
			// 	width: "360px",
			// 	height: "360px"
            // },
            

            //开始实现
            confr_info: null,
            join_info: null,
            pushedStream: null,
            callType: 'video',

            joined: false, // 是否在会议中， 在会议中则返回 忙碌
            remote: null, // 需要订阅的流（发起方的流 -- 暂时先不订阅）
            call_role: null, // caller: 主叫，callee: 被叫


            pending_invite_cattr_timeout: true, // 默认等待 邀请的会议属性 超时，收到会议属性后，置为false，达到5s 后，还是true hangup


            // 与 UI紧关联
            call_status: undefined, // 通话的状态 "joined": 加入会议, "calling": 振铃, "talking": 通话中 
            title: '正在邀请谁',
            mic_close: false,
            camera_close: false,
            sound_close: false,
		};
    },
    
	methods: {
		

        // 开始实现 
        onStreamAdded(member,stream) {
            console.log('streamAdd', stream);

            if(!stream.located()) {
                this.$data.remote = { member, stream };

                // this.emedia.subscribe(member, stream, true, true, this.$refs.remoteVideo)
            }
        },
        onMemberJoined(member) {
            console.log('memberAdd', member);
        },
        onConferenceExit(reason, failed) {
            let reasons = {
                0: '正常挂断', 
                1: "没响应",
                2: "服务器拒绝",
                3: "对方忙",
                4: "网络原因",
                5: "不支持",
                6: "超时",
                10: "其他设备登录",
                11: "会议关闭",
                12: "被踢出了会议"
            }

            console.log('onConferenceExit', reason);
            this.hangup()
        },
        onConfrAttrsUpdated(confr_attrs){ 
            console.log('onConfrAttrsUpdated', confr_attrs);
            // 会议属性变更

            // {key: "invitee_ysai", val: "{"status":"calling"}", op: ""}
            let _this = this;
            
            confr_attrs.map(item => {

                if(
                    item.key == 'invitee_'+_this.$data.user 
                    && item.op != 'DEL'
                ) {
                    _this.show_calling()
                }
            });
        },





          
        // 邀请他人
        invite(to, callType) {
            this.$data.callType = callType;
            this.$data.visible = true;


            let _this = this;
            (async ()=> {
                try {
                    await _this.ready_call();
                    
                    _this.$data.joined = true;
                    _this.$data.call_role = 'caller';
                    
                    _this.emedia.streamBindVideo(_this.$data.pushedStream, _this.$refs.localVideo);

                    const send_result = await this.send_invite_msg(to);
                    console.log('send_result', send_result);

                    let { confrId } = _this.$data.confr_info; // 设置一条占位会议属性
                    _this.emedia.setConferenceAttrs({ key: 'confrId', val: confrId })
                    _this.emedia.setConferenceAttrs({ key: 'invitee_' + to, val: JSON.stringify({ status:'calling' }) })
                    
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
                    // ext: { confrId, password },
                    success: function (id, serverMsgId) {
                        resolve({id, serverMsgId})  
                    },                              
                    fail: function(e){
                        reject("Send invite error");  
                    }   
                }

                msg.set(set_options);
                WebIM.conn.send(msg.body);
            })
            
            
        },

        
        // 整个程序收到消息 判断是否请求通话
        receivedMsg(msg) {
            console.log('call com onMsg', msg.ext);
            // judge msg 类型 busy | invite
            if(!msg.ext) {
                console.log('not have msg.ext');
                return
            }

            let { confrId, password } = msg.ext;
            if(!confrId || !password ) {
                console.log('not have ext.confrId or password');
                return
            }

            if(this.$data.joined) {
                console.warn('has jioned meeting');
                // send busy msg
                return
            }


            // 加入会议
            this.$data.confr_info = { confrId, password };
            let _this = this;
            
            (async () => {
                try {
                    const join_info = await _this.join();
                    _this.$data.join_info = join_info;
                    _this.$data.call_role = 'callee';


                    setTimeout(() => {
                        // 5s 后还没收到 邀请自己的会议属性 退出会议
                        if(_this.$data.pending_invite_cattr_timeout) {
                            _this.hangup()
                        }
                    }, 5000)
                    // _this.$data.pending_invite_cattr_timer_num = 0;
                    // _this.$data.pending_invite_cattr_timer = setInterval(() => {
                    //     if(_this.$data.pending_invite_cattr_timer_num >= 4) clearInterval(_this.$data.pending_invite_cattr_timer);

                    //     _this.$data.pending_invite_cattr_timer_num++

                    //     console.log('pending-num', _this.$data.pending_invite_cattr_timer_num);
                    // },1000)
                } catch (error) {
                    console.error('called join error', error);
                }

            })()
                
        },

        // // 等待会议属性
        show_calling() {
                this.$data.visible = true;
                this.$data.pending_invite_cattr_timeout = false;
                this.$data.call_status = 'calling';
            // if(!this.$data.pending_invite_cattr_timeout) {

            //     // 振铃
            //     this.$data.pending_invite_cattr_timeout = 
            // }
                    // const pushedStream = await _this.publish()
                    // _this.$data.pushedStream = pushedStream;
                    // _this.emedia.streamBindVideo(_this.$data.pushedStream, _this.$refs.localVideo);
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
            let constraints = this.$data.callType == 'voice' ? 
                                {audio: true, video:false} : {audio: true, video:true}

            return this.emedia.publish(constraints);

        },
        
        
        // 接听
        accept() {
            let _this = this;
            _this.$data.callType = 'voice' // 默认以语音推流
            (async ()=> {
                try {
                    await _this.publish()
                    _this.$data.call_status = 'talking'
                } catch (error) {
                    _this.$message.error('接听失败，请重新接听');
                }
            })()
        }, 
        // 挂断
        hangup() { // 多种情况会触发 挂断
            

            let call_role = this.$data.call_role;

            if(call_role) {

                if(call_role == 'caller') { //主叫 结束会议
                    this._destroy()
                } else {
                    this.exit()
                }
            }

            this.reset()

        },

        _destroy() {
            let confr_info = this.$data.confr_info;

            if(confr_info && confr_info.id) {
                this.emedia.destroyConference(confr_info.id)
            }
        }, 

        exit() {
            return this.emedia.exitConference();
        }, 

        // 重置
        reset() {

            this.$data.callType = 'video';
            this.$data.confr_info = null;
            this.$data.join_info = null;
            this.$data.pushedStream = null;
            this.$data.remote = null;
            this.$data.visible = false;
            this.$data.joined = false;
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

        // 随机生成密码
        get_uuid_psw (){ 
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 6 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(6);
            })
        },

	},
	components: {
		Draggable
	},
	mounted(){
        console.log('WebIm', WebIM);

        this.$data.user = WebIM.conn.user;
        this.emedia = WebIM.EMService; // 多人会议 SDK --- 不包含 1v1
        emedia.config({ // 取全局 window.emedia
            restPrefix: 'https://a1.easemob.com'
        })

        // 初始化会议监听
        this.emedia.onMemberJoined = this.onMemberJoined; // 有人加入
        this.emedia.onStreamAdded = this.onStreamAdded; // 有流加入
        this.emedia.onConferenceExit = this.onConferenceExit; // 退出会议
        this.emedia.onConfrAttrsUpdated = this.onConfrAttrsUpdated; // 会议属性变更

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
