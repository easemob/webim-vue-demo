<template>
    <Draggable v-if="visible" id='drag2'>
        <div 
            class="call-wrapper PC"
        >

            <div class="title">{{title + ' ' + duration}}</div>

            <!-- 单端通话 -->
            <div
                class="videos-wrapper single"
                v-if="callType != 2"
                v-show="pushedStream"
            >

                <div 
                    class="item-wrapper"
                >
                    <div class="name">{{user+'(我)'}}</div>
                    <video ref='localVideo' autoPlay muted playsInline/>
                </div>

                <div 
                    class="item-wrapper remote"
                    v-for="(value, key, index) in members"
                    :key='index'
                    :id='key'
                >
                    <div class="name">{{key}}</div>
                    <div class="waiting-icon" v-if="value.status == 'waiting'">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>

            <!-- 多人页面 -->
            <div
                class="videos-wrapper multi"
                v-else
                v-show="pushedStream"
            >

                <div 
                    class="item-wrapper"
                    :class="computed_layout()"
                >
                    <div class="name">{{user+'(我)'}}</div>
                    <video ref='localVideo' autoPlay muted playsInline/>
                </div>
                <div 
                    class="item-wrapper local"
                    :class="computed_layout()" 
                    v-for="(value, key, index) in members"
                    :key='index'
                    :id='key'
                >
                    <div class="name">{{ key }}</div>
                    <div class="waiting-icon" v-if="value.status == 'waiting'">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    
                </div>
                
            </div>

            <div class="media-action-wrapper" v-if="pushedStream">
                <i 
                    class="el-icon-turn-off-microphone font"
                    :class="{close: mic_close}" 
                    @click="controlAudio()"></i>
                <i class="el-icon-video-camera font camera" 
                    :class="{close: camera_close}" 
                    @click="controlVideo()"></i>

                <!-- <a-icon 
                    class="font mute" 
                    :class="{close: sound_close}"
                    type="sound" 
                    @click="controlSound"/> -->

                <i 
                    class="el-icon-circle-plus-outline font"
                    @click="() => this.$emit('show_add_member_modal')"
                    v-if="callType == 2"
                ></i>
            </div>

            <i 
                v-if="!pushedStream && call_role != 'caller' "
                class="el-icon-phone font accept"
                @click="accept"></i>
            <i 
                v-if="!pushedStream && call_role != 'caller' " 
                class="el-icon-switch-button close" 
                @click="refuse"></i>
            <i v-else class="el-icon-switch-button close" @click="hangupHandler"></i>

        </div>

    </Draggable>
</template>

<script>
import "./index.less";
import Draggable from "../draggable";
import WebIM from "../../utils/WebIM";

let call_log = '' // 上传日志
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
            callType: null, // 0: 1v1音频 | 1: 1v1视频 | 2: 多人
            
            joined: false, // 是否在会议中， 在会议中则返回 忙碌
            is_hangup: undefined,
            call_role: null, // caller: 主叫，callee: 被叫
            from: undefined,

            wait_invite_cattr_timeout: true, // 默认等待 邀请的会议属性 超时，收到会议属性后，置为false，达到5s 后，还是true hangup
            members: {
                // 'qx.su.1': { status: 'waiting'},
                // 'qx.su.2': { status: 'waiting'},
                // 'qx.su.3': { status: 'waiting'},
                // 'qx.su.4': { status: 'waiting'},
            }, // 会议中成员 包括订阅成功的，和正在邀请的
            
            // invitee_attr_timers: {}, //会议属性等待开启定时

            // 与 UI紧关联
            call_status: undefined, // 通话的状态 "calling": 振铃, "talking": 通话中 

            title: '',
            duration: '',
            duration_num: 0,
            duration_timer: null,

            mic_close: false,
            camera_close: false,
            sound_close: false,
		};
    },
    
	methods: {
		

        // 开始实现 
        onStreamAdded(member,stream) {
            
            if(!stream.located()) {
                console.log('[Call Component]  streamAdd', stream);

                let { name } = member;
                let _arrs = name.split('_');

                let uid = _arrs[_arrs.length-1];

                if(uid == this.$data.user) { // 收到相同用户发流
                    console.log('[Call Component]  hangup onStreamAdded uid == this.$data.user');
                    this.$message({
                        message: '已在其他设备处理',
                        type: 'warning',
                        duration:1500,
                        onClose: this.hangup
                    });
                } else {
                    this.update_members(uid, 'pubed', { stream ,member })// 保存流的信息

                    if(this.$data.pushedStream) { // 已经发流，立即订阅
                        this.sub_remotes();
                        if(!this.duration_timer) this._start_duration();
                    }

                    // 修改 title 1v1
                    if(
                        this.$data.callType != 2
                        && this.$data.call_role != 'callee'
                    ) {
                        this.$data.title = '正在与'+(name || '对方')+'进行通话中'
                    }
                }

                
            }

        },
        onStreamRemoved(member, stream) {

        },
        onMemberJoined(member) {
            console.log('[Call Component]  memberAdd', member);
        },
        onMemberExited(member, reason) {
            if(this.$data.is_hangup) return; // 已经挂断不再执行 onMemberExited
            console.log('[Call Component]  memberExited', member, reason);
            if(reason != 10){ // 10: 其他端发流，不处理

                if(this.$data.callType != 2) {
                    let item = this.$data.members[member.name];
                    if(item && item.status != 'waiting') this.$message.error('对方已挂断')
                }

                this.del_member(member.name);
                this.check_mems()
            }
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

            console.log('[Call Component]  onConferenceExit', reason);
            if(reason == 12 || reason == 10) {
                this.$message({
                    message: '已在其他设备处理',
                    duration:1500,
                    type: 'warning',
                    onClose: this.reset
                });
            }

            if( reason == 11) this.reset();
        },
        onConfrAttrsUpdated(confr_attrs){ 
            console.log('[Call Component]  onConfrAttrsUpdated', JSON.stringify(confr_attrs));

            // 区分是否是自己的 uid,以此判断 是主叫还是被叫
            let invitee_attrs = confr_attrs
                                .filter(item => (item.key.indexOf('invitee_') > -1 && item.op != "DEL"));

            let del_invitee_attrs = confr_attrs
                                .filter(item => (item.key.indexOf('invitee_') > -1 && item.op == "DEL"));


            if (invitee_attrs.length > 0) console.log('[Call Component]  invitee_attrs', JSON.stringify(invitee_attrs));
            if (del_invitee_attrs.length > 0) console.log('[Call Component]  del_invitee_attrs', JSON.stringify(del_invitee_attrs));




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

                        _this.update_members(uid)

                        // 设置被邀请方 超时定时器
                        _this.$data[`invitee_attr_timer_${uid}`] = setTimeout(() => {
                            
                            let member = _this.$data.members[uid]; 
                            console.log('[Call Component]  member invitee timeout', JSON.stringify(member));
                            if(member && member.status == 'waiting') {
                                _this.emedia.deleteConferenceAttrs({ key:'invitee_'+ uid });// 超时删除邀请人员 会议属性 --- 所有人都能删
                                if(_this.$data.callType != 2) _this.update_members(uid, 'timeout') // 1v1
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
                        console.log('[Call Component]  hangup del_invitee_attrs != talking');

                        _this.hangup()
                    }
                } else { // 邀请的信息已处理或超时后的被删掉 会议属性
                    console.log('[Call Component]  invitee_attr_timer', _this.$data[`invitee_attr_timer_${uid}`]);

                    clearTimeout(_this.$data[`invitee_attr_timer_${uid}`]); // 清除定时器
                    // _this.$delete(_this.$data.invitee_attr_timers, uid);

                    let member = _this.$data.members[uid];
                    console.log('[Call Component]  del_invitee_attrs map member='+uid, JSON.stringify(member));

                    if(member) { // 没有发流或者没被订阅 -- 删除占位符
                        if(
                            member.status == 'waiting' 
                            || member.status == 'timeout'
                            || member.status == 'busy'
                        ) {
                            console.log('[Call Component]  delete member because member refuse or timeout');

                            if(_this.$data.callType != 2) {
                                let err = {
                                    'busy': '对方忙线中',
                                    'waiting': '对方已拒绝'
                                }

                                _this.$message.error(err[member.status] ? err[member.status] : '对方忙')
                            }
                            _this.del_member(uid)
                            _this.check_mems()
                        }
                    }


                }
            })

        },

        // 检测会议中的人数
        check_mems() {
            let { members } = this.$data;

            console.log('[Call Component]  members', members);

            if( Object.keys(members).length > 0 ) return;

            console.log('[Call Component]  hangup only myself in meeting');
            this.hangup()
        },

        // 更新 members, 较为核心的方法

        // add_member(key) { // 给 members 添加属性(qx.su), 并设置 status: waiting
        //     this.$set(this.$data.members, key, { status: 'waiting'})
        // },
        update_members(key, status, val) {
            
            console.log(`[Call Component]  update_members key=${key}, status=${status}, val=${val}`);
            /*
            * key: 与会成员
            * status: 变为了哪种状态， pubed | subed
            *   pubed: 已经发流，还未订阅，应该有 stream
            *   subed: 已经订阅 应该有 el(订阅流后的 video)
            *  val: 有可能是{stream, member} | 订阅steam后的 video 标签
            */ 
           let member = this.$data.members[key];

        //    if(!member) return;
           if(!member) member = { status: 'waiting' };// 可能 是振铃状态

            // if(status == 'waiting') member = 
           if(status == 'pubed') {
               member = {
                   status: 'pubed',
                    ...val
               }
           }
           if(status == 'subed') {
               member = {
                   status: 'subed',
                    el: val
               }
           }
           if(status == 'timeout') {
               member = {
                   status: 'timeout'
               }
           }
           if(status == 'busy') {
               member = {
                   status: 'busy'
               }
           }

        //    this.$data.members[key] = member;
            this.$set(this.$data.members, key, member)
        },
        del_member(key) { // 删除 members 属性[key]
            this.$delete(this.$data.members, key);

            this.$nextTick(() => {
                this.clear_v_el();
                this.add_v_el()
                
            })
            
        },
        // 清空 video
        clear_v_el() {
            let v_els = document.querySelectorAll('.videos-wrapper .local video');
            console.log('[Call Component]  clear_v_el', v_els);

            for(var i = v_els.length - 1; i >= 0; i--) { 
                let v_el = v_els[i];
                v_el.parentNode.removeChild(v_el);
            }
        },
        // 重新注入 video
        add_v_el() {
            let { members } = this.$data;

            console.log('[Call Component]  add_v_el members', JSON.stringify(members));
            for (const key in members) {
                let item = members[key];
                console.log('[Call Component]  add_v_el members key', key);
                let v_wrapper = document.querySelector(`.videos-wrapper .local[id="${key}"]`);
                console.log(`[Call Component]  add_v_el v_wrapper = ${v_wrapper}, item.el = ${item.el}, key=${key}`);
                if(v_wrapper && item.el) v_wrapper.appendChild(item.el) 
            }
        },
          
        // 邀请他人 暴露在外面
        invite(tos, callType) {
            if(this.$data.visible) {
                if(this.$data.callType != 2) { // 1v1 通话直接返回
                    this.$message.warning('您正在通话中，请结束通话，再发起新的通话')
                    return
                }
                if(callType != 2) {  // 多人通话时，发起的不是多人通话 直接返回
                    this.$message.warning('您正在通话中，请结束通话，再发起新的通话')
                    return
                }
            }
            
            this.$data.callType = callType;
            this.$data.visible = true;
            if(this.$data.callType != 1) this.$data.camera_close = true;

            if(callType != 2) this.$data.call_role = 'caller'; //1v1 加主叫角色

            let _this = this;
            (async ()=> {
                try {
                    if(_this.$data.callType != 2){
                        _this.$data.title = '正在等待对方接收邀请...';
                    }

                    if(!_this.$data.pushedStream) await _this.ready_call(); // 再邀请时，不再重新推流
                    
                    this.send_invite_msg(tos);
                    
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

            await this.publish()
            
            let { confrId } = this.$data.confr_info; // 设置一条占位会议属性
            this.emedia.setConferenceAttrs({ key: 'confrId', val: confrId });

        },
        // 发送邀请消息 
        send_invite_msg(tos) {

            let { confr_info, callType } = this.$data;
            if(!confr_info) {
                console.error('not have confr_info');
                return
            }

            let { confrId, password: confrPwd } = confr_info;
            tos.map(item => {

                if(!this.$data.members[item]) { // 已经在会议中的不再邀请

                    this.emedia.setConferenceAttrs({ key: 'invitee_' + item, val: JSON.stringify({ status:'calling' }) })

                    let id = WebIM.conn.getUniqueId();    
                    let msg = new WebIM.message('txt', id);
                    
                    let set_options = {
                            msg: '邀请您进行通话',
                            to: item,                          
                            chatType: 'singleChat',
                            ext: { confrId, confrPwd, callType },
                            success: function (id, serverMsgId) {
                                console.log('[Call Component]  send invite success',{id, serverMsgId});  
                            },                              
                            fail: function(e){
                                console.error("Send invite error");  
                            }   
                    }
                    console.log('[Call Component]  send invite set_options', JSON.stringify(set_options));
                    msg.set(set_options);
                    WebIM.conn.send(msg.body);
                }
                
            })

        },

        
        // 整个程序收到消息 判断是否请求通话
        receivedMsg(msg) {
            console.log('[Call Component]  call com onMsg', msg);
            if(msg.from == this.$data.user) return; //自己的另一端发送的


            if(!msg.ext) {
                console.log('[Call Component]  not have msg.ext');
                return
            }

            if(msg.ext.result == 'busy') { // 收到忙碌消息
            
                if(
                    this.$data.confr_info
                    && msg.ext.confrId == this.$data.confr_info.confrId
                ) {
                    this.update_members(msg.from, 'busy')
                    this.emedia.deleteConferenceAttrs({ key:'invitee_'+msg.from });
                    return
                }
            }


            // 收到 邀请通话 消息

            //  邀请消息
            let { confrId, confrPwd } = msg.ext;
            if(!confrId || !confrPwd ) {
                console.log('[Call Component]  not have ext.confrId or password');
                return
            }

            if(this.$data.join_info) { // 正在会议中
                console.warn('has jioned meeting');

                // send busy msg
                let id = WebIM.conn.getUniqueId();    
                let busy_msg = new WebIM.message('txt', id);   

                let set_options = {
                    msg: '当前正在通话中',
                    ext: { confrId, result: 'busy' },
                    to: msg.from,                          
                    chatType: 'singleChat',
                    success: function (id, serverMsgId) {
                        console.log('[Call Component]  send busy msg success'); 
                    },                              
                    fail: function(e){
                        console.error("Send busy msg error", e);  
                    }   
                }

                busy_msg.set(set_options);
                WebIM.conn.send(busy_msg.body);

                return
            }


            this.invited_join(msg)

        },

        // 收到邀请，加入会议
        async invited_join(msg) {

            this.$data.confr_info = { confrId: msg.ext.confrId, password: msg.ext.confrPwd };
            this.$data.callType = msg.ext.callType;

            try {
                this.$data.call_role = 'callee';
                this.$data.from = msg.from;

                const join_info = await this.join();
                this.$data.join_info = join_info;


                this.$data.wait_invite_cattr_timer = setTimeout(() => {
                    // 5s 后还没收到 邀请自己的会议属性 退出会议
                    if(this.$data.wait_invite_cattr_timeout) {
                        console.log('[Call Component]  hangup 5s 后还没收到 邀请自己的会议属性 退出会议');
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
            if(this.$data.callType != 1) this.$data.camera_close = true;

            this.$data.wait_invite_cattr_timeout = false; clearTimeout(this.$data.wait_invite_cattr_timer);
            this.$data.call_status = 'calling';

            if(this.$data.callType != 2) {
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
            // let constraints = {audio: true, video:true}; // 默认都是视频
            let constraints = this.$data.callType == 1 ? 
                                {audio: true, video: true} : {audio: true, video:false}


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
                        key:'invitee_'+_this.$data.user
                    });

                    _this.sub_remotes();
                    _this._start_duration();

                } catch (error) {
                    console.error('accept error', error);
                    _this.$message.error('接听失败，请重新接听');
                    _this.hangup()
                }

                if(_this.$data.callType != 2){
                    let name = Object.keys(_this.$data.members)[0];
                    _this.$data.title = '正在与'+(name || '对方')+'进行通话中'
                } else {
                    _this.$data.title = ''
                }

            })()
        }, 
        // 订阅对方流
        sub_remotes() {
            
            let { members } = this.$data;
            let _uids = Object.keys(members);

            for (let index = 0; index < _uids.length; index++) {
                let key = _uids[index],
                item = members[key];

                if( !item.stream || !item.member) continue;

                let s = item.stream, m = item.member;

                let v_wrapper = document.querySelector(`.videos-wrapper .item-wrapper[id="${m.name}"]`);
                
                console.log('[Call Component]  sub_remote v_wrapper', v_wrapper);
                if( !v_wrapper ) continue;

                // 订阅并 append
                let el = document.createElement('video');
                    el.autoplay = true, el.playsInline = true;

                this.emedia.subscribe(m, s, true, true, el)

                v_wrapper.appendChild(el);

                this.update_members(key, 'subed', el)
                
            }
            
            
        },
        // 拒绝
        refuse() {
            this.$data.is_hangup = true;
            this.emedia.deleteConferenceAttrs({ 
                key:'invitee_'+this.$data.user,
                success: this.hangup,
                error: this.hangup
            });
            console.log('[Call Component]  hangup 拒绝');
            this.$data.visible = false
        },
        // 挂断
        hangupHandler() { // 手动操作 挂断按钮
            this.$data.is_hangup = true;
            this.hangup()
        },
        hangup() { // 多种情况会触发 挂断
            if(
                this.$data.callType !=2 
                && this.$data.call_role == 'caller'
            ) {
                this.emedia.destroyConference(this.$data.confr_info.id); // 销毁会议
            } else {
                this.emedia.exitConference();
            }
            this.reset();
        },

        _destroy() {
            let confr_info = this.$data.confr_info;

            if(confr_info && confr_info.id) {
                this.emedia.destroyConference(confr_info.id)
            }
        }, 


        // 重置
        reset() {

            // 清除定时器
            this._stop_duration()
            for (const key in this.$data) {
                if(key.indexOf('invitee_attr_timer') > -1) clearTimeout(this.$data[key])
                
            }

            clearTimeout(this.$data.wait_invite_cattr_timer);

            Object.assign(this.$data, 
                            this.$options.data(), 
                            { os:this.$data.os }
                        ) // os 不重置

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


        // 开始会议时长计时
        _start_duration() {
            this.$data.duration_timer = setInterval(this._update_duration, 1000)
        },
        _update_duration() {
            let { duration_num } = this.$data;

            function get_second(second){
                return second<10 ? ('0'+second) : second
            }
            function get_minute(minute){
                return minute<10 ? ('0'+minute) : minute
            }

            let time_str = ''
            if(duration_num < 60){
                time_str = '00:' + get_second(duration_num)
            }else if(duration_num >= 60){
                let minute = get_minute(parseInt(duration_num/60));
                let surplus_second = get_second(duration_num%60)
                time_str = minute +':'+ surplus_second
            }
            this.$data.duration = time_str;
            this.$data.duration_num = duration_num+1;

        },
        // 停止计时
        _stop_duration() {
            clearInterval(this.duration_timer)
        },
        // 随机生成密码
        get_uuid_psw (){ 
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 6 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(6);
            })
        },

        // 计算布局
        computed_layout() {
            let mems = this.$data.members;
            let mems_len = Object.keys(mems).length;
            if(mems_len > 3){
                return "layout-3"
            } else if(mems_len > 0) {
                return "layout-2"
            } else {
                return "layout-1"
            }
        },

    },
    
	components: {
		Draggable
    },
    
	mounted(){
        console.log('[Call Component]  WebIm', WebIM);

        this.emedia = WebIM.WebRTC.emedia.mgr; // 多人会议 SDK --- 不包含 1v1
        

        // 初始化会议监听
        this.emedia.onMemberJoined = this.onMemberJoined; // 有人加入
        this.emedia.onMemberExited = this.onMemberExited; // 有人退出
        this.emedia.onStreamAdded = this.onStreamAdded; // 有流加入
        this.emedia.onStreamRemoved = this.onStreamRemoved; // 有流退出
        this.emedia.onConferenceExit = this.onConferenceExit; // 退出会议
        this.emedia.onConfrAttrsUpdated = this.onConfrAttrsUpdated; // 会议属性变更

        
        // 页面刷新 退出会议
        let _this = this;
        window.onbeforeunload = () => {
            console.log('[Call Component]  onbeforeunload');
            _this.hangup()
        }


    },
    
    
};
</script>

