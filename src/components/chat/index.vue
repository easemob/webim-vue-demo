<template>
  <div class="userlist">
    <a-menu style="width: 100%; border-right: 0;" mode="vertical" :selectedKeys="selectedKeys">
      <a-menu-item
        style="height: 80px; position: relative; textAlign: left; borderBottom: 1px solid #eee; margin: 0"
        v-for="(item) in userList[type]"
        :key="getKey(item)"
        @click="select2(item, getKey(item))"
      >
        <div v-if="item.friendDetail" class="name_box">
          <img class="friend_portrait" :src="item.friendDetail.avatarurl?item.friendDetail.avatarurl:headPortraitImg" alt="" @click.stop="alertPersaonCard(item)">
          <span class="custom-title" >{{ item.friendDetail.nickname || item.name}}</span>
          <!-- <img class="status_img" v-if="dataFlag" :src="getUserOnlineStatus(item.presence)" alt=""> -->
        </div>
				<div v-else class="name_box">
					<img v-if="type === 'contact'" class="friend_portrait" :src="headPortraitImg" alt="">
          <span class="custom-title" :class="{'custom-title-width': !broken}">{{ item.name }}</span>
				</div>
        <div class="icon-style" v-if="getUnreadNum(item) != 0">
          <span class="unreadNum">{{getUnreadNum(item)}}</span>
        </div>
        <span class="time-style" style="float:right">{{getLastMsg(item).msgTime}}</span>
        <div class="last-msg">{{getLastMsg(item).lastMsg}}</div>
      </a-menu-item>
    </a-menu>
  </div>
</template>

<script>
import './index.less';
import { mapActions, mapGetters } from 'vuex';
import emoji from '../../config/emoji'
import _ from 'lodash';


export default{
	data(){
		return {
			activedKey: {
				contact: '',
				group: '',
				chatroom: ''
			},
			headPortraitImg: require('../../assets/headPortrait.jpeg'),
			showFirendMenus: false,
			firendMenus: [
				{
					name: '加入黑名单',
					id: '1',
					icon: 'add-o'
				},
				{
					name: '删除好友',
					id: '2',
					icon: 'delete'
				}
			],
			message: '',
			isHttps: window.location.protocol === 'https:',
			loadText: '加载更多',
			status: {
				sending: '发送中',
				sent: '已发送',
				read: '已读'
			},
			isCollapse: true,
			unRead: '',
			dataFlag: false,
			pushConfigData: []
			// selectedKeys: [ this.getKey(this.activedKey[this.type]) ]
		};
	},

	beforeMount(){
		if(this.type === 'contact'){
			setTimeout(() => {
				this.onGetFirendBlack();
				this.onGetContactUserList();
			}, 100);
		}
		else if(this.type === 'group'){
			this.onGetGroupUserList();
		}
		else if(this.type === 'chatroom'){
			this.onGetChatroomUserList();
		}
	},
	mounted(){
		// 取到黑名单列表值将黑名单匹配用户列表进行筛选
		let blackList = this.$store.state.friendModule.blackList;
		this.$store.commit('changeUserList', blackList);
	},
	updated(){
		this.scollBottom();
	},
	watch: {
		contact: {
			handler(val){
				// this.getAllFriendsStatus()
				this.dataFlag = false
				
				const params = {
					usernames: []
				}
				val.forEach(item => {
					params.usernames.push(item.name)
				})
				// params.usernames.length && this.subFriendStatus(params).then(res => {
				// 	console.log(res, this.contact, '333333333333333333')
				// 	let tempArr = []
				// 	val.forEach((item) => {
				// 		res.result.forEach(val => {
				// 			if(item.name === val.uid){
				// 				tempArr.push(val.uid)
				// 				item.presence = val
				// 			}
				// 		})
				// 	})
				// 	console.log(tempArr, 'tempArr')
				// 	val.forEach(item => {
				// 		if (!tempArr.includes(item.name)) {
				// 			item.presence = {
				// 				uid: item.name,
				// 				ext: 'Offline',
				// 				status: [],
				// 				expiry: new Date().getTime(),
				// 				last_time: new Date().getTime()
				// 			}
				// 		}
				// 	})
					
				// 	console.log(this.userList, 'this.userList===this.userList')
				// 	setTimeout(() => {
				// 		this.dataFlag = true
				// 	}, 500)
				// })
			},
			deep: true
		},
		group: {
			handler(val){
			},
			deep: true
		},
		chatroom: {
			handler(val){
			},
			deep: true
		},
		pushConfig: {
			handler(newVal, oldVal){
            	this.pushConfigData = newVal
			},
			deep: true
		}
	},
	computed: {
		...mapGetters({
			contact: 'onGetContactUserList',
			group: 'onGetGroupUserList',
			chatroom: 'onGetChatroomUserList',
			msgList: 'onGetCurrentChatObjMsg',
			pushConfig: 'onPushConfig'
		}),
		userList(){
			return {
				contact: this.contact.filter(item => {
					if(item && !this.blackList.includes(item.name)){
						return item;
					}
				}),
				group: this.group,
				chatroom: this.chatroom
			};
		},
		blackList(){
			return Object.keys(this.$store.state.friendModule.blackList);
		},
		chatList(){
			return this.$store.state.chat.msgList;
		},
		selectedKeys(){
			return [this.getKey(this.activedKey[this.type]) || ''];
		}
	},
	props: [
		'type', // 聊天类型 contact, group, chatroom
		'username', // 选中的聊天对象
		'select',
		'card',
		'broken'
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
			'onGetFirendBlack',
			'onGetAllFriendsInfo',
			'getAllFriendsStatus',
			'getSubPresence',
			'subFriendStatus'
		]),
		handleOpen(key, keyPath){
			// console.log(key, keyPath);
		},
		handleClose(key, keyPath){
			// console.log(key, keyPath);
		},
		getKey(item){
			let key = '';
			switch(this.type){
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
		alertPersaonCard(i){
			if(i.friendDetail){
				this.card.getOthersUserInfo(i)
			}
		},
		getUnreadNum(item){
			const { name, params } = this.$route;
			const chatList = this.chatList[name];
			let userId = '';
			if(name == 'contact'){
				userId = item.name;
			}
			else if(name == 'group'){
				userId = item.groupid;
			}
			else{
				userId = item.id;
				return 0;
			}
			const currentMsgs = chatList[userId] || [];
			let unReadNum = 0;
			currentMsgs.forEach(msg => {
				let isRenderNum = msg.chatType === 'group' ? this.pushConfigData.includes(msg.chatId) : this.pushConfigData.includes(msg.from)
				if(msg.status !== 'read' && msg.status !== 'recall' && !msg.bySelf && !isRenderNum){
					unReadNum++;
				}
			});
			return unReadNum;
		},
		select2(key, index){
			this.$data.selectedKeys = [index];
			this.select(key);
			this.$data.activedKey[this.type] = key;
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
				success
			});
		},
		changeMenus(){
			if(this.type === 'contact'){
				this.$data.showFirendMenus = !this.$data.showFirendMenus;
			}
			else if(this.type === 'group'){
				this.$refs.groupInfoModel.chengeInfoModel();
				this.getGroupInfo();
			}
		},

		getGroupInfo(){
			this.onGetGroupinfo({
				select_id: this.$data.activedKey[this.type].groupid
			});
		},
		onSendTextMsg(){
			this.onSendText({
				chatType: this.type,
				chatId: this.$data.activedKey[this.type],
				message: this.$data.message
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
				this.$refs.emediaModal.showEmediaModal();
				this.$refs.emediaModal.showCallerWait(
					this.$data.activedKey[this.type].name
				);
				const videoSetting = JSON.parse(localStorage.getItem('videoSetting'));
				const recMerge = (videoSetting && videoSetting.recMerge) || false;
				const rec = (videoSetting && videoSetting.rec) || false;
				this.onCallVideo({
					chatType: this.type,
					to: this.$data.activedKey[this.type].name,
					rec,
					recMerge
				});
			}
			else if(this.type == 'group'){
				this.getGroupMembers(this.$data.activedKey[this.type].groupid);
				this.$refs.addAvMembertModal.show();
			}
		},
		callVoice(){
			this.$refs.emediaModal.showEmediaModal();
			this.$refs.emediaModal.showCallerWait(
				this.$data.activedKey[this.type].name
			);
			const videoSetting = JSON.parse(localStorage.getItem('videoSetting'));
			const recMerge = (videoSetting && videoSetting.recMerge) || false;
			const rec = (videoSetting && videoSetting.rec) || false;
			this.onCallVoice({
				chatType: this.type,
				to: this.$data.activedKey[this.type].name,
				rec,
				recMerge
			});
		},
		readablizeBytes(value){
			let s = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
			let e = Math.floor(Math.log(value) / Math.log(1024));
			return (value / Math.pow(1024, Math.floor(e))).toFixed(2) + ' ' + s[e];
		},

		// TODO 可以抽离到utils
		renderTime(time){
			// const nowStr = new Date();
			// const localStr = time ? new Date(time) : nowStr;
			// const localMoment = moment(localStr);
			// const localFormat = localMoment.format("MM-DD hh:mm A");
			// return localFormat;
			var t = new Date(parseInt(time));
			var Y = t.getFullYear();
			var M = t.getMonth() + 1 < 10 ? '0' + (t.getMonth() + 1) : t.getMonth() + 1;
			var D = t.getDate() < 10 ? '0' + t.getDate() : t.getDate();
			var H = t.getHours() < 10 ? '0' + t.getHours() : t.getHours();
			var F = t.getMinutes() < 10 ? '0' + t.getMinutes() : t.getMinutes();
			var S = t.getSeconds() < 10 ? '0' + t.getSeconds() : t.getSeconds();
			return `${M}-${D} ${H}:${F}`;
		},
		getLastMsg(item){
			const { name, params } = this.$route;
			const chatList = this.chatList[name];
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
			let lastMsg = '';
			let lastType =
        currentMsgs.length && currentMsgs[currentMsgs.length - 1].type;
			if(currentMsgs.length){
				if(lastType === 'img'){
					lastMsg = '[image]';
				}
				else if(lastType === 'file'){
					lastMsg = currentMsgs[currentMsgs.length - 1].filename;
				}
				else if(lastType === 'audio'){
					lastMsg = '[audio]';
				}
				else if(lastType === 'vidio'){
					lastMsg = '[vidio]';
				}
				else{
					lastMsg = currentMsgs[currentMsgs.length - 1].msg;
				}
			}
			const msgTime = currentMsgs.length
				? this.renderTime(currentMsgs[currentMsgs.length - 1].time)
				: '';
			return {
				lastMsg,
				msgTime
			};
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
			this.recallMessage({
				to: name,
				message: item
			});
		},
		getUserOnlineStatus(val){
			const { ext } = val
			console.log(ext === '', 'getUserOnlineStatus')
			switch(ext){
			case 'Offline':
				return require('../../assets/Offline.png')
			case 'Online':
				return require('../../assets/Online.png')
			case '':
				return require('../../assets/Online.png')
			case 'Busy':
				return require('../../assets/Busy.png')
			case 'Do not Disturb':
				return require('../../assets/Do_not_Disturb.png')
			case 'Leave':
				return require('../../assets/leave.png')
			default:
				return require('../../assets/custom.png')
			}
		}
	}
};
</script>

<style scoped lang='less'>
.userlist {
  height: 100%;
  overflow-y: auto;
  border-right: 1px solid #e8e8e8;
}
.byself {
  float: right;
}
.recallMsg {
  font-size: 12px;
  color: #aaa;
  width: 100%;
  text-align: center;
}
.name_box {
  position: relative;
}
.friend_portrait{
  width: 35px;
  height: 35px;
  border-radius: 50%;
}
.custom-title {
  font-weight: 500;
  width: 100%;
  // height: 50px;
}
.custom-title-width {
	width: 290px;
	overflow: hidden;
	display: inline-block;
	line-height: 30px;
}
.status_img {
  width: 18px;
  height: 18px;
  position: absolute;
  bottom: 10px;
  left: 20px;
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
}
.unreadNum {
  float: left;
  width: 100%;
}
.icon-style {
  position: absolute;
  right: 10px;
  top: 25%;
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
  // margin-top: 3px;
  font-size: 12px;
  color: #888c98;
  position: absolute;
  right: 5px;
}
.last-msg {
  width: 80%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
	line-height: 30px;
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
