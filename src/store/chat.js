import WebIM from '../utils/WebIM';
import _ from 'lodash'
// import WebIM from "../utils/WebIM";

// TODO 处理页面刷新无法获取到音频url
const res = function (response) {
	let objectUrl = WebIM.utils.parseDownloadResponse.call(WebIM.conn, response);
	return objectUrl;  //  'blob:http://localhost:8080/536070e2-b3a0-444a-b1cc-f0723cf95588'
};

function test(url, func) {
	let options = {
		url: url,
		headers: { Accept: 'audio/mp3' },
		onFileDownloadComplete: func,
		onFileDownloadError: function () {
			console.log('音频下载失败');
		}
	};
	WebIM.utils.download.call(WebIM.conn, options);
}

const Chat = {
	state: {
		userList: {
			contactUserList: [],
			groupUserList: [],
			chatroomUserList: []
		},
		msgList: {
			contact: {},
			group: {},
			chatroom: {},
		},
		currentMsgs: [],
		searchMsgList: [],
		noticeCallMsg: {},
		pushConfig: [],
	},
	mutations: {
		updateUserList(state, payload) {
			const { userList, type } = payload;
			// 如果是添加黑名单，则从当前用户列表中删掉此人
			// if(payload.black && payload.black.type === "addBlack"){
			// 	const addName = payload.black.addName;
			// 	const userList = state.userList[type];
			// 	let newUserList = _.pullAllBy(userList, [{ name: addName }], "name");
			// 	state.userList[type] = newUserList;
			// }
			// else{
			// 	state.userList[type] = userList;
			// }
			state.userList[type] = userList;
		},
		updateMsgList(state, payload) {
			const { chatType, chatId, msg, bySelf, type, id } = payload;
			// payload的消息为漫游历史消息的话，进入判断筛选出已存在msgList当中的消息，此类消息不再添加进msgList。
			if (payload.isHistory) {
				// 拿到该key已经存在的消息。
				let nowKeyMsg = state.msgList[chatType][chatId];
				// 开始筛选，如果payload.mid 不等于item.id则说明msgList中没有存储。
				let newHistoryMsg = nowKeyMsg && nowKeyMsg.filter(item => {
					return item.mid != payload.mid;
				});
				state.msgList[chatType][chatId] = newHistoryMsg;
			}
			const { params } = Vue.$route;
			let status = 'unread';
			if (payload.chatType == 'contact') {
				if (params.id == payload.from) {
					status = 'read';
				}
			}
			else if (payload.chatType == 'group') {
				if (params.id == payload.chatId) {
					status = 'read';
				}
			}

			if (!state.msgList[chatType][chatId]) {
				state.msgList[chatType][chatId] = [{
					msg,
					bySelf,
					type: type || '',
					mid: id,
					status: status,
					...payload
				}];
			}
			else {
				state.msgList[chatType][chatId].push({
					msg,
					bySelf,
					type: type || '',
					mid: id,
					status,
					...payload
				});
				state.msgList[chatType][chatId] = state.msgList[chatType][chatId].sort((a, b) => {
					return a.time - b.time;
				});
				// state.msgList[chatType][chatId] = _unique(state.msgList[chatType][chatId])
			}

			if (chatType === 'chatroom' && !bySelf) { // 聊天室消息去重处理
				console.log(state.msgList[chatType][chatId], 'state.msgList[chatType][chatId]')
				state.currentMsgs = state.msgList[chatType][chatId] // _.uniqBy(state.msgList[chatType][chatId], 'mid');
			}
			else {
				state.currentMsgs = Object.assign({}, state.msgList[chatType][params.id || chatId]); // 这里params.id在路由跳转的时候会undefind，取chatId兼容
			}
			state.msgList = Object.assign({}, state.msgList);
		},

		updateSearchMsgList(state, payload) {
			if (payload.isSearch) {
				state.searchMsgList = []
			} else if (state.searchMsgList.length) {
				state.searchMsgList.forEach(item => {
					if (!(item.mid === payload.mid )) {
						state.searchMsgList.push(payload)
					}
				})
			} else {
				state.searchMsgList.push(payload)
			}
			var newHistory = _.uniqBy(state.searchMsgList, 'mid') // 根据id 去重
			state.searchMsgList = newHistory;
		},
		updateCurrentMsgList(state, messages){
			console.log(messages, 'updateCurrentMsgList');
			state.currentMsgs = messages;
		},
		updateMessageMid(state, message) {
			const { id, mid } = message;
			const { name, params } = Vue.$route;
			// state.currentMsgs.forEach((item) => {
			//     if(item.mid == id){
			//         item.mid = mid
			//     }
			// })
			Object.keys(state.msgList[name]).forEach((user) => {
				if (state.msgList[name][user].length) {
					state.msgList[name][user].forEach((msg) => {
						if (msg.mid == id) {
							msg.mid = mid;
						}
					});
				}
			});
		},
		updateMessageStatus(state, message) {
			const { id, mid, action, readUser } = message;
			const { name, params } = Vue.$route;
			Object.keys(state.msgList[name]).forEach((user) => {
				// console.log(state.msgList[name][user]);

				if (action == 'oneUserReadMsgs' || action == 'updatePushConfig') {
					if (state.msgList[name][readUser]) {
						state.msgList[name][readUser].forEach((msg) => {
							if (msg.status != 'recall') {
								msg.status = 'read';
							}
						});
					}
				}
				else if (state.msgList[name][user].length) {
					state.msgList[name][user].forEach((msg) => {
						if (action === 'readMsgs' && !msg.bySelf) {
							if (msg.status != 'recall') {
								msg.status = 'read';
							}
						}
						else if (msg.mid == id || msg.mid == mid) {
							msg.status = message.status;
							if (message.msg) {
								msg.msg = message.msg;
							}
						}
					});
				}
			});
		},
		// 黑名单筛选用户列表
		changeUserList(state, payload) {
			let ary = [];
			_.forIn(payload, function (value, key) {
				ary.push({ name: key });
			});
			state.userList.contactUserList = _.pullAllBy(state.userList.contactUserList, ary, 'name');
		},
		initChatState(state) {
			state.userList = {
				contactUserList: [],
				groupUserList: [],
				chatroomUserList: []
			};

			state.msgList = {
				contact: {},
				group: {},
				chatroom: {},
			};

			state.currentMsgs = [];
			state.pushConfig = [];
		},

		// 传递数据给 call 组件，是否收到通话邀请
		noticeCall(state, payload) {
			console.log('store noticeCall msg', payload);
			state.noticeCallMsg = payload;
		},
		// 更新推送免打扰配置
		updatePushConfig(state, payload) {
			const { user, type } = payload;
			let newData;
			if (type === 'add' && !(state.pushConfig.includes(user))) {
				newData = state.pushConfig.concat(user);
			}else if (type === 'remove') {
				newData = state.pushConfig.filter(item => item !== user)
			}else {
				newData = state.pushConfig
			}
			state.pushConfig = newData;
		}
	},
	actions: {
		onGetContactUserList: function (context, payload) {
			try {
				WebIM.conn.getContacts({
					success: function (roster) {
						const userList = roster.filter(user => ['both', 'to'].includes(user.subscription));
						const userInfoList = [];
						userList && userList.forEach(item => { return userInfoList.push(item.name); });
						userInfoList && WebIM.conn.fetchUserInfoById(userInfoList).then((res) => {
							let data = res.data;
							userList.forEach((item, idx) => { userList[idx].friendDetail = data[item.name]; });
							context.commit('updateUserList', {
								userList,
								type: 'contactUserList',
								black: payload
							});
						})['catch'](err => {
							context.commit('updateUserList', {
								userList,
								type: 'contactUserList',
								black: payload
							});
						})
					}
				});
			}
			catch (e) {
				console.log('error', e);
			}
		},
		onGetAllFriendsInfo: (context, payload) => {
			console.log(payload);
		},
		onGetGroupUserList: function (context, payload) {
			var options = {
				success: function (resp) {
					let userList = resp.data;
					userList.forEach((user, index) => {
						userList[index].name = user.groupname;
					});
					const userInfoList = [];
					userList && userList.forEach(item => { userInfoList.push(item.name); });
					context.commit('updateUserList', {
						userList,
						type: 'groupUserList'
					});
				},
				error: function (e) { },
			};
			WebIM.conn.getJoinedGroups(options);
		},
		onGetChatroomUserList: function (context, payload) {
			var option = {
				pagenum: 1,                                 // 页数
				pagesize: 20,                               // 每页个数
				success: function (list) {
					let userList = list.data;
					const userInfoList = [];
					userList && userList.forEach(item => { userInfoList.push(item.name); });
					context.commit('updateUserList', {
						userList: list.data,
						type: 'chatroomUserList'
					});
				},
				error: function () {
					console.log('List chat room error');
				}
			};
			WebIM.conn.getChatRooms(option);
		},
		// 获取当前聊天对象的记录 @payload： {key, type}
		onGetCurrentChatObjMsg: function (context, payload) {
			console.log(context, payload, 'onGetCurrentChatObjMsg');
			const { id, type } = payload;
			context.commit('updateCurrentMsgList', context.state.msgList[type][id]);
		},
		onSendText: function (context, payload) {
			const { chatType, chatId, message } = payload;
			const id = WebIM.conn.getUniqueId();
			const time = +new Date();
			const chatroom = chatType === 'chatroom';
			const type = chatType === 'contact' ? 'singleChat' : 'groupChat';
			const jid = {
				contact: 'name',
				group: 'groupid',
				chatroom: 'id'
			};
			const msgObj = new WebIM.message('txt', id);
			msgObj.set({
				msg: message,
				to: chatId[jid[chatType]],
				chatType: type,
				roomType: chatroom,
				success: function () {
					context.commit('updateMsgList', {
						chatType,
						chatId: chatId[jid[chatType]],
						msg: message,
						bySelf: true,
						time: time,
						mid: id,
						status: 'sending'
					});
				},
				fail: function (e) {
					console.log('Send private text error', e);
				}
			});
			if (chatType === 'group' || chatType === 'chatroom') {
				msgObj.setGroup('groupchat');
			}
			WebIM.conn.send(msgObj.body);
		},
		sendImgMessage: function (context, payload) {
			const { chatType, chatId, roomType, file, callback } = payload;
			const id = WebIM.conn.getUniqueId();
			const jid = {
				contact: 'name',
				group: 'groupid',
				chatroom: 'id'
			};
			const msgObj = new WebIM.message('img', id);
			msgObj.set({
				file: file,
				to: chatId[jid[chatType]],
				chatType: chatType,
				roomType: roomType,
				onFileUploadError: function (error) {
					console.log('图片上传失败', error);
					callback();
				},
				onFileUploadComplete: function (data) {
					let url = data.uri + '/' + data.entities[0].uuid;
					context.commit('updateMsgList', {
						msg: url,
						chatType,
						chatId: chatId[jid[chatType]],
						bySelf: true,
						type: 'img',
						time: data.timestamp,
						mid: id,
						status: 'sending'
					});
					callback();
				},
				success: function () {
					console.log('图片发送成功');
				}
			});
			if (chatType === 'group' || chatType === 'chatroom') {
				msgObj.setGroup('groupchat');
			}
			WebIM.conn.send(msgObj.body);
		},
		sendFileMessage: function (context, payload) {
			const { chatType, chatId, roomType, file, callback } = payload;
			const id = WebIM.conn.getUniqueId();
			const jid = {
				contact: 'name',
				group: 'groupid',
				chatroom: 'id'
			};
			const msgObj = new WebIM.message('file', id);
			msgObj.set({
				file: file,
				ext: {
					file_length: file.data.size
				},
				to: chatId[jid[chatType]],
				chatType: chatType,
				roomType: roomType,
				onFileUploadError: function (error) {
					console.log('文件上传失败', error);
					callback();
				},
				onFileUploadComplete: function (data) {
					let url = data.uri + '/' + data.entities[0].uuid;
					context.commit('updateMsgList', {
						msg: url,
						chatType,
						chatId: chatId[jid[chatType]],
						bySelf: true,
						type: 'file',
						filename: file.data.name,
						file_length: file.data.size,
						time: data.timestamp,
						mid: id,
						status: 'sending'
					});
					callback();
				},
				success: function () {
					console.log('文件发送成功');
				}
			});
			if (chatType === 'group' || chatType === 'chatroom') {
				msgObj.setGroup('groupchat');
			}
			WebIM.conn.send(msgObj.body);
		},
		sendRecorder: function (context, payload) {
			const { useId, type, file } = payload;
			const id = WebIM.conn.getUniqueId();
			const msgObj = new WebIM.message('audio', id);
			let isRoom = type == 'chatroom' || type == 'groupchat';

			const jid = {
				contact: 'name',
				group: 'groupid',
				chatroom: 'id'
			};

			// console.log('bold>>>', bold);
			// console.log('newBold>>', WebIM.utils.parseDownloadResponse.call(WebIM.conn, bold));
			// let newBold = WebIM.utils.parseDownloadResponse.call(WebIM.conn, bold)
			// var file = WebIM.utils.getFileUrl(input);
			msgObj.set({
				file: file,
				to: useId,
				type: 'audio',
				roomType: isRoom,

				onFileUploadError: function (error) {
					console.log('语音上传失败', error);
				},
				onFileUploadComplete: function (data) {
					console.log('上传成功', data);

					let url = data.uri + '/' + data.entities[0].uuid;
					context.commit('updateMsgList', {
						msg: url,
						chatType: type,
						chatId: useId,
						bySelf: true,
						type: 'audio',
						filename: file.data.name,
						file_length: file.data.size,
						time: data.timestamp,
						mid: id,
						status: 'sending'
					});
				},
				success: function (data) {
					console.log('语音发送成功', data);
				},
				flashUpload: WebIM.flashUpload
			});

			if (type === 'group' || type === 'chatroom') {
				msgObj.setGroup('groupchat');
			}
			WebIM.conn.send(msgObj.body);
		},



		onCallVideo: function (context, payload) {
			const { chatType, to } = payload;
			const type = chatType === 'contact' ? 'singleChat' : 'groupChat';
			const userInfo = JSON.parse(localStorage.getItem('userInfo'));
			if (chatType === 'contact') {
				// this.setState({
				//     showWebRTC: true
				// })
				WebIM.call.caller = userInfo.userId;
				WebIM.call.makeVideoCall(to, null, payload.rec, payload.recMerge);
			}
		},
		onCallVoice: function (context, payload) {
			const { chatType, to } = payload;
			const type = chatType === 'contact' ? 'singleChat' : 'groupChat';
			const userInfo = JSON.parse(localStorage.getItem('userInfo'));
			if (chatType === 'contact') {
				WebIM.call.caller = userInfo.userId;
				WebIM.call.makeVoiceCall(to, null, payload.rec, payload.recMerge);
			}
		},

		getHistoryMessage: function(context, payload){
			console.log(context, payload, 'getHistoryMessage');
			const { isSearch } = payload;
			isSearch && context.commit('updateSearchMsgList', {isSearch})
			const options = {
				queue: payload.name,
				isGroup: payload.isGroup,
				count: isSearch ? 200 : 10, // 每次获取消息条数
				success: function(msgs){
					try{
						console.log(msgs, 'msgs=getHistoryMessage');
						payload.success && payload.success(msgs);
						if (msgs.length) {
							const userInfo = JSON.parse(localStorage.getItem('userInfo'));
							const userId = userInfo && userInfo.userId;
							msgs.forEach((item) => {
								let time = Number(item.time);
								let msg = {};
								const bySelf = item.from == userId;
								if (!item.filename) {
									msg = {
										chatType: payload.isGroup ? 'group' : 'contact',
										chatId: bySelf ? item.to : item.from,
										msg: item.data,
										bySelf: bySelf,
										time: time,
										mid: item.id,
										status: 'read',
										type:'txt',
										from: item.from,
										to: item.to,
									};
									if (payload.isGroup) {
										msg.chatId = item.to;
									}
									else {
										msg.chatId = bySelf ? item.to : item.from;
									}
								}
								else if (!item.ext.file_length && item.filename !== 'audio' && item.filename.substring(item.filename.length - 3) !== 'mp4' && item.filename.substring(item.filename.length - 3) !== 'mp3' && item.filename.substring(item.filename.length - 3) !== 'amr') { // 为图片的情况
									msg = {
										msg: item.url,
										chatType: payload.isGroup ? 'group' : 'contact',
										chatId: bySelf ? item.to : item.from,
										bySelf: bySelf,
										type: 'img',
										time: time,
										mid: item.id,
										status: 'read',
										from: item.from,
										to: item.to,
									};
									if (payload.isGroup) {
										msg.chatId = item.to;
									}
									else {
										msg.chatId = bySelf ? item.to : item.from;
									}
								}
								else if (item.filename === 'audio' || item.filename.substring(item.filename.length - 3) === 'mp3' || item.filename.substring(item.filename.length - 3) === 'amr') {
									msg = {
										msg: item.url,
										chatType: payload.isGroup ? 'group' : 'contact',
										chatId: bySelf ? item.to : item.from,
										bySelf: bySelf,
										type: 'audio',
										time: time,
										mid: item.id,
										status: 'read',
										from: item.from,
										to: item.to,
									};
									if (payload.isGroup) {
										msg.chatId = item.to;
									}
									else {
										msg.chatId = bySelf ? item.to : item.from;
									}
								}
								else if (item.filename.substring(item.filename.length - 3) === 'mp4') {
									msg = {
										msg: item.url,
										chatType: payload.isGroup ? 'group' : 'contact',
										chatId: bySelf ? item.to : item.from,
										bySelf: bySelf,
										type: 'video',
										time: time,
										from: item.from,
										to: item.to,
									};
									if (payload.isGroup) {
										msg.chatId = item.to;
									}
									else {
										msg.chatId = bySelf ? item.to : item.from;
									}
								}
								else {
									msg = {
										msg: item.url,
										chatType: payload.isGroup ? 'group' : 'contact',
										chatId: bySelf ? item.to : item.from,
										bySelf: bySelf,
										type: 'file',
										filename: item.filename,
										file_length: item.file_length,
										time: time,
										mid: item.id,
										status: 'read',
										from: item.from,
										to: item.to,
									};
									if (payload.isGroup) {
										msg.chatId = item.to;
									}
									else {
										msg.chatId = bySelf ? item.to : item.from;
									}
								}
								msg.isHistory = true;
								isSearch ? context.commit('updateSearchMsgList', msg) : context.commit('updateMsgList', msg);
							});
							context.commit('updateMessageStatus', { action: 'readMsgs' });
						}
					}
					catch (e) {
						console.log('error', e);
					}
				},
				fail: function (err) {
					console.log(err, 'err')
				}
			};
			WebIM.conn.fetchHistoryMessages(options);
		},

		recallMessage: function (context, payload) {
			const { chatType, mid } = payload.message;
			const to = payload.to;
			const me = this;
			const chatTypeObj = {
				contact: 'chat',
				group: 'groupchat',
				chatroom: 'chatroom'
			};
			const option = {
				mid,
				to,
				type: chatTypeObj[chatType],
				success: function () {
					payload.message.status = 'recall';
					payload.message.msg = '消息已撤回';
					Vue.$store.commit('updateMessageStatus', payload.message);
				},
				fail: function () {
					// me.$message('消息撤回失败');
				},
			};
			WebIM.conn.recallMessage(option);
		},
		initChatState: function (context, payload) {
			context.commit('initChatState');
		},
		// 开启推送免打扰
		onSetSilent: function (context, payload) {
			const { params, name } = Vue.$route;
			const option = {
				conversationId: params.id,
				type: name === 'contact' ? 'singleChat' : 'groupChat',
				options: {
					paramType: 0,
					remindType: 'NONE'
				}
			}
			WebIM.conn.setSilentModeForConversation(option).then(res => {
				if (res.data.type === 'NONE') {
					context.commit('updatePushConfig', { user: params.id, type: 'add' })
				}
				payload && payload()
			})
		},
		// 清除推送免打扰
		onClearSilent: function (context, payload) {
			const { params, name } = Vue.$route;
			const option = {
				conversationId: params.id,
				type: name === 'contact' ? 'singleChat' : 'groupChat',
			}
			WebIM.conn.clearRemindTypeForConversation(option).then(res => {
				context.commit('updatePushConfig', {user: params.id, type: 'remove'})
				payload && payload();
			})
		},
		// 获取当前会话推送免打扰
		onGetSilentConfig: function (context, payload) {
			const { params, name } = Vue.$route;
			const option = {
				conversationId: params.id,
				type: name === 'contact' ? 'singleChat' : 'groupChat'
			}
			WebIM.conn.getSilentModeForConversation(option).then(res => {
				let dataLength = Object.keys(res.data).length
				context.commit('updatePushConfig', { user: params.id, type: dataLength ? 'add' : 'remove' })
			})
		}
	},
	getters: {
		onGetContactUserList(state) {
			return state.userList.contactUserList;
		},
		onGetGroupUserList(state) {
			return state.userList.groupUserList;
		},
		onGetChatroomUserList(state) {
			return state.userList.chatroomUserList;
		},
		onGetCurrentChatObjMsg(state) {
			console.log(state, 'state, payload====state, payload');
			return state.currentMsgs;
		},
		fetchHistoryMessages(state){
			return state.searchMsgList;
		},
		onPushConfig(state) {
			return state.pushConfig;
		}
	}

};
export default Chat;
