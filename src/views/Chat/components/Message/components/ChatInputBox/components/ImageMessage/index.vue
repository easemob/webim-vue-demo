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
const uploadImgs = ref(null);
const PRESET_IMAGE_PATH = '/resource/image_1080p.jpg';
const openChooseImages = () => {
  uploadImgs.value.click();
};
//发送图片
const { setUserInfoExt } = useUserInfoExt();
const sendImageFile = async (imgFile) => {
  //验证targetId是否有效
  if (!targetId.value || targetId.value === '') {
    console.error('发送图片消息失败: 缺少目标ID');
    ElMessage.error('发送图片消息失败: 请先选择聊天对象');
    return;
  }

  const file = {
    data: null, // file 对象。
    filename: '', //文件名称。
    filetype: '', //文件类型。
  };
  const url = window.URL || window.webkitURL;
  const img = new Image(); //手动创建一个Image对象
  const msgOptions = {
    to: targetId.value,
    chatType: chatType.value,
    ...(isChatThread.value ? { isChatThread: true } : {}),
    file: file,
    width: 0,
    height: 0,
    onFileUploadError: (error) => {
      // 被拉黑等错误常在上传阶段返回，不会进入 send 的 catch，需走统一 SDK 错误解析
      console.error('图片上传失败:', error);
      if (
        error?.type === 413 ||
        error?.data?.error === 'Request Entity Too Large'
      ) {
        ElMessage.error('图片大小超过服务器限制');
      } else {
        notifySdkSendError(error);
      }
      emit('onLoadending');
    },
    onFileUploadProgress: (e) => {
      // 图片文件上传进度。
      console.log('[Message Upload] image progress', {
        targetId: targetId.value,
        chatType: chatType.value,
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
  setUserInfoExt(msgOptions);
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

  file.data = imgFile;
  file.filename = imgFile.name;
  file.filetype = imgFile.type;
  img.src = url.createObjectURL(imgFile); //创建Image的对象的url
  img.onload = async () => {
    msgOptions.width = img.width;
    msgOptions.height = img.height;
    try {
      const msg = createMessage('img', msgOptions);
      const message = await sendMessage(msg, {
        ...deliverOnlineOnlyOptions.value,
        onFileUploadError: msgOptions.onFileUploadError,
        onFileUploadProgress: msgOptions.onFileUploadProgress,
        onFileUploadComplete: msgOptions.onFileUploadComplete,
      });
      store.dispatch('senedShowTypeMessage', { ...message });
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
