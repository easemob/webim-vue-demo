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
  </div>
</template>

<script>
import MessageBox from "../../components/chat/index.vue";
import "./index.less";
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
  components: {
    MessageBox
  }
};
</script>
