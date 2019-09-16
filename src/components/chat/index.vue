<template>
  <div class="chat-message">
    <div class="userlist">
      <van-list>
        <van-cell
          v-for="item in userList[type]"
          :key="item.name"
          :title="item.name"
          @click="select(item)"
          :class="{ 'active': activedKey[type] && activedKey[type].name ===  item.name }"
        />
      </van-list>
    </div>
    <div class="messagebox" v-if="activedKey[type]">
      <div class="messagebox-header">
        <div>{{activedKey[type].name}}</div>
      </div>
      <div class="messagebox-content">
        <ul>
          <li v-for="item in msgList" :key="item.msg" :class="{ 'byself': item.bySelf}">
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
                  <p>文件</p>
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
            <!-- TODO 实现方式欠妥 后期需优化 -->
            <span v-else>
              <img :src="imgSrc(item.msg)" class="emoji-style" />
              {{removeEmoji(item.msg)}}
            </span>
          </li>
        </ul>
      </div>
      <div class="messagebox-footer">
        <div class="footer-icon">
          <!-- 表情组件 -->
          <ChatEmoji v-on:selectEmoji="selectEmoji" />
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
      this.$data.activedKey[this.type] = key;
      if (this.type === "contact") {
        this.onGetCurrentChatObjMsg({ type: this.type, id: key.name });
      }
      if (this.type === "chatroom") {
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
    },

    rendEmoji(txt) {
      const regex = /(\[.*?\])/g;
      let rnTxt = [];
      let match = regex.exec(txt);
      let index = 0;
      let value = "";
      while (match) {
        index = match.index;
        if (match[1] in emoji.obj) {
          value = emoji.obj[match[1]];
        } else {
          rnTxt.push(match[1]);
        }
        return value;
      }
    },
    removeEmoji(txt) {
      const regex = /(\[.*?\])/g;
      if (regex.test(txt)) {
        let value = "";
        value = txt.replace(regex, "");
        return value;
      } else {
        return txt;
      }
    },
    imgSrc(msg) {
      const regex = /(\[.*?\])/g;
      if (regex.test(msg)) {
        let url = "";
        let value = this.rendEmoji(msg);
        url = require(`../../theme/faces/${value}`);
        return url;
      } else {
        return;
      }
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
.emoji-style {
  width: 22px;
  float: left;
}
.img-style {
  max-width: 400px;
  float: right;
}
.file-style {
  width: 240px;
  margin: 2px 2px 2px 0;
  font-size: 13px;
  p {
    border-bottom: 1px solid #e0e0e0;
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
