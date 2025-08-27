<script setup>
import { ref, toRefs } from 'vue';
import { useStore } from 'vuex';
import { handleSDKErrorNotifi } from '@/utils/handleSomeData';
import { ElLoading, ElMessageBox } from 'element-plus';
import { onClickOutside } from '@vueuse/core';
import { useUserInfoExt } from '@/hooks';
import { MESSAGE_TYPE, CHAT_TYPE } from '@/IM/constant';
import _ from 'lodash';
import { EMClient } from '@/IM';
import parseDownloadResponse from '@/utils/parseDownloadResponse';
/* 组件 */
import CollectAudio from '../suit/audio.vue';
import PreviewSendImg from '../suit/previewSendImg.vue';
import MsgQuote from '../suit/msgQuote.vue';
import emojiContainer from '../suit/emojiContainer.vue';
import TextMessage from './components/TextMessage';
import VideoMessage from './components/VideoMessage';
import ImageMessage from './components/ImageMessage';
import FileMessage from './components/FileMessage';
import ShareUserCard from './components/CustomMessage/ShareUserCard.vue';
//EaseCallKit Invite
// import { useManageChannel } from '@/components/EaseCallKit/hooks';
//inviteMembers modal
// import InviteCallMembers from '@/components/InviteCallMembers';
const store = useStore();
const props = defineProps({
  routeQueryData: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      chatType: CHAT_TYPE.SINGLE,
    }),
  },
});
const { routeQueryData } = toRefs(props);
//附件类上传加载状态
const loadingBox = ref(null);
let loadingInstance = null;
const onStartLoading = () => {
  if (loadingInstance) return;
  loadingInstance = ElLoading.service({
    target: loadingBox.value,
    background: '#f7f7f7',
  });
  return loadingInstance;
};
const onLoadending = () => {
  loadingInstance?.close();
  loadingInstance = null;
};

/* 文本相关操作 */
const textMessageComp = ref(null);
const appendEmoji = (emoji) => {
  textMessageComp.value?.onAddOneEmoji(emoji);
};
/* emojis */
const emojiContainerComp = ref(null);
onClickOutside(emojiContainerComp, () => {
  emojiContainerComp.value?.handleShowEmojisBox({ isShow: false });
});
const showEmojisBox = () => {
  emojiContainerComp.value?.handleShowEmojisBox({ isShow: true });
};
//文本消息重新编辑
const handleEditTextMessage = (msg) => {
  textMessageComp.value?.onEditMessage(msg);
};
/* 消息引用 */
const messageQuoteRef = ref(null);
//暴露给messagelist组件用来设置引用消息内容
const handleQuoteMessage = (msgBody) => {
  messageQuoteRef.value && messageQuoteRef.value.setQuoteContent(msgBody);
};
const getMessageQuoteContent = (cb) => {
  cb(messageQuoteRef.value?.msgQuote);
};
const clearQuoteContent = () => {
  messageQuoteRef.value?.clearQuoteContent();
};
/* 图片消息相关 */
//选择图片
const ImageMessageComp = ref(null);
const chooseImages = () => {
  ImageMessageComp.value?.openChooseImages();
};
//贴图发送
const previewSendImg = ref(null);
//从输入框剪切板获取图片
const getImageFileFromClipboard = (items) => {
  console.log('items', items);
  const item = Array.from(items).find(
    (item) => item.kind === 'file' && item.type.startsWith('image/'),
  );
  if (item) {
    const file = item.getAsFile();
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target.result;
      // 你可以在这里处理base64String，比如显示图片或上传到服务器
      const imgInfo = {
        imgFile: file,
        tempFilePath: base64String,
      };
      previewSendImg.value.showPreviewImgModal({ ...imgInfo });
    };
    reader.readAsDataURL(file);
    return; // 提前返回，因为读取是异步的
  }
};

/* 视频消息 */
const videoMessageComp = ref(null);
const chooseVideo = () => {
  videoMessageComp.value?.openChooseVideo();
};
/* 文件消息相关 */
//选择文件
const fileMessageComp = ref(null);
const chooseFiles = () => {
  fileMessageComp.value?.openChooseFiles();
};
/* 语音消息相关 */
//展示录音对话框
const isHttps =
  window.location.protocol === 'https:' ||
  window.location.hostname === 'localhost';
const isShowRecordBox = ref(false);
const recordBox = ref(null);
onClickOutside(recordBox, () => {
  isShowRecordBox.value = false;
});
const showRecordBox = () => {
  isShowRecordBox.value = true;
};
const { setUserInfoExt } = useUserInfoExt();
const sendAudioMessages = async (audioData) => {
  const file = {
    url: parseDownloadResponse(audioData.src),
    filename: '录音',
    filetype: '.amr',
    data: audioData.src,
  };

  const msgOptions = {
    type: MESSAGE_TYPE.AUDIO,
    to: routeQueryData.value.id,
    from: EMClient.user,
    chatType: routeQueryData.value.chatType,
    file: file,
    length: audioData.length,
  };
  setUserInfoExt(msgOptions);
  try {
    const msg = EMClient.Message.create(msgOptions);
    const { message } = await EMClient.send(msg);
    store.dispatch('senedShowTypeMessage', { ...message });
    isShowRecordBox.value = false;
  } catch (error) {
    if (error.type && error?.data) {
      handleSDKErrorNotifi(error.type, error.data.error || 'none');
    } else {
      handleSDKErrorNotifi(0, 'none');
    }
    isShowRecordBox.value = false;
  }
};
/* 自定义消息-个人名片 */
const personalCardMessageComp = ref(null);
const onShowContactsModal = () => {
  personalCardMessageComp.value.dialogVisible = true;
};
/*清除屏幕*/
const clearScreen = () => {
  ElMessageBox.confirm('确认清空当前消息内容？', '消息清屏', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const key = routeQueryData.value.id;
      store.commit('CLEAR_SOMEONE_MESSAGE', key);
    })
    .catch(() => {
      return false;
    });
};
/* About EaseCallKit */
// const { CALL_TYPES, sendInviteMessage } = useManageChannel();
// //处理发起的音视频呼叫类型
// const handleInviteCall = (handleType) => {
//   const toId = routeQueryData.value.id;
//   //语音类型
//   if (handleType === 'voice') {
//     const callType = CALL_TYPES.SINGLE_VOICE;
//     sendInviteMessage(toId, callType);
//     //发送邀请信息后创建一条本地系统通知类消息上屏展示
//     const params = {
//       from: EMClient.user,
//       to: toId,
//       chatType: CHAT_TYPE.SINGLE,
//       msg: `邀请【${toId}】进行语音通话`,
//     };
//     store.dispatch('createInformMessage', params);
//   }
//   if (handleType === 'video') {
//     if (routeQueryData.value?.chatType === CHAT_TYPE.SINGLE) {
//       const callType = CALL_TYPES.SINGLE_VIDEO;
//       sendInviteMessage(toId, callType);
//       //发送邀请信息后创建一条本地系统通知类消息上屏展示
//       const params = {
//         from: EMClient.user,
//         to: toId,
//         chatType: CHAT_TYPE.SINGLE,
//         msg: `邀请【${toId}】进行视频通话`,
//       };
//       store.dispatch('createInformMessage', params);
//     } else if (routeQueryData.value?.chatType === CHAT_TYPE.GROUP) {
//       //群组则弹出多人模态框
//       showInviteCallMembersModal();
//     }
//   }
// };
// const inviteCallMembersComp = ref(null);
// //调起多人邀请组件
// const showInviteCallMembersModal = () => {
//   const groupId = routeQueryData.value.id;
//   if (groupId) {
//     inviteCallMembersComp.value.alertDialog(groupId);
//   } else {
//   }
// };
// //发送多人场景邀请信息的方法
// const sendMulitInviteMsg = (targetIMId) => {
//   const callType = CALL_TYPES.MULTI_VIDEO;
//   const groupId = routeQueryData.value.id;
//   sendInviteMessage(targetIMId, callType, groupId);
//   const params = {
//     from: EMClient.user,
//     to: groupId,
//     chatType: CHAT_TYPE.GROUP,
//     msg: '已发起多人音视频通话',
//   };
//   store.dispatch('createInformMessage', params);
// };
//func 对应事件 icon class样式等
const all_func = [
  {
    className: 'icon-icon_emoji',
    style: 'font-size:20px;margin-left: 20px;',
    title: '选择表情',
    methodName: showEmojisBox,
  },
  {
    className: 'icon-tuku',
    style: 'font-size: 26px;',
    title: '发送图片',
    methodName: chooseImages,
  },
  {
    className: 'icon-shipin',
    style: 'font-size: 20px;',
    title: '发送视频',
    methodName: chooseVideo,
  },
  {
    className: 'icon-wenjian',
    style: 'font-size: 20px;',
    title: '发送文件',
    methodName: chooseFiles,
  },
  {
    className: 'icon-01',
    style: 'font-size: 20px;',
    title: '发送语音',
    methodName: showRecordBox,
  },
  {
    className: 'icon-mingpian',
    style: 'font-size: 23px;',
    title: '个人名片',
    methodName: onShowContactsModal,
  },
  {
    className: 'icon-lajitong',
    style: 'font-size: 23px;',
    title: '清屏',
    methodName: clearScreen,
  },
];
defineExpose({
  handleQuoteMessage,
  handleEditTextMessage,
});
</script>
<template>
  <div class="chat_func_box">
    <span v-for="iconItem in all_func" :class="['iconfont', iconItem.className]" :key="iconItem.className"
      :style="iconItem.style" :title="iconItem.title" @click.stop="iconItem.methodName"></span>
    <!-- EaseCallKit 音视频邀请icon【不需要可移除】 -->
    <!-- 群组没有语音发起 -->
    <!-- <template v-if="isHttps">
      <span
        class="iconfont icon-31dianhua"
        style="font-size: 20px"
        title="语音通话"
        v-show="routeQueryData.chatType === CHAT_TYPE.SINGLE"
        @click="handleInviteCall('voice')"
      ></span>
      <span
        class="iconfont icon-shipintonghua-hei"
        style="font-size: 22px"
        title="视频通话"
        @click="handleInviteCall('video')"
      ></span>
    </template> -->
    <!-- 表情框 -->
    <emojiContainer ref="emojiContainerComp" @appendEmoji="appendEmoji" />
    <!-- 图片附件choose -->
    <ImageMessage ref="ImageMessageComp" :targetId="routeQueryData.id" :chatType="routeQueryData.chatType"
      @onStartLoading="onStartLoading" @onLoadending="onLoadending" />
    <!-- 视频附件choose -->
    <VideoMessage ref="videoMessageComp" :targetId="routeQueryData.id" :chatType="routeQueryData.chatType"
      @onStartLoading="onStartLoading" @onLoadending="onLoadending" />
    <!-- 文件附件choose -->
    <FileMessage ref="fileMessageComp" :targetId="routeQueryData.id" :chatType="routeQueryData.chatType"
      @onStartLoading="onStartLoading" @onLoadending="onLoadending" />
    <!-- 录音采集框 -->
    <el-card ref="recordBox" v-if="isShowRecordBox" class="record_box" shadow="always">
      <p v-if="!isHttps">
        由于浏览器限制,录音功能必须为https环境或者为localhost环境下使用！
      </p>
      <CollectAudio v-else @sendAudioMessages="sendAudioMessages" />
    </el-card>
    <!-- 附件上传loading -->
    <div ref="loadingBox" class="loading_box"></div>
  </div>
  <TextMessage ref="textMessageComp" :targetId="routeQueryData.id" :chatType="routeQueryData.chatType"
    @getMessageQuoteContent="getMessageQuoteContent" @getImageFileFromClipboard="getImageFileFromClipboard"
    @clearQuoteContent="clearQuoteContent" />
  <MsgQuote ref="messageQuoteRef" />
  <!-- <InviteCallMembers ref="inviteCallMembersComp" @sendMulitInviteMsg="sendMulitInviteMsg" /> -->
  <PreviewSendImg ref="previewSendImg" :targetId="routeQueryData.id" :chatType="routeQueryData.chatType"
    @onStartLoading="onStartLoading" @onLoadending="onLoadending" />
  <ShareUserCard ref="personalCardMessageComp" :targetId="routeQueryData.id" :chatType="routeQueryData.chatType" />
</template>

<style lang="scss" scoped>
@import './index.scss';
</style>
