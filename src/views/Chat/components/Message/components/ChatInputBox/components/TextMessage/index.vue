<script setup>
import { ref, toRefs, computed, onMounted, onUpdated, watch } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { MENTION_ALL } from '@/constant';
import { CONVERSATION_TYPE } from '@/IM/constant';
import { createMessage, sendMessage, sendMessageByClient } from '@/IM/sdk5/chat';
import { getCurrentUserId, requireManager } from '@/IM';
import { useUserInfoExt } from '@/hooks';
import store from '@/store';
import { notifySdkSendError } from '@/utils/handleSomeData';
//vue at
import VueAt from 'vue-at/dist/vue-at-textarea'; // for textarea
import { ElMessage } from 'element-plus';
const props = defineProps({
  conversationType: {
    type: String,
    default: CONVERSATION_TYPE.SINGLE,
    required: true,
  },
  conversationId: {
    type: String,
    default: '',
    required: true,
  },
  isChatThread: {
    type: Boolean,
    default: false,
  },
  parentConversationId: {
    type: String,
    default: '',
  },
  deliverOnlineOnlyOptions: {
    type: Object,
    default: () => ({}),
  },
});
const {
  conversationType,
  conversationId,
  isChatThread,
  parentConversationId,
  deliverOnlineOnlyOptions,
} = toRefs(props);
const emit = defineEmits([
  'getImageFileFromClipboard',
  'getMessageQuoteContent',
  'clearQuoteContent',
]);
const editable = ref(null);
onMounted(() => {
  editable.value?.focus();
});
onUpdated(() => {
  editable.value?.focus();
});
/** /
 * 文本消息相关
 * 包含 @、emoji、引用功能
 */
//AT 逻辑
const mentionConversationId = computed(
  () => parentConversationId.value || conversationId.value,
);
const atMemberEntries = ref([]);
const atMembersList = computed(() => {
  const candidates = [{ text: MENTION_ALL.TEXT, value: MENTION_ALL.VALUE }];

  atMemberEntries.value.forEach((member) => {
    const userId = member.user?.userId;
    if (!userId || userId === getCurrentUserId()) return;
    candidates.push({
      text: userId,
      value: userId,
    });
  });

  return candidates;
});

const fetchChatRoomMentionMembers = async (chatRoomId) => {
  const members = [];
  let cursor = '';

  do {
    const result = await requireManager('chatRoomManager')
      .getChatRoom(chatRoomId)
      .getMembers({
        cursor,
        pageSize: 50,
      });
    members.push(...result.items);
    cursor = result.cursor;
  } while (cursor);

  return members;
};

const refreshMentionMembers = async () => {
  const mentionConversationIdSnapshot = mentionConversationId.value;
  const mentionConversationTypeSnapshot = conversationType.value;

  if (
    !mentionConversationIdSnapshot ||
    (mentionConversationTypeSnapshot !== CONVERSATION_TYPE.GROUP &&
      mentionConversationTypeSnapshot !== CONVERSATION_TYPE.CHATROOM)
  ) {
    atMemberEntries.value = [];
    return;
  }

  try {
    let members;
    if (mentionConversationTypeSnapshot === CONVERSATION_TYPE.GROUP) {
      members = await store.dispatch('fetchGroupsMemberFromServer', {
        groupId: mentionConversationIdSnapshot,
      });
    }
    if (mentionConversationTypeSnapshot === CONVERSATION_TYPE.CHATROOM) {
      members = await fetchChatRoomMentionMembers(mentionConversationIdSnapshot);
    }

    if (
      mentionConversationIdSnapshot === mentionConversationId.value &&
      mentionConversationTypeSnapshot === conversationType.value
    ) {
      atMemberEntries.value = members;
    }
  } catch (error) {
    if (mentionConversationTypeSnapshot === CONVERSATION_TYPE.CHATROOM) {
      console.error('[SDK 5.0 ChatRoom] getMembers failed', {
        chatRoomId: mentionConversationIdSnapshot,
        currentUser: getCurrentUserId(),
        error,
      });
    }
    ElMessage.error(error.message);
  }
};

watch(
  () => [conversationType.value, mentionConversationId.value],
  refreshMentionMembers,
  { immediate: true },
);

const isAtAll = ref(false);
const atMembers = ref([]);
//输入框插入@事件
const onInsert = (target) => {
  // if (!) return false
  if (_.map(atMembers.value, 'value').includes(target.value)) return false;
  if (target.value === MENTION_ALL.VALUE) {
    return (isAtAll.value = true);
  } else {
    atMembers.value.push({ ...target });
  }
};
//校验消息内容中是否包含要@的成员
const checkAtMembers = (text) => {
  if (!text) {
    return false;
  }
  //判断是否文本中是否有@ALL，没有则直接设置为false
  const patternAtAll = new RegExp(`@${MENTION_ALL.TEXT}`);

  if (isAtAll.value && !patternAtAll.test(text)) {
    isAtAll.value = false;
  }
  if (atMembers.value.length !== 0) {
    //循环AT成员数组通过匹配文本内容判断是否存在已经移除@成员
    _.map(atMembers.value, 'text').forEach((item, index) => {
      const pattern = new RegExp(`@${item}`);
      const result = pattern.test(text);
      if (!result) {
        //不包含则从@列表中移除该成员
        atMembers.value.splice(index, 1);
      }
    });
  }
};
//emojis框展开
const isShowEmojisBox = ref(false);
const emojisBox = ref(null);
onClickOutside(emojisBox, () => {
  isShowEmojisBox.value = false;
});
//新增一个emoji
const onAddOneEmoji = (emoji) => {
  textContent.value = textContent.value + emoji;
};
//监听键盘按下事件，如果为enter键则发送文本内容,shift+enter则换行。
const onTextInputKeyDown = (event) => {
  if (event.keyCode === 13 && !event.shiftKey) {
    event.preventDefault();
    // 执行发送操作
    sendTextMessage();
  } else if (event.keyCode === 13 && event.shiftKey) {
    // 换行操作
    insertNewLine();
  }
};
//换行操作
const insertNewLine = () => (textContent.value += '\n');
//发送文本内容
const textContent = ref('');
const { setUserInfoExt } = useUserInfoExt();
const sendTextMessage = _.debounce(async () => {
  //如果输入框全部为空格同样拒绝发送
  if (textContent.value.match(/^\s*$/)) return;
  if (!conversationId.value) {
    console.error('发送文本消息失败: 缺少目标ID');
    ElMessage.error('发送文本消息失败: 请先选择聊天对象');
    return;
  }
  checkAtMembers(textContent.value);
  const msgOptions = {
    conversationId: conversationId.value,
    conversationType: conversationType.value,
    ...(isChatThread.value ? { isChatThread: true } : {}),
    ...deliverOnlineOnlyOptions.value,
    ...(conversationType.value !== CONVERSATION_TYPE.CHATROOM
      ? { needReadReceipt: true }
      : {}),
    content: textContent.value,
    ext: {
      em_at_list: isAtAll.value
        ? MENTION_ALL.VALUE
        : _.map(atMembers.value, 'value'),
    },
  };
  //在消息体内携带该用户的昵称头像信息
  setUserInfoExt(msgOptions);
  //引用消息处理
  const callback = (quote) => {
    if (quote) {
      msgOptions.ext.quote = quote;
      emit('clearQuoteContent');
    }
  };
  emit('getMessageQuoteContent', callback);
  textContent.value = '';
  try {
    const messageToSend = createMessage('text', msgOptions);
    const message = await sendMessage(messageToSend);
    await store.dispatch('senedShowTypeMessage', message);
  } catch (error) {
    console.error('发送文本消息失败', error);
    notifySdkSendError(error);
  } finally {
    isAtAll.value = false;
    atMembers.value = [];
  }
}, 50);

const sendTextMessageByClient = _.debounce(async () => {
  if (textContent.value.match(/^\s*$/)) return;
  if (!conversationId.value) {
    console.error('[Message Send] ChatClient.sendMessage failed', {
      conversationId: conversationId.value,
      conversationType: conversationType.value,
      error: new Error('缺少目标ID'),
    });
    ElMessage.error('发送文本消息失败: 请先选择聊天对象');
    return;
  }
  checkAtMembers(textContent.value);
  const msgOptions = {
    conversationId: conversationId.value,
    conversationType: conversationType.value,
    ...(isChatThread.value ? { isChatThread: true } : {}),
    ...deliverOnlineOnlyOptions.value,
    ...(conversationType.value !== CONVERSATION_TYPE.CHATROOM
      ? { needReadReceipt: true }
      : {}),
    content: textContent.value,
    ext: {
      em_at_list: isAtAll.value
        ? MENTION_ALL.VALUE
        : _.map(atMembers.value, 'value'),
    },
  };
  setUserInfoExt(msgOptions);
  emit('getMessageQuoteContent', (quote) => {
    if (quote) {
      msgOptions.ext.quote = quote;
      emit('clearQuoteContent');
    }
  });

  let messageToSend;
  try {
    messageToSend = createMessage('text', msgOptions);
    const message = await sendMessageByClient(messageToSend);
    console.log('[Message Send] ChatClient.sendMessage success', {
      messageId: message.msgServerId || message.msgLocalId,
      conversationId: message.conversationId,
      conversationType: message.conversationType,
      rawMessage: message,
    });
    await store.dispatch('senedShowTypeMessage', message);
    textContent.value = '';
  } catch (error) {
    console.error('[Message Send] ChatClient.sendMessage failed', {
      conversationId: conversationId.value,
      conversationType: conversationType.value,
      rawMessage: messageToSend,
      error,
    });
    notifySdkSendError(error);
  } finally {
    isAtAll.value = false;
    atMembers.value = [];
  }
}, 50);

/* 监听输出面板粘贴事件 */
const dispatchPasteEvent = (event) => {
  const items = (event.clipboardData || window.clipboardData).items;
  const isImage = [...items].some(
    (item) => item.kind === 'file' && item.type.startsWith('image/'),
  );
  if (isImage) {
    emit('getImageFileFromClipboard', items);
  }
};
const onEditMessage = (content) => {
  textContent.value = content;
};
defineExpose({
  onAddOneEmoji,
  onEditMessage,
});
</script>
<template>
  <template v-if="conversationType === CONVERSATION_TYPE.SINGLE">
    <textarea
      ref="editable"
      v-model="textContent"
      class="chat_content_editable"
      spellcheck="false"
      contenteditable="true"
      placeholder="请输入消息内容..."
      @keydown="onTextInputKeyDown"
      @paste="dispatchPasteEvent"
    >
    </textarea>
  </template>
  <template
    v-else-if="conversationType === CONVERSATION_TYPE.GROUP || conversationType === CONVERSATION_TYPE.CHATROOM"
  >
    <vue-at :members="atMembersList" name-key="text" @insert="onInsert">
      <textarea
        ref="editable"
        v-model="textContent"
        class="chat_content_editable"
        spellcheck="false"
        contenteditable="true"
        placeholder="请输入消息内容..."
        @keydown="onTextInputKeyDown"
        @paste="dispatchPasteEvent"
      >
      </textarea>
    </vue-at>
  </template>

  <el-button
    :class="[textContent === '' ? 'no_content_send_btn' : 'chat_send_btn']"
    type="primary"
    @click="sendTextMessage"
    >发送</el-button
  >
  <el-button
    :class="[textContent === '' ? 'no_content_client_send_btn' : 'chat_client_send_btn']"
    type="primary"
    @click="sendTextMessageByClient">SDK5 Client.sendMessage</el-button
  >
</template>

<style lang="scss" scoped>
.chat_content_editable {
  font-family: 'PingFang SC';
  width: 100%;
  box-sizing: border-box;
  min-height: 100px;
  border: none;
  background: none;
  letter-spacing: 0.5px;
  resize: none;
  padding: 10px 20px;
  font-size: 14px;
  caret-color: #2454ff;
}
.no_content_send_btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 80px;
  opacity: 0.5;
}

.chat_send_btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 80px;
}

.no_content_client_send_btn {
  position: absolute;
  bottom: 20px;
  right: 120px;
  width: 160px;
  opacity: 0.5;
}

.chat_client_send_btn {
  position: absolute;
  bottom: 20px;
  right: 120px;
  width: 160px;
}
</style>
