<template>
  <input
    ref="uploadVideo"
    type="file"
    style="display: none"
    @change="sendVideoMessage"
    single
    accept="video/*"
  />
  <el-dialog
    v-model="dialogVisible"
    title="发送视频"
    width="420px"
    :close-on-click-modal="true"
    @close="onDialogClose"
  >
    <div class="video_send_options">
      <el-button type="primary" @click="onChooseLocalFile">选择本地文件</el-button>
      <div class="video_url_section">
        <div class="label">或输入视频链接（直接访问地址）</div>
        <el-input
          v-model="videoUrl"
          placeholder="请输入可访问的视频 URL，如 https://example.com/video.mp4"
          clearable
          class="video_url_input"
        />
        <el-button
          type="primary"
          :loading="sendByUrlLoading"
          :disabled="!videoUrlTrimmed"
          @click="sendVideoByUrl"
        >
          通过链接发送
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, toRefs, computed, nextTick } from 'vue';
import { createMessage, sendMessage } from '@/IM/sdk5/chat';
import { notifySdkSendError } from '@/utils/handleSomeData';
import { CONVERSATION_TYPE } from '@/IM/constant';
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
const uploadVideo = ref(null);
const dialogVisible = ref(false);
const videoUrl = ref('');
const sendByUrlLoading = ref(false);
const PRESET_VIDEO_PATH = '/resource/video_10s.mp4';

const videoUrlTrimmed = computed(() => (videoUrl.value || '').trim());

const openChooseVideo = () => {
  uploadVideo.value?.click();
};

const openVideoDialog = () => {
  dialogVisible.value = true;
  videoUrl.value = '';
};

const onDialogClose = () => {
  videoUrl.value = '';
  sendByUrlLoading.value = false;
};

const onChooseLocalFile = () => {
  dialogVisible.value = false;
  nextTick(() => uploadVideo.value?.click());
};

const { setUserInfoExt } = useUserInfoExt();
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

function getFilenameFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const name = pathname.split('/').filter(Boolean).pop() || 'video.mp4';
    return name.includes('.') ? name : name + '.mp4';
  } catch {
    return 'video.mp4';
  }
}

function getVideoMetadata(videoFile) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(videoFile);
    const video = document.createElement('video');
    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute('src');
      video.load();
    };

    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;
      cleanup();
      if (!Number.isFinite(duration) || duration <= 0) {
        reject(new Error('视频元数据未提供有效时长'));
        return;
      }
      resolve({ duration, width, height });
    };
    video.onerror = () => {
      cleanup();
      reject(new Error('无法读取视频元数据'));
    };
    video.src = objectUrl;
    video.load();
  });
}

async function sendVideoByUrl() {
  const url = videoUrlTrimmed.value;
  if (!url) return;
  if (!conversationId.value) {
    ElMessage.error('发送视频消息失败: 请先选择聊天对象');
    return;
  }
  sendByUrlLoading.value = true;
  emit('onStartLoading');
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(res.statusText || '请求失败');
    const blob = await res.blob();
    const contentType = res.headers.get('content-type') || blob.type || 'video/mp4';
    if (blob.size > MAX_VIDEO_SIZE) {
      ElMessage.error('视频大小不能超过50MB');
      return;
    }
    const filename = getFilenameFromUrl(url);
    const file = new File([blob], filename, { type: contentType });
    await doSendVideoFile(file);
    dialogVisible.value = false;
    videoUrl.value = '';
    ElMessage.success('视频已发送');
  } catch (e) {
    console.error('通过链接发送视频失败', e);
    ElMessage.error('无法加载该链接的视频，请检查地址或网络（含跨域）');
  } finally {
    sendByUrlLoading.value = false;
    emit('onLoadending');
  }
}

async function doSendVideoFile(videoFile) {
  const metadata = await getVideoMetadata(videoFile);
  const options = {
    data: videoFile,
    filetype: videoFile.type,
    filename: videoFile.name,
    conversationId: conversationId.value,
    conversationType: conversationType.value,
    duration: metadata.duration,
    width: metadata.width,
    height: metadata.height,
    ...(isChatThread.value ? { isChatThread: true } : {}),
    ...deliverOnlineOnlyOptions.value,
    onFileUploadError: (error) => {
      console.error('视频上传失败:', error);
      notifySdkSendError(error);
      emit('onLoadending');
    },
    onFileUploadProgress: () => {
      emit('onStartLoading');
    },
    onFileUploadComplete: () => {
      emit('onLoadending');
    },
  };
  setUserInfoExt(options);
  const messageToSend = createMessage('video', options);
  const message = await sendMessage(messageToSend, {
    onFileUploadError: options.onFileUploadError,
    onFileUploadProgress: options.onFileUploadProgress,
    onFileUploadComplete: options.onFileUploadComplete,
  });
  store.dispatch('senedShowTypeMessage', message);
}

const sendVideoMessage = async (event) => {
  if (!conversationId.value) {
    ElMessage.error('发送视频消息失败: 请先选择聊天对象');
    return;
  }
  const videoFile = uploadVideo.value?.files?.[0];
  if (!videoFile) return;
  if (videoFile.size > MAX_VIDEO_SIZE) {
    ElMessage.error('视频大小不能超过50MB');
    uploadVideo.value.value = '';
    return;
  }
  try {
    await doSendVideoFile(videoFile);
  } catch (error) {
    console.error('发送视频消息失败', {
      conversationId: conversationId.value,
      conversationType: conversationType.value,
      fileName: videoFile.name,
      error,
    });
    notifySdkSendError(error);
  } finally {
    uploadVideo.value.value = '';
  }
};

defineExpose({
  openChooseVideo,
  openVideoDialog,
  sendPresetVideo: async () => {
    if (!conversationId.value) {
      ElMessage.error('发送视频消息失败: 请先选择聊天对象');
      return;
    }
    try {
      emit('onStartLoading');
      const response = await fetch(PRESET_VIDEO_PATH);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      if (blob.size > MAX_VIDEO_SIZE) {
        ElMessage.error('视频大小不能超过50MB');
        return;
      }
      const videoFile = new File([blob], 'video_10s.mp4', {
        type: blob.type || 'video/mp4',
      });
      await doSendVideoFile(videoFile);
    } catch (error) {
      console.error('发送预置视频失败:', error);
      ElMessage.error('发送视频失败，无法加载 resource/video_10s.mp4');
    } finally {
      emit('onLoadending');
    }
  },
});
</script>

<style lang="scss" scoped>
.video_send_options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.video_url_section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  .label {
    font-size: 13px;
    color: #606266;
  }
  .video_url_input {
    width: 100%;
  }
}
</style>
