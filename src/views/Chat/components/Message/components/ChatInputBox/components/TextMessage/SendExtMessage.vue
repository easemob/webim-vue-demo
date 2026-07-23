<template>
  <el-dialog
    custom-class="setting_func_diglog"
    v-model="dialogVisible"
    title="发送扩展消息"
    width="500px"
    @close="onDialogClose"
  >
    <el-form label-position="top" class="ext-msg-form">
      <el-form-item label="文本内容" required>
        <el-input
          v-model="form.msg"
          type="textarea"
          :rows="3"
          placeholder="请输入消息内容"
        />
      </el-form-item>
      <el-form-item label="消息扩展 (ext，JSON 格式)">
        <el-input
          v-model="form.extStr"
          type="textarea"
          :rows="6"
          placeholder='例如：{"key1":"value1","key2":{"key3":"value3"}}'
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" :loading="sending" @click="sendExtMessage">
          发送
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, toRefs } from 'vue';
import { ElMessage } from 'element-plus';
import store from '@/store';
import { createMessage, sendMessage } from '@/IM/sdk5/chat';
import { useUserInfoExt } from '@/hooks';
import { notifySdkSendError } from '@/utils/handleSomeData';

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
  isChatThread: {
    type: Boolean,
    default: false,
  },
  deliverOnlineOnlyOptions: {
    type: Object,
    default: () => ({}),
  },
});

const { chatType, targetId, isChatThread, deliverOnlineOnlyOptions } =
  toRefs(props);
const { setUserInfoExt } = useUserInfoExt();

const dialogVisible = ref(false);
const sending = ref(false);
const form = ref({
  msg: 'message content',
  extStr: '{"key1":"Self-defined value1","key2":{"key3":"Self-defined value3"}}',
});

const closeDialog = () => {
  dialogVisible.value = false;
};

const onDialogClose = () => {
  form.value.msg = 'message content';
  form.value.extStr =
    '{"key1":"Self-defined value1","key2":{"key3":"Self-defined value3"}}';
};

const sendExtMessage = async () => {
  const msg = (form.value.msg || '').trim();
  if (!msg) {
    ElMessage.warning('请输入消息内容');
    return;
  }
  if (!targetId.value) {
    ElMessage.error('请先选择聊天对象');
    return;
  }

  let ext;
  if (form.value.extStr && form.value.extStr.trim()) {
    try {
      ext = JSON.parse(form.value.extStr.trim());
    } catch (error) {
      ElMessage.warning('消息扩展 (ext) 必须是合法 JSON 格式');
      return;
    }
    if (
      ext == null ||
      typeof ext !== 'object' ||
      Array.isArray(ext) ||
      Object.keys(ext).length === 0
    ) {
      ElMessage.warning('消息扩展 (ext) 不能为空对象');
      return;
    }
  } else {
    ElMessage.warning('消息扩展 (ext) 不能为空');
    return;
  }

  const msgOptions = {
    to: targetId.value,
    chatType: chatType.value,
    ...(isChatThread.value ? { isChatThread: true } : {}),
    msg,
    ext,
  };
  setUserInfoExt(msgOptions);

  sending.value = true;
  try {
    const message = createMessage('txt', msgOptions);
    const sentMessage = await sendMessage(message, deliverOnlineOnlyOptions.value);
    await store.dispatch('senedShowTypeMessage', sentMessage);
    ElMessage.success('扩展消息发送成功');
    closeDialog();
    onDialogClose();
  } catch (error) {
    console.error('发送扩展消息失败', error);
    notifySdkSendError(error);
  } finally {
    sending.value = false;
  }
};

const openDialog = () => {
  dialogVisible.value = true;
};

defineExpose({
  openDialog,
  dialogVisible,
});
</script>

<style lang="scss" scoped>
.ext-msg-form {
  :deep(.el-textarea__inner) {
    border-radius: 4px;
  }
}
</style>
