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
    <div class="messagebox" v-if="activedKey[type] !== undefined">
      <div class="messagebox-header">
        <div>{{activedKey[type].name}}</div>
      </div>
      <div class="messagebox-content"></div>
      <div class="messagebox-footer">
        <div class="footer-icon">
          <van-icon name="smile-o" size="20" color="rgba(0, 0, 0, 0.65)"/>
          <van-icon name="photo-o" size="20" color="rgba(0, 0, 0, 0.65)"/>
        </div>
        <div class="fotter-send"></div>
      </div>
    </div>
  </div>
</template>

<script>
import "./index.less";
import { mapActions, mapGetters } from "vuex";
export default {
  data() {
    return {
      activedKey: {
        contact: "",
        group: "",
        chatroom: ""
      }
    };
  },
  beforeMount() {
    if (this.type === "contact") {
      this.getContactUserList();
    } else if (this.type === "group") {
      this.getGroupUserList();
    } else if (this.type === "chatroom") {
      this.getChatroomUserList();
    }
  },
  computed: {
    ...mapGetters({
      contact: "onGetContactUserList",
      group: "onGetGroupUserList",
      chatroom: "onGetChatroomUserList"
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
      "onGetChatroomUserList"
    ]),
    getContactUserList() {
      this.onGetContactUserList();
    },
    getGroupUserList() {
      this.onGetGroupUserList();
    },
    getChatroomUserList(type) {
      this.onGetChatroomUserList();
    },
    select(key) {
      this.$data.activedKey[this.type] = key;
      console.log(key);
      if (this.type === "chatroom") {
        WebIM.conn.joinChatRoom({
          roomId: key.id, // 聊天室id
          success: function() {
            console.log("加入聊天室成功");
          }
        });
      }
    }
  }
};
</script>
