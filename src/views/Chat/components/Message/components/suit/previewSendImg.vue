<script setup>
import { ref, toRefs } from 'vue';
import { createMessage, sendMessage } from '@/IM/sdk5/chat';
import { CONVERSATION_TYPE } from '@/IM/constant';
import { notifySdkSendError } from '@/utils/handleSomeData';
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
import fileSizeFormat from '@/utils/fileSizeFormat';
let fileObj = null;
const imgPaths = ref('');
const imgName = ref('');
const imgSize = ref('');
const dialogTableVisible = ref(false);
const showPreviewImgModal = (imgObj) => {
  imgPaths.value = imgObj.tempFilePath;
  imgName.value = imgObj.imgFile.name;
  imgSize.value = imgObj.imgFile.size;
  fileObj = imgObj.imgFile;
  dialogTableVisible.value = true;
};
const sendTheImg = () => {
  // emits('sendImagesMessage', 'other', fileObj)
  dialogTableVisible.value = false;
  sendImagesMessage();
};
const sendImagesMessage = () => {
  const url = window.URL || window.webkitURL;
  const img = new Image(); //手动创建一个Image对象
  const messageOptions = {
    conversationId: conversationId.value,
    conversationType: conversationType.value,
    ...(isChatThread.value ? { isChatThread: true } : {}),
    data: fileObj,
    filename: fileObj?.name,
    filetype: fileObj?.type,
    width: 0,
    height: 0,
    onFileUploadError: (error) => {
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
        conversationId: conversationId.value,
        conversationType: conversationType.value,
        fileName: fileObj?.name,
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
  const imgFile = fileObj;

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
      console.error('发送图片消息失败:', {
        conversationId: conversationId.value,
        conversationType: conversationType.value,
        fileName: imgFile?.name,
        error,
      });
      notifySdkSendError(error);
    }
  };
};
defineExpose({
  showPreviewImgModal,
});
</script>
<template>
  <el-dialog v-model="dialogTableVisible" title="发送图片" width="300px">
    <el-image class="img_box" :src="imgPaths">
      <template #placeholder>
        <div class="image-slot">Loading<span class="dot">...</span></div>
      </template>
    </el-image>
    <div class="img_infos">
      <span class="img_name">{{ imgName }}</span>
      <span class="img_size">{{ fileSizeFormat(imgSize) }}</span>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogTableVisible = false">取消</el-button>
        <el-button type="primary" @click="sendTheImg"> 发送 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.img_box {
  max-width: 500px;
}

.img_infos {
  margin: 7px;
  line-height: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .img_name {
    font-size: 17px;
    font-weight: bold;
  }

  .img_size {
    font-size: 13px;
    font-weight: 400;
  }
}
</style>
