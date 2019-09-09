<template>
  <div class="contact">
    <div class="header">
      <span class="setting">
        <van-icon name="setting-o" size="24" color="#fff" @click="optionsVisibleChange"/>
        <ul class="options" v-show="showSettingOptions">
          <li class="option" @click="toLogout">退出</li>
        </ul>
      </span>
      <span class="add-style">
        <van-icon name="add-o" size="24" color="#fff" @click="addModalChange" />
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
      <span class="username">{{username}}</span>
    </div>
    <div class="content">
      <van-tabs v-model="activeKey" @click="contactTypeChange">
        <van-tab title="好友" name="contact">
          <MessageBox
          type="contact"
          />
        </van-tab>
        <van-tab title="群组" name="group">
          <MessageBox 
          type="group" 
          />
        </van-tab>
        <van-tab title="聊天室" name="chatroom">
          <MessageBox 
          type="chatroom" 
          />
        </van-tab>
      </van-tabs>
    </div>
      <AddFriend ref="addFriendMethods"/>
      <!-- TODO 好友请求弹窗组件写在这不太适合 -->
      <GetFriendRequest/>
  </div>
</template>

<script>
import Vue from 'vue'
import MessageBox from "../../components/chat/index.vue";
import AddFriend from "../../components/addModal/addFriend.vue";
import GetFriendRequest from "../../components/addModal/getFriendRequest.vue"
import "./index.less";
import { mapState, mapActions } from "vuex";
export default {
  data() {
    return {
      showSettingOptions: false,
      activeKey: "contact",

      showAddOptions: false,
      addList: [
        { name: "添加好友", id: "1", icon: "chat" },
        { name: "申请入群", id: "2", icon: "friends" },
        { name: "创建群组", id: "3", icon: "comment" }
      ]
    };
  },
  computed: {
    username() {
      return this.$store.state.login.username;
    },
  },
  methods: {
    ...mapActions(["onLogout"]),
    toLogout() {
      this.onLogout();
    },
    optionsVisibleChange() {
      this.$data.showSettingOptions = !this.$data.showSettingOptions;
    },
    contactTypeChange(type) {
      this.$data.activeKey = type;
    },
    addModalChange() {
      this.$data.showAddOptions = !this.$data.showAddOptions;
    },
    ulClick(i) {
      this.addModalChange()
      switch (i) {
        case "1":
          this.$refs.addFriendMethods.changeModal()
          break;
        default:
          break;
      }
    }
  },
  components: {
    MessageBox,
    AddFriend,
    GetFriendRequest
  }
};
</script>
