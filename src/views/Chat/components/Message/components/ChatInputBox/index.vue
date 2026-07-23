<script setup>
import { ref, toRefs, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import {
  handleSDKErrorNotifi,
  notifySdkSendError,
  setMessageKey,
} from '@/utils/handleSomeData';
import { ElLoading, ElMessageBox, ElMessage } from 'element-plus';
import { onClickOutside } from '@vueuse/core';
import { useUserInfoExt } from '@/hooks';
import { CHAT_TYPE } from '@/IM/constant';
import { createMessage, sendMessage } from '@/IM/sdk5/chat';
import { toSdk5CombineMessage } from '@/IM/sdk5/messageAdapter';
import _ from 'lodash';
import { getCurrentUserId } from '@/IM';
import parseDownloadResponse from '@/utils/parseDownloadResponse';
import { supportsDirectedMessage } from '@/utils/directedMessage';
import {
  buildDeliverOnlineOnlyOptions,
  supportsDeliverOnlineOnly,
} from '@/utils/deliverOnlineOnly';
/* 组件 */
import CollectAudio from '../suit/audio.vue';
import PreviewSendImg from '../suit/previewSendImg.vue';
import MsgQuote from '../suit/msgQuote.vue';
import emojiContainer from '../suit/emojiContainer.vue';
import TextMessage from './components/TextMessage';
import SendExtMessage from './components/TextMessage/SendExtMessage.vue';
import VideoMessage from './components/VideoMessage';
import ImageMessage from './components/ImageMessage';
import FileMessage from './components/FileMessage';
import ShareUserCard from './components/CustomMessage/ShareUserCard.vue';
import SendCustomMessage from './components/CustomMessage/SendCustomMessage.vue';
import CmdMessage from './components/CmdMessage/index.vue';
import SendDirectedMessage from './components/DirectedMessage/SendDirectedMessage.vue';
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
const isDirectedMessageEnabled = computed(() =>
  !isChatThread.value && supportsDirectedMessage(routeQueryData.value.chatType),
);
const isDeliverOnlineOnlySupported = computed(() =>
  supportsDeliverOnlineOnly(routeQueryData.value.chatType, isChatThread.value),
);
const isChatThread = computed(() => routeQueryData.value.isChatThread === true);
const threadMessageOptions = computed(() =>
  isChatThread.value ? { isChatThread: true } : {},
);
const deliverOnlineOnlyEnabled = ref(false);
const deliverOnlineOnlyOptions = computed(() =>
  buildDeliverOnlineOnlyOptions(
    deliverOnlineOnlyEnabled.value && isDeliverOnlineOnlySupported.value,
  ),
);
const onDeliverOnlineOnlySwitchChange = (enabled) => {
  const context = {
    targetId: routeQueryData.value.id,
    chatType: routeQueryData.value.chatType,
    currentUser: getCurrentUserId(),
  };
  if (enabled) {
    console.log('[Deliver Online Only] switch enabled', context);
    ElMessage.success('已开启只投在线用户发送');
    return;
  }
  console.log('[Deliver Online Only] switch disabled', context);
  ElMessage.info('已关闭只投在线用户发送');
};
watch(
  isDeliverOnlineOnlySupported,
  (supported) => {
    if (!supported) {
      deliverOnlineOnlyEnabled.value = false;
    }
  },
  { immediate: true },
);
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
  ImageMessageComp.value?.sendPresetImage?.();
};
//贴图发送
const previewSendImg = ref(null);
//从输入框剪切板获取图片
const getImageFileFromClipboard = (items) => {
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
  videoMessageComp.value?.sendPresetVideo?.();
};
/* 文件消息相关 */
//选择文件
const fileMessageComp = ref(null);
const chooseFiles = () => {
  fileMessageComp.value?.sendPresetFile?.();
};
/* 语音消息相关 */
//展示录音对话框
const isHttps =
  window.location.protocol === 'https:' ||
  window.location.hostname === 'localhost';
const isShowRecordBox = ref(false);
const recordBox = ref(null);
// 只有当元素存在时才使用onClickOutside
if (recordBox.value) {
  onClickOutside(recordBox, () => {
    isShowRecordBox.value = false;
  });
}
const showRecordBox = () => {
  isShowRecordBox.value = true;
};

// 在组件挂载后设置点击外部关闭逻辑
onMounted(() => {
  // 表情弹窗点击外部关闭
  if (emojiContainerComp.value) {
    onClickOutside(emojiContainerComp, () => {
      emojiContainerComp.value?.handleShowEmojisBox({ isShow: false });
    });
  }
});
const { setUserInfoExt } = useUserInfoExt();
const getAudioDuration = (file) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = document.createElement('audio');
    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      audio.removeAttribute('src');
      audio.load();
    };

    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      cleanup();
      if (!Number.isFinite(duration) || duration <= 0) {
        reject(new Error('语音元数据未提供有效时长'));
        return;
      }
      resolve(duration);
    };
    audio.onerror = () => {
      cleanup();
      reject(new Error('无法读取语音元数据'));
    };
    audio.src = objectUrl;
    audio.load();
  });

const sendPresetAudio = async () => {
  //验证targetId是否有效
  if (!routeQueryData.value.id || routeQueryData.value.id === '') {
    console.error('发送语音消息失败: 缺少目标ID');
    ElMessage.error('发送语音消息失败: 请先选择聊天对象');
    return;
  }

  onStartLoading();
  try {
    const response = await fetch('/resource/audio_10s.mp3');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const file = new File([blob], 'audio_10s.mp3', {
      type: blob.type || 'audio/mpeg',
    });
    const duration = await getAudioDuration(file);

    const msgOptions = {
      to: routeQueryData.value.id,
      chatType: routeQueryData.value.chatType,
      ...threadMessageOptions.value,
      file: {
        data: file,
        filename: file.name,
        filetype: file.type,
      },
      duration,
      onFileUploadError: (error) => {
        notifySdkSendError(error);
        onLoadending();
      },
      onFileUploadProgress: () => {
        onStartLoading();
      },
      onFileUploadComplete: () => {
        onLoadending();
      },
    };
    setUserInfoExt(msgOptions);
    const msg = createMessage('audio', msgOptions);
    const message = await sendMessage(msg, {
      ...deliverOnlineOnlyOptions.value,
      onFileUploadError: msgOptions.onFileUploadError,
      onFileUploadProgress: msgOptions.onFileUploadProgress,
      onFileUploadComplete: msgOptions.onFileUploadComplete,
    });
    store.dispatch('senedShowTypeMessage', { ...message });
  } catch (error) {
    console.error('发送预置语音失败:', error);
    notifySdkSendError(error);
  } finally {
    onLoadending();
  }
};
const sendAudioMessages = async (audioData) => {
  //验证targetId是否有效
  if (!routeQueryData.value.id || routeQueryData.value.id === '') {
    console.error('发送语音消息失败: 缺少目标ID');
    ElMessage.error('发送语音消息失败: 请先选择聊天对象');
    isShowRecordBox.value = false;
    return;
  }

  const file = {
    url: parseDownloadResponse(audioData.src),
    filename: '录音',
    filetype: '.amr',
    data: audioData.src,
  };

  const msgOptions = {
    to: routeQueryData.value.id,
    chatType: routeQueryData.value.chatType,
    ...threadMessageOptions.value,
    file: file,
    length: audioData.length,
  };
  setUserInfoExt(msgOptions);
  try {
    const msg = createMessage('audio', msgOptions);
    const message = await sendMessage(msg, deliverOnlineOnlyOptions.value);
    store.dispatch('senedShowTypeMessage', { ...message });
    isShowRecordBox.value = false;
  } catch (error) {
    notifySdkSendError(error);
    isShowRecordBox.value = false;
  }
};
/* 自定义消息-个人名片 */
const personalCardMessageComp = ref(null);
const onShowContactsModal = () => {
  personalCardMessageComp.value.dialogVisible = true;
};

/* 透传消息 */
const cmdMessageComp = ref(null);
const onShowCmdModal = () => {
  if (!routeQueryData.value.id || routeQueryData.value.id === '') {
    ElMessage.error('请先选择聊天对象');
    return;
  }
  cmdMessageComp.value?.openDialog?.();
};

/* 自定义消息 */
const customMessageComp = ref(null);
const onShowCustomMessageModal = () => {
  if (!routeQueryData.value.id || routeQueryData.value.id === '') {
    ElMessage.error('请先选择聊天对象');
    return;
  }
  customMessageComp.value?.openDialog?.();
};
/* 定向消息 */
const directedMessageComp = ref(null);
const onShowDirectedMessageModal = () => {
  if (!routeQueryData.value.id || routeQueryData.value.id === '') {
    ElMessage.error('请先选择聊天对象');
    return;
  }
  if (!isDirectedMessageEnabled.value) {
    ElMessage.error('当前会话类型不支持定向消息');
    return;
  }
  directedMessageComp.value?.openDialog?.();
};
/* 文本扩展消息 */
const extMessageComp = ref(null);
const onShowExtMessageModal = () => {
  if (!routeQueryData.value.id || routeQueryData.value.id === '') {
    ElMessage.error('请先选择聊天对象');
    return;
  }
  extMessageComp.value?.openDialog?.();
};

/* 位置消息 */
const sendLocationMessage = async () => {
  //验证targetId是否有效
  if (!routeQueryData.value.id || routeQueryData.value.id === '') {
    console.error('发送位置消息失败: 缺少目标ID');
    ElMessage.error('发送位置消息失败: 请先选择聊天对象');
    return;
  }

  const msgOptions = {
    to: routeQueryData.value.id,
    chatType: routeQueryData.value.chatType,
    ...threadMessageOptions.value,
    addr: '四通桥东',
    buildingName: '数码大厦',
    lat: 39,
    lng: 116,
  };
  setUserInfoExt(msgOptions);
  try {
    const msg = createMessage('loc', msgOptions);
    const message = await sendMessage(msg, deliverOnlineOnlyOptions.value);
    console.log('[Message Send] location success', {
      messageId: message?.id || message?.mid,
      targetId: routeQueryData.value.id,
      chatType: routeQueryData.value.chatType,
      lat: msgOptions.lat,
      lng: msgOptions.lng,
      addr: msgOptions.addr,
    });
    ElMessage.success('发送位置消息成功');
    await store.dispatch('senedShowTypeMessage', message);
  } catch (error) {
    console.error('发送位置消息失败:', error);
    ElMessage.error('发送位置消息失败');
  }
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
//     to: groupId,
//     chatType: CHAT_TYPE.GROUP,
//     msg: '已发起多人音视频通话',
//   };
//   store.dispatch('createInformMessage', params);
// };
//func 对应事件 icon class样式等
// 发送合并消息
const sendCombineMessage = async () => {
  //验证targetId是否有效
  if (!routeQueryData.value.id || routeQueryData.value.id === '') {
    console.error('发送合并消息失败: 缺少目标ID');
    ElMessage.error('发送合并消息失败: 请先选择聊天对象');
    return;
  }

  try {
    // 模拟获取最近5条消息作为合并内容
    const listKey = setMessageKey({
      to: routeQueryData.value.id,
      chatType: routeQueryData.value.chatType,
    });
    const currentChatMessages = store.state.Message.messageList[listKey] || [];
    const recentMessages = currentChatMessages
      .slice(-5)
      .map(toSdk5CombineMessage);

    if (recentMessages.length === 0) {
      ElMessage.warning('暂无消息可合并');
      return;
    }

    // 准备合并消息参数
    const combineMsgOptions = {
      chatType: routeQueryData.value.chatType,
      to: routeQueryData.value.id,
      ...threadMessageOptions.value,
      compatibleText: 'SDK 版本低，请升级',
      title: '聊天记录',
      summary: `共${recentMessages.length}条消息`,
      messageList: recentMessages,
    };

    // 发送合并消息
    const msg = createMessage('combine', combineMsgOptions);
    const message = await sendMessage(msg, deliverOnlineOnlyOptions.value);
    console.log('[Message Send] combine success', {
      messageId: message?.id || message?.mid,
      targetId: routeQueryData.value.id,
      chatType: routeQueryData.value.chatType,
      sourceMessageCount: recentMessages.length,
      summary: combineMsgOptions.summary,
    });
    ElMessage.success('合并消息发送成功');
    await store.dispatch('senedShowTypeMessage', message);
  } catch (error) {
    console.error('发送合并消息失败:', error);
    notifySdkSendError(error);
  }
};

const all_func = [
  {
    id: 'emoji',
    className: 'icon-icon_emoji',
    style: 'font-size:20px;margin-left: 20px;',
    title: '选择表情',
    methodName: showEmojisBox,
  },
  {
    id: 'image',
    className: 'icon-tuku',
    style: 'font-size: 26px;',
    title: '发送图片',
    methodName: chooseImages,
  },
  {
    id: 'combine',
    className: 'icon-kuaijiehuifu',
    style: 'font-size: 20px;',
    title: '发送合并消息',
    methodName: sendCombineMessage,
  },
  {
    id: 'video',
    className: 'icon-shipin',
    style: 'font-size: 20px;',
    title: '发送视频',
    methodName: chooseVideo,
  },
  {
    id: 'file',
    className: 'icon-wenjian',
    style: 'font-size: 20px;',
    title: '发送文件',
    methodName: chooseFiles,
  },
  {
    id: 'audio',
    className: 'icon-01',
    style: 'font-size: 20px;',
    title: '发送语音',
    methodName: sendPresetAudio,
  },
  {
    id: 'card',
    className: 'icon-mingpian',
    style: 'font-size: 23px;',
    title: '个人名片',
    methodName: onShowContactsModal,
  },
  {
    id: 'location',
    className: 'icon-tuku',
    style: 'font-size: 20px;',
    title: '发送位置',
    methodName: sendLocationMessage,
  },
  {
    id: 'cmd',
    className: 'icon-icon_emoji',
    style: 'font-size: 20px;',
    title: '发送透传消息',
    methodName: onShowCmdModal,
  },
  {
    id: 'ext',
    className: 'icon-wenjian',
    style: 'font-size: 20px;',
    title: '发送扩展消息',
    methodName: onShowExtMessageModal,
  },
  {
    id: 'custom',
    className: 'icon-kuaijiehuifu',
    style: 'font-size: 20px;',
    title: '发送自定义消息',
    methodName: onShowCustomMessageModal,
  },
  {
    id: 'directed',
    className: 'icon-mingpian',
    style: 'font-size: 20px;',
    title: '发送定向消息',
    methodName: onShowDirectedMessageModal,
  },
  {
    id: 'clear',
    className: 'icon-lajitong',
    style: 'font-size: 23px;',
    title: '清屏',
    methodName: clearScreen,
  },
];
const visibleFuncs = computed(() =>
  all_func.filter((item) =>
    item.id === 'directed' ? isDirectedMessageEnabled.value : true,
  ),
);
defineExpose({
  handleQuoteMessage,
  handleEditTextMessage,
});
</script>
<template>
  <div class="chat_func_box">
    <el-tooltip
      v-if="isDeliverOnlineOnlySupported"
      content="只投在线用户"
      placement="top"
      :show-after="300"
    >
      <el-switch
        v-model="deliverOnlineOnlyEnabled"
        class="deliver_online_only_switch"
        size="small"
        inline-prompt
        active-text="在线"
        inactive-text="普通"
        aria-label="只投在线用户"
        @change="onDeliverOnlineOnlySwitchChange"
      />
    </el-tooltip>
    <el-tooltip
      v-for="iconItem in visibleFuncs"
      :key="iconItem.id"
      :content="iconItem.title"
      placement="top"
      :show-after="300"
    >
      <span
        :class="['iconfont', iconItem.className]"
        :style="iconItem.style"
        @click.stop="iconItem.methodName"
      ></span>
    </el-tooltip>
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
    <ImageMessage
      ref="ImageMessageComp"
      :targetId="routeQueryData.id"
      :chatType="routeQueryData.chatType"
      :isChatThread="isChatThread"
      :deliverOnlineOnlyOptions="deliverOnlineOnlyOptions"
      @onStartLoading="onStartLoading"
      @onLoadending="onLoadending"
    />
    <!-- 视频附件choose -->
    <VideoMessage
      ref="videoMessageComp"
      :targetId="routeQueryData.id"
      :chatType="routeQueryData.chatType"
      :isChatThread="isChatThread"
      :deliverOnlineOnlyOptions="deliverOnlineOnlyOptions"
      @onStartLoading="onStartLoading"
      @onLoadending="onLoadending"
    />
    <!-- 文件附件choose -->
    <FileMessage
      ref="fileMessageComp"
      :targetId="routeQueryData.id"
      :chatType="routeQueryData.chatType"
      :isChatThread="isChatThread"
      :deliverOnlineOnlyOptions="deliverOnlineOnlyOptions"
      @onStartLoading="onStartLoading"
      @onLoadending="onLoadending"
    />
    <!-- 录音采集框 -->
    <el-card
      ref="recordBox"
      v-if="isShowRecordBox"
      class="record_box"
      shadow="always"
    >
      <p v-if="!isHttps">
        由于浏览器限制,录音功能必须为https环境或者为localhost环境下使用！
      </p>
      <CollectAudio v-else @sendAudioMessages="sendAudioMessages" />
    </el-card>
    <!-- 附件上传loading -->
    <div ref="loadingBox" class="loading_box"></div>
  </div>
  <TextMessage
    ref="textMessageComp"
    :targetId="routeQueryData.id"
    :chatType="routeQueryData.chatType"
    :isChatThread="isChatThread"
    :deliverOnlineOnlyOptions="deliverOnlineOnlyOptions"
    :groupId="routeQueryData.isChatThread ? routeQueryData.groupId : routeQueryData.id"
    @getMessageQuoteContent="getMessageQuoteContent"
    @getImageFileFromClipboard="getImageFileFromClipboard"
    @clearQuoteContent="clearQuoteContent"
  />
  <SendExtMessage
    ref="extMessageComp"
    :targetId="routeQueryData.id"
    :chatType="routeQueryData.chatType"
    :isChatThread="isChatThread"
    :deliverOnlineOnlyOptions="deliverOnlineOnlyOptions"
  />
  <MsgQuote ref="messageQuoteRef" />
  <!-- <InviteCallMembers ref="inviteCallMembersComp" @sendMulitInviteMsg="sendMulitInviteMsg" /> -->
  <PreviewSendImg
    ref="previewSendImg"
    :targetId="routeQueryData.id"
    :chatType="routeQueryData.chatType"
    :isChatThread="isChatThread"
    :deliverOnlineOnlyOptions="deliverOnlineOnlyOptions"
    @onStartLoading="onStartLoading"
    @onLoadending="onLoadending"
  />
  <ShareUserCard
    ref="personalCardMessageComp"
    :targetId="routeQueryData.id"
    :chatType="routeQueryData.chatType"
    :isChatThread="isChatThread"
    :deliverOnlineOnlyOptions="deliverOnlineOnlyOptions"
  />
  <CmdMessage
    ref="cmdMessageComp"
    :targetId="routeQueryData.id"
    :chatType="routeQueryData.chatType"
    :isChatThread="isChatThread"
    :deliverOnlineOnlyOptions="deliverOnlineOnlyOptions"
  />
  <SendCustomMessage
    ref="customMessageComp"
    :targetId="routeQueryData.id"
    :chatType="routeQueryData.chatType"
    :isChatThread="isChatThread"
    :deliverOnlineOnlyOptions="deliverOnlineOnlyOptions"
  />
  <SendDirectedMessage
    ref="directedMessageComp"
    :targetId="routeQueryData.id"
    :chatType="routeQueryData.chatType"
    :deliverOnlineOnlyOptions="deliverOnlineOnlyOptions"
  />
</template>

<style lang="scss" scoped>
@import './index.scss';
</style>
