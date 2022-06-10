<script setup>
import { ref, watch, computed } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { messageType } from '@/constant'

//组件
import MessageList from './components/messageList.vue'
import InputBox from './components/inputBox.vue'
const store = useStore()
const route = useRoute()
const drawer = ref(false)
const { CHAT_TYPE } = messageType
const nowPickInfo = ref({});
const friendList = computed(() => store.state.Contacts.friendList)
const groupList = computed(() => store.state.Contacts.groupList)
//获取路由ID对应的信息
const getIdInfo = async ({ id, chatType }) => {
  //类型为单聊
  if (chatType === CHAT_TYPE.SINGLE) {
    if (friendList.value[id].userInfo) {
      nowPickInfo.value.userInfo = friendList[id].userInfo
    } else {
      return
    }
  }
  //类型为群组
  if (chatType === CHAT_TYPE.GROUP) {
    if (groupList.value[id].groupDetail) {
      return nowPickInfo.value.groupDetail = groupList.value[id].groupDetail
    } else {
      await store.dispatch('getAssignGroupDetail', id)
      return nowPickInfo.value.groupDetail = groupList.value[id].groupDetail
    }
  }



}
watch(() => route.query, (routeVal) => {
  if (routeVal) {
    nowPickInfo.value = { ...routeVal }
    getIdInfo(routeVal)

  }
}, {
  immediate: true
})

//获取其id对应的消息内容
const messageData = computed(() => {

  return nowPickInfo.value.id && store.state.Message.messageList[nowPickInfo.value.id] || []
})
console.log('>>>>>messageData', messageData)
</script>
<template>
  <el-container class="app_container">
    <el-header class="chat_message_header">
      <div v-if="nowPickInfo.chatType === CHAT_TYPE.SINGLE" class="chat_user_name">{{ nowPickInfo.id }}</div>
      <div v-if="nowPickInfo.chatType === CHAT_TYPE.GROUP" class="chat_user_name">
        {{ nowPickInfo.groupDetail && nowPickInfo.groupDetail.name || '' }} {{ `(${nowPickInfo.groupDetail &&
            nowPickInfo.groupDetail.affiliations_count || ''})`
        }}
      </div>
      <span class="more" @click="drawer = !drawer">
        ...
      </span>
    </el-header>

    <el-main class="chat_message_main">
      <div class="chat_message_tips">
      </div>
      <MessageList :messageData="messageData" />

    </el-main>
    <el-footer class="chat_message_inputbar">
      <InputBox :nowPickInfo="nowPickInfo" />
    </el-footer>

  </el-container>
  <el-drawer v-model="drawer" title="I am the title" direction="rtl" :modal="false" size="20%">
    <span>Hi, there!</span>
  </el-drawer>
</template>



<style lang="scss" scoped>
.app_container {
  height: 100%;
  border-left: 1px solid #E6E6E6;
}

.chat_message_header {
  position: relative;
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
  height: 61px;
  background: #F9F9F9;
  border-bottom: 1px solid #E6E6E6;

  .chat_user_name {
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 400;
    font-size: 17px;
    line-height: 24px;
    letter-spacing: 0.3px;
    color: #333333;
  }

  .more {
    display: flex;
    width: 35px;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    cursor: pointer;
    transition: all .3s;

    &:hover {
      transform: scale(1.1);
    }
  }
}

.chat_message_main {
  background: #F9F9F9;
  overflow-y: scroll;
}

.chat_message_inputbar {
  width: 100%;
  height: 25%;
  padding: 0;
  background-color: #F9F9F9;


}
</style>
