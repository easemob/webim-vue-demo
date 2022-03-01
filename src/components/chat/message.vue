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

        <span v-if="activedKey[type].friendDetail">{{
          activedKey[type].friendDetail.nickname
            ? activedKey[type].friendDetail.nickname
            : activedKey[type].name
        }}</span>
        <span v-else>{{
          `${activedKey[type].name} &nbsp;&nbsp; ${
            activedKey[type].groupid || ""
          }`
        }}</span>
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
          </a-menu>
        </a-dropdown>
      </div>
    </div>

    <div class="messagebox-content" ref="msgContent">
      <div class="moreMsgs" @click="loadMoreMsgs">{{ loadText }}</div>
      <div
        v-for="(item, i) in msgObj"
        :key="i"
        class="message-group"
        :style="{ float: item.bySelf ? 'right' : 'left' }"
      >
        <h4 style="text-align: left; margin: 0">{{ item.from }}</h4>
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
          :disabled="!item.bySelf"
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
            <a-menu-item key="1" @click="handleCommand(item)">撤回</a-menu-item>
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
import { mapActions, mapGetters } from 'vuex';

import moment from 'moment';
import _ from 'lodash';
// import MultiAVModal from "../emediaModal/multiAVModal";
// import EmediaModal from "../emediaModal/index";
import GetGroupInfo from '../group/groupInfo.vue';

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
				contact: null,
				group: null,
				chatroom: null
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
			}
		};
	},
	beforeMount(){
		if(this.type === 'contact'){
			this.onGetContactUserList();
		}
		else if(this.type === 'group'){
			this.onGetGroupUserList();
		}
		else if(this.type === 'chatroom'){
			this.onGetChatroomUserList();
		}
	},
	updated(){
		// console.log("数据", this.$store);
		this.scollBottom();
	},
	watch: {
		msgList: {
			handler(msgNewVal, msgOldVal){
				console.log(msgNewVal, msgOldVal, 'msgNewVal, msgOldVal')
				this.msgNewOldObj = {
					msgNewVal,
					msgOldVal
				}
				this.flagObj.msgFlag = true
				/**
         * 处理，首次加载数据，点击列表项，第一次触发，msgOldVal有值,虽然无数据，是个空对象，但是也算有，不是undefined，msgNewVal为undefined
         * 然后，在select方法中，判断msgList为空，就请求历史数据，历史数据请求回来，有值，msgList再次被触发，这个时候msgOldVal和msgNewVal交换
         * msgOldVal = undefined
         * msgNewVal = 历史数据
         * 所以增加判断，这种情况，route不会触发，那手动改this.flagObj.routeFlag的值，以求，flagObj的触发，去更新数据
         */
				if(!msgOldVal){
					this.flagObj.routeFlag = true
				}
				this.flagObj.routeFlag = true
			},
			deep: true
		},
		$route: {
			handler(routeNewVal, routeOldVal){
				this.routeNewOldObj = {
					routeNewVal,
					routeOldVal
				}
				this.flagObj.routeFlag = true
			},
			deep: true
		},
		flagObj: {
			handler(val){
				console.log(val, 'flagObj')
				const { msgFlag, routeFlag } = val
				if(msgFlag && routeFlag){
					this.handlerMsgData(this.routeNewOldObj, this.msgNewOldObj)
					this.changeFlagObj()
				}
			},
			deep: true
		}
	},
	computed: {
		...mapGetters({
			contact: 'onGetContactUserList',
			group: 'onGetGroupUserList',
			chatroom: 'onGetChatroomUserList',
			msgList: 'onGetCurrentChatObjMsg'
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
		userList(){
			return {
				contact: this.contact,
				group: this.group,
				chatroom: this.chatroom,
			};
		},
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
		]),
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
			this.$data.activedKey[this.type] = key;
			const me = this;
			me.$data.loadText = '加载更多';
			// if( me.roomId){
			//     WebIM.conn.quitChatRoom({
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

				if(!this.msgList){
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
				console.log(this.msgList, 'this.msgList=select=contact')
				if(!this.msgList){
					this.getHistoryMessage({ name: key.name, isGroup: false });
				}
			}
			else if(this.type === 'chatroom'){
				this.typeId.chatroom = key.id
				const me = this;
				// me.roomId = key.id

				this.$router.push({ name: this.type, params: { id: key.id } });
				this.onGetCurrentChatObjMsg({ type: this.type, id: key.id });

				WebIM.conn.joinChatRoom({
					roomId: key.id, // 聊天室id
					success: function(){
						// console.log("加入聊天室成功");
						if(!me.msgList){
							me.getHistoryMessage({ name: key.id, isGroup: true });
							setTimeout(() => {
								me.$forceUpdate();
							}, 100);
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
				this.$emit('show_add_member_modal');
			}
		},
		callVoice(){
			const val = this.$data.activedKey[this.type].name;
			this.$emit('EmediaModalFun', [val], 0);
		},

		readablizeBytes(value){
			let s = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
			let e = Math.floor(Math.log(value) / Math.log(1024));
			return (value / Math.pow(1024, Math.floor(e))).toFixed(2) + ' ' + s[e];
		},

		// TODO 可以抽离到utils
		renderTime(time){
			var t = new Date(parseInt(time));
			var Y = t.getFullYear();
			var M =
        t.getMonth() + 1 < 10 ? '0' + (t.getMonth() + 1) : t.getMonth() + 1;
			var D = t.getDate() < 10 ? '0' + t.getDate() : t.getDate();
			var H = t.getHours() < 10 ? '0' + t.getHours() : t.getHours();
			var F = t.getMinutes() < 10 ? '0' + t.getMinutes() : t.getMinutes();
			var S = t.getSeconds() < 10 ? '0' + t.getSeconds() : t.getSeconds();
			return `${M}-${D} ${H}:${F}`;
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
		},
		closeContactMessage(){
			// 删除好友时关闭当前聊天框
			this.$data.activedKey.contact = '';
		},
		// changeIsVideoState(v) {
		//   v ? (this.$data.nowIsVideo = true) : (this.$data.nowIsVideo = false);
		// }
		handlerMsgData(routeVal, msgVal){
			console.log(routeVal, msgVal)

			const { msgNewVal, msgOldVal } = msgVal
			const { params: { id } } = this.$route
			msgOldVal && console.log(Object.keys(msgOldVal).length, 'Object.keys(msgOldVal).length')
			if(id){
				/**
         * 老数据在，新数据不在，并且用户的id和老数据中的不一样，置空聊天数据
         * 存在于，新点击的用户，没有聊天记录，
         * 也就是从，有聊天记录的切换到没聊天记录的情况
         */
				msgOldVal && console.log(Object.keys(msgOldVal).length, 'Object.keys(msgOldVal).length')
				if(msgOldVal && !msgNewVal && Object.keys(msgOldVal).length && id !== msgOldVal[0].chatId){
					this.msgObj = {}
				}
				else if(msgOldVal && Object.keys(msgOldVal).length && id === msgOldVal[0].chatId){
					/**
           * 以旧数据优先判断和渲染使用，以为初始化新数据是空，undefined的。
           * 旧数据存在，并且长度有值
           * 并且当且选中聊天对象的id和数据里一致，就是赋值，渲染
           */
					if(Object.keys(msgNewVal).length > Object.keys(msgOldVal).length){
						this.msgObj = msgNewVal
					}
					else{
						this.msgObj = msgOldVal
					}
				}
				else if(msgNewVal && Object.keys(msgNewVal).length && id === msgNewVal[0].chatId){
					/**
           * 旧数据没有，新数据有
           * 新数据长度不为0
           * 选中的聊天对象的id和数据中的id一致
           * 赋值，渲染
           */
					this.msgObj = msgNewVal
				}
				// console.log(msgNewVal, msgOldVal, '20919123')
			}
			// console.log(this.routeObj, 'msgList', this.msgObj)

			const { routeNewVal, routeOldVal } = routeVal
			const { name: newName, params: { id: newId } } = routeNewVal
			const { name: oldName, params: { id: oldId } } = routeOldVal
			// console.log(newName, oldName, 'name', 'route', this.copyMsgObj[oldName],this.copyMsgObj[newName], newId, oldId, this.msgObj)
			if(!newId){
				/**
         * newId不存在，那就是切换tab时，数据更新为上一次点击的那个用户的聊天记录
         */
				this.msgObj = this.copyMsgObj[newName]
			}
			else{
				/**
         * newId存在，newName === oldName 也就是，在当前聊天对象列表，切换了不同的用户，那就是保存一下数据，共切换tab时使用
         */
				if(newName === oldName){
					this.copyMsgObj[newName] = this.msgObj
				}
			}
		},
		changeFlagObj(){
			this.flagObj.msgFlag = false
			this.flagObj.routeFlag = false
		}
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
