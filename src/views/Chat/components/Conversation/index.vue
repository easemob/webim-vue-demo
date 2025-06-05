<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import _ from 'lodash';
import router from '@/router';

/* 搜索框组件 */
import SearchInput from '@/components/SearchInput';
/* 欢迎页 */
import Welcome from '@/components/Welcome';
/* 会话列表组件 */
import ConversationList from './components/ConversationList.vue';

const store = useStore();

const conversationFromMethod = computed(() => {
  return store.getters.conversationFromMethod;
});
const conversationList = computed(() => {
  if (conversationFromMethod.value) {
    return store.getters.conversationListFromLocal;
  } else {
    return store.getters.conversationListFromServer;
  }
});
//路由跳转-系统通知
const toInformDetails = () => {
  router.push('/chat/conversation/informdetails');
};

//路由跳转-对应好友会话
const toChatMessage = (id, chatType) => {
  router.push({
    path: '/chat/conversation/message',
    query: {
      id,
      chatType,
    },
  });
};
</script>
<template>
  <el-container style="height: 100%">
    <el-aside class="chat_converation_box">
      <!-- 搜索组件 -->
      <SearchInput
        :searchType="'conversation'"
        :searchData="conversationList"
        @toChatMessage="toChatMessage"
      />
      <div class="chat_conversation_list">
        <ConversationList
          @toInformDetails="toInformDetails"
          @toChatMessage="toChatMessage"
        />
      </div>
    </el-aside>
    <el-main class="chat_converation_main_box">
      <router-view></router-view>
      <Welcome />
    </el-main>
  </el-container>
</template>

<style lang="scss" scoped>
.chat_converation_box {
  position: relative;
  background: #cfdbf171;
  overflow: hidden;
  min-width: 324px;

  .chat_conversation_list {
    height: calc(100% - 60px);
  }
}

.chat_converation_main_box {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0;
}
</style>
