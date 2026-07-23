<template>
  <el-dialog
    custom-class="setting_func_diglog"
    v-model="dialogVisible"
    title="发送自定义消息"
    width="500px"
    @close="onDialogClose"
  >
    <el-form label-position="top" class="custom-message-form">
      <el-form-item label="自定义事件 (event)" required>
        <el-input
          v-model="form.event"
          placeholder="event"
          clearable
          class="custom-input-rect"
        />
      </el-form-item>
      <el-form-item label="自定义内容 (params，JSON，key/value 仅支持字符串)">
        <el-input
          v-model="form.paramsStr"
          type="textarea"
          :rows="4"
          placeholder='例如：{"key1": "value1", "key2": "value2"}'
          class="custom-textarea-rect"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" :loading="sending" @click="sendCustomMessage">
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
  event: 'event',
  paramsStr: '{"key": "value"}',
});

const closeDialog = () => {
  dialogVisible.value = false;
};

const onDialogClose = () => {
  form.value.event = 'event';
  form.value.paramsStr = '{"key": "value"}';
};

// SDK 5.0 body.params 的 key 和 value 仅支持字符串，将 JSON 转为纯字符串键值对
function ensureStringKeyValue(obj) {
  if (obj == null || typeof obj !== 'object') return {};
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    result[String(k)] = v == null ? '' : String(v);
  }
  return result;
}

const { setUserInfoExt } = useUserInfoExt();

const sendCustomMessage = async () => {
  const event = (form.value.event || '').trim();
  if (!event) {
    ElMessage.warning('请输入自定义事件 (event)');
    return;
  }

  let params = {};
  if (form.value.paramsStr && form.value.paramsStr.trim()) {
    try {
      const parsed = JSON.parse(form.value.paramsStr.trim());
      params = ensureStringKeyValue(parsed);
    } catch (e) {
      ElMessage.warning('自定义内容 (params) 必须是合法 JSON 格式');
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
    event,
    params,
    ext: {},
  };
  setUserInfoExt(messageOptions);

  sending.value = true;
  try {
    const messageToSend = createMessage('custom', messageOptions);
    const message = await sendMessage(messageToSend, deliverOnlineOnlyOptions.value);
    await store.dispatch('senedShowTypeMessage', message);
    ElMessage.success('自定义消息发送成功');
    closeDialog();
    onDialogClose();
  } catch (error) {
    console.error('发送自定义消息失败', error);
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
/* 自定义消息弹窗内输入框为长方形 */
:deep(.custom-input-rect .el-input__wrapper),
:deep(.custom-textarea-rect .el-textarea__inner) {
  border-radius: 0;
  border: 1px solid #dcdfe6;
  box-shadow: none;
}
:deep(.custom-input-rect .el-input__wrapper:hover),
:deep(.custom-textarea-rect .el-textarea__inner:hover) {
  border-color: #c0c4cc;
}
:deep(.custom-input-rect .el-input__wrapper.is-focus),
:deep(.custom-textarea-rect .el-textarea__inner:focus) {
  border-color: #409eff;
  box-shadow: none;
}
:deep(.custom-textarea-rect .el-textarea__inner) {
  min-height: 100px;
  padding: 8px 12px;
}
</style>
