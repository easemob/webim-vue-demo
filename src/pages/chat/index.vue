<template>
  <div class="contact">
    <div class="header">
      <span class="setting">
        <van-icon name="setting-o" size="24" color="#fff" @click="optionsVisibleChange"/>
        <ul class="options" v-show="showSettingOptions">
          <li class="option" @click="toLogout">退出</li>
        </ul>
      </span>
      <span class="username">{{username}}</span>
    </div>
    <div class="content">
      <van-tabs v-model="activeKey" @click="contactTypeChange">
        <van-tab title="好友" name="contact">
          好友聊天
        </van-tab>
        <van-tab title="群组" name="group">
          群组聊天
        </van-tab>
        <van-tab title="聊天室" name="chatroom">
          聊天室
        </van-tab>
      </van-tabs>
      <div class="userlist"></div>
      <div class="messagebox">
        <div class="messagebox-header">
          <div>{{username}}</div>
        </div>
        <div class="messagebox-content"></div>
        <div class="messagebox-footer">
          <div class="footer-icon"></div>
          <div class="fotter-send"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import "./index.css";
import { mapState, mapActions } from "vuex";
export default {
  data() {
    return {
      showSettingOptions: false,
      activeKey: "contact"
    };
  },
  computed: {
    username() {
      return this.$store.state.login.username;
    }
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
    }
  },
  components: {}
};
</script>
