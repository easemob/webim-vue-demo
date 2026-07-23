<script setup>
import {
  reactive,
  ref,
  computed,
  toRefs,
  nextTick,
  onMounted,
  onUnmounted,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import { useClipboard, usePermission } from '@vueuse/core';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCurrentUserId, requireManager } from '@/IM';
import { CHAT_TYPE, MESSAGE_TYPE } from '@/IM/constant';
import { CUSTOM_MSG_EVENT_TYPE, MESSAGE_STATUS_TYPE } from '@/constant';
import { useGetUserMapInfo } from '@/hooks';
import BenzAMRRecorder from 'benz-amr-recorder';
import fileSizeFormat from '@/utils/fileSizeFormat';
import dateFormat from '@/utils/dateFormater';
import { CUSTOM_MESSAGE_TYPE } from '@/constant';
import { handleSDKErrorNotifi } from '@/utils/handleSomeData';
import {
  getStreamStatusDetailText,
  getStreamStatusText,
  isStreamMessage,
} from '@/utils/streamMessageSupport';
import { getThreadIdFromResponse } from '@/utils/messageThread';
import router from '@/router';
/* utils */
import paseLink from '@/utils/paseLink';
/* 默认头像 */
import defaultAvatar from '@/assets/images/avatar/theme2x.png';
import ReportMessage from '../suit/reportMessage.vue';
import messageReadedIcon from '@/assets/messages/read@3x.png';
/* components */
import ModifyMessage from '../suit/modifyMessage.vue';
/* vuex store */
const store = useStore();
/* props */
const props = defineProps({
  messageData: {
    type: [Array, Object],
    default: () => [],
  },
  routeQueryData: {
    type: Object,
    default: () => ({
      id: '',
      chatType: CHAT_TYPE.SINGLE,
    }),
    required: true,
  },
});
const { routeQueryData } = toRefs(props);
/* emits */
const emit = defineEmits([
  'scrollMessageList',
  'reEditMessage',
  'messageQuote',
]);
const REACTION_PRESETS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

const currentConversation = computed(() => {
  const conversationId = routeQueryData.value?.id;
  if (!conversationId) return null;
  const conversationList =
    store.state.Conversation?.conversationListFromServer || [];
  return (
    conversationList.find(
      (conversation) => conversation.conversationId === conversationId,
    ) || null
  );
});

const hasConversationRecallPermission = computed(() => {
  const conversation = currentConversation.value;
  return !!(conversation?.isOwner || conversation?.isAdmin);
});

const INTERNAL_EXT_KEYS = [
  'msgQuote',
  'ease_chat_uikit_user_info',
  'ease_chat_uikit_directed_message',
  'ease_chat_uikit_receiver_list',
];

const getDisplayableExt = (ext) => {
  if (!ext || typeof ext !== 'object' || Array.isArray(ext)) return null;
  const displayable = Object.keys(ext).reduce((result, key) => {
    if (!INTERNAL_EXT_KEYS.includes(key)) {
      result[key] = ext[key];
    }
    return result;
  }, {});
  return Object.keys(displayable).length ? displayable : null;
};

// 组件挂载状态标志
const isMounted = ref(true);

// 预处理消息数据，添加计算属性到每个消息对象
// 避免在模板中频繁调用函数
const processedMessageData = computed(() => {
  let rawData;
  if (Array.isArray(props.messageData)) {
    rawData = props.messageData;
  } else if (props.messageData && typeof props.messageData === 'object') {
    rawData = [props.messageData];
  } else {
    rawData = [];
  }

  // 过滤掉null/undefined项
  const filtered = rawData.filter((item) => item != null);

  // 优化：避免不必要的对象创建，只在需要时创建新对象
  return filtered.map((msgBody, index) => {
    // 检查消息对象是否已经被处理过
    if (msgBody._isMyself !== undefined) {
      return msgBody;
    }

    // 创建一个新对象，避免修改原始数据
    // 使用Object.assign确保正确复制所有属性
    const processed = Object.assign({}, msgBody);

    if (!processed.chatType) {
      console.error('[Message Render] 消息缺少 chatType，按服务端原始结果展示，未默认成 singleChat', {
        index,
        messageId: processed.id || processed.mid,
        from: processed.from,
        to: processed.to,
        rawMessage: msgBody,
      });
    }

    // 确保展示层基础字段存在，避免异常数据导致页面崩溃
    processed.id = processed.id || `missing_id_${index}`;
    processed.from = processed.from || '';
    processed.to = processed.to || '';
    processed.time = processed.time || Date.now();
    processed.type = processed.type || MESSAGE_TYPE.TEXT;
    processed.isRecall = processed.isRecall || false;

    // 确保消息内容和扩展属性存在
    processed.msg = processed.msg || '';
    processed.ext = processed.ext || {};
    processed.ext.msgQuote = processed.ext.msgQuote || null;

    // 确保自定义消息属性存在
    if (processed.type === MESSAGE_TYPE.CUSTOM) {
      processed.customEvent = processed.customEvent || '';
      processed.customExts = processed.customExts || {};
    }

    // 确保文件消息属性存在
    if (processed.type === MESSAGE_TYPE.FILE) {
      processed.filename = processed.filename || 'unknown_file';
      processed.file_length = processed.file_length || 0;
      processed.url = processed.url || '';
    }

    // 确保图片消息属性存在
    if (processed.type === MESSAGE_TYPE.IMAGE) {
      processed.thumb = processed.thumb || '';
      processed.url = processed.url || '';
    }

    // 确保音频消息属性存在
    if (processed.type === MESSAGE_TYPE.AUDIO) {
      processed.length = processed.length || 0;
      processed.url = processed.url || '';
    }

    // 确保视频消息属性存在
    if (processed.type === MESSAGE_TYPE.VIDEO) {
      processed.thumb = processed.thumb || '';
      processed.url = processed.url || '';
    }

    // 预先计算常用属性
    processed._isMyself = processed.from === loginUserId;

    // 安全计算是否可以撤回消息
    let canRecall = processed._isMyself;
    if (!canRecall && processed.chatType !== CHAT_TYPE.SINGLE) {
      canRecall = hasConversationRecallPermission.value;
    }
    processed._canRecall = canRecall;

    // 计算时间显示（但不在此处缓存，因为依赖于前后消息）
    processed._timeShow = null;

    return processed;
  });
});

// 确保messageData始终作为数组处理，并过滤掉null/undefined项
// 使用缓存避免不必要的数组创建
const messageDataArray = computed(() => {
  return processedMessageData.value;
});

// 会话维度 key：切换会话时整块替换列表 DOM，避免 patch 时 parentNode 为 null
const messageListKey = computed(
  () =>
    `msg-list-${routeQueryData.value?.id ?? ''}-${routeQueryData.value?.chatType ?? ''}`,
);

// 组件挂载和卸载处理
onMounted(() => {
  isMounted.value = true;
});

/* login hxId */
const loginUserId = getCurrentUserId();

/* 消息来源是否为自己 */
const isMyself = (msgBody) => {
  return msgBody.from === loginUserId;
};

/* 是否有撤回权限 */
const canRecallMessage = (msgBody) => {
  if (isMyself(msgBody)) return true;
  if (msgBody.chatType === CHAT_TYPE.SINGLE) return false;
  return hasConversationRecallPermission.value;
};
/* 获取消息id集合 */
// 使用缓存避免重复获取getter
const messageIdsCollection = computed(() => {
  try {
    // 获取稳定的引用
    const map = store.getters.getMessageIdsCollectionMap;
    // 如果map是稳定的对象，直接返回
    if (map && typeof map === 'object') {
      return map;
    }
  } catch (error) {
    console.error('获取消息ID集合失败:', error);
  }
  return {};
});

/* 获取当前会话的消息id集合 */
// 缓存当前会话ID，避免不必要的计算
const currentSessionId = ref('');
const currentMessageIds = ref(null);

// 监听路由变化，更新当前会话的消息ID集合
watch(
  () => routeQueryData.value.id,
  (newId) => {
    if (newId) {
      currentSessionId.value = newId;
      currentMessageIds.value = messageIdsCollection.value[newId] || null;
    } else {
      currentSessionId.value = '';
      currentMessageIds.value = null;
    }
  },
  { immediate: true },
);

// 监听messageIdsCollection变化，更新当前会话的消息ID集合
watch(
  () => messageIdsCollection.value,
  (newMap) => {
    if (currentSessionId.value) {
      currentMessageIds.value = newMap[currentSessionId.value] || null;
    }
  },
  { deep: true },
);

/* 消息已读未读逻辑 */
//判断消息已读未读状态
const msgReadStatus = (msgBody) => {
  const { id } = msgBody;
  if (currentMessageIds.value && currentMessageIds.value.has(id)) {
    return currentMessageIds.value.get(id)[MESSAGE_STATUS_TYPE.READ_STATUS];
  }
  return false;
};
/* 文本中是否包含link */
const isLink = (msg) => {
  return paseLink(msg).isLink;
};
/* 获取自己的用户信息 */
const loginUserInfo = computed(() => store.state.loginUserInfo);

/* 获取他人的用户信息 */
const { getUserDisplayNameById, getUserDisplayAvatarById } =
  useGetUserMapInfo();
//处理他人头像展示
const handleOtherAvatar = (msgBody) => {
  return getUserDisplayAvatarById(msgBody.from);
};
//处理聊天对方昵称展示
const handleNickName = (msgBody) => {
  const { chatType, id: groupId } = routeQueryData.value;
  const userId = msgBody.from;
  if (chatType === CHAT_TYPE.SINGLE) {
    return getUserDisplayNameById(userId);
  }
  if (chatType === CHAT_TYPE.GROUP) {
    return getUserDisplayNameById(userId, groupId);
  }
};
/* 处理时间显示间隔 */
// 使用缓存避免重复计算
const timeShowCache = ref(new Map());

const handleMsgTimeShow = (time, index) => {
  // 使用时间戳和索引作为缓存键
  const cacheKey = `${time}-${index}`;

  // 如果缓存中存在，直接返回
  if (timeShowCache.value.has(cacheKey)) {
    return timeShowCache.value.get(cacheKey);
  }

  // 计算时间显示
  let result;
  if (index !== 0 && index < messageDataArray.value.length) {
    const lastTime = messageDataArray.value[index - 1].time;
    result = time - lastTime > 50000 ? dateFormat('MM/DD/HH:mm', time) : false;
  } else {
    result = dateFormat('MM/DD/HH:mm', time);
  }

  // 缓存结果
  timeShowCache.value.set(cacheKey, result);
  return result;
};

// 监听messageDataArray变化，清理时间显示缓存
watch(
  () => messageDataArray.value.length,
  () => {
    timeShowCache.value.clear();
  },
);
//音频播放状态
const audioPlayStatus = reactive({
  isPlaying: false, //是否在播放中
  playMsgId: '', //在播放的音频消息id,
});
// 保存所有音频实例，用于组件销毁时清理
const audioInstances = ref([]);

//开始播放
const startplayAudio = (msgBody) => {
  const armRec = new BenzAMRRecorder();
  audioInstances.value.push(armRec);

  const src = msgBody.url;
  audioPlayStatus.playMsgId = msgBody.id;

  //初始化音频源并调用播放
  armRec
    .initWithUrl(src)
    .then(() => {
      if (isMounted.value && !audioPlayStatus.isPlaying) {
        armRec.play();
      }
    })
    .catch((error) => {
      // 处理音频解码失败错误
      console.error('音频解码失败:', error);
      audioPlayStatus.playMsgId = '';
      audioPlayStatus.isPlaying = false;
      ElMessage.error('音频解码失败，请检查音频文件格式');
    });
  //播放开始监听
  if (armRec.onPlay) {
    armRec.onPlay(() => {
      if (isMounted.value) {
        audioPlayStatus.isPlaying = true;
        audioPlayStatus.playMsgId = msgBody.id;
      }
    });
  }
  //播放结束监听
  if (armRec.onStop) {
    armRec.onStop(() => {
      if (isMounted.value) {
        audioPlayStatus.isPlaying = false;
        audioPlayStatus.playMsgId = '';
      }
    });
  }
  // 注意：BenzAMRRecorder不支持onError方法，错误通过Promise的catch处理
};

// 组件销毁时清理所有资源
onUnmounted(() => {
  // 设置组件为未挂载状态
  isMounted.value = false;

  // 停止所有音频播放
  audioInstances.value.forEach((armRec) => {
    if (armRec.stop) {
      armRec.stop();
    }
    // 移除所有音频事件监听器
    if (armRec.offPlay) armRec.offPlay();
    if (armRec.offStop) armRec.offStop();
    if (armRec.offError) armRec.offError();
  });
  audioInstances.value = [];

  // 清理引用消息定时器
  if (quoteMsgTimer.value) {
    clearTimeout(quoteMsgTimer.value);
    quoteMsgTimer.value = null;
  }

  // 清理时间显示缓存
  timeShowCache.value.clear();

  // 清理当前会话ID和消息ID集合
  currentSessionId.value = '';
  currentMessageIds.value = null;

  // 清理其他可能的定时器
  clearTimeout(window.__chatMessageTimer__);

  // 移除所有可能的DOM事件监听器
  const messageBoxes = document.querySelectorAll('.messageList_box');
  messageBoxes.forEach((box) => {
    box.removeEventListener('click', startplayAudio);
    // 移除其他可能的事件监听器
  });
});

//复制文本
// const permissionRead = usePermission('clipboard-read') //请求剪切板读的权限
// const permissionWrite = usePermission('clipboard-write') //请求剪切板写的权限
const { copy, copied, isSupported } = useClipboard(); //copy 复制方法 copied 是否已经复制 isSupported 是否支持剪切板
const copyTextMessages = (msg) => {
  copy(msg);
  if (copied) {
    ElMessage({
      type: 'success',
      message: '成功复制到剪切板',
      center: true,
    });
  }
};

//引用消息
const clickQuoteMsgId = ref('');
const quoteMsgTimer = ref(null);
const clickQuoteMessage = (msgQuote) => {
  const { msgID } = msgQuote;
  nextTick(() => {
    const messageQuery = document.querySelectorAll('.messageList_box');
    const filterQuoteMsg =
      messageQuery.length &&
      Array.from(messageQuery).filter((node) => msgID === node.dataset.mid);
    if (filterQuoteMsg.length) {
      filterQuoteMsg[0].scrollIntoView();
      clickQuoteMsgId.value = msgID;
      // 清理之前的定时器
      if (quoteMsgTimer.value) {
        clearTimeout(quoteMsgTimer.value);
      }
      // 设置新的定时器
      quoteMsgTimer.value = setTimeout(() => {
        clickQuoteMsgId.value = '';
      }, 1000);
    } else {
      ElMessage({
        type: 'error',
        message: '无法定位到原消息',
        center: true,
      });
    }
  });
};

//撤回消息
const recallMessage = async ({ id, to, chatType }) => {
  const options = {
    mid: id,
    to: routeQueryData.value.isChatThread === true ? routeQueryData.value.id : to,
    chatType: chatType,
    isChatThread: routeQueryData.value.isChatThread === true,
  };
  try {
    await store.dispatch('recallMessage', options);
  } catch (error) {
    handleSDKErrorNotifi(error.type, error.message);
  }
};
//编辑消息
const modifyMessageRef = ref(null);
const showModifyMsgModal = (msgBody) => {
  nextTick(() => {
    modifyMessageRef.value.initModifyMessage({
      ...msgBody,
      to:
        routeQueryData.value.isChatThread === true
          ? routeQueryData.value.id
          : msgBody.to,
      isChatThread: routeQueryData.value.isChatThread === true,
      groupId: routeQueryData.value.groupId || msgBody.groupId || '',
    });
  });
};
//删除消息
const deleteMessage = async (msgBody) => {
  try {
    await ElMessageBox.confirm(
      '消息删除是从服务端删除，确认要删除吗？',
      '消息删除',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
    await store.dispatch('removeMessage', { ...msgBody });
    ElMessage({
      type: 'success',
      message: '消息已删除',
      center: true,
    });
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage({
        type: 'error',
        message: '删除失败',
        center: true,
      });
    }
  }
};
// 消息举报
const reportMessage = ref(null);
//举报消息
const informOnMessage = (msgBody) => {
  reportMessage.value.alertReportMsgModal(msgBody);
};
const getMessagePinConversationId = (msgBody) => {
  if (msgBody.chatType === CHAT_TYPE.SINGLE) return msgBody.from;
  if (routeQueryData.value.isChatThread === true) {
    return (
      routeQueryData.value.groupId ||
      msgBody.groupId ||
      msgBody.chatThread?.parentId ||
      ''
    );
  }
  return msgBody.to;
};
// 消息置顶
const pinMessage = async (msgBody) => {
  try {
    const options = {
      conversationType: msgBody.chatType,
      conversationId: getMessagePinConversationId(msgBody),
      messageId: msgBody.id
    };
    await requireManager('chatManager').pinMessage(options);
    ElMessage({
      type: 'success',
      message: '置顶消息成功',
      center: true,
    });
  } catch (error) {
    console.error('置顶消息失败:', error);
    ElMessage({
      type: 'error',
      message: `置顶失败：${error.message || '请稍后重试'}`,
      center: true,
    });
  }
};
// 取消消息置顶
const unpinMessage = async (msgBody) => {
  try {
    const options = {
      conversationType: msgBody.chatType,
      conversationId: getMessagePinConversationId(msgBody),
      messageId: msgBody.id
    };
    await requireManager('chatManager').unpinMessage(options);
    ElMessage({
      type: 'success',
      message: '取消置顶消息成功',
      center: true,
    });
  } catch (error) {
    console.error('取消置顶消息失败:', error);
    ElMessage({
      type: 'error',
      message: `取消置顶失败：${error.message || '请稍后重试'}`,
      center: true,
    });
  }
};
//父组件重新编辑方法
const reEdit = (msg) => {
  if (isMounted.value) {
    emit('reEditMessage', msg);
  }
};
//调用父组件引用消息
const onMsgQuote = (msg) => {
  if (isMounted.value) {
    emit('messageQuote', msg);
  }
};
const reactionLoadingMap = ref({});
const messageListConversationKey = computed(() => routeQueryData.value.id || '');
const getMessageReactions = (msgBody) => {
  return Array.isArray(msgBody?.reactions) ? msgBody.reactions : [];
};
const canUseReaction = (msgBody) => {
  return (
    !!msgBody?.id &&
    !msgBody.isRecall &&
    routeQueryData.value.chatType !== CHAT_TYPE.CHATROOM
  );
};
const getMessageThreadParentMessageId = (msgBody) => {
  return msgBody?.mid || msgBody?.id || '';
};
const describeThreadError = (error) => {
  if (!error) return null;
  return {
    message: error.message || '',
    type: error.type || '',
    code: error.code || error.status || '',
    name: error.name || '',
  };
};
const getCreatedThreadId = (response) => getThreadIdFromResponse(response);
const canCreateMessageThread = (msgBody) => {
  return (
    !!getMessageThreadParentMessageId(msgBody) &&
    !msgBody.isRecall &&
    routeQueryData.value.chatType === CHAT_TYPE.GROUP &&
    !!routeQueryData.value.id
  );
};
const createMessageThreadLoading = ref(false);
const createMessageThread = async (msgBody) => {
  if (!canCreateMessageThread(msgBody)) return;
  const messageId = getMessageThreadParentMessageId(msgBody);
  try {
    const { value: threadName } = await ElMessageBox.prompt(
      '请输入消息话题名称',
      '创建消息话题',
      {
        confirmButtonText: '创建',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '话题名称不能为空',
      },
    );
    const name = String(threadName || '').trim();
    if (!name) return;
    createMessageThreadLoading.value = true;
    const response = await store.dispatch('createMessageThread', {
      parentId: routeQueryData.value.id,
      name,
      messageId: getMessageThreadParentMessageId(msgBody),
    });
    const chatThreadId = getCreatedThreadId(response);
    if (!chatThreadId) {
      throw new Error('createChatThread 响应缺少 chatThreadId');
    }
    ElMessage({
      type: 'success',
      message: `消息话题创建成功：${chatThreadId || name}`,
      center: true,
    });
    router.push({
      path: '/chat/conversation/message',
      query: {
        id: getCreatedThreadId(response),
        chatType: CHAT_TYPE.GROUP,
        isChatThread: 'true',
        groupId: routeQueryData.value.id,
        threadName: name,
      },
    });
  } catch (error) {
    if (error === 'cancel') return;
    console.error('[Thread] createMessageThread UI failed', {
      parentId: routeQueryData.value.id,
      messageId,
      localMessageId: msgBody?.id,
      serverMessageId: msgBody?.mid,
      errorSummary: describeThreadError(error),
      error,
    });
    handleSDKErrorNotifi(error?.type, error?.message || '消息话题创建失败');
  } finally {
    createMessageThreadLoading.value = false;
  }
};
const getExistingReactionItem = (msgBody, reaction) => {
  return getMessageReactions(msgBody).find((item) => item.reaction === reaction);
};
const setReactionLoading = (messageId, reaction, loading) => {
  const key = `${messageId}_${reaction}`;
  reactionLoadingMap.value = {
    ...reactionLoadingMap.value,
    [key]: loading,
  };
};
const isReactionLoading = (messageId, reaction) => {
  return !!reactionLoadingMap.value[`${messageId}_${reaction}`];
};
const addReactionToMessage = async (msgBody, reaction) => {
  if (!canUseReaction(msgBody) || !reaction) return;
  const existingReaction = getExistingReactionItem(msgBody, reaction);
  if (existingReaction?.isAddedBySelf) {
    await removeReactionFromMessage(msgBody, reaction);
    return;
  }
  setReactionLoading(msgBody.id, reaction, true);
  try {
    await store.dispatch('addMessageReaction', {
      key: messageListConversationKey.value,
      messageId: msgBody.id,
      reaction,
      chatType: routeQueryData.value.chatType,
      groupId:
        routeQueryData.value.chatType === CHAT_TYPE.GROUP
          ? routeQueryData.value.id
          : undefined,
    });
  } catch (error) {
    console.error('[Reaction] addMessageReaction 失败', error);
    handleSDKErrorNotifi(error?.type, error?.message || 'Reaction 添加失败');
  } finally {
    setReactionLoading(msgBody.id, reaction, false);
  }
};
const removeReactionFromMessage = async (msgBody, reaction) => {
  if (!canUseReaction(msgBody) || !reaction) return;
  setReactionLoading(msgBody.id, reaction, true);
  try {
    await store.dispatch('deleteMessageReaction', {
      key: messageListConversationKey.value,
      messageId: msgBody.id,
      reaction,
      chatType: routeQueryData.value.chatType,
      groupId:
        routeQueryData.value.chatType === CHAT_TYPE.GROUP
          ? routeQueryData.value.id
          : undefined,
    });
  } catch (error) {
    console.error('[Reaction] deleteMessageReaction 失败', error);
    handleSDKErrorNotifi(error?.type, error?.message || 'Reaction 删除失败');
  } finally {
    setReactionLoading(msgBody.id, reaction, false);
  }
};
const toggleReaction = async (msgBody, reactionItem) => {
  if (!reactionItem?.reaction) return;
  if (reactionItem.isAddedBySelf) {
    await removeReactionFromMessage(msgBody, reactionItem.reaction);
    return;
  }
  await addReactionToMessage(msgBody, reactionItem.reaction);
};
const reactionDetailDialogVisible = ref(false);
const reactionDetailLoading = ref(false);
const reactionDetailMsgBody = ref(null);
const selectedReactionDetail = ref('');
const reactionDetailUsers = ref([]);
const openReactionDetailDialog = async (msgBody) => {
  if (!canUseReaction(msgBody)) return;
  reactionDetailMsgBody.value = msgBody;
  reactionDetailDialogVisible.value = true;
  const reactions = getMessageReactions(msgBody);
  if (reactions.length > 0) {
    await loadReactionDetail(msgBody, reactions[0].reaction);
  } else {
    selectedReactionDetail.value = '';
    reactionDetailUsers.value = [];
  }
};
const loadReactionDetail = async (msgBody, reaction) => {
  if (!canUseReaction(msgBody) || !reaction) return;
  reactionDetailLoading.value = true;
  selectedReactionDetail.value = reaction;
  try {
    const res = await store.dispatch('fetchMessageReactionDetail', {
      messageId: msgBody.id,
      reaction,
      cursor: null,
      pageSize: 100,
    });
    const data = res?.data || {};
    reactionDetailUsers.value = Array.isArray(data?.userList)
      ? data.userList
      : Array.isArray(data?.users)
        ? data.users
        : [];
  } catch (error) {
    reactionDetailUsers.value = [];
    handleSDKErrorNotifi(
      error?.type,
      error?.message || 'Reaction 详情获取失败',
    );
  } finally {
    reactionDetailLoading.value = false;
  }
};
const getReactionUserName = (userId) => {
  return getUserDisplayNameById(userId) || userId;
};
const getReactionUserAvatar = (userId) => {
  return getUserDisplayAvatarById(userId) || defaultAvatar;
};
</script>
<template>
  <div>
    <div :key="messageListKey">
      <div
        v-for="(msgBody, index) in messageDataArray"
        :key="msgBody.id || `msg_${String(msgBody.time ?? '')}_${msgBody.from ?? ''}_${index}`"
        class="messageList_box"
        :data-mid="msgBody.id"
      >
      <!-- 普通消息气泡 -->
      <template
        v-if="!msgBody.isRecall && msgBody.type !== CUSTOM_MESSAGE_TYPE.INFORM"
      >
        <div
          class="message_box_item"
          :style="{
            flexDirection: msgBody._isMyself ? 'row-reverse' : 'row',
          }"
        >
          <div class="message_item_time">
            {{ handleMsgTimeShow(msgBody.time, index) || '' }}
          </div>
          <div class="message_avatar_container">
            <el-avatar
              class="message_item_avatar"
              :src="
                msgBody._isMyself
                  ? loginUserInfo.avatarurl
                  : handleOtherAvatar(msgBody)
              "
            >
            </el-avatar>
            <span class="message_item_account">{{ msgBody.from }}</span>
          </div>
          <!-- 普通消息内容 -->
          <div class="message_box_card">
            <div class="message_box_meta">
              <span v-show="!msgBody._isMyself" class="message_box_nickname">{{
                handleNickName(msgBody)
              }}</span>
              <span
                v-if="isStreamMessage(msgBody)"
                class="message_stream_badge"
                :title="`当前状态：${getStreamStatusText(msgBody)}`"
              >
                流式消息
              </span>
            </div>
            <el-dropdown
              class="message_box_content"
              :class="[
                msgBody._isMyself
                  ? 'message_box_content_mine'
                  : 'message_box_content_other',
                clickQuoteMsgId === msgBody.id && 'quote_msg_avtive',
              ]"
              trigger="contextmenu"
              placement="bottom-end"
            >
              <!-- 将所有消息内容包裹在一个容器中，确保el-dropdown只有一个直接子元素 -->
              <div class="message_content_wrapper">
                <!-- 文本类型消息 -->
                <p
                  style="padding: 10px; line-height: 20px"
                  v-if="msgBody.type === MESSAGE_TYPE.TEXT"
                >
                  <template v-if="!isLink(msgBody.msg)">
                    {{ msgBody.msg }}
                    <!-- 已编辑 -->
                    <sup
                      style="font-size: 7px; color: #707784"
                      v-if="msgBody?.modifiedInfo?.operationCount"
                      >（已编辑）</sup
                    >
                  </template>
                  <template v-else>
                    <span v-html="paseLink(msgBody.msg).msg"> </span
                  ></template>
                </p>
                <p
                  v-if="
                    msgBody.type === MESSAGE_TYPE.TEXT &&
                    getDisplayableExt(msgBody.ext)
                  "
                  class="message_text_ext"
                  style="padding: 0 10px 10px; line-height: 18px; font-size: 12px; color: #909399"
                >
                  ext: {{ JSON.stringify(getDisplayableExt(msgBody.ext)) }}
                </p>
                <div
                  v-if="isStreamMessage(msgBody)"
                  class="message_stream_hint"
                >
                  <span>{{ getStreamStatusText(msgBody) }}</span>
                  <span v-if="msgBody?.stream?.customType">
                    {{ msgBody.stream.customType }}
                  </span>
                </div>
                <div
                  v-if="isStreamMessage(msgBody) && getStreamStatusDetailText(msgBody)"
                  class="message_stream_error"
                >
                  {{ getStreamStatusDetailText(msgBody) }}
                </div>
                <!-- 图片类型消息 -->
                <el-image
                  v-if="msgBody.type === MESSAGE_TYPE.IMAGE"
                  style="border-radius: 5px"
                  :src="msgBody.thumb"
                  :preview-src-list="[msgBody.url]"
                  :initial-index="1"
                  fit="cover"
                />
                <!-- 视频类型消息 -->
                <video
                  v-if="msgBody.type === MESSAGE_TYPE.VIDEO"
                  :src="msgBody.url"
                  :poster="msgBody.thumb"
                  style="height: 100%; width: 100%; border-radius: 5px"
                  controls
                ></video>
                <!-- 语音类型消息 -->
                <div
                  :class="[
                    'message_box_content_audio',
                    msgBody._isMyself
                      ? 'message_box_content_audio_mine'
                      : 'message_box_content_audio_other',
                  ]"
                  v-if="msgBody.type === MESSAGE_TYPE.AUDIO"
                  @click="startplayAudio(msgBody)"
                  :style="`width:${msgBody.length * 10}px`"
                >
                  <span class="audio_length_text"> {{ msgBody.length }}′′ </span>
                  <div
                    :class="[
                      msgBody._isMyself
                        ? 'play_audio_icon_mine'
                        : 'play_audio_icon_other',
                      audioPlayStatus.playMsgId === msgBody.id &&
                        'start_play_audio',
                    ]"
                    style="background-size: 100% 100%"
                  ></div>
                </div>
                <div
                  v-if="msgBody.type === MESSAGE_TYPE.LOCAL"
                  class="message_box_content_location"
                >
                  <p class="location_title">
                    {{ msgBody.addr || '位置消息' }}
                  </p>
                  <p v-if="msgBody.buildingName" class="location_detail">
                    建筑：{{ msgBody.buildingName }}
                  </p>
                  <p class="location_detail">
                    纬度：{{ msgBody.lat ?? '-' }}，经度：{{ msgBody.lng ?? '-' }}
                  </p>
                </div>
                <!-- 透传消息 -->
                <div
                  v-if="msgBody.type === MESSAGE_TYPE.COMMAND"
                  class="message_box_content_cmd"
                  style="padding: 10px; line-height: 20px"
                >
                  <p style="margin: 0; color: #666">[透传消息]</p>
                  <p style="margin: 4px 0 0 0">action: {{ msgBody.action || '-' }}</p>
                  <p
                    v-if="msgBody.ext && Object.keys(msgBody.ext).length"
                    style="margin: 4px 0 0 0; font-size: 12px; color: #999"
                  >
                    ext: {{ JSON.stringify(msgBody.ext) }}
                  </p>
                </div>
                <!-- 文件类型消息 -->
                <div
                  v-if="msgBody.type === MESSAGE_TYPE.FILE"
                  class="message_box_content_file"
                >
                  <div class="file_text_box">
                    <div class="file_name">
                      {{ msgBody.filename }}
                    </div>
                    <div class="file_size">
                      {{ fileSizeFormat(msgBody.file_length) }}
                    </div>
                    <a class="file_download" :href="msgBody.url" download
                      >点击下载</a
                    >
                  </div>
                  <span class="iconfont icon-wenjian"></span>
                </div>
                <!-- 合并消息 -->
                <div
                  v-if="msgBody.type === MESSAGE_TYPE.COMBINE"
                  class="message_box_content_combine"
                >
                  <div class="combine_title">
                    <span class="iconfont icon-hebing"></span>
                    {{ msgBody.title || '聊天记录' }}
                  </div>
                  <div class="combine_summary">
                    {{ msgBody.summary || '' }}
                  </div>
                  <div
                    v-if="Array.isArray(msgBody.messageList)"
                    class="combine_count"
                  >
                    共{{ msgBody.messageList.length }}条消息
                  </div>
                  <div v-else class="combine_count">
                    SDK 下行未包含子消息列表
                  </div>
                  <div class="combine_compatible" v-if="msgBody.compatibleText">
                    {{ msgBody.compatibleText }}
                  </div>
                </div>
                <!-- 自定义类型消息 -->
                <div
                  v-if="msgBody.type === MESSAGE_TYPE.CUSTOM"
                  class="message_box_content_custom"
                >
                  <template
                    v-if="
                      msgBody.customEvent &&
                      CUSTOM_MSG_EVENT_TYPE[msgBody.customEvent]
                    "
                  >
                    <div class="user_card">
                      <div class="user_card_main">
                        <!-- 头像 -->
                        <el-avatar
                          shape="circle"
                          :size="50"
                          :src="
                            (msgBody.customExts &&
                              msgBody.customExts.avatarurl) ||
                            msgBody.customExts.avatar ||
                            defaultAvatar
                          "
                          fit="cover"
                        />
                        <!-- 昵称 -->
                        <span class="nickname">{{
                          (msgBody.customExts && msgBody.customExts.nickname) ||
                          msgBody.customExts.uid
                        }}</span>
                      </div>
                      <el-divider
                        style="margin: 5px 0; border-top: 1px solid black"
                      />
                      <p style="font-size: 8px">个人名片</p>
                    </div>
                  </template>
                  <!-- 其他自定义消息：展示 customEvent 与 customExts -->
                  <div
                    v-else
                    class="message_box_content_custom_generic"
                    style="padding: 10px; line-height: 20px"
                  >
                    <p style="margin: 0; color: #666">[自定义消息]</p>
                    <p style="margin: 4px 0 0 0">
                      event: {{ msgBody.customEvent || '-' }}
                    </p>
                    <p
                      v-if="msgBody.customExts && Object.keys(msgBody.customExts).length"
                      style="margin: 4px 0 0 0; font-size: 12px; color: #999"
                    >
                      {{ JSON.stringify(msgBody.customExts) }}
                    </p>
                  </div>
                </div>
              </div>
              <!-- 右键点击弹起更多功能栏 -->
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-if="msgBody.type === MESSAGE_TYPE.TEXT && isSupported"
                    @click="copyTextMessages(msgBody.msg)"
                  >
                    复制
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="msgBody._canRecall"
                    @click="recallMessage(msgBody)"
                  >
                    撤回
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="
                      msgBody.type === MESSAGE_TYPE.TEXT && msgBody._isMyself
                    "
                    @click="showModifyMsgModal(msgBody)"
                  >
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item @click="onMsgQuote(msgBody)">
                    引用
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="canCreateMessageThread(msgBody)"
                    :disabled="createMessageThreadLoading"
                    @click="createMessageThread(msgBody)"
                  >
                    创建消息话题
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="canUseReaction(msgBody) && getMessageReactions(msgBody).length > 0"
                    @click="openReactionDetailDialog(msgBody)"
                  >
                    表情回复详情
                  </el-dropdown-item>
                  <el-dropdown-item @click="pinMessage(msgBody)">
                    置顶
                  </el-dropdown-item>
                  <el-dropdown-item @click="unpinMessage(msgBody)">
                    取消置顶
                  </el-dropdown-item>
                  <el-dropdown-item @click="deleteMessage(msgBody)">
                    删除
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="!msgBody._isMyself"
                    @click="informOnMessage(msgBody)"
                  >
                    举报
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <!-- 引用消息展示框 -->
            <div
              class="message_quote_box"
              v-if="msgBody?.ext?.msgQuote"
              @click="clickQuoteMessage(msgBody.ext.msgQuote)"
            >
              <p>
                {{ msgBody?.ext?.msgQuote?.msgSender }}：{{
                  msgBody?.ext?.msgQuote?.msgPreview
                }}
              </p>
            </div>
            <div
              v-if="canUseReaction(msgBody)"
              class="message_reaction_bar"
              :class="msgBody._isMyself && 'is-mine'"
            >
              <div
                v-if="getMessageReactions(msgBody).length > 0"
                class="message_reaction_list"
              >
                <button
                  v-for="reactionItem in getMessageReactions(msgBody)"
                  :key="`${msgBody.id}_${reactionItem.reaction}`"
                  class="message_reaction_chip"
                  :class="reactionItem.isAddedBySelf && 'is-active'"
                  :disabled="
                    isReactionLoading(msgBody.id, reactionItem.reaction)
                  "
                  @click="toggleReaction(msgBody, reactionItem)"
                >
                  <span>{{ reactionItem.reaction }}</span>
                  <span>{{ reactionItem.count }}</span>
                </button>
              </div>
              <el-popover
                trigger="click"
                :placement="msgBody._isMyself ? 'bottom-end' : 'bottom-start'"
                :width="248"
                popper-class="message_reaction_picker_popover"
                :show-arrow="false"
              >
                <template #reference>
                  <button class="message_reaction_entry" title="添加表情回复">
                    <span class="reaction_entry_icon">☺</span>
                  </button>
                </template>
                <div class="message_reaction_picker">
                  <div class="message_reaction_picker_title">
                    选择表情回复
                  </div>
                  <button
                    v-for="reaction in REACTION_PRESETS"
                    :key="reaction"
                    class="message_reaction_picker_item"
                    :class="
                      getExistingReactionItem(msgBody, reaction)?.isAddedBySelf &&
                      'is-active'
                    "
                    :disabled="isReactionLoading(msgBody.id, reaction)"
                    @click="addReactionToMessage(msgBody, reaction)"
                  >
                    {{ reaction }}
                  </button>
                </div>
              </el-popover>
            </div>
          </div>
          <!-- 消息状态展示 -->
          <div class="message_item_status">
            <!-- 消息送达状态 -->
            <span
              v-if="msgBody.delivered && msgBody._isMyself"
              class="message_item_delivered_icon"
              title="消息已送达"
            >
              ✓
            </span>
            <!-- 消息已读状态 -->
            <img
              class="message_item_readed_icon"
              v-if="msgReadStatus(msgBody) && msgBody._isMyself"
              :src="messageReadedIcon"
              title="消息已读"
            />
            <!-- 群组消息已读计数 -->
            <span
              v-if="
                msgBody.groupReadCount !== undefined &&
                msgBody.groupReadCount !== null &&
                msgBody._isMyself
              "
              class="message_item_group_read_count"
              title="已读人数"
            >
              {{ msgBody.groupReadCount }}人已读
            </span>
          </div>
        </div>
      </template>
      <!-- 撤回消息通知 -->
      <template v-if="msgBody.isRecall">
        <div class="recall_style">
          {{
            msgBody._isMyself
              ? '你'
              : `${getUserDisplayNameById(msgBody.from)}`
          }}撤回了一条消息<span
            class="reEdit"
            v-show="msgBody._isMyself && msgBody.type === MESSAGE_TYPE.TEXT"
            @click="reEdit(msgBody.msg)"
            >重新编辑</span
          >
        </div>
      </template>
      <!-- 灰色系统通知 -->
      <template v-if="msgBody.type === CUSTOM_MESSAGE_TYPE.INFORM">
        <div class="inform_style">
          <p>
            {{ msgBody.msg }}
          </p>
        </div>
      </template>
    </div>
    </div>
    <ReportMessage ref="reportMessage" />
    <ModifyMessage ref="modifyMessageRef" />
    <el-dialog
      v-model="reactionDetailDialogVisible"
      width="420px"
      title="Reaction 详情"
      :destroy-on-close="false"
    >
      <template v-if="reactionDetailMsgBody">
        <div class="reaction_detail_dialog">
          <div class="reaction_detail_selector">
            <button
              v-for="reactionItem in getMessageReactions(reactionDetailMsgBody)"
              :key="`detail_${reactionDetailMsgBody.id}_${reactionItem.reaction}`"
              class="message_reaction_chip"
              :class="
                selectedReactionDetail === reactionItem.reaction && 'is-active'
              "
              @click="loadReactionDetail(reactionDetailMsgBody, reactionItem.reaction)"
            >
              <span>{{ reactionItem.reaction }}</span>
              <span>{{ reactionItem.count }}</span>
            </button>
          </div>
          <div v-loading="reactionDetailLoading" class="reaction_detail_user_list">
            <template v-if="reactionDetailUsers.length > 0">
              <div
                v-for="userId in reactionDetailUsers"
                :key="userId"
                class="reaction_detail_user_item"
              >
                <el-avatar
                  :size="30"
                  :src="getReactionUserAvatar(userId)"
                />
                <div class="reaction_detail_user_meta">
                  <div class="reaction_detail_user_name">
                    {{ getReactionUserName(userId) }}
                  </div>
                  <div class="reaction_detail_user_id">
                    {{ userId }}
                  </div>
                </div>
              </div>
            </template>
            <el-empty
              v-else
              :image-size="60"
              description="暂无用户详情"
            />
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
@import './index.scss';
</style>
