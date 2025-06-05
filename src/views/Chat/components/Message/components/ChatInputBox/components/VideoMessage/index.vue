<template>
  <input
    ref="uploadVideo"
    type="file"
    style="display: none"
    @change="sendVideoMessage"
    single
    accept="video/*"
  />
</template>

<script setup>
import { ref, toRefs } from 'vue';
import { EMClient } from '@/IM';
import { MESSAGE_TYPE, CHAT_TYPE } from '@/IM/constant';
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
const uploadVideo = ref(null);
const openChooseVideo = () => {
  uploadVideo.value.click();
};
const { setUserInfoExt } = useUserInfoExt();
const sendVideoMessage = async (event) => {
  console.log('>>>>>>执行上传发送视频消息');
  const videoFile = uploadVideo.value?.files[0];
  if (!videoFile) return;
  const messageFileBody = {
    data: videoFile,
    filetype: videoFile.type,
    filename: videoFile.name,
  };
  const options = {
    // 消息类型。
    type: MESSAGE_TYPE.VIDEO,
    file: messageFileBody,
    // 消息接收方：单聊为对方用户 ID，群聊和聊天室分别为群组 ID 和聊天室 ID。
    to: targetId.value,
    from: EMClient.user,
    // 会话类型：单聊、群聊和聊天室分别为 `singleChat`、`groupChat` 和 `chatRoom`。
    chatType: chatType.value,
    onFileUploadError: () => {
      // 视频文件上传失败。
      console.log('onFileUploadError');
      emit('onLoadending');
    },
    onFileUploadProgress: (e) => {
      // 视频文件上传进度。
      console.log(e);
      emit('onStartLoading');
    },
    onFileUploadComplete: () => {
      // 视频文件上传成功。
      console.log('onFileUploadComplete');
      emit('onLoadending');
    },
  };
  //携带发送方昵称头像等信息
  setUserInfoExt(options);
  const msg = EMClient.Message.create(options);
  try {
    const { message } = await EMClient.send(msg);
    store.dispatch('senedShowTypeMessage', { ...message });
  } catch (error) {
    console.log('视频消息发送失败', error);
  } finally {
    uploadVideo.value.value = null;
  }
};
defineExpose({
  openChooseVideo,
});
</script>

<style lang="scss" scoped></style>
