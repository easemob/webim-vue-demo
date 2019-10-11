<template>
  <a-layout
  	style="position: absolute;
	width: 100%;
	height: 100%;">
	<a-layout-header class="layout-header">
	 	<div class="header">
			<span class="setting">
				<a-dropdown>
					<span class="ant-dropdown-link" href="#">
						<a-icon type="setting" />
						<span class="username">{{userName}}</span>
					</span>
					<a-menu slot="overlay">
						<a-menu-item @click="recEmedia">
							<a href="javascript:;">音视频录制</a>
						</a-menu-item>
						<a-menu-item @click="GetFirendBlack">
							<a href="javascript:;">好友黑名单</a>
						</a-menu-item>
						<a-menu-item @click="toLogout">
							<a href="javascript:;">退出</a>
						</a-menu-item>
					</a-menu>
				</a-dropdown>
			</span>

			<span class="setting">
				<a-dropdown>
					<span class="ant-dropdown-link" href="#">
						<a-icon type="plus-circle" />
					</span>
					<a-menu slot="overlay">
						<a-menu-item @click="ulClick('1')">
							<a href="javascript:;">添加好友</a>
						</a-menu-item>
						<a-menu-item @click="ulClick('2')">
							<a href="javascript:;">申请入群</a>
						</a-menu-item>
						<a-menu-item @click="ulClick('3')">
							<a href="javascript:;">创建群组</a>
						</a-menu-item>
					</a-menu>
				</a-dropdown>
			</span>
		</div>

		<a-menu
			v-model="current"
			mode="horizontal"
			:defaultSelectedKeys="['contact']"
			:style="{ lineHeight: '50px', background: '#000', color: '#fff', textAlign: 'left'}"
			@click="contactTypeChange"
		>
			<a-menu-item key="contact">
			<a-icon type="user" />
			<span>好友</span>
			</a-menu-item>
			<a-menu-item key="group">
			<a-icon type="team" />
			<span>群组</span>
			</a-menu-item>
			<a-menu-item key="chatroom">
			<a-icon type="usergroup-add" />
			<span>聊天室</span>
			</a-menu-item>
		</a-menu>

	  <!-- <el-tabs type="border-card" v-model="activeKey" @click="contactTypeChange">
	  <el-tab-pane label="好友">-->
	  <!-- <MessageBox type="contact" /> -->
	  <!-- </el-tab-pane>
		<el-tab-pane label="群组"><MessageBox type="contact" /></el-tab-pane>
		<el-tab-pane label="聊天室"><MessageBox type="chatroom" /></el-tab-pane>
	  </el-tabs>-->
	</a-layout-header>

	<a-layout>

		<a-layout-sider
			style="background: #fff" :width="broken ? '100%' : 350"
			breakpoint="lg" 
			collapsedWidth="0"
			:trigger="null"
			v-model="collapsed"
			@collapse='onCollapse'
			@breakpoint="onBreakpoint"
			>

		<MessageBox 
			:type="activeKey"
			:select="select"
			ref='messageBox'/>
		<!-- <MessageBox v-if="activeKey == 'chatroom'"  type="chatroom" />
		<MessageBox v-if="activeKey == 'group'" type="group" /> -->
	  </a-layout-sider>

	  <a-layout-content>
		<Message 
			:type="activeKey"
			:broken="broken"
			:hideUserList="hideUserList"
			:showUserList="showUserList"
			ref='messageList'/>

		<AddFriend ref="addFriendMethods" />
		<GetFriendRequest />
		<FirendBlack ref="firendModel" />
		<AddGroupUser ref="addGroupModel" />
		<CreateGroup ref="createGroupModel" />
		<VidoeSetting ref="videoSetting" />
		<GroupRequest />
	  </a-layout-content>
	</a-layout>
  </a-layout>

  <!-- <div class="contact">
	<div class="header">
	  <div class="mask" v-show="showSettingOptions" @click="showSettingOptions=false"></div>
	  <span class="setting">
		<van-icon name="setting-o" size="24" color="#fff" @click="optionsVisibleChange" />
		<ul class="options" v-show="showSettingOptions">
		  <li class="option" @click="recEmedia">音视频录制</li>
		  <li class="option" @click="GetFirendBlack">好友黑名单</li>
		  <li class="option" @click="toLogout">退出</li>
		</ul>
	  </span>
	  <span class="add-style">
		<van-icon name="add-o" size="24" color="#fff" @click="addModalChange" />
		<div class="mask" v-show="showAddOptions" @click="showAddOptions =false"></div>
		<ul class="options options2" v-show="showAddOptions">
		  <li
			class="option option2"
			v-for="(item,index) in addList"
			id="item.id"
			@click="ulClick(item.id)"
			:key="index"
		  >
			<van-icon v-bind:name="item.icon" size="18" color="#6d6d6d" />
			&nbsp;{{item.name}}
		  </li>
		</ul>
	  </span>
	  <span class="username">{{userName}}</span>
	</div>
	<div class="content">
	  <van-tabs v-model="activeKey" @click="contactTypeChange">
		<van-tab title="好友" name="contact">
		  <MessageBox type="contact" />
		</van-tab>
		<van-tab title="群组" name="group">
		  <MessageBox type="group" />
		</van-tab>
		<van-tab title="聊天室" name="chatroom">
		  <MessageBox type="chatroom" />
		</van-tab>
	  </van-tabs>
	</div>
	<AddFriend ref="addFriendMethods" />
	
	<GetFriendRequest />
	<FirendBlack ref="firendModel" />
	<AddGroupUser ref="addGroupModel" />
	<CreateGroup ref="createGroupModel" />
	<VidoeSetting ref="videoSetting"/>
	<GroupRequest />
  </div>-->
</template>

<script>
import Vue from "vue";
import MessageBox from "../../components/chat/index.vue";
import Message from "../../components/chat/message.vue";
import AddFriend from "../../components/addModal/addFriend.vue";
import GetFriendRequest from "../../components/addModal/getFriendRequest.vue";
import FirendBlack from "../../components/addModal/firendBlack.vue";
import AddGroupUser from "../../components/group/addGroupUser.vue";
import CreateGroup from "../../components/group/createGroup.vue";
import VidoeSetting from "../../components/videoSetting/index";
import GroupRequest from "../../components/group/groupRequest.vue";
import "./index.less";
import { mapState, mapActions } from "vuex";
export default {
  data() {
	return {
	  showSettingOptions: false,
	  activeKey: "contact",
		selectedItem: '',
	  showAddOptions: false,
	  addList: [
		{
		  name: "添加好友",
		  id: "1",
		  icon: "chat"
		},
		{
		  name: "申请入群",
		  id: "2",
		  icon: "friends"
		},
		{
		  name: "创建群组",
		  id: "3",
		  icon: "comment"
		}
	  ],
	  userName:
		localStorage.getItem("userInfo") &&
		JSON.parse(localStorage.getItem("userInfo")).userId,
	  collapsed: false,
	  broken: false,
	  current: ["contact"]
	};
  },
  computed: {
	// username() {
	//   return this.$store.state.login.username;
	// }
  },
  methods: {
	...mapActions(["onLogout", "onGetFirendBlack"]),
	toLogout() {
	  this.onLogout();
	},
	onCollapse(collapsed, type) {
		console.log(collapsed, type);
		if(type != 'responsive'){
			this.$data.collapsed = true;
		}else{
			this.$data.collapsed = false;
		}
	},
	onBreakpoint(broken) {
	  this.$data.broken = broken
	},
	hideUserList(){
		this.$data.collapsed = true;
	},
	showUserList(){
		this.$data.collapsed = false;
	},
	select(i){
		console.log(i, '选中')
		this.$refs.messageList.select(i)
		if(this.broken){this.$data.collapsed = true;}
	},
	GetFirendBlack() {
	  this.onGetFirendBlack();
	  this.$refs.firendModel.changModel();
	},
	optionsVisibleChange() {
	  this.$data.showSettingOptions = !this.$data.showSettingOptions;
	},
	contactTypeChange(type) {
		this.$data.activeKey = type.key;
		this.$router.push(`/${type.key}`);
		if(this.broken&&this.collapsed){this.$data.collapsed = false}

		switch(type.key){
		  case 'contact':
			this.$refs.messageBox.onGetContactUserList();
			break;
		case 'group':
			this.$refs.messageBox.onGetGroupUserList();
			break;
		case 'chatroom':
			this.$refs.messageBox.onGetChatroomUserList();
			break;
		default:
			break;
		}
		this.$refs.messageList.getCurrentMsg(type.key)
	},
	addModalChange() {
	  this.$data.showAddOptions = !this.$data.showAddOptions;
	},
	ulClick(i) {
	  //this.addModalChange();
	  switch (i) {
		case "1":
		  this.$refs.addFriendMethods.changeModal();
		  break;
		case "2":
		  this.$refs.addGroupModel.changeGroupModel();
		  break;
		case "3":
		  this.$refs.createGroupModel.changeCreateModel();
		  break;
		default:
		  break;
	  }
	},
	recEmedia() {
	  this.$refs.videoSetting.show();
	}
  },
  components: {
	MessageBox,
	Message,
	AddFriend,
	GetFriendRequest,
	FirendBlack,
	AddGroupUser,
	CreateGroup,
	VidoeSetting,
	GroupRequest
  }
};
</script>
