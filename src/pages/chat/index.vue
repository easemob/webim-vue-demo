<template>
  <a-layout style="position: absolute;
	width: 100%;
	overflow: hidden;
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
        :style="{ lineHeight: '50px', background: '#434648', color: '#fff', textAlign: 'left'}"
        @click="contactTypeChange"
      >
        <a-menu-item key="contact">
          <a-icon type="user" class="navMenu-icon" />
          <span class="navMenu-text">好友</span>
          <!-- 信息提示 -->
          <div class="tip-style" v-if="getUnread('contact').contact">&nbsp;</div>
        </a-menu-item>
        <a-menu-item key="group">
          <a-icon type="team" class="navMenu-icon" />
          <span class="navMenu-text">群组</span>
          <div class="tip-style" v-if="getUnread('group').group">&nbsp;</div>
        </a-menu-item>
        <a-menu-item key="chatroom">
          <a-icon type="usergroup-add" class="navMenu-icon" />
          <span class="navMenu-text">聊天室</span>
        </a-menu-item>
      </a-menu>
    </a-layout-header>

    <a-layout>
      <a-layout-sider
        style="background: #fff"
        :width="broken ? '100%' : 350"
        breakpoint="lg"
        collapsedWidth="0"
        :trigger="null"
        v-model="collapsed"
        @collapse="onCollapse"
        @breakpoint="onBreakpoint"
      >
        <MessageBox :type="activeKey" :select="select" ref="messageBox" />
        <!-- <MessageBox v-if="activeKey == 'chatroom'"  type="chatroom" />
        <MessageBox v-if="activeKey == 'group'" type="group" />-->
      </a-layout-sider>

      <a-layout-content style="overflow: visible">
        <Message
          :type="activeKey"
          :broken="broken"
          :hideUserList="hideUserList"
          :showUserList="showUserList"
          ref="messageList"
          @EmediaModalFun="EmediaModalFun"
          @show_add_member_modal="show_add_member_modal"
        />

        <AddFriend ref="addFriendMethods" />
        <GetFriendRequest />
        <FirendBlack ref="firendModel" />
        <AddGroupUser ref="addGroupModel" />
        <CreateGroup ref="createGroupModel" />
        <VidoeSetting ref="videoSetting" />
        <GroupRequest />
        <GroupInvite />

        <EmediaModal ref="emediaModal" @changeIsVideoState="changeIsVideoState"/>
        <!-- <MultiAVModal :to="activedType[activeKey]" /> -->

        <AddAVMemberModal ref="addAvMembertModal" @EmediaModalFun="EmediaModalFun"/>

        <AlertModal v-if="showAlert"/>
        <MultiAVModal ref="multiCall" v-if="showConfr" @show_add_member_modal="show_add_member_modal"/>
        <Call ref="call" v-if="showCall"/>
      </a-layout-content>
    </a-layout>
  </a-layout>
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
import GroupInvite from "../../components/group/groupInvite.vue";

import EmediaModal from "../../components/emediaModal/index";
// import MultiAVModal from "../../components/emediaModal/multiAVModal";
// import Call from "../../components/call/index"; // 多人实现 1v1 通话
import MultiAVModal from "../../components/agoraCallModal/addAVMemberModal"
import Call from "../../components/agoraCallModal/channel";
import AlertModal from "../../components/agoraCallModal/alertModal"
import AddAVMemberModal from "../../components/emediaModal/addAVMemberModal";

import "./index.less";
import { mapState, mapActions } from "vuex";
const rtc = WebIM.rtc;
export default {
  data() {
    return {
      activedType: {
        contact: "",
        group: "",
        chatroom: ""
      },
      groupRead: false,
      contactRead: false,
      showSettingOptions: false,
      activeKey: "contact",
      selectedItem: "",
      showAddOptions: false,
      nowIsVideo:false,
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
      current: ["contact"],

      showAlert:false,
    };
  },
  computed: {
    chatList() {
      return this.$store.state.chat.msgList;
    },
    onSetCallStatus () {
        return this.$store.state.agora.callStatus
    },
     //显隐主叫弹窗
     showCall(){
       const {confr, callStatus} = this.$store.state.agora
        let bool =[1, 3, 5, 6, 7].includes(callStatus) && typeof confr.type == "number" && confr.type < 2 ? true : false;
       return bool
     },
     showConfr(){
       const {confr, callStatus} = this.$store.state.agora
        return (confr.type === 2 && [0,3,5,6,7].includes(callStatus)) ? true: false
     }
  },
  watch:{
    onSetCallStatus (msg) {
      let self = this
      console.log('触发对msg》》',this.$store.state.agora);
        const {confr, callStatus, minisize} = this.$store.state.agora
        console.log('confr>>',confr,'callStatus>>',callStatus,'minisize>>',minisize);
         const status = {
            idle: 0,
            confirmRing: 3,
            answerCall: 5,
            receivedAnswerCall: 6,
            confirmCallee: 7
        }
      
        self.$data.showAlert = callStatus == 4 ? true:false // 显隐被叫弹窗

     
        if (callStatus === 3) {
        return self.$refs.call && self.$refs.call.join() // 单人
        }
        if (callStatus===7) {
        return  self.$refs.multiCall && self.$refs.multiCall.join()
        }
    },
  },
  methods: {
    ...mapActions(["onLogout", "onGetFirendBlack", "initChatState","updateConfr","setCallStatus","hangup","cancelCall"]),
    toLogout() {
      this.onLogout();
      this.initChatState();
    },
    onCollapse(collapsed, type) {
      if (type != "responsive") {
        this.$data.collapsed = true;
      } else {
        this.$data.collapsed = false;
      }
    },
    onBreakpoint(broken) {
      this.$data.broken = broken;
    },
     changeIsVideoState(v) {
      v ? (this.$data.nowIsVideo = true) : (this.$data.nowIsVideo = false);
    },

    EmediaModalFun(tos, callType){
        // callType: 0 1v1音频, 1 1v1视频, 2 多人
        this.invite(tos, callType,this.$data.activeKey)
    },
    show_add_member_modal() {
        this.$refs.addAvMembertModal.show()
    },
    hideUserList() {
      this.$data.collapsed = true;
    },
    showUserList() {
      this.$data.collapsed = false;
    },
    select(i) {
      this.$refs.messageList.select(i);
      if (this.broken) {
        this.$data.collapsed = true;
      }
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
      if (this.broken && this.collapsed) {
        this.$data.collapsed = false;
      }

      switch (type.key) {
        case "contact":
          this.$refs.messageBox.onGetContactUserList();
          break;
        case "group":
          this.$refs.messageBox.onGetGroupUserList();
          break;
        case "chatroom":
          this.$refs.messageBox.onGetChatroomUserList();
          break;
        default:
          break;
      }
      this.$refs.messageList.getCurrentMsg(type.key);
    },
    addModalChange() {
      this.$data.showAddOptions = !this.$data.showAddOptions;
    },
    ulClick(i) {
      // this.addModalChange();
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
    },
    getUnread(type) {
      const chatList = this.chatList[type];
      let obj = {
        contact: false,
        group: false
      };
      if (JSON.stringify(chatList) != "{}") {
        for (const item in chatList) {
          chatList[item].map((v, k) => {
            if (v.status === "unread") {
              if (v.chatType === "group") {
                obj.group = true;
              }
              if (v.chatType === "contact") {
                obj.contact = true;
              }
            }
            return obj;
          });
        }
      }
      return {
        contact: obj.contact,
        group: obj.group
      };
    },



    invite(tos, callType, selectTab) {
      // // callType: 0 1v1音频, 1 1v1视频, 2 多人
      console.log("tos",tos, "callType", callType, "selectTab", selectTab);
      console.log('tasdjahskjdhwkjasd>>',this.$route.params.id);
      const callId = WebIM.conn.getUniqueId().toString();
      const channelName = Math.uuid(8);
      const { callStatus } = this.$store.state.agora
      switch (callType) {
        case 0:
          if (selectTab === "contact") {
            let id = WebIM.conn.getUniqueId();
            let msg = new WebIM.message("txt", id);
            let set_options = {
              msg: "邀请您进行语音通话",
              to: tos[0],
              chatType: "singleChat",
              ext: {
                action: "invite",
                channelName: channelName,
                type: 0, //0为1v1音频，1为1v1视频，2为多人通话
                callerDevId: WebIM.conn.context.jid.clientResource, // 主叫方设备Id
                callId: callId, // 随机uuid，每次呼叫都不同，代表一次呼叫
                ts: Date.now(),
                msgType: "rtcCallWithAgora",
                callerIMName: WebIM.conn.context.jid.name
              },
            };
            msg.set(set_options);
            WebIM.conn.send(msg.body);

            this.updateConfr({
              ext: {
                channelName: channelName,
                token: null,
                type: 0,
                callerDevId: WebIM.conn.context.jid.clientResource,
                callId: callId,
              },
              to: tos[0],
              callerIMName: WebIM.conn.context.jid.name,
              calleeIMName: tos[0],
            });
            const inviteStatus = 1;
            this.setCallStatus(inviteStatus);
          }
          break;
        case 1:
          if (callStatus > 0) {
            console.log('正在通话中')
          }
          if (selectTab === "contact") {
            let id = WebIM.conn.getUniqueId();
            let msg = new WebIM.message("txt", id);

            let set_options = {
              msg: "邀请您进行视频通话",
              to: tos[0],
              chatType: "singleChat",
              ext: {
                action: "invite",
                channelName: channelName,
                type: 1, //0为1v1音频，1为1v1视频，2为多人通话
                callerDevId: WebIM.conn.context.jid.clientResource, // 主叫方设备Id
                callId: callId, // 随机uuid，每次呼叫都不同，代表一次呼叫
                ts: Date.now(),
                msgType: "rtcCallWithAgora",
              },
            };
            msg.set(set_options);
            WebIM.conn.send(msg.body);

            this.updateConfr({
              ext: {
                channelName: channelName,
                type: 1,
                callerDevId: WebIM.conn.context.jid.clientResource,
                callId: callId,
              },
              to: tos[0],
              callerIMName: WebIM.conn.context.jid.name,
              calleeIMName: tos[0],
            });
            const inviteStatus = 1;
            this.setCallStatus(inviteStatus);
          } else if(selectTab === 'group'){
            console.log('执行了group');
          }
          const inviteStatus = 1
          this.setCallStatus(inviteStatus)
          let to = tos[0]
          rtc.timer = setTimeout(() => {
              if (selectTab === 'contact') {
                  this.cancelCall(to)
                  this.hangup()
              }else{
                  // 多人不做超时
              }
          }, 30000)
          break
        case 2:
          console.log('this.$refs.multiCall>>',this.$refs.multiCall);
          // this.$refs.multiCall.handleSubmit(tos,this.$route.params.id)
          break
        default:
          break;
      }
    },
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
    GroupRequest,
    GroupInvite,
    EmediaModal,
    MultiAVModal,
    Call,
    AddAVMemberModal,
    AlertModal
  }
};
</script>
