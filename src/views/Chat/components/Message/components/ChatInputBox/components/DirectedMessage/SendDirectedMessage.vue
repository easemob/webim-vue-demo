<template>
  <el-dialog
    custom-class="setting_func_diglog"
    v-model="dialogVisible"
    title="发送定向消息"
    width="520px"
    @close="onDialogClose"
  >
    <el-form label-position="top" class="directed-msg-form">
      <el-form-item label="消息内容" required>
        <el-input
          v-model="form.msg"
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
      <div class="directed-msg-hint">
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
import { CHAT_TYPE } from '@/IM/constant';
import { useUserInfoExt } from '@/hooks';
import { notifySdkSendError } from '@/utils/handleSomeData';
import {
  appendDirectedMessageOptions,
  normalizeReceiverList,
} from '@/utils/directedMessage';
import { getDefaultDirectedReceivers } from '@/utils/directedMessageDefaults';
import { normalizeChatroomMembers } from '@/utils/chatroomMembers';

const props = defineProps({
  chatType: {
    type: String,
    required: true,
  },
  targetId: {
    type: String,
    default: '',
    required: true,
  },
  deliverOnlineOnlyOptions: {
    type: Object,
    default: () => ({}),
  },
});

const { chatType, targetId, deliverOnlineOnlyOptions } = toRefs(props);
const store = useStore();
const { setUserInfoExt } = useUserInfoExt();

const dialogVisible = ref(false);
const sending = ref(false);
const receiverInput = ref('');
const form = ref({
  msg: '这是一条定向消息',
});

const receiverList = computed(() => normalizeReceiverList(receiverInput.value));

const receiverPlaceholder = computed(
  () => '输入用户 ID，使用逗号、空格或换行分隔',
);

const receiverLabel = computed(() =>
  chatType.value === CHAT_TYPE.CHATROOM ? '聊天室成员' : '群组成员',
);

const getCachedMembers = () => {
  if (!targetId.value) {
    return [];
  }
  if (chatType.value === CHAT_TYPE.GROUP) {
    return store.getters.getGroupMembersMap.get(targetId.value) || [];
  }
  if (chatType.value === CHAT_TYPE.CHATROOM) {
    return store.getters.getChatroomMembersMap.get(String(targetId.value)) || [];
  }
  return [];
};

const fetchChatroomMembers = async () => {
  const allMembers = [];
  let cursor = '';

  do {
    const res = await requireManager('chatRoomManager').getMemberList({
      chatRoomId: targetId.value,
      cursor,
      pageSize: 50,
    });
    const pageMembers = Array.isArray(res?.items) ? res.items : [];
    allMembers.push(...normalizeChatroomMembers(pageMembers));
    cursor = res?.cursor || '';
  } while (cursor);

  store.commit('SET_CHATROOM_MEMBERS', {
    chatRoomId: targetId.value,
    members: allMembers,
  });

  return allMembers;
};

const ensureMembersLoaded = async () => {
  const cachedMembers = getCachedMembers();
  if (cachedMembers.length > 0) {
    return cachedMembers;
  }

  if (!targetId.value) {
    return [];
  }

  if (chatType.value === CHAT_TYPE.GROUP) {
    await store.dispatch('fetchGroupsMemberFromServer', {
      groupId: targetId.value,
      chatType: chatType.value,
    });
    return getCachedMembers();
  }

  if (chatType.value === CHAT_TYPE.CHATROOM) {
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
    !targetId.value ||
    (chatType.value !== CHAT_TYPE.GROUP &&
      chatType.value !== CHAT_TYPE.CHATROOM)
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
  () => [dialogVisible.value, targetId.value, chatType.value],
  async ([visible]) => {
    if (!visible) {
      return;
    }
    await populateDefaultReceivers();
  },
);

const resetForm = () => {
  form.value.msg = '这是一条定向消息';
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
  const msg = (form.value.msg || '').trim();
  if (!msg) {
    ElMessage.warning('请输入消息内容');
    return;
  }

  if (!targetId.value) {
    ElMessage.error('请先选择聊天对象');
    return;
  }

  if (
    chatType.value !== CHAT_TYPE.GROUP &&
    chatType.value !== CHAT_TYPE.CHATROOM
  ) {
    ElMessage.error('当前会话类型不支持定向消息');
    return;
  }

  if (receiverList.value.length === 0) {
    ElMessage.warning('请至少输入一个定向接收成员');
    return;
  }

  const msgOptions = {
    to: targetId.value,
    chatType: chatType.value,
    ...deliverOnlineOnlyOptions.value,
    msg,
    receiverList: receiverList.value,
    ext: {},
  };
  setUserInfoExt(msgOptions);
  console.log('[Directed Message] 准备发送定向消息', {
    targetId: targetId.value,
    chatType: chatType.value,
    receiverCount: receiverList.value.length,
    receiverList: receiverList.value,
    sdkOptions: msgOptions,
  });

  sending.value = true;
  try {
    const message = createMessage('txt', msgOptions);
    const sentMessage = await sendMessage(message, {
      ...deliverOnlineOnlyOptions.value,
    });
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
.directed-msg-hint {
  margin-top: -8px;
  color: #909399;
  font-size: 12px;
  line-height: 18px;
}

.directed-msg-form {
  :deep(.el-textarea__inner) {
    border-radius: 4px;
  }
}
</style>
