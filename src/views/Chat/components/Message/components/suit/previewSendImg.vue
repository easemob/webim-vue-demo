<script setup>
import { ref, toRefs } from 'vue';
import { EMClient } from '@/IM';
import { MESSAGE_TYPE, CHAT_TYPE } from '@/IM/constant';
import { handleSDKErrorNotifi } from '@/utils/handleSomeData';
import store from '@/store';
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
});
const { chatType, targetId } = toRefs(props);
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
  // if (type === 'other') {
  const file = {
    data: null, // file 对象。
    filename: '', //文件名称。
    filetype: '', //文件类型。
  };
  const url = window.URL || window.webkitURL;
  const img = new Image(); //手动创建一个Image对象
  const msgOptions = {
    type: MESSAGE_TYPE.IMAGE,
    to: targetId.value,
    chatType: chatType.value,
    file: file,
    width: 0,
    height: 0,
    from: EMClient.user,
    onFileUploadError: () => {
      // 图片文件上传失败。
      console.log('onFileUploadError');
      emit('onLoadending');
    },
    onFileUploadProgress: (e) => {
      // 图片文件上传进度。
      console.log(e);
      emit('onStartLoading');
    },
    onFileUploadComplete: () => {
      // 上传成功。
      emit('onLoadending');
    },
  };
  const imgFile = fileObj;
  file.data = imgFile;
  file.filename = imgFile.name;
  file.filetype = imgFile.type;

  img.src = url.createObjectURL(imgFile); //创建Image的对象的url
  img.onload = async () => {
    msgOptions.width = img.width;
    msgOptions.height = img.height;
    try {
      const msg = EMClient.Message.create(msgOptions);
      const { message } = await EMClient.send(msg);
      store.dispatch('senedShowTypeMessage', { ...message });
    } catch (error) {
      console.log('>>>>>>error', error);
      if (error.type && error?.data) {
        handleSDKErrorNotifi(error.type, error.data.error || 'none');
      } else {
        handleSDKErrorNotifi(0, 'none');
      }
    }
  };
  // }
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
