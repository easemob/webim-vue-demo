<script setup>
import { ref, watch, nextTick, computed, onMounted } from 'vue';
import _ from 'lodash';
import { getCurrentUserId, requireManager } from '@/IM';
import { CONVERSATION_TYPE } from '@/IM/constant';
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
import {
  setCurrentConversation,
  resetCurrentConversation,
  getCurrentConversation as getSdkCurrentConversation,
} from '@/IM/sdk5/chat';
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
const pinnedMessageListDrawer = ref(false);
const pinnedMessageListLoading = ref(false);
const pinnedMessageListResult = ref(null);
const pinnedMessageListError = ref('');
const showThreadListDrawer = () => {
  threadListDrawer.value = true;
};
const showMessageSearchDrawer = () => {
  messageSearchDrawer.value = true;
};
const pinnedMessageItems = computed(() => pinnedMessageListResult.value?.items || []);
const getPinnedMessagePreview = (item) => {
  const message = item?.message || {};
  const body = message.body || {};
  if (message.type === 'text') return body.content || '';
  if (message.type === 'image') return '[图片]';
  if (message.type === 'video') return '[视频]';
  if (message.type === 'voice') return '[语音]';
  if (message.type === 'file') return `[文件] ${body.filename || ''}`;
  if (message.type === 'location') return `[位置] ${body.address || ''}`;
  if (message.type === 'custom') return `[自定义] ${body.event || ''}`;
  if (message.type === 'cmd') return `[透传] ${body.action || ''}`;
  if (message.type === 'combine') return `[合并] ${body.title || ''}`;
  return `[${message.type || '未知消息'}]`;
};
const fetchPinnedMessageList = async () => {
  const { conversationId, conversationType } = routeQueryData.value || {};
  if (!conversationId || !conversationType) return;
  pinnedMessageListDrawer.value = true;
  pinnedMessageListLoading.value = true;
  pinnedMessageListError.value = '';
  try {
    pinnedMessageListResult.value = await store.dispatch('getPinnedMessageList', {
      conversationId,
      conversationType,
    });
  } catch (error) {
    pinnedMessageListResult.value = null;
    pinnedMessageListError.value = error?.message || '置顶消息列表获取失败';
    console.error('[Pinned Message] getPinnedMessageList UI failed', {
      conversationId,
      conversationType,
      error,
    });
    ElMessage.error(pinnedMessageListError.value);
  } finally {
    pinnedMessageListLoading.value = false;
  }
};
const isMessageSearchVisible = computed(() => {
  return (
    routeQueryData.value.conversationId &&
    !routeQueryData.value.isChatThread &&
    [
      CONVERSATION_TYPE.SINGLE,
      CONVERSATION_TYPE.GROUP,
      CONVERSATION_TYPE.CHATROOM,
    ].includes(
      routeQueryData.value.conversationType,
    )
  );
});
const refreshFriendBlackList = async (context = 'manual') => {
  blackListLoading.value = true;
  try {
    const users = await store.dispatch('fetchBlackList');
    console.log('[Blocklist] getBlocklist response', {
      context,
      userIds: users.map((user) => user.userId),
      users,
    });
    return users;
  } catch (error) {
    console.error('[Blocklist] getBlocklist failed', {
      context,
      error,
    });
    throw error;
  } finally {
    blackListLoading.value = false;
  }
};
const openFriendBlackList = async () => {
  blackListDialogVisible.value = true;
  await refreshFriendBlackList();
};
const normalizeSdk5UserId = (userId) =>
  typeof userId === 'string' ? userId.trim() : '';
const isKnownContactUserId = (userId) => {
  const normalizedUserId = normalizeSdk5UserId(userId);
  if (!normalizedUserId || normalizedUserId === getCurrentUserId()) return false;
  return (
    store.getters.getContactsWithRemarkMap?.has?.(normalizedUserId) ||
    store.getters.getContactsUserInfosMap?.has?.(normalizedUserId) ||
    [...store.state.Contacts.friendBlackList].includes(normalizedUserId)
  );
};
const getPeerUserIdFromSdk5Message = (message) => {
  if (!message) return '';
  const senderUserId = normalizeSdk5UserId(message.sender?.userId);
  if (senderUserId && senderUserId !== getCurrentUserId()) {
    return senderUserId;
  }
  return '';
};
const showSingleChatTargetUserIdMissingReason = (action) => {
  const message =
    singleChatTargetUserIdMissingReason.value ||
    '当前单聊会话缺少 SDK 5.0 用户 ID，不能调用联系人能力';
  const latestMessage = messageData.value[messageData.value.length - 1] || null;
  console.error('[SingleChatDetails] SDK 5.0 target userId missing', {
    action,
    currentUser: getCurrentUserId(),
    conversationId: routeQueryData.value.conversationId,
    conversationType: routeQueryData.value.conversationType,
    conversationLastMessage: getCurrentConversationFromStore()?.lastMessage || null,
    latestMessage,
  });
  ElMessage({
    type: 'error',
    center: true,
    message,
  });
};
const getRequiredSingleChatContactUserId = (action) => {
  const targetId = singleChatTargetUserId.value;
  if (targetId) return targetId;
  showSingleChatTargetUserIdMissingReason(action);
  return '';
};
//删除好友
const delTheFriend = async () => {
  const targetId = getRequiredSingleChatContactUserId('deleteContact');
  if (targetId) {
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
  const targetId = getRequiredSingleChatContactUserId('setRemark');
  if (targetId && friendRemark.value.trim()) {
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
  const targetId = singleChatTargetUserId.value;
  if (!targetId) return false;
  return [...store.state.Contacts.friendBlackList].includes(targetId);
});

//加入好友到黑名单
const addFriendToBlackList = async () => {
  const targetId = getRequiredSingleChatContactUserId('addUsersToBlocklist');
  if (targetId) {
    try {
      const sdkParams = {
        userIds: [targetId],
      };
      console.log('[Blocklist] addUsersToBlocklist request', {
        currentUser: getCurrentUserId(),
        conversationId: routeQueryData.value.conversationId,
        targetId,
        sdkParams,
      });
      const result = await contactManager().addUsersToBlocklist({
        userIds: [targetId],
      });
      console.log('[Blocklist] addUsersToBlocklist response', {
        currentUser: getCurrentUserId(),
        conversationId: routeQueryData.value.conversationId,
        targetId,
        sdkParams,
        succeededUserIds: result.succeeded.map((user) => user.userId),
        failedUserIds: result.failed.map((user) => user.userId),
        result,
      });
      if (!result.succeeded.some((user) => user.userId === targetId)) {
        console.error('[Blocklist] addUsersToBlocklist did not confirm target', {
          currentUser: getCurrentUserId(),
          conversationId: routeQueryData.value.conversationId,
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
      const users = await refreshFriendBlackList('addUsersToBlocklist verification');
      const verified = users.some((user) => user.userId === targetId);
      console.log('[Blocklist] addUsersToBlocklist verification', {
        currentUser: getCurrentUserId(),
        conversationId: routeQueryData.value.conversationId,
        targetId,
        verified,
        userIds: users.map((user) => user.userId),
        users,
      });
      if (!verified) {
        console.error('[Blocklist] addUsersToBlocklist verification did not confirm target', {
          currentUser: getCurrentUserId(),
          conversationId: routeQueryData.value.conversationId,
          targetId,
          result,
          users,
        });
        ElMessage({
          type: 'error',
          center: true,
          message: '添加到黑名单失败：SDK 刷新结果未确认目标用户',
        });
        return;
      }
      ElMessage({ type: 'success', center: true, message: '已成功将该用户添加到黑名单' });
    } catch (error) {
      console.error('[Blocklist] addUsersToBlocklist failed', {
        currentUser: getCurrentUserId(),
        conversationId: routeQueryData.value.conversationId,
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
  const targetId = getRequiredSingleChatContactUserId('removeUserFromBlocklist');
  if (targetId) {
    try {
      await contactManager().removeUserFromBlocklist({
        userIds: [targetId]
      });
      ElMessage({ type: 'success', center: true, message: '已成功将该用户从黑名单中移除' });
      await refreshFriendBlackList();
    } catch (error) {
      ElMessage({ type: 'error', center: true, message: error?.message || '从黑名单中移除失败' });
      console.error('[Blocklist] removeUserFromBlocklist failed', {
        currentUser: getCurrentUserId(),
        conversationId: routeQueryData.value.conversationId,
        targetId,
        error,
      });
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
  if (!routeQueryData.value?.conversationId) return;
  try {
    await ElMessageBox.confirm('确认清空当前聊天记录？', '清空聊天记录', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    });
    store.commit('CLEAR_SOMEONE_MESSAGE', routeQueryData.value.conversationId);
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

const getCurrentConversationFromStore = () => {
  const { conversationId, conversationType } = routeQueryData.value;
  if (!conversationId) return null;
  const list = store.state.Conversation.conversationFromMethod
    ? store.state.Conversation.conversationListFromLocal
    : store.state.Conversation.conversationListFromServer;
  return list.find(
    (item) =>
      item.conversationId === conversationId &&
      item.conversationType === conversationType,
  ) || null;
};

const sdkCurrentConversation = ref(null);
const sdkCurrentConversationError = ref('');

const readSdkCurrentConversation = (context) => {
  try {
    const current = getSdkCurrentConversation();
    sdkCurrentConversation.value = current;
    return current;
  } catch (error) {
    sdkCurrentConversation.value = null;
    sdkCurrentConversationError.value =
      error?.message || 'getCurrentConversation failed';
    console.error('[Current Conversation] getCurrentConversation failed', {
      context,
      error,
    });
    return null;
  }
};

const clearSdkCurrentConversation = (reason) => {
  if (!loginState.value) return;
  try {
    resetCurrentConversation();
    const current = readSdkCurrentConversation('reset-current-conversation');
    sdkCurrentConversationError.value = '';
    console.log('[Current Conversation] resetCurrentConversation success', {
      reason,
      sdkCurrentConversation: current,
    });
  } catch (error) {
    sdkCurrentConversationError.value =
      error?.message || 'resetCurrentConversation failed';
    console.error('[Current Conversation] resetCurrentConversation failed', {
      reason,
      error,
    });
    readSdkCurrentConversation('reset-current-conversation-failed');
  }
};

const syncSdkCurrentConversation = (reason) => {
  if (!loginState.value) return;
  const { conversationId, conversationType, isChatThread } =
    routeQueryData.value || {};
  if (!conversationId || !conversationType || isChatThread) {
    clearSdkCurrentConversation(
      isChatThread ? 'chat-thread-not-current-conversation' : reason,
    );
    return;
  }

  const params = {
    conversationId,
    conversationType,
  };
  try {
    setCurrentConversation(params);
    const current = readSdkCurrentConversation('set-current-conversation');
    sdkCurrentConversationError.value = '';
    console.log('[Current Conversation] setCurrentConversation success', {
      reason,
      request: params,
      sdkCurrentConversation: current,
    });
  } catch (error) {
    sdkCurrentConversationError.value =
      error?.message || 'setCurrentConversation failed';
    console.error('[Current Conversation] setCurrentConversation failed', {
      reason,
      request: params,
      error,
    });
    readSdkCurrentConversation('set-current-conversation-failed');
  }
};

const canClearConversationUnreadCount = (conversationType) =>
  [
    CONVERSATION_TYPE.SINGLE,
    CONVERSATION_TYPE.GROUP,
  ].includes(conversationType);

const markConversationReadIfNeeded = (options = {}) => {
  const { conversationId, conversationType } = routeQueryData.value;
  if (!conversationId || !conversationType) return;
  if (!canClearConversationUnreadCount(conversationType)) return;

  const conversation = getCurrentConversationFromStore();
  if (!options.force && (!conversation || conversation.unreadCount <= 0)) {
    return;
  }

  store.dispatch('clearConversationUnreadCount', {
    conversationId,
    conversationType,
  });
};

const isMessageInCurrentConversation = (message) => {
  if (!message || !routeQueryData.value.conversationId) return false;
  return (
    message.conversationId === routeQueryData.value.conversationId &&
    message.conversationType === routeQueryData.value.conversationType &&
    message.sender?.userId !== getCurrentUserId()
  );
};

/* warterMark */
onMounted(() => {
  const chatContainer = document.querySelector('.chat_message_main');
  chatContainer && waterMark({ container: chatContainer });
});

// 离开该路由销毁路由监听。
onBeforeRouteLeave(() => {
  clearSdkCurrentConversation('route-leave');
  stopWatchRoute();
});
const closeWarningTips = () => store.commit('CLOSE_WARNING_TIPS');
/* userInfo */
const routeQueryData = ref({
  conversationId: '',
  conversationType: CONVERSATION_TYPE.SINGLE,
  isChatThread: false,
  parentConversationId: '',
  threadName: '',
});
const getRouteQueryWithIdInfo = (data) => {
  const { conversationId, conversationType, parentConversationId, threadName } = data;
  routeQueryData.value = {
    conversationId,
    conversationType,
    isChatThread: data.isChatThread === 'true',
    parentConversationId: parentConversationId || '',
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
  () => getCurrentConversationFromStore()?.unreadCount || 0,
  (unreadCount) => {
    if (unreadCount > 0) {
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
        conversationId: routeQueryData.value.conversationId,
        conversationType: routeQueryData.value.conversationType,
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
        conversationId: routeQueryData.value.conversationId,
        conversationType: routeQueryData.value.conversationType,
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
//获取当前会话的原始 SDK 5.0 消息列表。
const messageData = computed(() => {
  // 只返回本地缓存的消息列表，异步获取通过watch处理
  if (loginState.value && routeQueryData.value.conversationId) {
    return store.state.Message.messageList[routeQueryData.value.conversationId] || [];
  }
  return [];
});
const singleChatTargetUserId = computed(() => {
  if (routeQueryData.value.conversationType !== CONVERSATION_TYPE.SINGLE) {
    return '';
  }
  const conversationId = normalizeSdk5UserId(routeQueryData.value.conversationId);
  if (isKnownContactUserId(conversationId)) {
    return conversationId;
  }
  const peerFromConversation = getPeerUserIdFromSdk5Message(
    getCurrentConversationFromStore()?.lastMessage,
  );
  if (peerFromConversation) {
    return peerFromConversation;
  }
  const messages = [...messageData.value].reverse();
  for (const message of messages) {
    const peerUserId = getPeerUserIdFromSdk5Message(message);
    if (peerUserId) {
      return peerUserId;
    }
  }
  return '';
});
const singleChatTargetUserIdMissingReason = computed(() => {
  if (routeQueryData.value.conversationType !== CONVERSATION_TYPE.SINGLE) {
    return '';
  }
  if (singleChatTargetUserId.value) {
    return '';
  }
  return '当前 SDK 5.0 单聊会话只提供了 conversationId，未提供可用于 ContactManager 的用户 ID，已停止调用联系人黑名单/备注/删除接口';
});

// 监听路由变化，当切换到新的聊天会话时获取历史消息
watch(
  () => routeQueryData.value,
  async (newRouteQuery, oldRouteQuery) => {
    if (
      loginState.value &&
      newRouteQuery.conversationId &&
      newRouteQuery.conversationType
    ) {
      const isConversationChanged =
        !oldRouteQuery ||
        newRouteQuery.conversationId !== oldRouteQuery.conversationId ||
        newRouteQuery.conversationType !== oldRouteQuery.conversationType ||
        newRouteQuery.isChatThread !== oldRouteQuery.isChatThread;

      if (isConversationChanged) {
        if (oldRouteQuery?.conversationId) {
          clearSdkCurrentConversation('conversation-switch');
        }
        syncSdkCurrentConversation('conversation-enter');
      }

      // 只有当会话ID变化或者是首次加载时才获取历史消息
      // 首次加载时oldRouteQuery是undefined，需要特殊处理
      if (
        !oldRouteQuery ||
        !oldRouteQuery.conversationId ||
        newRouteQuery.conversationId !== oldRouteQuery.conversationId
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
const reEditMessage = (content) =>
  inputBoxComp.value?.handleEditTextMessage(content);
//消息引用
const onQuoteMessage = (message) =>
  inputBoxComp.value?.handleQuoteMessage(message);
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
          <el-tooltip
            content="置顶消息列表"
            placement="top"
            :show-after="200"
          >
            <div
              class="more pinned_message_list_trigger"
              aria-label="置顶消息列表"
              @click="fetchPinnedMessageList"
            >
              置顶
            </div>
          </el-tooltip>
          <div
            class="more thread_list_trigger"
            v-if="routeQueryData.conversationType === CONVERSATION_TYPE.GROUP && !routeQueryData.isChatThread"
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
            v-if="routeQueryData.conversationType === CONVERSATION_TYPE.GROUP && !routeQueryData.isChatThread"
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
            v-if="routeQueryData.conversationType === CONVERSATION_TYPE.SINGLE"
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
      <p v-show="routeQueryData.conversationType === CONVERSATION_TYPE.GROUP">
        {{ WARM_TIP }}
      </p>
      <span class="easeim_close_tips" @click="closeWarningTips">
        <el-icon>
          <Close />
        </el-icon>
      </span>
    </div>
    <div
      v-if="routeQueryData.conversationId"
      class="sdk_current_conversation_context"
      :class="{ 'is-error': sdkCurrentConversationError }"
    >
      <span class="sdk_current_conversation_label">SDK 当前会话：</span>
      <template v-if="sdkCurrentConversation">
        <span>{{ sdkCurrentConversation.conversationType }}</span>
        <span>/</span>
        <span>{{ sdkCurrentConversation.conversationId }}</span>
      </template>
      <template v-else>
        <span>
          {{ sdkCurrentConversationError || 'SDK 返回 null' }}
        </span>
      </template>
    </div>
    <!-- 消息内容区域 -->
    <el-main class="chat_message_main">
      <el-scrollbar class="main_container" ref="messageContainer">
        <div class="innerRef">
          <div v-show="isMoreHistoryMsg" class="chat_message_tips">
            <div
              v-show="messageData?.length"
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
            @quoteMessage="onQuoteMessage"
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
        v-if="routeQueryData.conversationType === CONVERSATION_TYPE.GROUP"
        ref="groupsDetailsComponent"
        :groupId="routeQueryData.conversationId"
        @handleDrawer="handleDrawer"
      />
      <SingleChatDetails
        v-else-if="routeQueryData.conversationType === CONVERSATION_TYPE.SINGLE"
        :user-id="singleChatTargetUserId"
        :conversation-id="routeQueryData.conversationId"
        :contact-unavailable-reason="singleChatTargetUserIdMissingReason"
        :is-in-black-list="isInBlackList"
        @setRemark="remarkDialogVisible = true"
        @addBlackList="addFriendToBlackList"
        @removeBlackList="removeFriendFromBlackList"
        @openBlackList="openFriendBlackList"
        @clearMessages="clearCurrentConversationMessages"
        @deleteContact="delTheFriend"
        @contactActionUnavailable="showSingleChatTargetUserIdMissingReason"
      />
    </el-drawer>
    <MessageThreadListDrawer
      v-model="threadListDrawer"
      :group-id="routeQueryData.conversationId"
    />
    <MessageSearchDrawer
      v-model="messageSearchDrawer"
      :route-query-data="routeQueryData"
    />
    <el-drawer
      v-model="pinnedMessageListDrawer"
      title="置顶消息列表"
      size="360px"
      direction="rtl"
      :destroy-on-close="false"
    >
      <div class="pinned_message_list_drawer" v-loading="pinnedMessageListLoading">
        <div class="pinned_message_list_header">
          <span>
            {{ routeQueryData.conversationType }} / {{ routeQueryData.conversationId }}
          </span>
          <el-button
            link
            type="primary"
            :loading="pinnedMessageListLoading"
            @click="fetchPinnedMessageList"
          >
            刷新
          </el-button>
        </div>
        <p v-if="pinnedMessageListError" class="pinned_message_list_error">
          {{ pinnedMessageListError }}
        </p>
        <template v-else-if="pinnedMessageItems.length > 0">
          <div
            v-for="item in pinnedMessageItems"
            :key="item.messageId"
            class="pinned_message_item"
          >
            <div class="pinned_message_item_title">
              {{ getPinnedMessagePreview(item) }}
            </div>
            <div class="pinned_message_item_meta">
              <span>messageId: {{ item.messageId }}</span>
              <span>operatorId: {{ item.operatorId || 'SDK 未返回' }}</span>
              <span>pinnedAt: {{ item.pinnedAt }}</span>
            </div>
            <pre>{{ JSON.stringify(item, null, 2) }}</pre>
          </div>
        </template>
        <el-empty
          v-else
          :image-size="80"
          description="SDK 返回置顶消息为空"
        />
      </div>
    </el-drawer>
    
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
