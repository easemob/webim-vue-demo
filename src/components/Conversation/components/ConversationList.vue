<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import router from '@/router';
import Ease from '@/IM/initwebsdk'
import dateFormater from '@/utils/dateFormat'
import { useConversation } from '@/hooks'
const store = useStore();
/* 在此处挂载关于环信的消息相关监听用来做更新会话列表使用 */
Ease.conn.addEventHandler('messageListen', {
  onTextMessage: function (message) {
    console.log('>>>>>>>mesage', message)
    let resultData = useConversation(message)
    store.dispatch('createNewConversation', resultData)
    // console.log('>>>>>>在会话中接收message', resultData)
  },    // 收到文本消息。
  onEmojiMessage: function (message) { },   // 收到表情消息。
  onImageMessage: function (message) {
  },   // 收到图片消息。
  onCmdMessage: function (message) { },     // 收到命令消息。
  onAudioMessage: function (message) { },   // 收到音频消息。
  onLocationMessage: function (message) { },// 收到位置消息。
  onFileMessage: function (message) { },    // 收到文件消息。
  onCustomMessage: function (message) { },  // 收到自定义消息。
  onVideoMessage: function (message) { },     // 收到视频消息。
  onRecallMessage: function (message) { },    // 收到消息撤回回执。
})
//取会话数据
const conversationList = computed(() => {
  return store.state.Conversation.conversationListData;
});
//处理会话列表头像
const handleConversationData = computed(() => {
  const defaultGroupAvatarUrl = require('@/assets/images/avatar/jiaqun2x.png')
  const defaultSingleAvatarUrl = require('@/assets/images/avatar/theme2x.png')

  return (data) => {
    console.log('data', data)
    let conversationData = {
      avatarUrl: data.conversationType === 'singleChat' ? defaultSingleAvatarUrl : defaultGroupAvatarUrl,
      name: '测试',
      unReadNum: data.unreadMessageNum || 0,
      latestSendTime: dateFormater('MM/DD/HH:mm', 1652274260558),
      latestMessage: '11111221',
      fromName: '张三'
    }

    // if (data.conversationType === 'groupChat') { conversationData.defaultGroupAvatarUrl }
    return conversationData
  }

})
//处理会话列表头像
const handleAvatarUrl = computed(() => {
  let avatarUrl;
  const defaultGroupAvatarUrl = require('@/assets/images/avatar/jiaqun2x.png')
  const defaultSingleAvatarUrl = require('@/assets/images/avatar/theme2x.png')
  return chatType => {
    console.log('chatType', chatType)
    return avatarUrl = chatType === 'singleChat' ? defaultSingleAvatarUrl : defaultGroupAvatarUrl
  }
})
//处理latestMessage
const handleLatestMessage = computed(() => {
  return lastestMessage => {
    return console.log('>>>>>>>', lastestMessage)
  }
})
//系统通知
const informIcon = require('@/assets/images/avatar/inform.png');
const toInformDetails = () => {
  router.push('/chat/conversation/informdetails');
};
//普通会话
let checkedConverItemIndex = ref(null);
const toChatMessage = (index) => {
  console.log('index', index);
  checkedConverItemIndex.value = index;
  router.push('/chat/conversation/message');
};
//加载到底拉取新数据
const load = () => {
  console.log('>>>>>加载到底');
};

</script>
<template>
  <ul v-infinite-scroll="load" class="session_list" style="overflow: auto" @click="getItem">
    <!-- 系统通知会话 -->
    <li class="session_list_item" @click="toInformDetails">
      <div class="item_body item_left">
        <!-- 通知头像 -->
        <div class="session_other_avatar">
          <el-avatar :src="informIcon" />
        </div>
      </div>
      <div class="item_body item_main">
        <div class="name">系统通知</div>
        <div class="last_msg_body">张三：申请加您为好友！</div>
      </div>
      <div class="item_body item_right">
        <span class="time">11:30</span>
      </div>
    </li>

    <!-- 普通会话 -->
    <li class="session_list_item" :style="{ background: (checkedConverItemIndex === index ? '#d2d2d2' : '') }"
      v-for="( item, itemKey, index) in conversationList" :key="index" @click="toChatMessage(index)">
      <div class="item_body item_left">
        <!-- 头像 -->
        <el-badge :value="item.unreadMessageNum" :hidden="item.unreadMessageNum === 0" :max="99">
          <div class="session_other_avatar">
            <el-avatar :src="handleAvatarUrl(item.conversationType)" />
          </div>
        </el-badge>
      </div>
      <div class="item_body item_main">
        <div class="name">{{ item.conversationInfo.name }}</div>
        <div class="last_msg_body">{{
            handleConversationData(item).fromName + '：' + handleConversationData(item).latestMessage
        }}
        </div>
      </div>
      <div class="item_body item_right">
        <span class="time">{{ dateFormater('MM/DD/HH:mm', item.latestSendTime) }}</span>
      </div>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.session_list {
  height: 100%;
  padding: 0;
  margin: 0;
  list-style: none;
}

.session_list .session_list_item {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 66px;
  background: #f0f0f0;
  color: var(--el-color-primary);
  cursor: pointer;

  &:hover {
    background: #d2d2d2;
  }

  .item_body {
    display: flex;
    height: 100%;
  }

  .item_left {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    width: 25%;
    padding: 0;
  }

  .item_main {
    width: 50%;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;

    .name {
      max-width: 56px;
      max-height: 20px;
      font-size: 14px;
      font-weight: bold;
      color: #000;
    }

    .last_msg_body {
      margin-top: 5px;
      max-width: 185px;
      height: 17px;
      color: #a3a3a3;
      font-size: 12px;
      font-weight: 300;
    }
  }

  .item_right {
    width: 25%;
    flex-direction: row;
    align-items: center;
    justify-content: center;

    .time {
      font-size: 10px;
      color: #a3a3a3;
      font-weight: 400;
    }
  }
}

.session_list_item_active {
  background: #d2d2d2;
}

.session_list .session_list_item+.list_item {
  margin-top: 10px;
}
</style>
