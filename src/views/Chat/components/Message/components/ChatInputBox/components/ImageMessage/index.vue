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
import { EMClient } from '@/IM';
import { MESSAGE_TYPE, CHAT_TYPE } from '@/IM/constant';
import { handleSDKErrorNotifi } from '@/utils/handleSomeData';
import { useUserInfoExt } from '@/hooks';
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
const uploadImgs = ref(null);
const openChooseImages = () => {
  uploadImgs.value.click();
};
//发送图片
const { setUserInfoExt } = useUserInfoExt();
const sendImagesMessage = async (type, fileObj) => {
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
  //在消息体内携带该用户的昵称头像信息
  setUserInfoExt(msgOptions);
  //读取图片的宽高
  const imgFile = uploadImgs.value.files[0];
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
      if (error.type && error?.data) {
        handleSDKErrorNotifi(error.type, error.data.error || 'none');
      } else {
        handleSDKErrorNotifi(0, 'none');
      }
    }
  };
};
defineExpose({
  openChooseImages,
});
</script>

<style lang="scss" scoped></style>
