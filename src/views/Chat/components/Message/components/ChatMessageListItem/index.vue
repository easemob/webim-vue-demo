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
import { CONVERSATION_TYPE } from '@/IM/constant';
import { CUSTOM_MSG_EVENT_TYPE } from '@/constant';
import { useGetUserMapInfo } from '@/hooks';
import BenzAMRRecorder from 'benz-amr-recorder';
import fileSizeFormat from '@/utils/fileSizeFormat';
import dateFormat from '@/utils/dateFormater';
import { handleSDKErrorNotifi } from '@/utils/handleSomeData';
import { getSdk5ErrorMessage } from '@/utils/sdk5ErrorInfo';
import {
  getStreamStatusDetailText,
  getStreamStatusText,
  isStreamMessage,
} from '@/utils/streamMessageSupport';
import router from '@/router';
/* utils */
import paseLink from '@/utils/paseLink';
/* 默认头像 */
import defaultAvatar from '@/assets/images/avatar/theme2x.png';
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
      conversationId: '',
      conversationType: CONVERSATION_TYPE.SINGLE,
    }),
    required: true,
  },
});
const { routeQueryData } = toRefs(props);
/* emits */
const emit = defineEmits([
  'scrollMessageList',
  'reEditMessage',
  'quoteMessage',
]);
const REACTION_PRESETS = ['👍', '❤️', '😂', '😮', '😢', '👏'];
const activeCombineMessageId = ref('');
const combineMessageList = ref([]);
const combineMessageLoading = ref(false);
const combineMessageError = ref('');
const messageIdOf = (message) => message?.msgServerId || message?.msgLocalId || '';

const getCombineChildMessageText = (message) => {
  const body = message?.body || {};
  if (message?.type === 'text') return body.content || '';
  if (message?.type === 'image') return '[图片]';
  if (message?.type === 'video') return '[视频]';
  if (message?.type === 'voice') return '[语音]';
  if (message?.type === 'file') return `[文件] ${body.filename || ''}`;
  if (message?.type === 'location') return `[位置] ${body.address || ''}`;
  return `[${message?.type || '未知消息'}]`;
};

const loadCombineMessageList = async (combineMessage) => {
  const messageId = messageIdOf(combineMessage);
  if (!messageId || combineMessageLoading.value) return;

  if (activeCombineMessageId.value === messageId) {
    activeCombineMessageId.value = '';
    return;
  }

  combineMessageLoading.value = true;
  combineMessageError.value = '';
  try {
    combineMessageList.value = await requireManager('chatManager').downloadAndParseCombineMessage({
      message: combineMessage,
    });
    activeCombineMessageId.value = messageId;
  } catch (error) {
    combineMessageList.value = [];
    activeCombineMessageId.value = messageId;
    combineMessageError.value = error?.message || '合并消息子消息加载失败';
  } finally {
    combineMessageLoading.value = false;
  }
};

const currentConversation = computed(() => {
  const conversationId = routeQueryData.value?.conversationId;
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
  'quote',
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

const translationLanguages = ref([]);
const translationLanguagesLoading = ref(false);
const translateDialogVisible = ref(false);
const translateTargetMessage = ref(null);
const selectedTranslationLanguage = ref('');
const translatingMessageId = ref('');
const translationResultMap = ref({});
const translationErrorMap = ref({});
const voiceToTextLoadingMap = ref({});
const voiceToTextResultMap = ref({});
const voiceToTextErrorMap = ref({});
const attachmentDownloadLoadingMap = ref({});
const attachmentDownloadDialogVisible = ref(false);
const message_attachment_download_result = ref(null);
const attachmentObjectUrl = ref('');
const group_message_read_users_dialog = ref(false);
const groupMessageReadUsersLoading = ref(false);
const groupMessageReadUsersTarget = ref(null);
const groupMessageReadUsersResult = ref(null);
const groupMessageReadUsersError = ref('');
const group_message_read_receipts_dialog = ref(false);
const groupMessageReadReceiptsLoading = ref(false);
const groupMessageReadReceiptsTarget = ref(null);
const groupMessageReadReceiptsResult = ref(null);
const groupMessageReadReceiptsError = ref('');
const ATTACHMENT_MESSAGE_TYPES = ['image', 'video', 'file', 'voice'];

const getTranslationLanguageLabel = (language) => {
  if (!language) return '';
  const name = language.name || '';
  const nativeName = language.nativeName || '';
  if (name && nativeName && name !== nativeName) {
    return `${language.code} - ${name} / ${nativeName}`;
  }
  return `${language.code} - ${name || nativeName || language.code}`;
};

const getMessageTranslationResult = (message) => {
  const messageId = messageIdOf(message);
  return messageId ? translationResultMap.value[messageId] : null;
};

const getMessageTranslationError = (message) => {
  const messageId = messageIdOf(message);
  return messageId ? translationErrorMap.value[messageId] : '';
};

const loadSupportedTranslationLanguages = async () => {
  if (translationLanguages.value.length > 0 || translationLanguagesLoading.value) {
    return translationLanguages.value;
  }
  translationLanguagesLoading.value = true;
  try {
    const languages = await store.dispatch('fetchSupportedTranslationLanguages');
    translationLanguages.value = Array.isArray(languages) ? languages : [];
    if (!selectedTranslationLanguage.value && translationLanguages.value[0]?.code) {
      selectedTranslationLanguage.value = translationLanguages.value[0].code;
    }
    return translationLanguages.value;
  } catch (error) {
    console.error('[Message Translate] 获取支持语言失败', {
      error,
    });
    handleSDKErrorNotifi(error?.code, getSdk5ErrorMessage(error, '获取翻译语言列表失败'), error);
    throw error;
  } finally {
    translationLanguagesLoading.value = false;
  }
};

const openTranslateMessageDialog = async (msgBody) => {
  if (msgBody?.type !== 'text') return;
  translateTargetMessage.value = msgBody;
  translateDialogVisible.value = true;
  try {
    await loadSupportedTranslationLanguages();
  } catch (error) {
    // 真实 SDK / 服务端错误已经在 loadSupportedTranslationLanguages 中输出并提示。
  }
};

const submitTranslateMessage = async () => {
  const message = translateTargetMessage.value;
  const targetLanguage = selectedTranslationLanguage.value;
  const messageId = messageIdOf(message);
  if (!message || !messageId || !targetLanguage) {
    ElMessage({
      type: 'warning',
      center: true,
      message: '请选择 SDK 返回的目标语言后再翻译',
    });
    return;
  }
  translatingMessageId.value = messageId;
  translationErrorMap.value = {
    ...translationErrorMap.value,
    [messageId]: '',
  };
  try {
    const result = await store.dispatch('translateTextMessage', {
      message,
      targetLanguages: [targetLanguage],
    });
    translationResultMap.value = {
      ...translationResultMap.value,
      [messageId]: result,
    };
    translateDialogVisible.value = false;
    ElMessage({
      type: 'success',
      center: true,
      message: '消息翻译完成',
    });
  } catch (error) {
    const errorMessage = getSdk5ErrorMessage(error, '消息翻译失败');
    translationErrorMap.value = {
      ...translationErrorMap.value,
      [messageId]: errorMessage,
    };
    handleSDKErrorNotifi(error?.code, errorMessage, error);
  } finally {
    translatingMessageId.value = '';
  }
};

const getVoiceToTextResult = (message) => {
  const messageId = messageIdOf(message);
  return messageId ? voiceToTextResultMap.value[messageId] : null;
};

const getVoiceToTextError = (message) => {
  const messageId = messageIdOf(message);
  return messageId ? voiceToTextErrorMap.value[messageId] : '';
};

const isVoiceToTextLoading = (message) => {
  const messageId = messageIdOf(message);
  return !!(messageId && voiceToTextLoadingMap.value[messageId]);
};

const setVoiceToTextLoading = (messageId, loading) => {
  voiceToTextLoadingMap.value = {
    ...voiceToTextLoadingMap.value,
    [messageId]: loading,
  };
};

const convertVoiceMessageToText = async (msgBody) => {
  if (msgBody?.type !== 'voice') return;
  const messageId = messageIdOf(msgBody);
  if (!messageId || isVoiceToTextLoading(msgBody)) return;
  setVoiceToTextLoading(messageId, true);
  voiceToTextErrorMap.value = {
    ...voiceToTextErrorMap.value,
    [messageId]: '',
  };
  try {
    const result = await store.dispatch('voiceMessageToText', {
      message: msgBody,
    });
    voiceToTextResultMap.value = {
      ...voiceToTextResultMap.value,
      [messageId]: result,
    };
    ElMessage({
      type: 'success',
      center: true,
      message: '语音转文字完成',
    });
  } catch (error) {
    const errorMessage = getSdk5ErrorMessage(error, '语音转文字失败');
    voiceToTextErrorMap.value = {
      ...voiceToTextErrorMap.value,
      [messageId]: errorMessage,
    };
    handleSDKErrorNotifi(error?.code, errorMessage, error);
  } finally {
    setVoiceToTextLoading(messageId, false);
  }
};

const canDownloadAttachment = (msgBody) =>
  !!msgBody && ATTACHMENT_MESSAGE_TYPES.includes(msgBody.type);

const isAttachmentDownloadLoading = (message) => {
  const messageId = messageIdOf(message);
  return !!(messageId && attachmentDownloadLoadingMap.value[messageId]);
};

const setAttachmentDownloadLoading = (messageId, loading) => {
  attachmentDownloadLoadingMap.value = {
    ...attachmentDownloadLoadingMap.value,
    [messageId]: loading,
  };
};

const revokeAttachmentObjectUrl = () => {
  if (attachmentObjectUrl.value) {
    URL.revokeObjectURL(attachmentObjectUrl.value);
    attachmentObjectUrl.value = '';
  }
};

const createAttachmentDownloadUrl = (result) => {
  revokeAttachmentObjectUrl();
  if (!result?.data) return '';
  const blob = new Blob([result.data], {
    type: result.mimeType || 'application/octet-stream',
  });
  attachmentObjectUrl.value = URL.createObjectURL(blob);
  return attachmentObjectUrl.value;
};

const downloadMessageAttachment = async (msgBody) => {
  if (!canDownloadAttachment(msgBody)) return;
  const messageId = messageIdOf(msgBody);
  if (!messageId || isAttachmentDownloadLoading(msgBody)) return;
  setAttachmentDownloadLoading(messageId, true);
  try {
    const result = await store.dispatch('downloadMessageAttachment', {
      message: msgBody,
    });
    const browserDownloadUrl = createAttachmentDownloadUrl(result);
    message_attachment_download_result.value = {
      messageId,
      conversationId: msgBody.conversationId,
      conversationType: msgBody.conversationType,
      messageType: msgBody.type,
      filename: result?.filename,
      mimeType: result?.mimeType,
      size: result?.size,
      dataByteLength: result?.data?.byteLength || result?.data?.length || 0,
      downloadUrl: result?.downloadUrl,
      browserDownloadUrl,
    };
    attachmentDownloadDialogVisible.value = true;
    ElMessage({
      type: 'success',
      center: true,
      message: 'SDK 附件下载完成',
    });
  } catch (error) {
    handleSDKErrorNotifi(error?.code, getSdk5ErrorMessage(error, '附件下载失败'), error);
  } finally {
    setAttachmentDownloadLoading(messageId, false);
  }
};

const canQueryGroupMessageRead = (msgBody) =>
  msgBody?.conversationType === CONVERSATION_TYPE.GROUP && !!msgBody?.msgServerId;

const openGroupReadUsersDialog = async (msgBody) => {
  if (!canQueryGroupMessageRead(msgBody)) {
    ElMessage.warning('群消息已读用户查询需要群聊消息和 SDK 5.0 msgServerId');
    return;
  }
  groupMessageReadUsersTarget.value = msgBody;
  groupMessageReadUsersResult.value = null;
  groupMessageReadUsersError.value = '';
  group_message_read_users_dialog.value = true;
  groupMessageReadUsersLoading.value = true;
  try {
    groupMessageReadUsersResult.value = await store.dispatch(
      'getGroupMessageReadUsers',
      {
        groupId: msgBody.conversationId,
        messageId: msgBody.msgServerId,
        cursor: '',
        pageSize: 100,
      },
    );
  } catch (error) {
    groupMessageReadUsersError.value = getSdk5ErrorMessage(error, '群消息已读用户查询失败');
    handleSDKErrorNotifi(error?.code, groupMessageReadUsersError.value, error);
  } finally {
    groupMessageReadUsersLoading.value = false;
  }
};

const openGroupReadReceiptsDialog = async (msgBody) => {
  if (!canQueryGroupMessageRead(msgBody)) {
    ElMessage.warning('群消息回执详情查询需要群聊消息和 SDK 5.0 msgServerId');
    return;
  }
  groupMessageReadReceiptsTarget.value = msgBody;
  groupMessageReadReceiptsResult.value = null;
  groupMessageReadReceiptsError.value = '';
  group_message_read_receipts_dialog.value = true;
  groupMessageReadReceiptsLoading.value = true;
  try {
    groupMessageReadReceiptsResult.value = await store.dispatch(
      'getGroupMessageReadReceipts',
      {
        groupId: msgBody.conversationId,
        messageIds: [msgBody.msgServerId],
      },
    );
  } catch (error) {
    groupMessageReadReceiptsError.value =
      getSdk5ErrorMessage(error, '群消息回执详情查询失败');
    handleSDKErrorNotifi(error?.code, groupMessageReadReceiptsError.value, error);
  } finally {
    groupMessageReadReceiptsLoading.value = false;
  }
};

// 组件挂载状态标志
const isMounted = ref(true);

const processedMessageData = computed(() => {
  let rawData;
  if (Array.isArray(props.messageData)) {
    rawData = props.messageData;
  } else if (props.messageData && typeof props.messageData === 'object') {
    rawData = [props.messageData];
  } else {
    rawData = [];
  }

  return rawData.filter((item) => item != null);
});

// 确保messageData始终作为数组处理，并过滤掉null/undefined项
// 使用缓存避免不必要的数组创建
const messageDataArray = computed(() => {
  return processedMessageData.value;
});

// 会话维度 key：切换会话时整块替换列表 DOM，避免 patch 时 parentNode 为 null
const messageListKey = computed(
  () =>
    `msg-list-${routeQueryData.value?.conversationId ?? ''}-${routeQueryData.value?.conversationType ?? ''}`,
);

// 组件挂载和卸载处理
onMounted(() => {
  isMounted.value = true;
});

/* login hxId */
const loginUserId = getCurrentUserId();

/* 消息来源是否为自己 */
const isMyself = (msgBody) => {
  if (msgBody?.direct === 'SEND') return true;
  if (msgBody?.direct === 'RECEIVE') return false;
  return msgBody.sender?.userId === loginUserId;
};

/* 是否有撤回权限 */
const canRecallMessage = (msgBody) => {
  if (isMyself(msgBody)) return true;
  if (msgBody.conversationType === CONVERSATION_TYPE.SINGLE) return false;
  return hasConversationRecallPermission.value;
};
const getSingleChatReceiptText = (msgBody) => {
  if (msgBody?.conversationType !== CONVERSATION_TYPE.SINGLE) return '';
  if (msgBody?.isPeerRead === true) return '✓✓';
  if (msgBody?.delivered === true) return '✓';
  return '';
};
const getGroupChatReceiptText = (msgBody) => {
  if (msgBody?.conversationType !== CONVERSATION_TYPE.GROUP) return '';
  if (msgBody?.groupReadCount > 0) return '✓✓';
  if (msgBody?.delivered === true) return '✓';
  return '';
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
  return getUserDisplayAvatarById(msgBody.sender?.userId);
};
//处理聊天对方昵称展示
const handleNickName = (msgBody) => {
  const { conversationType, conversationId: groupId } = routeQueryData.value;
  const userId = msgBody.sender?.userId;
  if (conversationType === CONVERSATION_TYPE.SINGLE) {
    return getUserDisplayNameById(userId);
  }
  if (conversationType === CONVERSATION_TYPE.GROUP) {
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
    const lastTime = messageDataArray.value[index - 1].timestamp;
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

  const src = msgBody.body.url;
  audioPlayStatus.playMsgId = messageIdOf(msgBody);

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
        audioPlayStatus.playMsgId = messageIdOf(msgBody);
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
  if (quoteTimer.value) {
    clearTimeout(quoteTimer.value);
    quoteTimer.value = null;
  }

  // 清理时间显示缓存
  timeShowCache.value.clear();
  revokeAttachmentObjectUrl();

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
const copyTextMessages = (content) => {
  copy(content);
  if (copied) {
    ElMessage({
      type: 'success',
      message: '成功复制到剪切板',
      center: true,
    });
  }
};

//引用消息
const highlightedQuoteMessageId = ref('');
const quoteTimer = ref(null);
const clickQuoteMessage = (quote) => {
  const quotedMessageId = quote?.msgServerId || quote?.msgLocalId;
  if (!quotedMessageId) {
    console.error('[Message Quote] quoted SDK 5.0 message has no ID', quote);
    ElMessage.error('引用消息缺少 SDK 5.0 消息 ID');
    return;
  }
  nextTick(() => {
    const messageQuery = document.querySelectorAll('.messageList_box');
    const filterQuoteMsg =
      messageQuery.length &&
      [...messageQuery].filter(
        (node) => quotedMessageId === node.dataset.messageId,
      );
    if (filterQuoteMsg.length) {
      filterQuoteMsg[0].scrollIntoView();
      highlightedQuoteMessageId.value = quotedMessageId;
      // 清理之前的定时器
      if (quoteTimer.value) {
        clearTimeout(quoteTimer.value);
      }
      // 设置新的定时器
      quoteTimer.value = setTimeout(() => {
        highlightedQuoteMessageId.value = '';
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
const recallMessage = async (message) => {
  const options = {
    messageId: messageIdOf(message),
    conversationId: message.conversationId,
    conversationType: message.conversationType,
  };
  try {
    await store.dispatch('recallMessage', options);
  } catch (error) {
    handleSDKErrorNotifi(error.code, error.message, error);
  }
};
//编辑消息
const modifyMessageRef = ref(null);
const showModifyMsgModal = (message) => {
  nextTick(() => {
    modifyMessageRef.value.initModifyMessage({
      ...message,
      isChatThread: routeQueryData.value.isChatThread === true,
      parentConversationId: routeQueryData.value.parentConversationId || '',
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
    await store.dispatch('removeMessage', {
      messageId: messageIdOf(msgBody),
      conversationId: msgBody.conversationId,
      conversationType: msgBody.conversationType,
    });
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
// 消息置顶
const pinMessage = async (msgBody) => {
  try {
    const options = {
      conversationType: msgBody.conversationType,
      conversationId: msgBody.conversationId,
      messageId: messageIdOf(msgBody),
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
      conversationType: msgBody.conversationType,
      conversationId: msgBody.conversationId,
      messageId: messageIdOf(msgBody),
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
const reEdit = (content) => {
  if (isMounted.value) {
    emit('reEditMessage', content);
  }
};
//调用父组件引用消息
const onQuoteMessage = (message) => {
  if (isMounted.value) {
    emit('quoteMessage', message);
  }
};
const getQuotePreview = (quote) => {
  if (!quote) return '';
  if (quote.type === 'text') return quote.body?.content || '';
  return JSON.stringify(quote.body);
};
const reactionLoadingMap = ref({});
const messageListConversationKey = computed(() => routeQueryData.value.conversationId || '');
const getMessageReactions = (msgBody) => {
  return Array.isArray(msgBody?.reactions) ? msgBody.reactions : [];
};
const canUseReaction = (msgBody) => {
  return (
    !!messageIdOf(msgBody) && !msgBody.isRecall
  );
};
const getMessageThreadParentMessageId = (msgBody) => {
  return msgBody?.msgServerId || '';
};
const describeThreadError = (error) => {
  if (!error) return null;
  return {
    message: error.message || '',
    code: error.code || '',
    details: error.details,
    name: error.name || '',
  };
};
const getCreatedThreadId = (response) => response.chatThreadId;
const canCreateMessageThread = (msgBody) => {
  return (
    !!getMessageThreadParentMessageId(msgBody) &&
    !msgBody.isRecall &&
    routeQueryData.value.conversationType === CONVERSATION_TYPE.GROUP &&
    !!routeQueryData.value.conversationId
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
      parentId: routeQueryData.value.conversationId,
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
        conversationId: getCreatedThreadId(response),
        conversationType: CONVERSATION_TYPE.GROUP,
        isChatThread: 'true',
        parentConversationId: routeQueryData.value.conversationId,
        threadName: name,
      },
    });
  } catch (error) {
    if (error === 'cancel') return;
    console.error('[Thread] createMessageThread UI failed', {
      parentId: routeQueryData.value.conversationId,
      messageId,
      serverMessageId: msgBody?.msgServerId,
      errorSummary: describeThreadError(error),
      error,
    });
    handleSDKErrorNotifi(error?.code, getSdk5ErrorMessage(error, '消息话题创建失败'), error);
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
  setReactionLoading(messageIdOf(msgBody), reaction, true);
  try {
    await store.dispatch('addMessageReaction', {
      key: messageListConversationKey.value,
      messageId: messageIdOf(msgBody),
      reaction,
      conversationType: msgBody.conversationType,
      groupId:
        msgBody.conversationType === CONVERSATION_TYPE.GROUP
          ? msgBody.conversationId
          : undefined,
    });
  } catch (error) {
    console.error('[Reaction] addMessageReaction 失败', error);
    handleSDKErrorNotifi(error?.code, getSdk5ErrorMessage(error, 'Reaction 添加失败'), error);
  } finally {
    setReactionLoading(messageIdOf(msgBody), reaction, false);
  }
};
const removeReactionFromMessage = async (msgBody, reaction) => {
  if (!canUseReaction(msgBody) || !reaction) return;
  setReactionLoading(messageIdOf(msgBody), reaction, true);
  try {
    await store.dispatch('deleteMessageReaction', {
      key: messageListConversationKey.value,
      messageId: messageIdOf(msgBody),
      reaction,
      conversationType: msgBody.conversationType,
      groupId:
        msgBody.conversationType === CONVERSATION_TYPE.GROUP
          ? msgBody.conversationId
          : undefined,
    });
  } catch (error) {
    console.error('[Reaction] deleteMessageReaction 失败', error);
    handleSDKErrorNotifi(error?.code, getSdk5ErrorMessage(error, 'Reaction 删除失败'), error);
  } finally {
    setReactionLoading(messageIdOf(msgBody), reaction, false);
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
      messageId: messageIdOf(msgBody),
      reaction,
      cursor: null,
      pageSize: 100,
    });
    reactionDetailUsers.value = res.reactionUsers;
  } catch (error) {
    reactionDetailUsers.value = [];
    handleSDKErrorNotifi(
      error?.code,
      getSdk5ErrorMessage(error, 'Reaction 详情获取失败'),
      error,
    );
  } finally {
    reactionDetailLoading.value = false;
  }
};
const getReactionUserName = (user) => {
  return getUserDisplayNameById(user.userId) || user.userId;
};
const getReactionUserAvatar = (user) => {
  return getUserDisplayAvatarById(user.userId) || defaultAvatar;
};
</script>
<template>
  <div>
    <div :key="messageListKey">
      <div
        v-for="(msgBody, index) in messageDataArray"
        :key="messageIdOf(msgBody) || `message_${String(msgBody.timestamp ?? '')}_${index}`"
        class="messageList_box"
        :data-message-id="messageIdOf(msgBody)"
      >
      <!-- 普通消息气泡 -->
      <template
        v-if="!msgBody.isRecall"
      >
        <div
          class="message_box_item"
          :style="{
            flexDirection: isMyself(msgBody) ? 'row-reverse' : 'row',
          }"
        >
          <div class="message_item_time">
            {{ handleMsgTimeShow(msgBody.timestamp, index) || '' }}
          </div>
          <div class="message_avatar_container">
            <el-avatar
              class="message_item_avatar"
              :src="
                isMyself(msgBody)
                  ? loginUserInfo.avatarurl
                  : handleOtherAvatar(msgBody)
              "
            >
            </el-avatar>
            <span class="message_item_account">{{ msgBody.sender?.userId }}</span>
          </div>
          <!-- 普通消息内容 -->
          <div class="message_box_card">
            <div class="message_box_meta">
              <span v-show="!isMyself(msgBody)" class="message_box_nickname">{{
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
                isMyself(msgBody)
                  ? 'message_box_content_mine'
                  : 'message_box_content_other',
                highlightedQuoteMessageId === messageIdOf(msgBody) && 'quote_msg_avtive',
              ]"
              trigger="contextmenu"
              placement="bottom-end"
            >
              <!-- 将所有消息内容包裹在一个容器中，确保el-dropdown只有一个直接子元素 -->
              <div class="message_content_wrapper">
                <!-- 文本类型消息 -->
                <p
                  style="padding: 10px; line-height: 20px"
                  v-if="msgBody.type === 'text'"
                >
                  <template v-if="!isLink(msgBody.body.content)">
                    {{ msgBody.body.content }}
                    <!-- 已编辑 -->
                    <sup
                      style="font-size: 7px; color: #707784"
                      v-if="msgBody?.modifiedInfo?.operationCount"
                      >（已编辑）</sup
                    >
                  </template>
                  <template v-else>
                    <span v-html="paseLink(msgBody.body.content).content"> </span
                  ></template>
                </p>
                <p
                  v-if="
                    msgBody.type === 'text' &&
                    getDisplayableExt(msgBody.ext)
                  "
                  class="message_text_ext"
                  style="padding: 0 10px 10px; line-height: 18px; font-size: 12px; color: #909399"
                >
                  ext: {{ JSON.stringify(getDisplayableExt(msgBody.ext)) }}
                </p>
                <div
                  v-if="
                    msgBody.type === 'text' &&
                    getMessageTranslationResult(msgBody)
                  "
                  class="message_translation_result"
                >
                  <div class="message_translation_title">
                    SDK 5.0 翻译结果
                    <span
                      v-if="getMessageTranslationResult(msgBody).detectedLanguage"
                    >
                      ｜源语言：{{
                        getMessageTranslationResult(msgBody).detectedLanguage.language
                      }}
                      ({{
                        getMessageTranslationResult(msgBody).detectedLanguage.score
                      }})
                    </span>
                  </div>
                  <div
                    v-for="translation in getMessageTranslationResult(msgBody).translations"
                    :key="`${messageIdOf(msgBody)}_${translation['to']}`"
                    class="message_translation_item"
                  >
                    <span class="message_translation_lang">{{ translation['to'] }}</span>
                    <span>{{ translation.text }}</span>
                  </div>
                  <div
                    v-if="
                      !getMessageTranslationResult(msgBody).translations ||
                      getMessageTranslationResult(msgBody).translations.length === 0
                    "
                    class="message_translation_empty"
                  >
                    SDK 返回 translations 为空
                  </div>
                </div>
                <div
                  v-if="
                    msgBody.type === 'text' &&
                    getMessageTranslationError(msgBody)
                  "
                  class="message_translation_error"
                >
                  翻译失败：{{ getMessageTranslationError(msgBody) }}
                </div>
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
                  v-if="msgBody.type === 'image'"
                  style="border-radius: 5px"
                  :src="msgBody.body.thumbnailUrl"
                  :preview-src-list="[msgBody.body.bigImageUrl || msgBody.body.originalImageUrl || msgBody.body.localUrl]"
                  :initial-index="1"
                  fit="cover"
                />
                <!-- 视频类型消息 -->
                <video
                  v-if="msgBody.type === 'video'"
                  :src="msgBody.body.url"
                  :poster="msgBody.body.thumbnailUrl"
                  style="height: 100%; width: 100%; border-radius: 5px"
                  controls
                ></video>
                <!-- 语音类型消息 -->
                <div
                  :class="[
                    'message_box_content_audio',
                    isMyself(msgBody)
                      ? 'message_box_content_audio_mine'
                      : 'message_box_content_audio_other',
                  ]"
                  v-if="msgBody.type === 'voice'"
                  @click="startplayAudio(msgBody)"
                  :style="`width:${msgBody.body.duration * 10}px`"
                >
                  <span class="audio_length_text"> {{ msgBody.body.duration }}′′ </span>
                  <div
                    :class="[
                      isMyself(msgBody)
                        ? 'play_audio_icon_mine'
                        : 'play_audio_icon_other',
                      audioPlayStatus.playMsgId === messageIdOf(msgBody) &&
                        'start_play_audio',
                    ]"
                    style="background-size: 100% 100%"
                  ></div>
                </div>
                <div
                  v-if="
                    msgBody.type === 'voice' &&
                    getVoiceToTextResult(msgBody)
                  "
                  class="message_voice_to_text_result"
                >
                  <div class="message_voice_to_text_title">
                    SDK 5.0 语音转文字结果
                  </div>
                  {{ getVoiceToTextResult(msgBody).text }}
                </div>
                <div
                  v-if="
                    msgBody.type === 'voice' &&
                    getVoiceToTextError(msgBody)
                  "
                  class="message_voice_to_text_error"
                >
                  语音转文字失败：{{ getVoiceToTextError(msgBody) }}
                </div>
                <div
                  v-if="msgBody.type === 'location'"
                  class="message_box_content_location"
                >
                  <p class="location_title">
                    {{ msgBody.body.address || '位置消息' }}
                  </p>
                  <p v-if="msgBody.body.buildingName" class="location_detail">
                    建筑：{{ msgBody.body.buildingName }}
                  </p>
                  <p class="location_detail">
                    纬度：{{ msgBody.body.latitude }}，经度：{{ msgBody.body.longitude }}
                  </p>
                </div>
                <!-- 透传消息 -->
                <div
                  v-if="msgBody.type === 'cmd'"
                  class="message_box_content_cmd"
                  style="padding: 10px; line-height: 20px"
                >
                  <p style="margin: 0; color: #666">[透传消息]</p>
                  <p style="margin: 4px 0 0 0">action: {{ msgBody.body.action }}</p>
                  <p
                    v-if="msgBody.ext && Object.keys(msgBody.ext).length"
                    style="margin: 4px 0 0 0; font-size: 12px; color: #999"
                  >
                    params: {{ JSON.stringify(msgBody.body.params) }}
                  </p>
                </div>
                <!-- 文件类型消息 -->
                <div
                  v-if="msgBody.type === 'file'"
                  class="message_box_content_file"
                >
                  <div class="file_text_box">
                    <div class="file_name">
                      {{ msgBody.body.filename }}
                    </div>
                    <div class="file_size">
                      {{ fileSizeFormat(msgBody.body.fileLength) }}
                    </div>
                    <a class="file_download" :href="msgBody.body.url" download
                      >点击下载</a
                    >
                  </div>
                  <span class="iconfont icon-wenjian"></span>
                </div>
                <!-- 合并消息 -->
                <div
                  v-if="msgBody.type === 'combine'"
                  class="message_box_content_combine"
                  @click.stop="loadCombineMessageList(msgBody)"
                >
                  <div class="combine_title">
                    <span class="iconfont icon-hebing"></span>
                    {{ msgBody.body.title }}
                  </div>
                  <div class="combine_summary">
                    {{ msgBody.body.summary }}
                  </div>
                  <div v-if="combineMessageLoading" class="combine_count">
                    正在加载子消息...
                  </div>
                  <template v-else-if="activeCombineMessageId === messageIdOf(msgBody)">
                    <div v-if="combineMessageError" class="combine_count">
                      {{ combineMessageError }}
                    </div>
                    <template v-else>
                      <div class="combine_count">共{{ combineMessageList.length }}条消息</div>
                      <div
                        v-for="(combineChildMessage, combineChildIndex) in combineMessageList"
                        :key="combineChildMessage.msgServerId || combineChildMessage.msgLocalId || combineChildIndex"
                        class="combine_summary"
                      >
                        {{ getCombineChildMessageText(combineChildMessage) }}
                      </div>
                    </template>
                  </template>
                  <div v-else class="combine_count">点击查看子消息</div>
                </div>
                <!-- 自定义类型消息 -->
                <div
                  v-if="msgBody.type === 'custom'"
                  class="message_box_content_custom"
                >
                  <template
                    v-if="
                      msgBody.body?.event &&
                      CUSTOM_MSG_EVENT_TYPE[msgBody.body.event]
                    "
                  >
                    <div class="user_card">
                      <div class="user_card_main">
                        <!-- 头像 -->
                        <el-avatar
                          shape="circle"
                          :size="50"
                          :src="
                            msgBody.body?.params?.avatarurl ||
                            msgBody.body?.params?.avatar ||
                            defaultAvatar
                          "
                          fit="cover"
                        />
                        <!-- 昵称 -->
                        <span class="nickname">{{
                          msgBody.body?.params?.nickname ||
                          msgBody.body?.params?.uid
                        }}</span>
                      </div>
                      <el-divider
                        style="margin: 5px 0; border-top: 1px solid black"
                      />
                      <p style="font-size: 8px">个人名片</p>
                    </div>
                  </template>
                  <!-- 其他自定义消息：展示 SDK 5.0 body.event 与 body.params -->
                  <div
                    v-else
                    class="message_box_content_custom_generic"
                    style="padding: 10px; line-height: 20px"
                  >
                    <p style="margin: 0; color: #666">[自定义消息]</p>
                    <p style="margin: 4px 0 0 0">
                      event: {{ msgBody.body?.event || '-' }}
                    </p>
                    <p
                      v-if="msgBody.body?.params && Object.keys(msgBody.body.params).length"
                      style="margin: 4px 0 0 0; font-size: 12px; color: #999"
                    >
                      {{ JSON.stringify(msgBody.body.params) }}
                    </p>
                  </div>
                </div>
              </div>
              <!-- 右键点击弹起更多功能栏 -->
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-if="msgBody.type === 'text' && isSupported"
                    @click="copyTextMessages(msgBody.body.content)"
                  >
                    复制
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="msgBody.type === 'text'"
                    :disabled="translatingMessageId === messageIdOf(msgBody)"
                    @click="openTranslateMessageDialog(msgBody)"
                  >
                    翻译
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="msgBody.type === 'voice'"
                    :disabled="isVoiceToTextLoading(msgBody)"
                    @click="convertVoiceMessageToText(msgBody)"
                  >
                    转文字
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="canRecallMessage(msgBody)"
                    @click="recallMessage(msgBody)"
                  >
                    撤回
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="
                      msgBody.type === 'text' && isMyself(msgBody)
                    "
                    @click="showModifyMsgModal(msgBody)"
                  >
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item @click="onQuoteMessage(msgBody)">
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
                  <el-dropdown-item
                    v-if="canDownloadAttachment(msgBody)"
                    :disabled="isAttachmentDownloadLoading(msgBody)"
                    @click="downloadMessageAttachment(msgBody)"
                  >
                    SDK附件下载
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="canQueryGroupMessageRead(msgBody)"
                    @click="openGroupReadUsersDialog(msgBody)"
                  >
                    群已读用户
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="canQueryGroupMessageRead(msgBody)"
                    @click="openGroupReadReceiptsDialog(msgBody)"
                  >
                    群回执详情
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
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <!-- 引用消息展示框 -->
            <div
              class="message_quote_box"
              v-if="msgBody?.ext?.quote"
              @click="clickQuoteMessage(msgBody.ext.quote)"
            >
              <p>
                {{ msgBody?.ext?.quote?.sender?.userId }}：{{
                  getQuotePreview(msgBody?.ext?.quote)
                }}
              </p>
            </div>
            <div
              v-if="canUseReaction(msgBody)"
              class="message_reaction_bar"
              :class="isMyself(msgBody) && 'is-mine'"
            >
              <div
                v-if="getMessageReactions(msgBody).length > 0"
                class="message_reaction_list"
              >
                <button
                  v-for="reactionItem in getMessageReactions(msgBody)"
                  :key="`${messageIdOf(msgBody)}_${reactionItem.reaction}`"
                  class="message_reaction_chip"
                  :class="reactionItem.isAddedBySelf && 'is-active'"
                  :disabled="
                    isReactionLoading(messageIdOf(msgBody), reactionItem.reaction)
                  "
                  @click="toggleReaction(msgBody, reactionItem)"
                >
                  <span>{{ reactionItem.reaction }}</span>
                  <span>{{ reactionItem.count }}</span>
                </button>
              </div>
              <el-popover
                trigger="click"
                :placement="isMyself(msgBody) ? 'bottom-end' : 'bottom-start'"
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
                    :disabled="isReactionLoading(messageIdOf(msgBody), reaction)"
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
            <!-- 单聊消息回执状态：已送达一个勾，已读两个勾。 -->
            <span
              v-if="isMyself(msgBody) && getSingleChatReceiptText(msgBody)"
              class="message_item_chat_receipt_icon"
              :title="msgBody?.isPeerRead === true ? '消息已读' : '消息已送达'"
            >
              {{ getSingleChatReceiptText(msgBody) }}
            </span>
            <!-- 群聊消息回执状态：已送达一个勾，至少一人已读两个勾。 -->
            <span
              v-if="isMyself(msgBody) && getGroupChatReceiptText(msgBody)"
              class="message_item_chat_receipt_icon"
              :title="msgBody?.groupReadCount > 0 ? '消息已读' : '消息已送达'"
            >
              {{ getGroupChatReceiptText(msgBody) }}
            </span>
            <!-- 聊天室消息送达状态 -->
            <span
              v-if="
                msgBody.delivered &&
                isMyself(msgBody) &&
                msgBody.conversationType === CONVERSATION_TYPE.CHATROOM
              "
              class="message_item_delivered_icon"
              title="消息已送达"
            >
              ✓
            </span>
            <!-- 群组消息已读计数 -->
            <span
              v-if="
                msgBody.groupReadCount !== undefined &&
                msgBody.groupReadCount !== null &&
                isMyself(msgBody)
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
            isMyself(msgBody)
              ? '你'
              : `${getUserDisplayNameById(msgBody.sender?.userId)}`
          }}撤回了一条消息<span
            class="reEdit"
            v-show="isMyself(msgBody) && msgBody.type === 'text'"
            @click="reEdit(msgBody.body.content)"
            >重新编辑</span
          >
        </div>
      </template>
    </div>
    </div>
    <ModifyMessage ref="modifyMessageRef" />
    <el-dialog
      v-model="translateDialogVisible"
      width="420px"
      title="消息翻译"
      :destroy-on-close="false"
    >
      <div class="message_translate_dialog">
        <div class="message_translate_source">
          {{ translateTargetMessage?.body?.content || '' }}
        </div>
        <el-select
          v-model="selectedTranslationLanguage"
          class="message_translate_select"
          placeholder="选择 SDK 返回的目标语言"
          filterable
          :loading="translationLanguagesLoading"
        >
          <el-option
            v-for="language in translationLanguages"
            :key="language.code"
            :label="getTranslationLanguageLabel(language)"
            :value="language.code"
          />
        </el-select>
        <div
          v-if="!translationLanguagesLoading && translationLanguages.length === 0"
          class="message_translation_empty"
        >
          SDK 返回的翻译语言列表为空
        </div>
      </div>
      <template #footer>
        <el-button @click="translateDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="
            translatingMessageId === messageIdOf(translateTargetMessage)
          "
          :disabled="
            !selectedTranslationLanguage || translationLanguages.length === 0
          "
          @click="submitTranslateMessage"
        >
          调用 SDK 翻译
        </el-button>
      </template>
    </el-dialog>
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
              :key="`detail_${messageIdOf(reactionDetailMsgBody)}_${reactionItem.reaction}`"
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
                v-for="user in reactionDetailUsers"
                :key="user.userId"
                class="reaction_detail_user_item"
              >
                <el-avatar
                  :size="30"
                  :src="getReactionUserAvatar(user)"
                />
                <div class="reaction_detail_user_meta">
                  <div class="reaction_detail_user_name">
                    {{ getReactionUserName(user) }}
                  </div>
                  <div class="reaction_detail_user_id">
                    {{ user.userId }}
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
    <el-dialog
      v-model="attachmentDownloadDialogVisible"
      width="520px"
      title="SDK 5.0 附件下载结果"
      class="message_attachment_download_result"
      :destroy-on-close="false"
    >
      <template v-if="message_attachment_download_result">
        <div class="sdk5_result_dialog">
          <p>
            消息 ID：{{ message_attachment_download_result.messageId }}
          </p>
          <p>
            文件名：{{ message_attachment_download_result.filename || 'SDK 未返回' }}
          </p>
          <p>
            MIME：{{ message_attachment_download_result.mimeType || 'SDK 未返回' }}
          </p>
          <p>
            大小：
            {{
              message_attachment_download_result.size !== undefined
                ? fileSizeFormat(message_attachment_download_result.size)
                : 'SDK 未返回'
            }}
          </p>
          <p>
            二进制长度：{{ message_attachment_download_result.dataByteLength }}
          </p>
          <el-link
            v-if="message_attachment_download_result.browserDownloadUrl"
            type="primary"
            :href="message_attachment_download_result.browserDownloadUrl"
            :download="message_attachment_download_result.filename || 'attachment'"
          >
            下载 SDK 返回二进制
          </el-link>
          <pre>{{
            JSON.stringify(message_attachment_download_result, null, 2)
          }}</pre>
        </div>
      </template>
    </el-dialog>
    <el-dialog
      v-model="group_message_read_users_dialog"
      width="520px"
      title="群消息已读用户"
      class="group_message_read_users_dialog"
      :destroy-on-close="false"
    >
      <div v-loading="groupMessageReadUsersLoading" class="sdk5_result_dialog">
        <p>
          群组 ID：{{ groupMessageReadUsersTarget?.conversationId || '-' }}
        </p>
        <p>
          消息 ID：{{ groupMessageReadUsersTarget?.msgServerId || '-' }}
        </p>
        <template v-if="groupMessageReadUsersError">
          <p class="message_voice_to_text_error">
            {{ groupMessageReadUsersError }}
          </p>
        </template>
        <template v-else-if="groupMessageReadUsersResult">
          <p>已读总数：{{ groupMessageReadUsersResult.count }}</p>
          <div
            v-for="user in groupMessageReadUsersResult.users || []"
            :key="user.userId"
            class="sdk5_user_row"
          >
            <span>{{ user.userId }}</span>
            <span v-if="user.timestamp">
              {{ dateFormat('MM/DD/HH:mm', user.timestamp) }}
            </span>
          </div>
          <el-empty
            v-if="!(groupMessageReadUsersResult.users || []).length"
            :image-size="60"
            description="SDK 返回 users 为空"
          />
          <pre>{{ JSON.stringify(groupMessageReadUsersResult, null, 2) }}</pre>
        </template>
      </div>
    </el-dialog>
    <el-dialog
      v-model="group_message_read_receipts_dialog"
      width="520px"
      title="群消息回执详情"
      class="group_message_read_receipts_dialog"
      :destroy-on-close="false"
    >
      <div v-loading="groupMessageReadReceiptsLoading" class="sdk5_result_dialog">
        <p>
          群组 ID：{{ groupMessageReadReceiptsTarget?.conversationId || '-' }}
        </p>
        <p>
          消息 ID：{{ groupMessageReadReceiptsTarget?.msgServerId || '-' }}
        </p>
        <template v-if="groupMessageReadReceiptsError">
          <p class="message_voice_to_text_error">
            {{ groupMessageReadReceiptsError }}
          </p>
        </template>
        <template v-else-if="groupMessageReadReceiptsResult">
          <div
            v-for="receipt in groupMessageReadReceiptsResult"
            :key="receipt.messageId"
            class="sdk5_user_row"
          >
            <span>{{ receipt.messageId }}</span>
            <span>{{ receipt.count }}人已读</span>
          </div>
          <el-empty
            v-if="!groupMessageReadReceiptsResult.length"
            :image-size="60"
            description="SDK 返回回执详情为空"
          />
          <pre>{{ JSON.stringify(groupMessageReadReceiptsResult, null, 2) }}</pre>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
@import './index.scss';
</style>
