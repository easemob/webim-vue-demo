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
//选择文件
const uploadFiles = ref(null);
const openChooseFiles = () => {
  uploadFiles.value.click();
};
//发送文件
const { setUserInfoExt } = useUserInfoExt();
const sendFilesMessages = async () => {
  const commonFile = uploadFiles.value.files[0];
  const file = {
    data: commonFile, // file 对象。
    filename: commonFile.name, //文件名称。
    filetype: commonFile.type, //文件类型。
    size: commonFile.size,
  };

  const msgOptions = {
    type: MESSAGE_TYPE.FILE,
    from: EMClient.user,
    to: targetId.value,
    chatType: chatType.value,
    file: file,
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
  try {
    const msg = EMClient.Message.create(msgOptions);
    const { message } = await EMClient.send(msg);
    console.log('message', message);
    store.dispatch('senedShowTypeMessage', { ...message });
  } catch (error) {
    if (error.type && error?.data) {
      handleSDKErrorNotifi(error.type, error.data.error || 'none');
    } else {
      handleSDKErrorNotifi(0, 'none');
    }
  } finally {
    uploadFiles.value.value = null;
  }
};

defineExpose({
  openChooseFiles,
});
</script>

<style lang="scss" scoped></style>
