<script setup>
import '@/utils/globalErrorHandler';
import { ref, onMounted, onUnmounted } from 'vue';
import router from '@/router';
import { fetchLoginUsersInitData, mountAllEMListener } from '@/IM/listener';
import { getClient, getCurrentUserId, login } from '@/IM';
import { sdk5Config } from '@/IM/initwebsdk';
import { sdkErrorToError } from '@/IM/sdkError';
import {
  isImAuthFailedReason,
  redirectToLoginClearImSession,
} from '@/utils/imAuthRedirect';
import ring from '@/assets/ring.mp3';
import { ElMessage } from 'element-plus';
// 导入播放铃声钩子
import { usePlayRing } from '@/hooks';
// 导入事件发射器
import eventEmitter from '@/utils/eventEmitter';
import { safeSync } from '@/utils/safeCall';


/* 【重要】挂载IM相关监听回调。 */
safeSync('mountAllEMListener', () => mountAllEMListener());

/* 重新登陆 */
const EASEIM_loginUser = window.localStorage.getItem('EASEIM_loginUser');
let loginUserFromStorage = {};
try {
  loginUserFromStorage = EASEIM_loginUser ? JSON.parse(EASEIM_loginUser) : {};
} catch (e) {
  console.error('[App] EASEIM_loginUser JSON 解析失败，已忽略本地缓存', e);
}

const handleRelogin = async () => {
  try {
    await login({
      userId: loginUserFromStorage.user,
      token: loginUserFromStorage.accessToken,
    });
    fetchLoginUsersInitData();
    await router.replace('/chat');
  } catch (raw) {
    const error = sdkErrorToError(raw);
    if (isImAuthFailedReason(raw) || isImAuthFailedReason(error)) {
      console.warn('[App] IM 鉴权失败，跳转登录页');
      redirectToLoginClearImSession();
      return;
    }
    ElMessage({
      type: 'error',
      center: true,
      message: error.message || '重新登录失败',
    });
    console.error('[IM SDK 5.0 登录诊断]', {
      appKey: sdk5Config.appKey,
      serviceConnectionMode: sdk5Config.serviceConfig ? 'fixed' : 'dns',
      serverUrls: sdk5Config.serviceConfig?.serverUrls,
      clientServerUrls: getClient().getServerUrlsConfig?.(),
      userId: loginUserFromStorage.user,
      tokenLength: loginUserFromStorage.accessToken.length,
      error: {
        name: raw?.name,
        message: raw?.message,
        code: raw?.code,
        details: raw?.details,
      },
      raw,
    });
  }
};

if (loginUserFromStorage?.user && loginUserFromStorage?.accessToken) {
  void handleRelogin().catch((e) =>
    console.error('[App] handleRelogin 未捕获异常', e),
  );
}

// 初始化播放铃声功能
const { isOpenPlayRing, playRing } = usePlayRing();

// 监听新消息事件，播放提示音
const handleNewMessage = (message) => {
  safeSync('handleNewMessage', () => {
    if (!message || typeof message !== 'object') return;
    if (message.sender?.userId !== getCurrentUserId() && isOpenPlayRing.value) {
      playRing();
    }
  });
};

// 添加事件监听器
onMounted(() => {
  eventEmitter.on('newMessage', handleNewMessage);
});

// 移除事件监听器
onUnmounted(() => {
  eventEmitter.off('newMessage', handleNewMessage);
});
</script>
<template>
  <router-view v-slot="{ Component }">
    <transition
      name="slide-fade"
      mode="out-in"
      :duration="{ enter: 500, leave: 300 }"
    >
      <component :is="Component" />
    </transition>
  </router-view>
  <!-- 铃声标签 -->
  <audio id="ring" :src="ring" controls hidden></audio>
</template>

<style type="scss">
@import './styles/reset/reset.css';
@import './styles/iconfont/iconfont.css';

/* .slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0.3;
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  opacity: 1;
} */
</style>
