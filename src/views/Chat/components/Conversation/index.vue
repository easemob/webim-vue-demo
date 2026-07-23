<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import _ from 'lodash';
import router from '@/router';
import { ElMessage } from 'element-plus';
import { CONVERSATION_MARK } from '@/constant';

/* 搜索框组件 */
import SearchInput from '@/components/SearchInput';
/* 欢迎页 */
import Welcome from '@/components/Welcome';
/* 会话列表组件 */
import ConversationList from './components/ConversationList.vue';

const store = useStore();

const conversationList = computed(() => {
  return store.getters.conversationListFromServer;
});

// 标星筛选状态
const showStarredConversations = ref(false);

//路由跳转-系统通知
const toInformDetails = () => {
  router.push('/chat/conversation/informdetails');
};

//路由跳转-对应好友会话
const toChatMessage = (conversationId, conversationType) => {
  router.push({
    path: '/chat/conversation/message',
    query: {
      conversationId,
      conversationType,
    },
  });
};

// 切换标星会话筛选
const toggleStarredFilter = async () => {
  showStarredConversations.value = !showStarredConversations.value;
  
  if (showStarredConversations.value) {
    // 显示标星会话
    try {
      await store.dispatch('getServerConversationsByFilter', {
        filter: {
          mark: CONVERSATION_MARK.STAR,
        },
      });
      ElMessage.success('已显示所有标星会话');
    } catch (error) {
      console.error('获取标星会话失败', error);
      ElMessage.error('获取标星会话失败');
      showStarredConversations.value = false;
    }
  } else {
    // 显示所有会话
    try {
      await store.dispatch('getConversationListFromServer', { isInit: true });
      ElMessage.success('已显示所有会话');
    } catch (error) {
      console.error('获取所有会话失败', error);
      ElMessage.error('获取所有会话失败');
    }
  }
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
      <!-- 标星筛选按钮 -->
      <div class="conversation_filter">
        <el-button 
          link 
          @click="toggleStarredFilter"
          :class="{ 'active': showStarredConversations }"
        >
          <span class="star-icon">⭐</span>
          {{ showStarredConversations ? '查看所有会话' : '查看标星会话' }}
        </el-button>
      </div>
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

  .conversation_filter {
    padding: 8px 16px;
    border-bottom: 1px solid #e4e7ed;

    .el-button {
      color: #606266;
      font-size: 14px;
      padding: 4px 0;
      
      &.active {
        color: #409eff;
      }

      .star-icon {
        margin-right: 4px;
      }
    }
  }

  .chat_conversation_list {
    height: calc(100% - 100px);
  }
}

.chat_converation_main_box {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0;
}
</style>
