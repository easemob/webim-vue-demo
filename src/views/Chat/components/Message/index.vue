<script setup>
import { ref, watch, nextTick, computed, onMounted } from 'vue';
import _ from 'lodash';
import { getCurrentUserId, requireManager } from '@/IM';
import { CHAT_TYPE } from '@/IM/constant';
import { useStore } from 'vuex';
import { useRoute, onBeforeRouteLeave } from 'vue-router';
import { EASEIM_HINT, SWINDLER_GO_DIE, WARM_TIP } from '@/constant';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ChatLineSquare, Close, Search } from '@element-plus/icons-vue';
import waterMark from '@/utils/waterMark';
/* 组件 */
import ChatMessageListItem from './components/ChatMessageListItem';
import ChatInputBox from './components/ChatInputBox';
import GroupsDetails from '@/views/Chat/components/AboutGroups/GroupsDetails';
import ChatContainerHeader from './components/ChatContainerHeader';
import SingleChatDetails from './components/SingleChatDetails.vue';
import MessageThreadListDrawer from './components/MessageThreadListDrawer.vue';
import MessageSearchDrawer from './components/MessageSearchDrawer.vue';
/* store */
const store = useStore();
const contactManager = () => requireManager('contactManager');
/* route */
const route = useRoute();

/* loginstatus */
const loginState = computed(() => store.state.loginState);
/* header 操作 */
const drawer = ref(false); //抽屉显隐
const handleDrawer = () => {
  drawer.value = !drawer.value;
};
const blackListDialogVisible = ref(false);
const blackListLoading = ref(false);
const removingBlackListUserId = ref('');
const friendBlackList = computed(() => store.state.Contacts.friendBlackList || []);
const threadListDrawer = ref(false);
const messageSearchDrawer = ref(false);
const showThreadListDrawer = () => {
  threadListDrawer.value = true;
};
const showMessageSearchDrawer = () => {
  messageSearchDrawer.value = true;
};
const isMessageSearchVisible = computed(() => {
  return (
    routeQueryData.value.id &&
    !routeQueryData.value.isChatThread &&
    [CHAT_TYPE.SINGLE, CHAT_TYPE.GROUP, CHAT_TYPE.CHATROOM].includes(
      routeQueryData.value.chatType,
    )
  );
});
const refreshFriendBlackList = async () => {
  blackListLoading.value = true;
  try {
    await store.dispatch('fetchBlackList');
  } finally {
    blackListLoading.value = false;
  }
};
const openFriendBlackList = async () => {
  blackListDialogVisible.value = true;
  await refreshFriendBlackList();
};
//删除好友
const delTheFriend = async () => {
  if (routeQueryData.value?.id) {
    const targetId = routeQueryData.value.id;
    try {
      await contactManager().deleteContact({ userId: targetId });
      store.commit('DELETE_CONTACTS_FROM_MAP', targetId);
      ElMessage({ type: 'success', center: true, message: '好友已删除~' });
    } catch (error) {
      console.error('删除好友失败:', error);
      ElMessage({
        type: 'error',
        center: true,
        message: error?.message || '删除好友失败',
      });
    }
  }
};
// 设置好友备注
const remarkDialogVisible = ref(false);
const friendRemark = ref('');
const setFriendRemark = async () => {
  if (routeQueryData.value?.id && friendRemark.value.trim()) {
    const targetId = routeQueryData.value.id;
    const remark = friendRemark.value.trim();
    
    // 检查备注长度
    if (remark.length > 100) {
      ElMessage({ type: 'warning', center: true, message: '好友备注长度不能超过 100 个字符' });
      return;
    }
    
    // 检查是否是好友关系
    const contactsMap = store.getters.getContactsWithRemarkMap;
    if (!contactsMap.has(targetId)) {
      ElMessage({ type: 'warning', center: true, message: '只有好友才能设置备注' });
      return;
    }
    
    try {
      await store.dispatch('setContactsRemark', {
        userId: targetId,
        remark,
      });
      ElMessage({ type: 'success', center: true, message: '好友备注设置成功~' });
      remarkDialogVisible.value = false;
      friendRemark.value = '';
    } catch (error) {
      ElMessage({ type: 'error', center: true, message: '好友备注设置失败，请稍后重试' });
      console.error('设置好友备注失败:', error);
    }
  }
};
//检查用户是否在黑名单中
const isInBlackList = computed(() => {
  const targetId = routeQueryData.value?.id;
  if (!targetId) return false;
  return Array.from(store.state.Contacts.friendBlackList).includes(targetId);
});

//加入好友到黑名单
const addFriendToBlackList = async () => {
  if (routeQueryData.value?.id) {
    const targetId = routeQueryData.value.id;
    try {
      const result = await contactManager().addUsersToBlocklist({
        userIds: [targetId],
      });
      if (!result.succeeded.some((user) => user.userId === targetId)) {
        console.error('[Blocklist] addUsersToBlocklist did not confirm target', {
          currentUser: getCurrentUserId(),
          targetId,
          result,
        });
        ElMessage({
          type: 'error',
          center: true,
          message: '添加到黑名单失败：SDK 未确认目标用户已加入黑名单',
        });
        return;
      }
      await refreshFriendBlackList();
      ElMessage({ type: 'success', center: true, message: '已成功将该用户添加到黑名单' });
    } catch (error) {
      console.error('[Blocklist] addUsersToBlocklist failed', {
        currentUser: getCurrentUserId(),
        targetId,
        error,
      });
      ElMessage({
        type: 'error',
        center: true,
        message: error?.message || '添加到黑名单失败',
      });
    }
  }
};

//从黑名单中移除用户
const removeFriendFromBlackList = async () => {
  if (routeQueryData.value?.id) {
    const targetId = routeQueryData.value.id;
    try {
      await contactManager().removeUserFromBlocklist({
        userIds: [targetId]
      });
      ElMessage({ type: 'success', center: true, message: '已成功将该用户从黑名单中移除' });
      await refreshFriendBlackList();
    } catch (error) {
      ElMessage({ type: 'error', center: true, message: '从黑名单中移除失败，请稍后重试' });
      console.error('从黑名单中移除失败:', error);
    }
  }
};
const removeUserFromFriendBlackList = async (userId) => {
  if (!userId || removingBlackListUserId.value) return;
  removingBlackListUserId.value = userId;
  try {
    await contactManager().removeUserFromBlocklist({
      userIds: [userId],
    });
    ElMessage({ type: 'success', center: true, message: `${userId} 已移出黑名单` });
    await refreshFriendBlackList();
  } catch (error) {
    console.error('从黑名单列表移除用户失败:', {
      userId,
      error,
    });
    ElMessage({
      type: 'error',
      center: true,
      message: error?.message || `${userId} 移出黑名单失败`,
    });
  } finally {
    removingBlackListUserId.value = '';
  }
};
const clearCurrentConversationMessages = async () => {
  if (!routeQueryData.value?.id) return;
  try {
    await ElMessageBox.confirm('确认清空当前聊天记录？', '清空聊天记录', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    });
    store.commit('CLEAR_SOMEONE_MESSAGE', routeQueryData.value.id);
    ElMessage({ type: 'success', center: true, message: '聊天记录已清空' });
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空聊天记录失败:', error);
      ElMessage({ type: 'error', center: true, message: '清空聊天记录失败' });
    }
  }
};
/* warningTips */
const isShowWarningTips = computed(() => store.state.isShowWarningTips);
const randomTips = computed(() => {
  return _.toString(_.sampleSize(SWINDLER_GO_DIE, 1));
});

const getCurrentConversation = () => {
  const { id } = routeQueryData.value;
  if (!id) return null;
  const list = store.state.Conversation.conversationFromMethod
    ? store.state.Conversation.conversationListFromLocal
    : store.state.Conversation.conversationListFromServer;
  return list.find((item) => item.conversationId === id) || null;
};

const markConversationReadIfNeeded = (options = {}) => {
  const { id, chatType } = routeQueryData.value;
  if (!id || !chatType || chatType === CHAT_TYPE.CHATROOM) return;

  const conversation = getCurrentConversation();
  if (!options.force && (!conversation || conversation.unReadCount <= 0)) {
    return;
  }

  store.dispatch('clearConversationUnreadCount', {
    conversationId: id,
    chatType,
  });
};

const isMessageInCurrentConversation = (message) => {
  if (!message || !routeQueryData.value.id) return false;
  if (message.from === getCurrentUserId()) return false;
  const { id, chatType } = routeQueryData.value;
  if (chatType === CHAT_TYPE.SINGLE) {
    return message.chatType === CHAT_TYPE.SINGLE && message.from === id;
  }
  return message.chatType === chatType && message.to === id;
};

/* warterMark */
onMounted(() => {
  const chatContainer = document.querySelector('.chat_message_main');
  chatContainer && waterMark({ container: chatContainer });

  // 监听消息送达回执事件
  window.addEventListener('hx:messageDelivered', handleMessageDelivered);

  // 监听消息已读回执事件
  window.addEventListener('hx:messageRead', handleMessageRead);

  // 监听会话已读回执事件
  window.addEventListener('hx:channelMessage', handleChannelMessage);

  // 监听统计消息事件（离线回执）
  window.addEventListener('hx:statisticMessage', handleStatisticMessage);
});

// 处理消息送达回执
const handleMessageDelivered = (event) => {
  const message = event.detail;

  // 确定会话 ID
  const conversationId =
    message.chatType === CHAT_TYPE.SINGLE ? message.from : message.to;

  // 更新消息送达状态
  store.commit('UPDATE_MESSAGE_DELIVERED', {
    messageId: message.id,
    conversationId: conversationId,
    chatType: message.chatType,
  });
};

// 处理消息已读回执
const handleMessageRead = (event) => {
  const message = event.detail;

  // 确定会话 ID
  const conversationId =
    message.chatType === CHAT_TYPE.SINGLE ? message.from : message.to;

  // 更新消息已读状态
  store.commit('UPDATE_MESSAGE_READ', {
    messageId: message.id,
    conversationId: conversationId,
    chatType: message.chatType,
    groupReadCount: message.groupReadCount,
  });
};

// 处理会话已读回执
const handleChannelMessage = (event) => {
  const message = event.detail;

  const conversationId = message?.from || message?.to;
  if (!conversationId) return;

  // 单聊收到会话已读回执后，将当前会话中我发送的消息标记为已读。
  // 群聊会话已读回执仅用于清空服务端未读数，不会通过 onChannelMessage 回调给发送方。
  if (message.chatType === CHAT_TYPE.SINGLE) {
    const listKey = `${CHAT_TYPE.SINGLE}${conversationId}`;
    const currentList = store.state.Message.messageList[listKey] || [];
    currentList
      .filter((item) => item.from === getCurrentUserId() && !item.read)
      .forEach((item) => {
        store.commit('UPDATE_MESSAGE_READ', {
          messageId: item.id,
          conversationId,
          chatType: CHAT_TYPE.SINGLE,
        });
      });
  }
};

// 处理统计消息事件（离线回执）
const handleStatisticMessage = (event) => {
  const message = event.detail;
  
  // 解析群组已读回执信息
  if (message.location) {
    try {
      const statisticMsg = JSON.parse(message.location);
      const groupAck = statisticMsg.group_ack || [];
      
      // 处理群组已读回执
      groupAck.forEach(ack => {
        store.commit('UPDATE_MESSAGE_READ', {
          messageId: ack.mid,
          conversationId: message.from,
          chatType: CHAT_TYPE.GROUP,
          groupReadCount: ack.count
        });
      });
    } catch (error) {
      console.error('解析统计消息失败:', error);
    }
  }
};

// 离开该路由销毁事件监听
onBeforeRouteLeave(() => {
  stopWatchRoute();
  window.removeEventListener('hx:messageDelivered', handleMessageDelivered);
  window.removeEventListener('hx:messageRead', handleMessageRead);
  window.removeEventListener('hx:channelMessage', handleChannelMessage);
  window.removeEventListener('hx:statisticMessage', handleStatisticMessage);
});
const closeWarningTips = () => store.commit('CLOSE_WARNING_TIPS');
/* userInfo */
const routeQueryData = ref({
  id: '',
  chatType: CHAT_TYPE.SINGLE,
  isChatThread: false,
  groupId: '',
  threadName: '',
});
const getRouteQueryWithIdInfo = (data) => {
  const { id, chatType, groupId, threadName } = data;
  routeQueryData.value = {
    id,
    chatType,
    isChatThread: data.isChatThread === 'true',
    groupId: groupId || '',
    threadName: threadName || '',
  };
};
//监听路由改变获取对应的getIdInfo
const stopWatchRoute = watch(
  () => route.query,
  (routeVal) => {
    if (routeVal) {
      getRouteQueryWithIdInfo(routeVal);
    }
  },
  {
    immediate: true,
  },
);

watch(
  () => getCurrentConversation()?.unReadCount || 0,
  (unReadCount) => {
    if (unReadCount > 0) {
      markConversationReadIfNeeded();
    }
  },
);

/* 消息相关 */
const loadingHistoryMsg = ref(false); //是否正在加载中
const isMoreHistoryMsg = ref(true); //加载文案展示为加载更多还是已无更多。
const notScrollBottom = ref(false); //是否滚动置底
const historyMessageCursor = ref(-1);
//获取历史记录
const fechHistoryMessage = async (loadType) => {
  if (!routeQueryData.value) return [];
  loadingHistoryMsg.value = true;
  notScrollBottom.value = true;

  try {
    let messages = [];
    if (loadType == 'fistLoad') {
      const result = await store.dispatch('getHistoryMessage', {
        ...routeQueryData.value,
        isChatThread: routeQueryData.value.isChatThread === true,
        cursor: -1,
        pageSize: 20,
        searchDirection: 'up',
      });
      messages = result.messages || [];
      historyMessageCursor.value = result.cursor ?? '';

      isMoreHistoryMsg.value = !!result.hasMore;
      setTimeout(() => {
        scrollMessageList('bottom');
      }, 500);
    } else {
      if (historyMessageCursor.value === '') return [];

      const result = await store.dispatch('getHistoryMessage', {
        ...routeQueryData.value,
        isChatThread: routeQueryData.value.isChatThread === true,
        cursor: historyMessageCursor.value,
        pageSize: 20,
        searchDirection: 'up',
      });
      messages = result.messages || [];
      historyMessageCursor.value = result.cursor ?? '';

      isMoreHistoryMsg.value = !!result.hasMore;
      scrollMessageList('normal');
    }

    return messages;
  } catch (error) {
    console.error('获取历史消息失败:', error);
    isMoreHistoryMsg.value = false;
    return [];
  } finally {
    loadingHistoryMsg.value = false;
    notScrollBottom.value = false;
  }
};
//获取其id对应的消息内容
const messageData = computed(() => {
  // 只返回本地缓存的消息列表，异步获取通过watch处理
  if (loginState.value && routeQueryData.value.id) {
    return store.state.Message.messageList[routeQueryData.value.id] || [];
  }
  return [];
});

// 监听路由变化，当切换到新的聊天会话时获取历史消息
watch(
  () => routeQueryData.value,
  async (newRouteQuery, oldRouteQuery) => {
    if (loginState.value && newRouteQuery.id && newRouteQuery.chatType) {
      // 只有当会话ID变化或者是首次加载时才获取历史消息
      // 首次加载时oldRouteQuery是undefined，需要特殊处理
      if (
        !oldRouteQuery ||
        !oldRouteQuery.id ||
        newRouteQuery.id !== oldRouteQuery.id
      ) {
        historyMessageCursor.value = -1;
        isMoreHistoryMsg.value = true;
        await fechHistoryMessage('fistLoad');
        markConversationReadIfNeeded();
      }
    }
  },
  { immediate: true, deep: true },
);

const messageContainer = ref(null);
//控制消息滚动
const scrollMessageList = (direction) => {
  //direction滚动方向 bottom向下滚动 normal向上滚动
  nextTick(() => {
    const messageNodeList = document.querySelectorAll('.messageList_box');
    const fistMsgElement = messageNodeList[0];
    const lastMsgElement = messageNodeList[messageNodeList.length - 1];
    //直接滚动置底
    if (direction === 'bottom') {
      lastMsgElement && lastMsgElement.scrollIntoView(false);
    }
    //保持当前的消息位于当前可视窗口
    if (direction === 'normal') {
      fistMsgElement.scrollIntoView(true);
    }
  });
};

// 合并消息滚动监听，减少不必要的组件更新
watch(
  () => messageData.value.length,
  (newLength, oldLength) => {
    const isLoadingHistory = notScrollBottom.value;
    nextTick(() => {
      // 判断拉取漫游导致的消息变化不需要执行滚动置底
      if (isLoadingHistory) {
        return;
      }
      // 新消息到达或首次加载时滚动到底部
      if (newLength > oldLength || oldLength === undefined) {
        scrollMessageList('bottom');
      }
    });

    const latestMessage = messageData.value[newLength - 1];
    if (
      !isLoadingHistory &&
      oldLength !== undefined &&
      newLength > oldLength &&
      isMessageInCurrentConversation(latestMessage)
    ) {
      markConversationReadIfNeeded({ force: true });
    }
  },
  {
    immediate: true,
  },
);
watch(
  () => route.query,
  () => {
    if (Object.keys(routeQueryData.value).length > 0) {
      nextTick(() => {
        scrollMessageList('bottom');
      });
    }
  },
);

//消息重新编辑
const inputBoxComp = ref(null);
const reEditMessage = (msg) => inputBoxComp.value?.handleEditTextMessage(msg);
//消息引用
const messageQuote = (msg) => inputBoxComp.value?.handleQuoteMessage(msg);
</script>
<template>
  <el-container v-if="loginState" class="app_container">
    <!-- 聊天页头部 -->
    <ChatContainerHeader :routeQueryData="routeQueryData">
      <template v-slot:more>
        <div class="header_actions">
          <el-tooltip
            v-if="isMessageSearchVisible"
            content="服务端消息搜索"
            placement="top"
            :show-after="200"
          >
            <div
              class="more message_search_trigger"
              aria-label="服务端消息搜索"
              @click="showMessageSearchDrawer"
            >
              <el-icon>
                <Search />
              </el-icon>
            </div>
          </el-tooltip>
          <div
            class="more thread_list_trigger"
            v-if="routeQueryData.chatType === CHAT_TYPE.GROUP && !routeQueryData.isChatThread"
            title="子区列表"
            @click="showThreadListDrawer"
          >
            <el-icon>
              <ChatLineSquare />
            </el-icon>
          </div>
          <!-- 群组展示抽屉 -->
          <div
            class="more"
            v-if="routeQueryData.chatType === CHAT_TYPE.GROUP && !routeQueryData.isChatThread"
            @click="handleDrawer"
          >
            <svg
              width="18"
              height="4"
              viewBox="0 0 18 4"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="2" cy="2" r="2" fill="#333333" />
              <circle cx="9" cy="2" r="2" fill="#333333" />
              <circle cx="16" cy="2" r="2" fill="#333333" />
            </svg>
          </div>
          <div
            class="more"
            v-if="routeQueryData.chatType === CHAT_TYPE.SINGLE"
            @click="handleDrawer"
          >
            <svg
              width="18"
              height="4"
              viewBox="0 0 18 4"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="2" cy="2" r="2" fill="#333333" />
              <circle cx="9" cy="2" r="2" fill="#333333" />
              <circle cx="16" cy="2" r="2" fill="#333333" />
            </svg>
          </div>
        </div>
      </template>
    </ChatContainerHeader>
    <!-- 友情提示框 -->
    <div v-if="isShowWarningTips" class="easeim_safe_tips">
      <p>{{ EASEIM_HINT }}</p>
      <p>【防骗提示】{{ randomTips }}</p>
      <p v-show="routeQueryData.chatType === CHAT_TYPE.GROUP">
        {{ WARM_TIP }}
      </p>
      <span class="easeim_close_tips" @click="closeWarningTips">
        <el-icon>
          <Close />
        </el-icon>
      </span>
    </div>
    <!-- 消息内容区域 -->
    <el-main class="chat_message_main">
      <el-scrollbar class="main_container" ref="messageContainer">
        <div class="innerRef">
          <div v-show="isMoreHistoryMsg" class="chat_message_tips">
            <div
              v-show="messageData?.length && messageData[0].type !== 'inform'"
              class="load_more_msg"
            >
              <el-link
                v-show="!loadingHistoryMsg"
                :disabled="!isMoreHistoryMsg"
                underline="never"
                @click="fechHistoryMessage()"
              >
                加载更多
              </el-link>
              <el-link v-show="loadingHistoryMsg" disabled
                >消息加载中...</el-link
              >
            </div>
          </div>
          <ChatMessageListItem
            :routeQueryData="routeQueryData"
            :messageData="messageData"
            @scrollMessageList="scrollMessageList"
            @reEditMessage="reEditMessage"
            @messageQuote="messageQuote"
          />
        </div>
      </el-scrollbar>
    </el-main>
    <!-- 输入框区别 -->
    <el-footer class="chat_message_inputbar">
      <ChatInputBox ref="inputBoxComp" :routeQueryData="routeQueryData" />
    </el-footer>
    <!-- 聊天右侧抽屉 -->
    <el-drawer
      v-model="drawer"
      class="conversation_details_drawer"
      :show-close="false"
      :close-on-click-modal="true"
      :destroy-on-close="true"
      direction="rtl"
      :modal="true"
      size="280px"
    >
      <GroupsDetails
        v-if="routeQueryData.chatType === CHAT_TYPE.GROUP"
        ref="groupsDetailsComponent"
        :groupId="routeQueryData.id"
        @handleDrawer="handleDrawer"
      />
      <SingleChatDetails
        v-else-if="routeQueryData.chatType === CHAT_TYPE.SINGLE"
        :user-id="routeQueryData.id"
        :is-in-black-list="isInBlackList"
        @setRemark="remarkDialogVisible = true"
        @addBlackList="addFriendToBlackList"
        @removeBlackList="removeFriendFromBlackList"
        @openBlackList="openFriendBlackList"
        @clearMessages="clearCurrentConversationMessages"
        @deleteContact="delTheFriend"
      />
    </el-drawer>
    <MessageThreadListDrawer
      v-model="threadListDrawer"
      :group-id="routeQueryData.id"
    />
    <MessageSearchDrawer
      v-model="messageSearchDrawer"
      :route-query-data="routeQueryData"
    />
    
    <!-- 设置好友备注对话框 -->
    <el-dialog
      v-model="remarkDialogVisible"
      title="设置好友备注"
      width="30%"
    >
      <el-input
        v-model="friendRemark"
        placeholder="请输入好友备注（最多100个字符）"
        maxlength="100"
        show-word-limit
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="remarkDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="setFriendRemark">确定</el-button>
        </span>
      </template>
    </el-dialog>
    <el-dialog
      v-model="blackListDialogVisible"
      title="黑名单列表"
      width="360px"
      :destroy-on-close="true"
    >
      <div class="friend_black_list_dialog" v-loading="blackListLoading">
        <div class="friend_black_list_header">
          <span>当前黑名单用户</span>
          <el-button
            link
            type="primary"
            :loading="blackListLoading"
            @click="refreshFriendBlackList"
          >
            刷新
          </el-button>
        </div>
        <el-scrollbar max-height="260px">
          <div v-if="friendBlackList.length > 0" class="friend_black_list">
            <div
              v-for="item in friendBlackList"
              :key="item"
              class="friend_black_list_item"
            >
              <span class="friend_black_list_user">{{ item }}</span>
              <el-button
                link
                type="danger"
                :loading="removingBlackListUserId === item"
                :disabled="blackListLoading"
                @click="removeUserFromFriendBlackList(item)"
              >
                移除
              </el-button>
            </div>
          </div>
          <el-empty v-else :image-size="60" description="暂无黑名单用户" />
        </el-scrollbar>
      </div>
    </el-dialog>
  </el-container>
</template>

<style lang="scss" scoped>
@import './index.scss';
</style>
