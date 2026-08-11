<template>
  <input
    ref="uploadFiles"
    type="file"
    style="display: none"
    @change="sendFilesMessages"
    single
  />
</template>

<script setup>
import { ref, toRefs } from 'vue';
import { createMessage, sendMessage } from '@/IM/sdk5/chat';
import { CONVERSATION_TYPE } from '@/IM/constant';
import { notifySdkSendError } from '@/utils/handleSomeData';
import { useUserInfoExt } from '@/hooks';
import store from '@/store';
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
const emit = defineEmits(['onStartLoading', 'onLoadending']);
const PRESET_FILE_PATH = '/resource/loadtest-ngi.jmx';
//选择文件
const uploadFiles = ref(null);
const openChooseFiles = () => {
  uploadFiles.value.click();
};
//发送文件
const { setUserInfoExt } = useUserInfoExt();
const sendFileMessage = async (commonFile) => {
  if (!conversationId.value) {
    console.error('发送文件消息失败: 缺少目标ID');
    ElMessage.error('发送文件消息失败: 请先选择聊天对象');
    return;
  }

  if (!commonFile) {
    return;
  }

  // 增加文件大小检查，避免发送过大文件触发服务器413错误
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  if (commonFile.size > MAX_FILE_SIZE) {
    ElMessage.error('文件大小不能超过100MB');
    if (uploadFiles.value) {
      uploadFiles.value.value = null;
    }
    return;
  }

  const messageOptions = {
    conversationId: conversationId.value,
    conversationType: conversationType.value,
    ...(isChatThread.value ? { isChatThread: true } : {}),
    ...deliverOnlineOnlyOptions.value,
    data: commonFile,
    filename: commonFile.name,
    filetype: commonFile.type,
    fileSize: commonFile.size,
    onFileUploadError: (error) => {
      console.error('文件上传失败:', error);
      notifySdkSendError(error);
      emit('onLoadending');
    },
    onFileUploadProgress: (e) => {
      // 图片文件上传进度。
      console.log('[Message Upload] file progress', {
        conversationId: conversationId.value,
        conversationType: conversationType.value,
        fileName: commonFile.name,
        loaded: e?.loaded,
        total: e?.total,
      });
      emit('onStartLoading');
    },
    onFileUploadComplete: () => {
      // 上传成功。
      emit('onLoadending');
    },
  };
  //在消息体内携带该用户的昵称头像信息
  setUserInfoExt(messageOptions);
  try {
    const messageToSend = createMessage('file', messageOptions);
    const message = await sendMessage(messageToSend, {
      onFileUploadError: messageOptions.onFileUploadError,
      onFileUploadProgress: messageOptions.onFileUploadProgress,
      onFileUploadComplete: messageOptions.onFileUploadComplete,
    });
    store.dispatch('senedShowTypeMessage', message);
  } catch (error) {
    console.error('发送文件消息失败:', {
      conversationId: conversationId.value,
      conversationType: conversationType.value,
      fileName: commonFile.name,
      error,
    });
    notifySdkSendError(error);
  } finally {
    if (uploadFiles.value) {
      uploadFiles.value.value = null;
    }
  }
};

const sendFilesMessages = async () => {
  const commonFile = uploadFiles.value?.files?.[0];
  await sendFileMessage(commonFile);
};

const sendPresetFile = async () => {
  try {
    emit('onStartLoading');
    const response = await fetch(PRESET_FILE_PATH);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const commonFile = new File([blob], 'loadtest-ngi.jmx', {
      type: blob.type || 'application/xml',
    });
    await sendFileMessage(commonFile);
  } catch (error) {
    console.error('发送预置文件失败:', error);
    ElMessage.error('发送文件失败，无法加载 resource/loadtest-ngi.jmx');
  } finally {
    emit('onLoadending');
  }
};

defineExpose({
  openChooseFiles,
  sendPresetFile,
});
</script>

<style lang="scss" scoped></style>
