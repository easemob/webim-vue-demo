<template>
  <div class="messagebox" v-show="toggleWindows">
    <div class="messagebox-header">
      <!-- <div>{{type}}</div> -->
      <div>
        <a-icon
          type="left"
          class="user-goback"
          v-show="broken"
          @click="showUserList"
        />
        <!-- {{activedKey[type].name}} -->

        <span class="chat_name" v-if="activedKey[type].friendDetail">{{
          activedKey[type].friendDetail.nickname
            ? activedKey[type].friendDetail.nickname
            : activedKey[type].name
        }}</span>
        <span v-else>
					<span class="chat_name">{{activedKey[type].name}}</span>
					<span class="groupid">{{activedKey[type].groupid}}</span>
				</span>
        <a-icon
          v-if="type == 'group'"
          type="ellipsis"
          class="user-ellipsis"
          @click="changeMenus"
        />
        <a-dropdown v-else-if="type == 'contact'">
          <a
            class="ant-dropdown-link user-ellipsis"
            href="#"
            @click="changeMenus"
          >
            <a-icon type="ellipsis" />
          </a>
          <a-menu slot="overlay">
            <a-menu-item @click="menuClick('1')">
              <a href="javascript:;">加入黑名单</a>
            </a-menu-item>
            <a-menu-item @click="menuClick('2')">
              <a href="javascript:;">删除好友</a>
            </a-menu-item>
			 <a-menu-item @click="menuClick('3')">
              <a href="javascript:;">免打扰配置</a>
            </a-menu-item>
          </a-menu>
        </a-dropdown>
      </div>
    </div>

    <div class="messagebox-content" ref="msgContent">
      <div class="moreMsgs" @click="loadMoreMsgs">{{ loadText }}</div>
      <div class="tips">本应用仅用于环信产品功能开发测试，请勿用于非法用途。任何涉及转账、汇款、裸聊、网恋、网购退款、投资理财等统统都是诈骗，请勿相信！</div>
      <div
        v-for="(item, i) in msgObj"
        :key="i"
        class="message-group"
        :style="{ float: item.bySelf ? 'right' : 'left' }"
      >
        <h4 v-if="!item.bySelf" style="text-align: left; margin: 0">{{ item.from }}</h4>
        <!-- 撤回消息 -->
        <div v-if="item.status == 'recall'" class="recallMsg">
          {{ item.msg }}
        </div>
        <div v-if="item.status == 'recall'" class="recallMsg">
          {{ renderTime(item.time) }}
        </div>
        <!-- 撤回消息 end -->
        <a-dropdown
          v-else
          :trigger="['contextmenu']"
          :style="{ float: item.bySelf ? 'right' : 'left' }"
          :disabled="item.status == 'recall'"
        >
          <span style="user-select: none">
            <!-- 图片消息 -->
            <img
              :key="item.msg"
              :src="item.msg ? item.msg : ''"
              v-if="item.type === 'img'"
              class="img-style"
            />
            <!-- 文件card -->
            <div
              v-else-if="item.type === 'file'"
              class="file-style"
              :style="{ float: item.bySelf ? 'right' : 'left' }"
            >
              <a-card :body-style="{ padding: '0px' }">
                <div style="padding: 14px">
                  <h2>文件</h2>
                  <span>
                    <h3>{{ item.filename }}</h3>
                  </span>
                  <div class="bottom clearfix">
                    <span>{{ readablizeBytes(item.file_length) }}</span>
                    <a :href="item.msg" :download="item.filename">点击下载</a>
                  </div>
                </div>
              </a-card>
            </div>
            <!-- 音频消息 -->
            <div
              v-else-if="item.type === 'audio'"
              :style="{ float: item.bySelf ? 'right' : 'left' }"
            >
              <audio :src="item.msg" controls></audio>
            </div>
            <!-- 视频消息 -->
            <div v-else-if="item.type === 'video'">
              <video :src="item.msg" width="100%" controls></video>
            </div>
            <!-- 聊天消息 -->
            <p
              style="user-select: text"
              v-else
              v-html="renderTxt(item.msg)"
              :class="{ byself: item.bySelf }"
            />
            <!-- <div v-if="item.bySelf?true:false" class="status">{{status[item.status]}}</div> -->
          </span>
          <a-menu slot="overlay">
            <a-menu-item v-if="item.bySelf" key="1" @click="handleCommand(item)">撤回</a-menu-item>
            <a-menu-item v-else key="2" @click="()=>{setReportMsgId(item.mid)}">举报</a-menu-item>
          </a-menu>
        </a-dropdown>

        <!-- 聊天时间 -->
        <div
          v-if="item.status !== 'recall'"
          class="time-style"
          :style="{ 'text-align': item.bySelf ? 'right' : 'left' }"
        >
          {{ renderTime(item.time) }}
          {{ item.bySelf ? status[item.status] : "" }}
        </div>
      </div>
    </div>
    <div class="messagebox-footer">
      <div class="footer-icon">
        <!-- 表情组件 -->
        <ChatEmoji v-on:selectEmoji="selectEmoji" :inpMessage="message" />
        <!-- 上传图片组件 -->
        <UpLoadImage :type="this.type" :chatId="activedKey[type]" />
        <!-- 上传文件组件 -->
        <UpLoadFile :type="this.type" :chatId="activedKey[type]" />
				<!-- 历史记录 -->
				<SearchModal v-if="this.type !== 'chatroom'" :type="this.type" :chatId="activedKey[type]"/>
        <!-- 发送语音 -->
        <RecordAudio v-show="isHttps" />
        <!-- 发视频通话 -->
        <a-icon
          type="video-camera"
          class="icon"
          @click="callVideo"
          v-show="isHttps && type != 'chatroom'"
          :style="nowIsVideo ? 'pointer-events: none' : 'cursor: pointer'"
        />
        <!-- 发语音通话 -->
        <a-icon
          v-if="type === 'contact'"
          class="icon"
          type="audio"
          :style="nowIsVideo ? 'pointer-events: none' : 'cursor: pointer'"
          v-show="isHttps && type != 'chatroom'"
          @click="callVoice" />
      </div>
      <!-- 文字输入框 -->
      <div class="fotter-send">
        <a-input
          v-model="message"
          equired
          placeholder="消息"
          class="sengTxt"
          @pressEnter="onSendTextMsg"
          style="resize: none"
          ref="txtDom"
        />
        <template />
      </div>
    </div>
    <GetGroupInfo ref="groupInfoModel" @closeGroupMessage="closeGroupMessage" />
	<DisturbConfig ref="disturbConfigModel" :userId="this.userId"/>

    <!-- fix 移动到全局 -->
    <!-- <AddAVMemberModal ref="addAvMembertModal" :to="activedKey[type]" @start="start_multi"/> -->
    <!-- <EmediaModal ref="emediaModal" @changeIsVideoState="changeIsVideoState" /> -->
    <!-- <MultiAVModal :to="activedKey[type]" /> -->
  </div>
</template>

<script>
import ChatEmoji from '../chatEmoji/index.vue';
import emoji from '../../config/emoji';
import UpLoadImage from '../upLoadImage/index.vue';
import UpLoadFile from '../upLoadFile/index.vue';
import RecordAudio from '../recorder/index.vue';
import './index.less';
import { mapActions, mapGetters, mapState } from 'vuex';

import moment from 'moment';
import _ from 'lodash';
// import MultiAVModal from "../emediaModal/multiAVModal";
// import EmediaModal from "../emediaModal/index";
import GetGroupInfo from '../group/groupInfo.vue';
import DisturbConfig from '../pushConfig/index.vue'
import SearchModal from '../search/index.vue'
import { readablizeBytes, renderTime } from '../../utils/index'
export default{
	data(){
		return {
			activedKey: {
				contact: '',
				group: '',
				chatroom: '',
			},
			message: '',
			isHttps: window.location.protocol === 'https:',
			loadText: '加载更多',
			status: {
				sending: '发送中',
				sent: '已发送',
				read: '已读',
			},
			nowIsVideo: false,
			titleObj: {
				titleMode: 'time',
				timeStamp: 10
			},
			msgObj: {}, // 聊天窗口渲染数据的变量
			copyMsgObj: { // 保存上一次聊天记录的变量
				// contact: null,
				// group: null,
				// chatroom: null
			},
			routeNewOldObj: null, // 保存路由信息的变量
			msgNewOldObj: null, // 保存聊天信息的变量
			flagObj: { // 触发聊天信息更新的变量
				msgFlag: false,
				routeFlag: false
			},
			typeId: {
				group: '',
				contact: '',
				chatroom: ''
			},
			globalHistoryMsg: {},
			conversationId: '',
			userId: '',
			readablizeBytes,
			renderTime
		};
	},
	beforeMount(){
		// if(this.type === 'contact'){
		// 	this.onGetContactUserList();
		// }
		// else if(this.type === 'group'){
		// 	this.onGetGroupUserList();
		// }
		// else if(this.type === 'chatroom'){
		// 	this.onGetChatroomUserList();
		// }
		this.userId = JSON.parse(localStorage.getItem('userInfo')).userId
	},
	updated(){
		// console.log("数据", this.$store);
		this.scollBottom();
	},
	watch: {
		curMsgList: {
			handler(msgNewVal, msgOldVal){
				const { params: { id } } = this.$route
				if(!msgOldVal){
					if(msgNewVal && Object.keys(msgNewVal).length){
						// eslint-disable-next-line guard-for-in
						for(let item in msgNewVal){
							if(msgNewVal[item].chatId === id){
								if(Object.keys(this.msgObj).length){
									if(Object.values(this.msgObj).findIndex(val => Number(val.time) === Number(msgNewVal[item].time)) === -1){
										this.globalHistoryMsg[this.conversationId].push(msgNewVal[item])
									}
								}
								else{
									this.globalHistoryMsg[this.conversationId].push(msgNewVal[item])
								}
							}
						}
					}
				}
				else if(!msgNewVal){
					if(this.conversationId){
						if(msgOldVal && Object.keys(msgOldVal).length){
							// eslint-disable-next-line guard-for-in
							for(let item in msgOldVal){
								if(msgOldVal[item].chatId === id){
									if(Object.keys(this.msgObj).length){
										if(Object.values(this.msgObj).findIndex(val => Number(val.time) === Number(msgOldVal[item].time)) === -1){
											this.globalHistoryMsg[this.conversationId].push(msgOldVal[item])
										}
									}
									else{
										this.globalHistoryMsg[this.conversationId].push(msgOldVal[item])
									}
								}
							}
						}
					}
				}
				else if(msgNewVal && msgOldVal){
					if(Object.keys(msgNewVal).length > Object.keys(msgOldVal).length){
						if(new Date().getTime() - msgNewVal[Object.keys(msgNewVal).length - 1].time > 2000){
							const tempArr = []
							// eslint-disable-next-line guard-for-in
							for(let item in msgNewVal){
								if(msgNewVal[item].chatId === id){
									if(Object.keys(this.msgObj).length){
										if(Object.values(this.msgObj).findIndex(val => Number(val.time) === Number(msgNewVal[item].time)) === -1){
											tempArr.push(msgNewVal[item])
										}
									}
									else{
										tempArr.push(msgNewVal[item])
									}
								}
							}
							this.globalHistoryMsg[this.conversationId] = [...tempArr, ...this.globalHistoryMsg[this.conversationId]]
						}
						else{
							this.globalHistoryMsg[this.conversationId] && this.globalHistoryMsg[this.conversationId].push(msgNewVal[Object.keys(msgNewVal).length - 1])
						}
					}
					else{
						// eslint-disable-next-line guard-for-in
						for(let item in msgOldVal){
							if(msgOldVal[item].chatId === id){
								if(Object.keys(this.msgObj).length){
									if(Object.values(this.msgObj).findIndex(val => Number(val.time) === Number(msgOldVal[item].time)) === -1){
										this.globalHistoryMsg[this.conversationId].push(msgOldVal[item])
									}
								}
								else{
									this.globalHistoryMsg[this.conversationId].push(msgOldVal[item])
								}
							}
						}
						// eslint-disable-next-line guard-for-in
						for(let item in msgNewVal){
							if(msgNewVal[item].chatId === id){
								if(Object.keys(this.msgObj).length){
									if(Object.values(this.msgObj).findIndex(val => Number(val.time) === Number(msgNewVal[item].time)) === -1){
										this.globalHistoryMsg[this.conversationId].push(msgNewVal[item])
									}
								}
								else{
									this.globalHistoryMsg[this.conversationId].push(msgNewVal[item])
								}
							}
						}
					}
				}
				if(this.conversationId && this.globalHistoryMsg[this.conversationId].length){
					const tempObj = {}
					let num = 0
					this.globalHistoryMsg[this.conversationId].sort((a, b) => {
						return a.time - b.time
					})
					this.globalHistoryMsg[this.conversationId].forEach((item, index) => {
						if(item.from && item.from === this.userId){
							item.bySelf = true
						}
						if(item.chatId === id){
							if(Object.values(tempObj).length > 0 && Object.values(tempObj).findIndex(val => Number(val.time) === Number(item.time)) === -1){
								num++
								tempObj[num] = item
							}
							else if(!Object.values(tempObj).length){
								tempObj[num] = item
							}
						}
					})
					this.msgObj = tempObj
				}
				else{
					this.msgObj = {}
				}
			},
			deep: true
		},
	},
	computed: {
		...mapGetters({
			// contact: 'onGetContactUserList',
			group: 'onGetGroupUserList',
			// chatroom: 'onGetChatroomUserList',
			curMsgList: 'onGetCurrentChatObjMsg'
		}),
		// 控制聊天框
		toggleWindows(){
			let show
			switch(this.type){
			case 'contact':
				show = this.activedKey[this.type] != ''
				break
			case 'group':
				show = !!this.group.find(item=>item.groupid === this.activedKey[this.type].groupid)
				break
			default:
				show = this.activedKey[this.type] != ''
			}
			return show
		},
		// userList(){
		// 	return {
		// 		contact: this.contact,
		// 		group: this.group,
		// 		chatroom: this.chatroom,
		// 	};
		// },
		selectedKeys(){
			return [this.getKey(this.activedKey[this.type]) || ''];
		},
	},
	props: [
		'type', // 聊天类型 contact, group, chatroom
		'username', // 选中的聊天对象
		'broken', // 是否适应移动端
		'showUserList',
		'hideUserList',
	],
	methods: {
		...mapActions([
			'onGetContactUserList',
			'onGetGroupUserList',
			'onGetChatroomUserList',
			'onGetCurrentChatObjMsg',
			'onSendText',
			'onCallVideo',
			'onCallVoice',
			'getGroupMembers',
			'getHistoryMessage',
			'onAddBlack',
			'onDelteFirend',
			'onGetGroupinfo',
			'recallMessage',
			'onGetGroupBlack',
			'onGetSilentConfig',

		]),
		setReportMsgId(id){
			this.$store.commit('setReportMsgId', { messageId: id });
		},
		getKey(item, type){
			let key = '';
			switch(type){
			case 'contact':
				key = item.name;
				break;
			case 'group':
				key = item.groupid;
				break;
			case 'chatroom':
				key = item.id;
				break;
			default:
				break;
			}
			return key;
		},
		getCurrentMsg(props){
			this.onGetCurrentChatObjMsg({
				type: props,
				id: this.getKey(this.activedKey[props], props),
			});
		},
		select(key){
			switch(this.type){
			case 'contact':
				this.conversationId = key.name
				break;
			case 'group':
				this.conversationId = key.groupid
				break;
			case 'chatroom':
				this.conversationId = key.id
				break;
			default:
				break;
			}
			if(!this.globalHistoryMsg[this.conversationId]){
				this.globalHistoryMsg[this.conversationId] = []
			}
			else{
				const tempObj = {}
				this.globalHistoryMsg[this.conversationId].forEach((item, index) => {
					if(item.chatId === this.conversationId){
						tempObj[index] = item
					}
				})
				this.msgObj = tempObj
			}
			this.$data.activedKey[this.type] = key;
			const me = this;
			me.$data.loadText = '加载更多';
			// if( me.roomId){
			//     WebIM.conn.leaveChatRoom({
			//         roomId: me.roomId // 聊天室id
			//     });
			//     me.roomId = ''
			//   }

			if(this.type === 'group'){
				this.typeId.group = key.groupid
				this.$router.push({ name: this.type, params: { id: key.groupid } });
				this.onGetCurrentChatObjMsg({ type: this.type, id: key.groupid });

				setTimeout(() => {
					Vue.$store.commit('updateMessageStatus', {
						action: 'oneUserReadMsgs',
						readUser: key.groupid,
					});
					this.$forceUpdate();
				}, 100);

				if(!this.curMsgList){
					this.getHistoryMessage({ name: key.groupid, isGroup: true });
				}
			}
			else if(this.type === 'contact'){
				this.typeId.contact = key.name
				this.$router.push({ name: this.type, params: { id: key.name } });
				this.onGetCurrentChatObjMsg({ type: this.type, id: key.name });
				setTimeout(() => {
					Vue.$store.commit('updateMessageStatus', {
						action: 'oneUserReadMsgs',
						readUser: key.name,
					});
					this.$forceUpdate();
				}, 100);
				if(!this.curMsgList){
					this.getHistoryMessage({ name: key.name, isGroup: false });
				}
			}
			else if(this.type === 'chatroom'){
				this.typeId.chatroom = key.id
				const me = this;
				if(!this.copyMsgObj[key.id]){
					this.copyMsgObj[key.id] = {
						flag: true
					}
				}

				this.$router.push({ name: this.type, params: { id: key.id } });
				this.onGetCurrentChatObjMsg({ type: this.type, id: key.id });

				WebIM.conn.joinChatRoom({
					roomId: key.id, // 聊天室id
					success: () => {
						console.log('成功加入聊天室')
						if(this.copyMsgObj[key.id].flag){
							this.copyMsgObj[key.id] = {
								flag: false
							}
							me.getHistoryMessage({ name: key.id, isGroup: true, success: () => {this.onGetCurrentChatObjMsg({ type: this.type, id: key.id });} });
						}
					},
				});
			}
			this.$emit('changeActiveFlag', this.typeId)
		},

		loadMoreMsgs(){
			const me = this;
			const success = function(msgs){
				if(msgs.length === 0){
					me.$data.loadText = '已无更多数据';
				}
			};
			let name = '';
			let isGroup = false;
			if(this.type === 'contact'){
				name = this.$data.activedKey[this.type].name;
			}
			else if(this.type === 'group'){
				name = this.$data.activedKey[this.type].groupid;
				isGroup = true;
			}
			else if(this.type === 'chatroom'){
				name = this.$data.activedKey[this.type].id;
				isGroup = true;
			}
			this.getHistoryMessage({
				name,
				isGroup,
				success,
			});
		},

		changeMenus(){
			if(this.type === 'contact'){
			}
			else if(this.type === 'group'){
				this.$refs.groupInfoModel.chengeInfoModel();
				this.getGroupInfo();
			}
		},
		menuClick(i){
			this.changeMenus();
			switch(i){
			case '1':
				// console.log("加入黑名单");
				this.onAddBlack({
					userId: this.$data.activedKey[this.type],
				});
				this.$data.activedKey.contact = '';
				this.$router.push({
					// 核心语句
					path: '/contact', // 跳转的路径
				});
				break;
			case '2':
				this.onDelteFirend({
					userId: this.$data.activedKey[this.type],
					callback: () => {
						this.closeContactMessage();
					},
				});
				break;
			case '3':
				this.$refs.disturbConfigModel.changeModal();
				this.onGetSilentConfig();
				break;
			default:
				break;
			}
		},
		getGroupInfo(){
			this.onGetGroupinfo({
				select_id: this.$data.activedKey[this.type].groupid,
			});
		},
		onSendTextMsg(){
			if(this.$data.message == '' || this.$data.message == '\n'){
				this.$data.message = '';
				return;
			}
			this.onSendText({
				chatType: this.type,
				chatId: this.$data.activedKey[this.type],
				message: this.$data.message,
			});
			this.$data.message = '';
		},

		selectEmoji(v){
			this.$data.message = v;
			this.$refs.txtDom.focus();
		},

		customEmoji(value){
			return `<img src="../../../static/faces/${value}" style="width:20px"/>`;
		},

		renderTxt(txt = ''){
			let rnTxt = [];
			let match = null;
			const regex = /(\[.*?\])/g;
			let start = 0;
			let index = 0;
			while((match = regex.exec(txt))){
				index = match.index;
				if(index > start){
					rnTxt.push(txt.substring(start, index));
				}
				if(match[1] in emoji.obj){
					const v = emoji.obj[match[1]];
					rnTxt.push(this.customEmoji(v));
				}
				else{
					rnTxt.push(match[1]);
				}
				start = index + match[1].length;
			}
			rnTxt.push(txt.substring(start, txt.length));
			return rnTxt.toString().replace(/,/g, '');
		},

		callVideo(){
			if(this.type == 'contact'){
				const val = this.$data.activedKey[this.type].name;
				this.$emit('EmediaModalFun', [val], 1);
			}
			else if(this.type == 'group'){
				this.getGroupMembers(this.$data.activedKey[this.type].groupid);
				let _this = this;
				this.$emit('show_add_member_modal', this.type);
			}
		},
		callVoice(){
			const val = this.$data.activedKey[this.type].name;
			this.$emit('EmediaModalFun', [val], 0);
		},

		getLastMsg(item){
			const { name, params } = this.$route;
			const chatList = this.$store.state.chat.msgList[name];
			let userId = '';
			if(name == 'contact'){
				userId = item.name;
			}
			else if(name == 'group'){
				userId = item.groupid;
			}
			else{
				userId = item.id;
			}
			const currentMsgs = chatList[userId] || [];
			const lastMsg = currentMsgs.length
				? currentMsgs[currentMsgs.length - 1].msg
				: '';
			const msgTime = currentMsgs.length
				? this.renderTime(currentMsgs[currentMsgs.length - 1].time)
				: '';
			return { lastMsg, msgTime };
		},
		scollBottom(){
			setTimeout(() => {
				const dom = this.$refs.msgContent;
				if(!dom) return;
				dom.scrollTop = dom.scrollHeight;
			}, 0);
		},
		handleCommand(item){
			let name = '';
			if(this.type === 'contact'){
				name = this.$data.activedKey[this.type].name;
			}
			else if(this.type === 'group'){
				name = this.$data.activedKey[this.type].groupid;
			}
			else if(this.type === 'chatroom'){
				name = this.$data.activedKey[this.type].id;
			}
			this.recallMessage({ to: name, message: item });
		},
		closeGroupMessage(){
			// 退出群组或解散群组时关闭聊天框
			this.$data.activedKey.group = '';
			this.$emit('chatTypeChange', { key: 'group' })
		},
		closeContactMessage(){
			// 删除好友时关闭当前聊天框
			this.$data.activedKey.contact = '';
			this.$emit('chatTypeChange', { key: 'contact' })
		},
		// changeIsVideoState(v) {
		//   v ? (this.$data.nowIsVideo = true) : (this.$data.nowIsVideo = false);
		// }
	},
	components: {
		ChatEmoji,
		UpLoadImage,
		UpLoadFile,
		GetGroupInfo,
		RecordAudio,
		// AddAVMemberModal,
		// MultiAVModal,
		// EmediaModal,
		DisturbConfig,
		SearchModal
	}
};
</script>

<style scoped lang="less">
.byself {
  float: right;
}
.recallMsg {
  font-size: 12px;
  color: #aaa;
  width: 100%;
  text-align: center;
}
.custom-title {
  font-weight: 500;
}
.moreMsgs {
  background: #ccc !important;
  border-radius: 8px;
  cursor: pointer;
}
.status {
  display: inline;
  position: relative;
  top: 20px;
  font-size: 12px;
  left: -6px;
  color: #736c6c;
  float: left;
}
.unreadNum {
  float: left;
  width: 100%;
}
.icon-style {
  display: inline-block;
  background-color: #f04134;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: white;
  line-height: 1.5;
  text-align: center;
}
.emoji-style {
  width: 22px;
  float: left;
}
.img-style {
  max-width: 350px;
}
.time-style {
  clear: both;
  margin-left: 2px;
  margin-top: 3px;
  font-size: 12px;
  color: #888c98;
}
.file-style {
  width: 240px;
  margin: 2px 2px 2px 0;
  font-size: 13px;
  h2 {
    border-bottom: 1px solid #e0e0e0;
    font-weight: 300;
    text-align: left;
  }
  h3 {
    max-width: 100%;
    font-size: 15px;
    height: 20px;
    line-height: 20px;
    font-weight: 600;
    -o-text-overflow: ellipsis;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    text-align: left;
    margin-bottom: 20px;
  }
  .bottom {
    span {
      color: #999999;
      text-align: left;
    }
  }
  a {
    color: #999999;
    float: right;
    text-decoration: none;
  }
}
</style>
