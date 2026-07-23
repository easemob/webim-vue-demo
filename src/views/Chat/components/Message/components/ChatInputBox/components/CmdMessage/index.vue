<template>
  <el-dialog
    custom-class="setting_func_diglog"
    v-model="dialogVisible"
    title="发送透传消息"
    width="500px"
    @close="onDialogClose"
  >
    <el-form :model="form" label-width="80px" label-position="top" class="cmd-form">
      <el-form-item label="自定义动作 (action)" required>
        <el-input
          v-model="form.action"
          placeholder="请输入 action，例如：action"
          clearable
          class="cmd-input-rect"
        />
      </el-form-item>
      <el-form-item label="扩展信息 (ext，可选，JSON 格式)">
        <el-input
          v-model="form.extStr"
          type="textarea"
          :rows="4"
          placeholder='例如：{"key": "extends messages"}'
          class="cmd-textarea-rect"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" :loading="sending" @click="sendCmdMessage">
          发送
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, toRefs } from 'vue';
import store from '@/store';
import { ElMessage } from 'element-plus';
import { useUserInfoExt } from '@/hooks';
import { createMessage, sendMessage } from '@/IM/sdk5/chat';
import { notifySdkSendError } from '@/utils/handleSomeData';

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
  isChatThread: {
    type: Boolean,
    default: false,
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
  deliverOnlineOnlyOptions,
} =
  toRefs(props);

const dialogVisible = ref(false);
const sending = ref(false);

const form = ref({
  action: 'action',
  extStr: '{"key": "extends messages"}',
});

const closeDialog = () => {
  dialogVisible.value = false;
};

const onDialogClose = () => {
  form.value.action = 'action';
  form.value.extStr = '{"key": "extends messages"}';
};

const { setUserInfoExt } = useUserInfoExt();

const sendCmdMessage = async () => {
  const action = (form.value.action || '').trim();
  if (!action) {
    ElMessage.warning('请输入自定义动作 (action)');
    return;
  }

  let ext = {};
  if (form.value.extStr && form.value.extStr.trim()) {
    try {
      ext = JSON.parse(form.value.extStr.trim());
    } catch (e) {
      ElMessage.warning('扩展信息 (ext) 必须是合法 JSON 格式');
      return;
    }
  }

  if (!conversationId.value) {
    ElMessage.error('请先选择聊天对象');
    return;
  }

  const messageOptions = {
    conversationType: conversationType.value,
    conversationId: conversationId.value,
    ...(isChatThread.value ? { isChatThread: true } : {}),
    ...deliverOnlineOnlyOptions.value,
    action,
    ext,
  };
  setUserInfoExt(messageOptions);

  sending.value = true;
  try {
    const messageToSend = createMessage('cmd', messageOptions);
    const message = await sendMessage(messageToSend, deliverOnlineOnlyOptions.value);
    console.log('[Message Send] cmd success', {
      messageId: message.msgServerId || message.msgLocalId,
      conversationId: message.conversationId,
      conversationType: message.conversationType,
      action,
      displayMessage: message,
    });
    await store.dispatch('senedShowTypeMessage', message);
    ElMessage.success('透传消息发送成功');
    closeDialog();
    onDialogClose();
  } catch (error) {
    console.error('发送透传消息失败', error);
    notifySdkSendError(error);
  } finally {
    sending.value = false;
  }
};

const openDialog = () => {
  dialogVisible.value = true;
};

defineExpose({
  dialogVisible,
  openDialog,
});
</script>

<style lang="scss" scoped>
/* 透传消息弹窗内输入框为长方形 */
:deep(.cmd-input-rect .el-input__wrapper),
:deep(.cmd-textarea-rect .el-textarea__inner) {
  border-radius: 0;
  border: 1px solid #dcdfe6;
  box-shadow: none;
}
:deep(.cmd-input-rect .el-input__wrapper:hover),
:deep(.cmd-textarea-rect .el-textarea__inner:hover) {
  border-color: #c0c4cc;
}
:deep(.cmd-input-rect .el-input__wrapper.is-focus),
:deep(.cmd-textarea-rect .el-textarea__inner:focus) {
  border-color: #409eff;
  box-shadow: none;
}
:deep(.cmd-textarea-rect .el-textarea__inner) {
  min-height: 100px;
  padding: 8px 12px;
}
</style>
