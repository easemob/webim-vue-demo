<template>
    <Draggable v-if="visible" id='drag2'>
        <div 
            class="call-wrapper PC"
        >

            <div v-if="groupname" class="title">{{groupname}}</div>
            <div v-else class="title">{{title}}</div>
            <div
                class="video-wrapper"
                v-if="make_call_type == 'single'"
            >

                <video ref='localVideo' class='main' autoPlay muted playsInline/>
                <video ref='remoteVideo' class="small" autoPlay playsInline />
            </div>
            <div
                class="video-wrapper"
                v-else
            >

                <video ref='localVideo' class='main' autoPlay muted playsInline/>
            </div>

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
                v-if="call_status == 'calling' && call_role != 'caller' "
                class="el-icon-phone font accept"
                @click="accept"></i>
            <i 
                v-if="call_status == 'calling' && call_role != 'caller' " 
                class="el-icon-switch-button close" 
                @click="refuse"></i>
            <i v-else class="el-icon-switch-button close" @click="hangup"></i>

        </div>

    </Draggable>
</template>

<script>
import "./index.less";
import Draggable from "../draggable";
import WebIM from "../../utils/WebIM";

let call_log = '' // 上穿日志
function call_report_log() {

}

export default{
	data(){
		return {
            visible: false,
            user: WebIM.conn.user,

            //开始实现
            confr_info: null,
            join_info: null,
            pushedStream: null,
            callType: 'video',
            make_call_type: null, // 1v1 | 多人

            joined: false, // 是否在会议中， 在会议中则返回 忙碌
            remotes: [], // 需要订阅的流（发起方的流 -- 暂时先不订阅）
            call_role: null, // caller: 主叫，callee: 被叫
            from: undefined,

            wait_invite_cattr_timeout: true, // 默认等待 邀请的会议属性 超时，收到会议属性后，置为false，达到5s 后，还是true hangup
            waiting_invitees: [], // 被邀请人员 还在等待响应的
            invitee_attr_timers: {}, //会议属性等待开启定时

            // 与 UI紧关联
            call_status: undefined, // 通话的状态 "joined": 加入会议, "calling": 振铃, "talking": 通话中 
            title: '',
            mic_close: false,
            camera_close: false,
            sound_close: false,
            wrapper_style: {
                width: 'auto',
                height: 'auto',
            },
		};
    },
    
    props: ['groupname'],
	methods: {
		

        // 开始实现 
        onStreamAdded(member,stream) {
            console.log('streamAdd', stream);

            if(!stream.located()) {
                this.$data.remotes.push({ member, stream }); // 都保存


                // 主叫 立即订阅
                if(this.call_role != 'callee') {
                    this.sub_remotes();
                    this.$data.call_status = 'talking';
                    this.$data.title = '正在通话中';

                    let { name } = this.$data.remotes[0].member;
                    this.$data.title = '正在与'+name+'进行通话中'
                }
                
                let { name } = member;
                let _arrs = name.split('_');

                let uid = _arrs[_arrs.length-1];

                if(uid == this.$data.user) { // 收到相同用户发流
                    console.log('hangup onStreamAdded uid == this.$data.user');
                    this.$message({
                        message: '已在其他设备处理',
                        type: 'warning',
                        duration:1500,
                        onClose: this.hangup
                    });
                } else {
                    let index = this.$data.waiting_invitees.indexOf(uid); 
                    if(index > -1) { 
                        this.$data.waiting_invitees.splice(index, 1);// 删除占位符
                        clearTimeout(this.$data.invitee_attr_timers[uid]);
                        this.check_mems()
                    } 
                }
            }

        },
        onMemberJoined(member) {
            console.log('memberAdd', member);
        },
        onMemberExited(member) {
            console.log('memberExited', member);

            this.check_mems()
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
            if(reason == 12 || reason == 10) {
                this.$message({
                    message: '已在其他设备处理',
                    duration:1500,
                    type: 'warning',
                    onClose: this.reset
                });
            }
        },
        onConfrAttrsUpdated(confr_attrs){ 
            console.log('onConfrAttrsUpdated', JSON.stringify(confr_attrs));

            // 区分是否是自己的 uid,以此判断 是主叫还是被叫
            let invitee_attrs = confr_attrs
                                .filter(item => (item.key.indexOf('invitee_') > -1 && item.op != "DEL"));

            let del_invitee_attrs = confr_attrs
                                .filter(item => (item.key.indexOf('invitee_') > -1 && item.op == "DEL"));


            if (invitee_attrs.length > 0) console.log('invitee_attrs', JSON.stringify(invitee_attrs));
            if (del_invitee_attrs.length > 0) console.log('del_invitee_attrs', JSON.stringify(del_invitee_attrs));




            // {key: "invitee_ysai", val: "{"status":"calling"}", op: ""}
            let _this = this;

            // 收到invitee 会议属性，设置超时定时器
            // 有处理或者超时，都删除
            invitee_attrs.map(item => { 

                let uid = item.key.split('_')[1];

                
                if(uid) {
                    if(uid == _this.$data.user) {
                        _this.show_calling();
                    } else {

                        _this.$data.waiting_invitees.push(uid);

                        // 设置被邀请方 超时定时器
                        _this.$data.invitee_attr_timers[uid] = setTimeout(() => {
                            console.log('invitee timeout', uid);
    
                            let index = _this.$data.waiting_invitees.indexOf(uid); 
                            if(index > -1) {// 超时删除邀请人员 会议属性 --- 所有人都能删
                                _this.emedia.deleteConferenceAttrs({ key:'invitee_'+ uid, val: JSON.stringify({ status:'timeout' }) });
                            }
                        }, 30000)

                    }
                }
            });

            // 收到删除invitee 会议属性
            del_invitee_attrs.map(item => {
                let uid = item.key.split('_')[1];
                if(uid == _this.$data.user) { // 多端登录
                
                    if(_this.$data.call_status != 'talking') {// 自己如果 talking, 则忽略(自己删除的会议属性)
                        console.log('hangup del_invitee_attrs != talking');

                        _this.hangup()
                    }
                } else { // 邀请的信息已处理或超时后的被删掉 会议属性

                    if(item.val) {
                        let val = JSON.parse(item.val);
                        let msg = {
                            'refuse': '对方已拒绝',
                            'timeout': '对方忙',
                            'busy': '对方正在通话中'
                        }

                        if(msg[val.status]) _this.$message.error(msg[val.status]);
                    }

                    let index = _this.$data.waiting_invitees.indexOf(uid); 
                    if(index > -1) { // 去除 等待邀请人员 -- 停止超时器

                        _this.$data.waiting_invitees.splice(index, 1);// 删除占位符
                        clearTimeout(_this.$data.invitee_attr_timers[uid]);
                        this.check_mems()
                    } 
                }
            })

        },

        // 检测会议中的人数
        check_mems() {
            let { waiting_invitees } = this.$data;

            let _cacheMembers;

            if(
                emedia.useCurrentXService 
                && emedia.useCurrentXService.current
                && emedia.useCurrentXService.current._cacheMembers
            ) {
                _cacheMembers = emedia.useCurrentXService.current._cacheMembers
            }

            console.log('waiting_invitees', waiting_invitees);

            if( waiting_invitees > 0 ) return;

            console.log('_cacheMembers', _cacheMembers);
            if(Object.keys(_cacheMembers).length > 0) return; // _cacheMembers 不包含自己的信息

            if(this.$data.make_call_type == 'single' && this.$data.call_status == 'talking') this.$message.error('对方已挂断')
            this.hangup()
        },




          
        // 邀请他人
        invite(make_call_type, tos, callType) {
            if(this.$data.visible) {
                this.$message.warning('您正在通话中，请结束通话，再发起新的通话')
                console.warn('you had meeting, not allowed make call');
                return
            }

            this.$data.make_call_type = make_call_type;
            this.$data.callType = callType;
            this.$data.visible = true;


            let _this = this;
            (async ()=> {
                try {
                    await _this.ready_call();
                    
                    _this.$data.title = '正在等待对方接收邀请...';
                    
                    let { confrId } = _this.$data.confr_info; // 设置一条占位会议属性
                    _this.emedia.setConferenceAttrs({ key: 'confrId', val: confrId });

                    tos.map(item => {
                        _this.emedia.setConferenceAttrs({ key: 'invitee_' + item, val: JSON.stringify({ status:'calling' }) })
                    })

                    const send_result = await this.send_invite_msg(tos);
                    console.log('send_result', send_result);

                    
                } catch (error) {
                    console.log('hangup 发起呼叫失败，请重新发起');

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

            await this.publish()
            

        },
        // 发起呼叫
        send_invite_msg(tos) {

            let { confr_info, callType } = this.$data;
            if(!confr_info) {
                console.error('not have confr_info');
                return
            }

            let { confrId, password} = confr_info;

            tos.map(item => {

                let id = WebIM.conn.getUniqueId();    
                let msg = new WebIM.message('txt', id);
                
                let set_options = {
                        msg: 'invite call',
                        to: item,                          
                        chatType: 'singleChat',
                        ext: { confrId, password, callType },
                        success: function (id, serverMsgId) {
                            console.log('send invite success',{id, serverMsgId});  
                        },                              
                        fail: function(e){
                            console.error("Send invite error");  
                        }   
                    }
    
                msg.set(set_options);
                WebIM.conn.send(msg.body);
                
            })

        },

        
        // 整个程序收到消息 判断是否请求通话
        receivedMsg(msg) {
            console.log('call com onMsg', msg);
            if(msg.from == this.$data.user) return; //自己的另一端发送的

            if(msg.data == 'call busy') { // 收到忙碌消息
                let index = this.$data.waiting_invitees.indexOf(msg.from);
                if(index > -1) {
                    this.emedia.deleteConferenceAttrs({ 
                        key:'invitee_'+msg.from,
                        val: JSON.stringify({ status:'busy' }) 
                    });
                }
                return
            }


            // 收到 邀请通话 消息

            if(this.$data.join_info) { // 正在会议中
                console.warn('has jioned meeting');

                // send busy msg
                let id = WebIM.conn.getUniqueId();    
                let busy_msg = new WebIM.message('txt', id);   

                let set_options = {
                    msg: 'call busy',
                    to: msg.from,                          
                    chatType: 'singleChat',
                    success: function (id, serverMsgId) {
                        console.log('send busy msg success'); 
                    },                              
                    fail: function(e){
                        console.error("Send busy msg error", e);  
                    }   
                }

                busy_msg.set(set_options);
                WebIM.conn.send(busy_msg.body);

                return
            }


            if(!msg.ext) {
                console.log('not have msg.ext');
                return
            }

            let { confrId, password } = msg.ext;
            if(!confrId || !password ) {
                console.log('not have ext.confrId or password');
                return
            }

            this.invited_join(msg)

        },

        // 收到邀请，加入会议
        async invited_join(msg) {

            this.$data.confr_info = { confrId: msg.ext.confrId, password: msg.ext.password };
            this.$data.callType = msg.ext.callType;

            try {
                this.$data.call_role = 'callee';
                this.$data.from = msg.from;

                const join_info = await this.join();
                this.$data.join_info = join_info;


                this.$data.wait_invite_cattr_timer = setTimeout(() => {
                    // 5s 后还没收到 邀请自己的会议属性 退出会议
                    if(this.$data.wait_invite_cattr_timeout) {
                        console.log('hangup 5s 后还没收到 邀请自己的会议属性 退出会议');
                        this.hangup()
                    }
                }, 5000)
            } catch (error) {
                console.error('called join error', error);
                this.reset();
            }

        },

        // 振铃
        show_calling() {
            if(this.$data.call_status == 'calling') return; //已经收到了 邀请

            this.$data.visible = true;
            this.$data.wait_invite_cattr_timeout = false; clearTimeout(this.$data.wait_invite_cattr_timer);
            this.$data.call_status = 'calling';

            if(this.$data.make_call_type == 'single') {
                if(
                    this.$data.call_role == 'callee' &&
                    this.$data.from
                ) this.$data.title = this.$data.from+'请求与您进行通话'
                
            } else {
                this.$data.title = this.$data.from+'请求您加入会议'
            }
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


            let _this = this;
            return new Promise((resolve, reject) => {
                _this.emedia.publish(constraints).then(pushedStream => {
                    _this.$data.pushedStream = pushedStream;
                    _this.emedia.streamBindVideo(_this.$data.pushedStream, _this.$refs.localVideo);

                    resolve('publish success')
                })
                .catch(error => reject(error));
            });

        },
        
        // 接听
        accept() {
            
            let _this = this;
            (async ()=> {
                try {
                    await _this.publish()
                    _this.$data.call_status = 'talking';

                    _this.emedia.deleteConferenceAttrs({ 
                        key:'invitee_'+_this.$data.user,
                        val: JSON.stringify({ status:'accept' }) 
                    });

                    _this.sub_remotes()
                } catch (error) {
                    console.error('accept error', error);
                    _this.$message.error('接听失败，请重新接听');
                }

                let { name } = _this.$data.remotes[0].member;
                _this.$data.title = '正在与'+name+'进行通话中'
            })()
        }, 
        // 订阅对方流
        sub_remotes() {
            let { remotes } = this.$data;

            if(this.$data.make_call_type == 'single') {
                let remote = remotes[0];
                if( remote.member && remote.stream) {
                    this.emedia.subscribe(remote.member, remote.stream, true, true, this.$refs.remoteVideo)
                }
            }
        },
        // 拒绝
        refuse() {
            this.emedia.deleteConferenceAttrs({ 
                key:'invitee_'+this.$data.user,
                val: JSON.stringify({ status: 'refuse'}),
                success: this.hangup,
                error: this.hangup
            });
            console.log('hangup 拒绝');
            this.$data.visible = false
        },
        // 挂断
        hangup() { // 多种情况会触发 挂断
            
            this.emedia.exitConference();
            this.reset()
        },

        _destroy() {
            let confr_info = this.$data.confr_info;

            if(confr_info && confr_info.id) {
                this.emedia.destroyConference(confr_info.id)
            }
        }, 


        // 重置
        reset() {


            for (const key in this.$data.invitee_attr_timers) {
                let timer = this.$data.invitee_attr_timers[key];

                clearTimeout(timer)
            }

            Object.assign(this.$data, 
                            this.$options.data(), 
                            { os:this.$data.os, wrapper_style: this.$data.wrapper_style}
                        ) // os、wrapper_style 不重置
            emedia.mgr.catrrs=[]; // 无法更新 SDK，临时改一下

            // if(process.env.NODE_ENV == 'development') console.clear();
        },


        // 控制视频流
        controlAudio() {

            let { pushedStream } = this.$data;

            if(!pushedStream) return;

            let funName = this.$data.mic_close ? 'resumeAudio' : 'pauseAudio'

            let _this = this;
            this.emedia[funName](pushedStream)
            .then(() => {
                _this.$data.mic_close = !_this.$data.mic_close;
            })
            
        },

        controlVideo() {

            let { pushedStream } = this.$data;

            if(!pushedStream) return;

            let funName = this.$data.camera_close ? 'resumeVideo' : 'pauseVideo'

            let _this = this;
            this.emedia[funName](pushedStream)
            .then(() => {
                _this.$data.camera_close = !_this.$data.camera_close;
            })
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
    watch: {
        callType: function(val) {
            if( this.$data.callType == 'voice') this.$data.camera_close = true;

        }
        
    },
	components: {
		Draggable
    },
    
	mounted(){
        console.log('WebIm', WebIM);

        this.emedia = WebIM.EMService; // 多人会议 SDK --- 不包含 1v1
        emedia.config({ // 取全局 window.emedia
            restPrefix: 'https://a1.easemob.com'
        })

        // 初始化会议监听
        this.emedia.onMemberJoined = this.onMemberJoined; // 有人加入
        this.emedia.onMemberExited = this.onMemberExited; // 有人加入
        this.emedia.onStreamAdded = this.onStreamAdded; // 有流加入
        this.emedia.onConferenceExit = this.onConferenceExit; // 退出会议
        this.emedia.onConfrAttrsUpdated = this.onConfrAttrsUpdated; // 会议属性变更

        
        // 页面刷新 退出会议
        let _this = this;
        window.onbeforeunload = () => {
            console.log('onbeforeunload');
            _this.hangup()
        }


    },
    
    
};
</script>
<style scoped>
.call-wrapper {
    background: #dadada;
    transition: 0.5s;
}

.shrink.call-wrapper {
    position: absolute;
    top: 200px;
    left: 0;

    transition: 0.5s;
}
.PC {
    width: 500px;
    height: 400px;
}

.title {
    text-align: center;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;

    font-size: 16px;
}
.video-wrapper {
    width: 100%;
    height: 100%;
}
video.main {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;

}

.shrink video.main {
    z-index: 5;
    background:#dadada;
}
.shrink-place {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 6;

    width: 100%;
    height: 100%;
    background: transparent;
}
.PC video.small {
    position: absolute;
    width: 25%;
    height: 20%;
    top: 10%;
    right: 5%;
}

video.small {
    position: absolute;
    width: 35%;
    height: 20%;
    top: 10%;
    right: 5%;
}

.callees-placeholder-wrapper{
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

.call-wrapper i {
    cursor: pointer;
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

.shrink-wrapper {
    position: absolute;
    top: 20px;
    left: 20px;

    width: 32px;
    height: 32px;
    z-index: 2;
}

.shrink-wrapper i {
    color: #fff;
    font-size: 16px;
    font-weight: bold;
}
.shrink-wrapper i:first-child {
    position: absolute;
    top: 0;
    right: 0;
}
.shrink-wrapper i:last-child {
    position: absolute;
    bottom: 0;
    left: 0;
}



/* old */
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
