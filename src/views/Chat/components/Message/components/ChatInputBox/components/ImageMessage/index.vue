<template>
  <input
    ref="uploadImgs"
    type="file"
    style="display: none"
    @change="sendImagesMessage('common')"
    single
    accept="image/*"
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
const uploadImgs = ref(null);
const PRESET_IMAGE_PATH = '/resource/image_1080p.jpg';
const openChooseImages = () => {
  uploadImgs.value.click();
};
//发送图片
const { setUserInfoExt } = useUserInfoExt();
const sendImageFile = async (imgFile) => {
  if (!conversationId.value) {
    console.error('发送图片消息失败: 缺少目标ID');
    ElMessage.error('发送图片消息失败: 请先选择聊天对象');
    return;
  }

  const url = window.URL || window.webkitURL;
  const img = new Image(); //手动创建一个Image对象
  const messageOptions = {
    conversationId: conversationId.value,
    conversationType: conversationType.value,
    ...(isChatThread.value ? { isChatThread: true } : {}),
    data: imgFile,
    filename: imgFile?.name,
    filetype: imgFile?.type,
    width: 0,
    height: 0,
    onFileUploadError: (error) => {
      console.error('图片上传失败:', error);
      notifySdkSendError(error);
      emit('onLoadending');
    },
    onFileUploadProgress: (e) => {
      // 图片文件上传进度。
      console.log('[Message Upload] image progress', {
        conversationId: conversationId.value,
        conversationType: conversationType.value,
        fileName: imgFile?.name,
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
  //读取图片的宽高
  if (!imgFile) {
    return;
  }

  // 增加文件大小检查，避免发送过大文件
  const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
  if (imgFile.size > MAX_IMAGE_SIZE) {
    ElMessage.error('图片大小不能超过20MB');
    uploadImgs.value.value = null;
    return;
  }

  img.src = url.createObjectURL(imgFile); //创建Image的对象的url
  img.onload = async () => {
    messageOptions.width = img.width;
    messageOptions.height = img.height;
    try {
      const messageToSend = createMessage('image', messageOptions);
      const message = await sendMessage(messageToSend, {
        ...deliverOnlineOnlyOptions.value,
        onFileUploadError: messageOptions.onFileUploadError,
        onFileUploadProgress: messageOptions.onFileUploadProgress,
        onFileUploadComplete: messageOptions.onFileUploadComplete,
      });
      store.dispatch('senedShowTypeMessage', message);
    } catch (error) {
      notifySdkSendError(error);
    }
  };
};

const sendImagesMessage = async () => {
  const imgFile = uploadImgs.value?.files?.[0];
  if (!imgFile) {
    return;
  }
  await sendImageFile(imgFile);
};

const sendPresetImage = async () => {
  try {
    emit('onStartLoading');
    const response = await fetch(PRESET_IMAGE_PATH);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const imgFile = new File([blob], 'image_1080p.jpg', {
      type: blob.type || 'image/jpeg',
    });
    await sendImageFile(imgFile);
  } catch (error) {
    console.error('发送预置图片失败:', error);
    ElMessage.error('发送图片失败，无法加载 resource/image_1080p.jpg');
  } finally {
    emit('onLoadending');
  }
};
defineExpose({
  openChooseImages,
  sendPresetImage,
});
</script>

<style lang="scss" scoped></style>
