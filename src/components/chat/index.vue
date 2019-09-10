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
            <!-- TODO 实现方式欠妥 后期需优化 -->
            <img :src="imgSrc(item.msg)" class="img-style" />
            <span>{{removeEmoji(item.msg)}}</span>
          </li>
        </ul>
      </div>
      <div class="messagebox-footer">
        <div class="footer-icon">
          <!-- <van-icon name="smile-o" size="20" color="rgba(0, 0, 0, 0.65)"/> -->
          <!-- 表情组件 -->
          <ChatEmoji v-on:selectEmoji="selectEmoji" />
          <van-icon name="photo-o" size="20" color="rgba(0, 0, 0, 0.65)" />
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
  </div>
</template>

<script>
import ChatEmoji from "../chatEmoji/index.vue";
import emoji from "../../config/emoji";
import "./index.less";
import { mapActions, mapGetters } from "vuex";
export default {
  data() {
    return {
      activedKey: {
        contact: "",
        group: "",
        chatroom: "",
      },
      message: ""
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
      "onSendText"
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

    // rendEmoji2(txt) {
    //   const regex = /(\[.*?\])/g;
    //   let rnTxt = [];
    //   let match = regex.exec(txt);
    //   let start = 0;
    //   let index = 0;
    //   while (match) {
    //     index = match.index;
    //     if (index > start) {
    //       rnTxt.push(txt.substring(start, index));
    //     }
    //     if (match[1] in emoji.obj) {
    //       const v = emoji.obj[match[1]];
    //       rnTxt.push(
    //         <img
    //           key={WebIM.conn.getUniqueId()}
    //           // src={require(`../../themes/faces/${v}`)}
    //           width={20}
    //           height={20}
    //         />
    //       );
    //     } else {
    //       rnTxt.push(match[1]);
    //     }
    //     start = index + match[1].length;
    //   }
    //   rnTxt.push(txt.substring(start, txt.length));
    //   console.log("rnTxt>>>>>", rnTxt);

    //   return rnTxt;
    // },

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
    }
  },
  components: {
    ChatEmoji
  }
};
</script>

<style scoped>
.img-style {
  width: 22px;
  float: left;
}
</style>
