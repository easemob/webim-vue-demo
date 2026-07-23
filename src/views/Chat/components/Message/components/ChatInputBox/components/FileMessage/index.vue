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
import { CHAT_TYPE } from '@/IM/constant';
import { notifySdkSendError } from '@/utils/handleSomeData';
import { useUserInfoExt } from '@/hooks';
import store from '@/store';
import { ElMessage } from 'element-plus';
const props = defineProps({
  chatType: {
    type: String,
    default: CHAT_TYPE.SINGLE,
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
  //验证targetId是否有效
  if (!targetId.value || targetId.value === '') {
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

  const file = {
    data: commonFile, // file 对象。
    filename: commonFile.name, //文件名称。
    filetype: commonFile.type, //文件类型。
    size: commonFile.size,
  };

  const msgOptions = {
    to: targetId.value,
    chatType: chatType.value,
    ...(isChatThread.value ? { isChatThread: true } : {}),
    file: file,
    onFileUploadError: (error) => {
      console.error('文件上传失败:', error);
      if (
        error?.type === 413 ||
        error?.data?.error === 'Request Entity Too Large'
      ) {
        ElMessage.error('文件大小超过服务器限制');
      } else {
        notifySdkSendError(error);
      }
      emit('onLoadending');
    },
    onFileUploadProgress: (e) => {
      // 图片文件上传进度。
      console.log('[Message Upload] file progress', {
        targetId: targetId.value,
        chatType: chatType.value,
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
  setUserInfoExt(msgOptions);
  try {
    const msg = createMessage('file', msgOptions);
    const message = await sendMessage(msg, {
      ...deliverOnlineOnlyOptions.value,
      onFileUploadError: msgOptions.onFileUploadError,
      onFileUploadProgress: msgOptions.onFileUploadProgress,
      onFileUploadComplete: msgOptions.onFileUploadComplete,
    });
    store.dispatch('senedShowTypeMessage', { ...message });
  } catch (error) {
    console.error('发送文件消息失败:', {
      targetId: targetId.value,
      chatType: chatType.value,
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
