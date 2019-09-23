<template>
  <div class="chat-message">
    <div class="userlist">
      <van-list>
        <van-cell
          v-for="item in userList[type]"
          :key="item.name"
          :value="getLatestMessage().id === item.name?getLatestMessage().latestMessage:''"
          @click="select(item)"
          :class="{ 'active': activedKey[type] && activedKey[type].name ===  item.name }"
        >
          <template slot="title">
            <span class="custom-title">{{item.name}}</span>
            <!-- <div class="icon-style">
              <span>消息数</span>
            </div>-->
            <span
              class="time-style"
              style="float:right"
            >{{getLatestMessage().id === item.name?getLatestMessage().latestTime:''}}</span>
          </template>
        </van-cell>
      </van-list>
    </div>
    <div class="messagebox" v-if="activedKey[type]">
      <div class="messagebox-header">
        <div>{{activedKey[type].name}}</div>
      </div>
      <div class="messagebox-content">
        <div
          v-for="(item,i) in msgList"
          :key="i"
          class="message-group"
          :style="{'float':item.bySelf ? 'right':'left'}"
        >
          <h4 style="text-align: left;margin:0">{{item.from}}</h4>
          <!-- 图片消息 -->
          <img
            :key="item.msg"
            :src="item.msg?item.msg:''"
            v-if="item.type === 'img'"
            class="img-style"
          />
          <!-- 文件card -->
          <div v-else-if="item.type==='file'" class="file-style">
            <el-card :body-style="{ padding: '0px' }">
              <div style="padding: 14px;">
                <h2>文件</h2>
                <span>
                  <h3>{{item.filename}}</h3>
                </span>
                <div class="bottom clearfix">
                  <span>{{readablizeBytes(item.file_length)}}</span>
                  <a :href="item.msg" :download="item.filename">点击下载</a>
                </div>
              </div>
            </el-card>
          </div>
          <!-- 聊天消息 -->
          <p v-else v-html="renderTxt(item.msg)" :class="{ 'byself': item.bySelf}" />
          <!-- 聊天时间 -->
          <div
            class="time-style"
            :style="{'text-align':item.bySelf ? 'right':'left'}"
          >{{renderTime(item.time)}}</div>
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

          <i class="el-icon-video-camera icon" @click="callVideo" v-show="isHttps"></i>
          <i class="el-icon-mic icon" @click="callVoice" v-show="isHttps"></i>
        </div>
        <div class="fotter-send">
          <textarea
            v-model="message"
            equired
            placeholder="消息"
            class="sengTxt"
            v-on:keyup.enter="onSendTextMsg"
            style="resize:none"
            ref="txtDom"
          />
          <template />
        </div>
      </div>
    </div>
    <EmediaModal ref="emediaModal" />
  </div>
</template>

<script>
import ChatEmoji from "../chatEmoji/index.vue";
import emoji from "../../config/emoji";
import UpLoadImage from "../upLoadImage/index.vue";
import UpLoadFile from "../upLoadFile/index.vue";
import "./index.less";
import { mapActions, mapGetters } from "vuex";
import EmediaModal from "../emediaModal/index";
import moment from "moment";
import _ from "lodash";

export default {
  data() {
    return {
      activedKey: {
        contact: "",
        group: "",
        chatroom: ""
      },
      message: "",
      isHttps: window.location.protocol === "https:" ? true : false
    };
  },

  beforeMount() {
    if (this.type === "contact") {
      this.onGetContactUserList();
    } else if (this.type === "group") {
      this.onGetGroupUserList();
    } else if (this.type === "chatroom") {
      this.onGetChatroomUserList();
    }
  },
  computed: {
    ...mapGetters({
      contact: "onGetContactUserList",
      group: "onGetGroupUserList",
      chatroom: "onGetChatroomUserList",
      msgList: "onGetCurrentChatObjMsg"
    }),
    userList() {
      return {
        contact: this.contact,
        group: this.group,
        chatroom: this.chatroom
      };
    }
  },
  props: [
    "type", // 聊天类型 contact, group, chatroom
    "username" // 选中的聊天对象
  ],
  methods: {
    ...mapActions([
      "onGetContactUserList",
      "onGetGroupUserList",
      "onGetChatroomUserList",
      "onGetCurrentChatObjMsg",
      "onSendText",
      "onCallVideo",
      "onCallVoice"
    ]),
    select(key) {
      if (this.type == "group") {
        this.$router.push({ name: this.type, params: { id: key.groupid } });
      }
      this.$data.activedKey[this.type] = key;
      if (this.type === "contact") {
        this.$router.push({ name: this.type, params: { id: key.name } });
        this.onGetCurrentChatObjMsg({ type: this.type, id: key.name });
      }
      if (this.type === "chatroom") {
        this.$router.push({ name: this.type, params: { id: key.id } });
        WebIM.conn.joinChatRoom({
          roomId: key.id, // 聊天室id
          success: function() {
            console.log("加入聊天室成功");
          }
        });
      }
    },

    onSendTextMsg() {
      this.onSendText({
        chatType: this.type,
        chatId: this.$data.activedKey[this.type],
        message: this.$data.message
      });
      this.$data.message = "";
    },

    selectEmoji(v) {
      this.$data.message = v;
      this.$refs.txtDom.focus();
    },

    customEmoji(value) {
      return `<img src="../../../static/faces/${value}" style="width:20px"/>`;
    },

    renderTxt(txt) {
      let rnTxt = [];
      let match = null;
      const regex = /(\[.*?\])/g;
      let start = 0;
      let index = 0;
      while ((match = regex.exec(txt))) {
        index = match.index;
        if (index > start) {
          rnTxt.push(txt.substring(start, index));
        }
        if (match[1] in emoji.obj) {
          const v = emoji.obj[match[1]];
          rnTxt.push(this.customEmoji(v));
        } else {
          rnTxt.push(match[1]);
        }
        start = index + match[1].length;
      }
      rnTxt.push(txt.substring(start, txt.length));
      return rnTxt.toString().replace(/,/g, "");
    },

    callVideo() {
      this.$refs.emediaModal.showEmediaModal();
      this.onCallVideo({
        chatType: this.type,
        to: this.$data.activedKey[this.type].name
      });
    },
    callVoice() {
      this.$refs.emediaModal.showEmediaModal();
      this.onCallVoice({
        chatType: this.type,
        to: this.$data.activedKey[this.type].name
      });
    },
    readablizeBytes(value) {
      let s = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
      let e = Math.floor(Math.log(value) / Math.log(1024));
      return (value / Math.pow(1024, Math.floor(e))).toFixed(2) + " " + s[e];
    },

    // TODO 可以抽离到utils
    renderTime(time) {
      const nowStr = new Date();
      const localStr = time ? new Date(time) : nowStr;
      const localMoment = moment(localStr);
      const localFormat = localMoment.format("MM-DD hh:mm A");
      return localFormat;
    },
    // TODO 可以抽离到utils
    getLatestMessage() {
      console.log("this.store", this.$store.state.chat);
      const { name, params } = this.$route;
      let currentMsgs = this.$store.state.chat.msgList[name] || "";
      console.log("currentMsgs>>>", currentMsgs);
      let data = [];
      if (name === "contact") {
        data = currentMsgs[params.id] || [];
      }
      let latestMessage = "";
      let latestTime = "";
      if (data.length > 0) {
        const latestData = data[data.length - 1];
        const latestType = _.get(latestData, "type", "");
        console.log("latestData>>", latestData, "latestType>>", latestType);
        if (!latestType) {
          latestMessage = _.get(latestData, "msg", "");
        } else if (latestType === "img") {
          latestMessage = "[image]";
        }
        latestTime = this.renderTime(latestData.time);
      }
      return {
        latestMessage,
        latestTime,
        id:params.id
      };
    }
  },
  components: {
    EmediaModal,
    ChatEmoji,
    UpLoadImage,
    UpLoadFile
  }
};
</script>

<style scoped lang='less'>
.custom-title {
  font-weight: 500;
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
  max-width: 400px;
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
