<template>
  <el-dialog
    custom-class="setting_func_diglog"
    v-model="dialogVisible"
    title="发送定向消息"
    width="520px"
    @close="onDialogClose"
  >
    <el-form label-position="top" class="directed-message-form">
      <el-form-item label="消息内容" required>
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="4"
          placeholder="请输入消息内容"
        />
      </el-form-item>
      <el-form-item :label="receiverLabel" required>
        <el-input
          v-model="receiverInput"
          type="textarea"
          :rows="4"
          resize="none"
          :placeholder="receiverPlaceholder"
        />
      </el-form-item>
      <div class="directed-message-hint">
        {{
          receiverList.length > 0
            ? `当前将定向发送给 ${receiverList.length} 个成员`
            : '请输入定向接收成员'
        }}
      </div>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" :loading="sending" @click="sendDirectedMessage">
          发送
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, toRefs, watch } from 'vue';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
import { createMessage, sendMessage } from '@/IM/sdk5/chat';
import { getCurrentUserId, requireManager } from '@/IM';
import { CONVERSATION_TYPE } from '@/IM/constant';
import { useUserInfoExt } from '@/hooks';
import { notifySdkSendError } from '@/utils/handleSomeData';
import { normalizeReceiverList } from '@/utils/directedMessage';
import { getDefaultDirectedReceivers } from '@/utils/directedMessageDefaults';

const props = defineProps({
  conversationType: {
    type: String,
    required: true,
  },
  conversationId: {
    type: String,
    default: '',
    required: true,
  },
  deliverOnlineOnlyOptions: {
    type: Object,
    default: () => ({}),
  },
});

const { conversationType, conversationId, deliverOnlineOnlyOptions } =
  toRefs(props);
const store = useStore();
const { setUserInfoExt } = useUserInfoExt();

const dialogVisible = ref(false);
const sending = ref(false);
const receiverInput = ref('');
const form = ref({
  content: '这是一条定向消息',
});

const receiverList = computed(() => normalizeReceiverList(receiverInput.value));

const receiverPlaceholder = computed(
  () => '输入用户 ID，使用逗号、空格或换行分隔',
);

const receiverLabel = computed(() =>
  conversationType.value === CONVERSATION_TYPE.CHATROOM
    ? '聊天室成员'
    : '群组成员',
);

const getCachedMembers = () => {
  if (!conversationId.value) {
    return [];
  }
  if (conversationType.value === CONVERSATION_TYPE.GROUP) {
    return store.getters.getGroupMembersMap.get(conversationId.value) || [];
  }
  if (conversationType.value === CONVERSATION_TYPE.CHATROOM) {
    return store.getters.getChatroomMembersMap.get(String(conversationId.value)) || [];
  }
  return [];
};

const fetchChatroomMembers = async () => {
  const allMembers = [];
  let cursor = '';

  do {
    const res = await requireManager('chatRoomManager')
      .getChatRoom(conversationId.value)
      .getMembers({
      cursor,
      pageSize: 50,
    });
    allMembers.push(...res.items);
    if (res.hasMore && !res.cursor) {
      throw new Error('SDK 5.0 ChatRoom.getMembers returned hasMore without cursor');
    }
    cursor = res.hasMore ? res.cursor : '';
  } while (cursor);

  store.commit('SET_CHATROOM_MEMBERS', {
    chatRoomId: conversationId.value,
    members: allMembers,
  });

  return allMembers;
};

const fetchGroupMembers = async () => {
  const members = [];
  let cursor = '';

  do {
    const result = await requireManager('groupManager').getGroup(conversationId.value).getMembers({
      cursor,
      pageSize: 50,
    });
    members.push(...(result?.items || []));
    cursor = result?.cursor || '';
  } while (cursor);

  return members;
};

const ensureMembersLoaded = async () => {
  const cachedMembers = getCachedMembers();
  if (cachedMembers.length > 0) {
    return cachedMembers;
  }

  if (!conversationId.value) {
    return [];
  }

  if (conversationType.value === CONVERSATION_TYPE.GROUP) {
    return fetchGroupMembers();
  }

  if (conversationType.value === CONVERSATION_TYPE.CHATROOM) {
    try {
      return await fetchChatroomMembers();
    } catch (error) {
      console.error('获取聊天室成员失败', error);
      return [];
    }
  }

  return [];
};

const populateDefaultReceivers = async () => {
  if (
    !conversationId.value ||
    (conversationType.value !== CONVERSATION_TYPE.GROUP &&
      conversationType.value !== CONVERSATION_TYPE.CHATROOM)
  ) {
    receiverInput.value = '';
    return;
  }

  const members = await ensureMembersLoaded();
  const defaults = getDefaultDirectedReceivers({
    currentUserId: getCurrentUserId(),
    existingReceivers: receiverList.value,
    members,
  });
  receiverInput.value = defaults.join('\n');
};

watch(
  () => [dialogVisible.value, conversationId.value, conversationType.value],
  async ([visible]) => {
    if (!visible) {
      return;
    }
    await populateDefaultReceivers();
  },
);

const resetForm = () => {
  form.value.content = '这是一条定向消息';
  receiverInput.value = '';
};

const closeDialog = () => {
  dialogVisible.value = false;
};

const onDialogClose = () => {
  resetForm();
};

const openDialog = async () => {
  dialogVisible.value = true;
  await populateDefaultReceivers();
};

const sendDirectedMessage = async () => {
  const content = (form.value.content || '').trim();
  if (!content) {
    ElMessage.warning('请输入消息内容');
    return;
  }

  if (!conversationId.value) {
    ElMessage.error('请先选择聊天对象');
    return;
  }

  if (
    conversationType.value !== CONVERSATION_TYPE.GROUP &&
    conversationType.value !== CONVERSATION_TYPE.CHATROOM
  ) {
    ElMessage.error('当前会话类型不支持定向消息');
    return;
  }

  if (receiverList.value.length === 0) {
    ElMessage.warning('请至少输入一个定向接收成员');
    return;
  }

  const messageOptions = {
    conversationId: conversationId.value,
    conversationType: conversationType.value,
    ...deliverOnlineOnlyOptions.value,
    content,
    receiverList: receiverList.value,
    ext: {},
  };
  setUserInfoExt(messageOptions);
  console.log('[Directed Message] 准备发送定向消息', {
    conversationId: conversationId.value,
    conversationType: conversationType.value,
    receiverCount: receiverList.value.length,
    receiverList: receiverList.value,
    sdkOptions: messageOptions,
  });

  sending.value = true;
  try {
    const messageToSend = createMessage('text', messageOptions);
    const sentMessage = await sendMessage(messageToSend);
    await store.dispatch('senedShowTypeMessage', sentMessage);
    ElMessage.success('定向消息发送成功');
    closeDialog();
    resetForm();
  } catch (error) {
    console.error('发送定向消息失败', error);
    notifySdkSendError(error);
  } finally {
    sending.value = false;
  }
};

defineExpose({
  dialogVisible,
  openDialog,
});
</script>

<style lang="scss" scoped>
.directed-message-hint {
  margin-top: -8px;
  color: #909399;
  font-size: 12px;
  line-height: 18px;
}

.directed-message-form {
  :deep(.el-textarea__inner) {
    border-radius: 4px;
  }
}
</style>
