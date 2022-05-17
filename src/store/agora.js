import { Message } from 'ant-design-vue';
import axios from 'axios';
const rtc = WebIM.rtc;
const CALLSTATUS = {
	idle: 0,
	inviting: 1,
	alerting: 2,
	confirmRing: 3, // caller
	receivedConfirmRing: 4, // callee
	answerCall: 5,
	receivedAnswerCall: 6,
	confirmCallee: 7
};
const Agora = {
	state: {
		callStatus: CALLSTATUS.idle,
		callDuration: '00:00',
		minisize: false,
		confr: {
			channel: '',
			token: '',
			type: null,
			callId: null,
			callerDevId: null,
			calleeDevId: null,
			confrName: '',
			callerIMName: '',
			calleeIMName: ''
		},
		gid: '',
		inviteModal: false,
		joinedMembers: [],
		invitedMembers: [],
	},
	mutations: {
		updateAgoraConfr(state, msg){
			console.log('msg>>', msg);
			let confrInfo = msg.ext || {};
			let confr = {
				channel: confrInfo.channelName,
				token: confrInfo.token,
				type: confrInfo.type,
				callId: confrInfo.callId,
				callerDevId: confrInfo.callerDevId,
				calleeDevId: confrInfo.calleeDevId
			};
			if(confrInfo.type === 2){
				confr.confrName = msg.to;
			}
			else{
				confr.confrName = msg.from;
			}

			if(msg.calleeIMName){
				confr.calleeIMName = msg.calleeIMName;
			}

			if(msg.callerIMName){
				confr.callerIMName = msg.callerIMName;
			}
			state.confr = confr;
		},
		onSetCallStatus(state, status){
			console.log('更新会议状态-----', state, 'status>>', status);
			state.callStatus = status;
		},
		onHangup(state, status){
			rtc.localAudioTrack && rtc.localAudioTrack.close();
			rtc.localVideoTrack && rtc.localVideoTrack.close();
			rtc.client && rtc.client.leave();
			const resetState = {
				callStatus: CALLSTATUS.idle,
				callDuration: '00:00',
				minisize: false,
				confr: {
					channel: '',
					token: '',
					type: null,
					callId: null,
					callerDevId: null,
					calleeDevId: null,
					confrName: '',
					callerIMName: '',
					calleeIMName: ''
				},
				gid: '',
				inviteModal: false,
				joinedMembers: [],
				invitedMembers: [],
			};
			state.callStatus = resetState.callStatus;
			state.callDuration = resetState.callDuration;
			state.confr = resetState.confr;
			state.gid = resetState.gid;
			state.inviteModal = resetState.inviteModal;
			state.joinedMembers = resetState.joinedMembers;
			state.invitedMembers = resetState.invitedMembers;
		},
		onSetCallDuration(state, callDuration){
			state.callDuration = callDuration;
		},
		onSetJoinedMembers(state, members){
			let joinCurrent = state.joinedMembers.concat(members);
			let newInvitedMem = [];
			// todo
			if(state.invitedMembers.length){
				newInvitedMem = state.invitedMembers.filter((item) => {
					if(item != members.name){ return item; }
				});
			}
			state.joinedMembers = joinCurrent;
			state.invitedMembers = newInvitedMem;
		},
		onUpdateJoinedMembers(state, removed){
			let joinCurrent = state.joinedMembers.filter((item) => {
				console.log('item>>', item);
				if(item.name != removed.name){
					return item;
				}
			});
			state.joinedMembers = joinCurrent;
		},
		onSetInvitedMembers(state, members){
			state.invitedMembers = members;
		}

	},
	actions: {
		updateConfr: function(context, payload){
			context.commit('updateAgoraConfr', payload);
		},
		// caller 主叫
		confirmRing: function(context, payload){
			console.log('confirmRing...context>>', context, 'payload>>', payload);
			const { msg, deviceId, callerDevId, callId } = payload;
			const { from } = msg;
			let confr = context.state.confr;
			console.log('confr>>>', confr);
			let currentCallId = confr.callId;
			let status = true;
			if(callId !== currentCallId){
				console.warn('callId 不相同');
				status = false;
			}
			if(context.state.callStatus > 4 && confr.type != 2){ // 已经在通话中 是否是多人视频
				status = false;
			}
			if(callerDevId !== WebIM.conn.context.jid.clientResource){
				console.warn('callerDevId 设备不相同');
				return;
			}

			const id = WebIM.conn.getUniqueId();            // 生成本地消息id
			const msgObj = new WebIM.message('cmd', id); // 创建命令消息
			msgObj.set({
				to: from,
				action: 'rtcCall',
				ext: {
					action: 'confirmRing',
					status: status, // TRUE为有效，FALSE为无效（miss）
					callerDevId: WebIM.conn.context.jid.clientResource,
					calleeDevId: deviceId,
					callId: callId,
					ts: Date.now(),
					msgType: 'rtcCallWithAgora'
				},
				success: function(id, serverMsgId){
					if(status){
						console.log('status>>', status);
						context.commit('onSetCallStatus', CALLSTATUS.confirmRing);
					}
				},
				fail: function(e){
					console.log('Fail');
				}
			});
			console.log('msgObj.body>>', msgObj.body);
			WebIM.conn.send(msgObj.body);

		},
		// callee 被叫
		sendAlerting: function(context, payload){
			const { to, calleeDevId, callId } = payload;
			console.log('to>>', payload);
			const id = WebIM.conn.getUniqueId();            // 生成本地消息id
			const msgObj = new WebIM.message('cmd', id); // 创建命令消息
			msgObj.set({
				to: to,
				action: 'rtcCall',
				ext: {
					action: 'alert',
					calleeDevId: WebIM.conn.context.jid.clientResource,
					callerDevId: calleeDevId,
					callId: callId,
					ts: Date.now(),
					msgType: 'rtcCallWithAgora'
				},
				success: function(id, serverMsgId){
					console.log('sendAlerting>>>');
					context.commit('onSetCallStatus', CALLSTATUS.alerting);
				},
				fail: function(e){
					console.log('Fail');
				}
			});

			console.log('被叫发出的alert: ', msgObj.body);
			WebIM.conn.send(msgObj.body);
			rtc.timer = setTimeout(() => {
				console.log('定时器到期');
				context.commit('onHangup');
				context.commit('onSetCallStatus', CALLSTATUS.idle);
			}, 30000);
			console.log('设置定时器');
		},

		answerCall: function(context, payload){
			console.log('payload>>>', payload);
			let confr = context.state.confr;
			console.log('confr>>>', context);
			const { result } = payload;
			const id = WebIM.conn.getUniqueId();            // 生成本地消息id
			const msgObj = new WebIM.message('cmd', id); // 创建命令消息
			let currentCallId = payload.currentCallId || confr.callId;
			let callerDevId = payload.callerDevId || confr.callerDevId;
			let to = payload.to || confr.callerIMName;
			msgObj.set({
				to: to,
				action: 'rtcCall',
				ext: {
					action: 'answerCall',
					result: result, // busy/accept/refuse
					callerDevId: callerDevId,
					calleeDevId: WebIM.conn.context.jid.clientResource,
					callId: currentCallId,
					ts: Date.now(),
					msgType: 'rtcCallWithAgora'
				},
				success: function(id, serverMsgId){
					console.log('成功发送answerCall');
				},
				fail: function(e){
					console.log('Fail'); // 如禁言、拉黑后发送消息会失败
				}
			});
			console.log('发送answerCall', msgObj);
			WebIM.conn.send(msgObj.body);

		},

		confirmCallee: function(context, payload){
			console.log('confirmCallee>>>>>>', payload);
			const { to, calleeDevId } = payload;
			let result = payload.result;
			const id = WebIM.conn.getUniqueId();            // 生成本地消息id
			const msgObj = new WebIM.message('cmd', id); // 创建命令消息
			let confr = context.state.confr;
			let currentCallId = confr.callId;

			console.log('confr.calleeDevId>>', confr.calleeDevId, 'confr.type>>', confr.type);
			if(!confr.calleeDevId && confr.type != 2){
				console.log('进来了updateAgoraConfr');
				const obj = {
					to: confr.confrName,
					ext: {
						channelName: confr.channel,
						token: confr.token,
						type: confr.type,
						callerDevId: confr.callerDevId,
						calleeDevId: calleeDevId,
						callId: confr.callId,
					},
					calleeIMName: confr.calleeIMName,
					callerIMName: confr.callerIMName
				};
				context.commit('updateAgoraConfr', obj);
			}
			else if(confr.calleeDevId != calleeDevId && confr.type != 2){
				result = 'refuse';
			}
			msgObj.set({
				to: to,
				action: 'rtcCall',
				ext: {
					action: 'confirmCallee',
					result: result || 'accept', // busy/accept/refuse
					callerDevId: WebIM.conn.context.jid.clientResource,
					calleeDevId: calleeDevId,
					callId: currentCallId,
					ts: Date.now(),
					msgType: 'rtcCallWithAgora'
				},
				success: function(id, serverMsgId){
					context.commit('onSetCallStatus', CALLSTATUS.confirmCallee);
				},
				fail: function(e){
					console.log('Fail');
				}
			});
			console.log('发送confirmCallee', msgObj);
			WebIM.conn.send(msgObj.body);

		},

		cancelCall: function(context, payload){
			let confr = context.state.confr;
			let id = WebIM.conn.getUniqueId();
			let msgObj = new WebIM.message('cmd', id);
			let callerDevId = confr.callerDevId;
			let user = payload && payload.to || confr.calleeIMName;
			let currentCallId = confr.callId;
			if(!user){
				console.log('-- to is undefined --');
				return;
			}
			msgObj.set({
				to: user,
				action: 'rtcCall',
				ext: {
					action: 'cancelCall',
					callerDevId: callerDevId,
					callId: currentCallId,
					ts: Date.now(),
					msgType: 'rtcCallWithAgora'
				},
				success: function(id, serverMsgId){
					context.commit('onSetCallStatus', CALLSTATUS.idle);
				},
				fail: function(e){
					console.log('Fail');
				}
			});
			console.log('发送取消消息', msgObj);
			WebIM.conn.send(msgObj.body);
		},

		// 更改会议状态
		setCallStatus: function(context, payload){
			context.commit('onSetCallStatus', payload);
		},

		hangup: function(context, payload){
			// 重置所有state
			context.commit('onHangup');
		},

		setCallDuration: function(context, payload){
			context.commit('onSetCallDuration', payload);
		},

		setJoinedMembers: function(context, payload){
			context.commit('onSetJoinedMembers', payload);
		},
		updateJoinedMembers: function(context, payload){
			context.commit('onUpdateJoinedMembers', payload);
		},

		getRtctoken: function(context, payload){
			axios.defaults.headers.common.Authorization = 'Bearer ' + WebIM.conn.context.accessToken;
			let { username, channelName, appkey } = payload;
			return axios.get(`${WebIM.conn.apiUrl}/token/rtcToken/v1?userAccount=${username}&channelName=${channelName}&appkey=${encodeURIComponent(appkey)}`)
			.then(function(response){
				return response.data;
			})
			['catch'](function(error){
				console.log(error);
			});
		},
		setInvitedMembers: function(context, payload){
			context.commit('onSetInvitedMembers', payload);
		}

	},
	getters: {
		getAgora(state){
			return state;
		},
	}
};
export default Agora;
