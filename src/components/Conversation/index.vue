<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import router from '@/router';

/* 搜索框组件 */
import SearchInput from '@/components/searchInput';
/* 会话列表组件 */
import ConversationList from './components/ConversationList.vue';
const store = useStore();
const conversationList = computed(() => {
  return Object.values(store.state.Conversation.conversationListData);
});
const informConversationData = computed(() => {
  return Object.values(store.state.Conversation.informConversationData);
});
</script>
<template>
  <el-container style="height: 100%">
    <el-aside class="chat_converation_box">
      <div class="chat_conversation_search">
        <SearchInput />
      </div>
      <div class="chat_conversation_list">
        <ConversationList />
      </div>
    </el-aside>
    <el-main class="chat_converation_main_box">
      <router-view></router-view>
    </el-main>
  </el-container>
</template>

<style lang="scss" scoped>
.chat_converation_box {
  width: 30%;
  background: #cfdbf171;
  overflow: hidden;

  .chat_conversation_list {
    height: calc(100% - 60px);
    // overflow-y: auto;
  }

  .chat_conversation_search {
    width: 100%;
    height: 60px;
    background: #eff0f0;
    padding: 14px 20px;
    box-sizing: border-box;
  }
}

.chat_converation_main_box {
  width: 100%;
  height: 100%;

}
</style>
