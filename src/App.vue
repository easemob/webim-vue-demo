<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useLocalStorage } from '@vueuse/core';
import { mountAllEMListener } from '@/IM/listener';
import { EMClient } from '@/IM';
import ring from '@/assets/ring.mp3';
import {
  LogLevel,
  EasemobChatCallKitProvider,
  InvitationNotification,
  EasemobChatSingleCall,
  EasemobChatMultiCall,
  useCallKitCore,
} from '@easemob-community/callkit-vue3';
import { ElMessage } from 'element-plus';

const store = useStore();
const { updateImClient } = useCallKitCore();

// 给 callkit 提供用户资料查询（从 demo 自己的用户资料库查）
const getUserInfo = async (userIds) => {
  return userIds.map((userId) => ({
    userId,
    nickname: store.getters['UsersProfile/getDisplayName'](userId),
    avatarUrl: store.getters['UsersProfile/getAvatarUrl'](userId),
  }));
};

/* 【重要】挂载IM相关监听回调。 */
mountAllEMListener();
/* 重新登陆 */
//读取本地EASEIM_loginUser
const EASEIM_loginUser = window.localStorage.getItem('EASEIM_loginUser');
const loginUserFromStorage = JSON.parse(EASEIM_loginUser) || {};
const handleRelogin = async () => {
  try {
    await EMClient.open({
      username: loginUserFromStorage.user,
      accessToken: loginUserFromStorage.accessToken,
    });
    // 账号切换/重新登录后，主动同步 IM Client 到 CallKit
    await updateImClient(EMClient);
  } catch (error) {
    ElMessage({
      type: 'error',
      center: true,
      message: error.message,
    });
  }
};
if (loginUserFromStorage?.user && loginUserFromStorage?.accessToken) {
  handleRelogin();
}

// CallKit 日志配置（从系统设置读取本地存储）
const isOpenedCallKitLog = useLocalStorage('isOpenedCallKitLog', true);
const callKitLogLevel = useLocalStorage('callKitLogLevel', LogLevel.INFO);
const isOpenedCallKitIDBLog = useLocalStorage('isOpenedCallKitIDBLog', true);

const callKitInitConfig = computed(() => ({
  logLevel: isOpenedCallKitLog.value
    ? Number(callKitLogLevel.value)
    : LogLevel.ERROR,
  enableIDBLog: !!isOpenedCallKitIDBLog.value,
}));
</script>
<template>
  <EasemobChatCallKitProvider
    :chat-client="EMClient"
    :init-config="callKitInitConfig"
    :getUserInfo="getUserInfo"
  >
    <router-view v-slot="{ Component }">
      <transition name="slide-fade" mode="out-in" :duration="{ enter: 500, leave: 300 }">
        <component :is="Component" />
      </transition>
    </router-view>

    <!-- 通话邀请通知（被叫时自动弹出） -->
    <InvitationNotification />

    <!-- 单人通话组件（自动显示/隐藏） -->
    <EasemobChatSingleCall />

    <!-- 群组通话组件（自动显示/隐藏） -->
    <EasemobChatMultiCall />

    <!-- 铃声标签 -->
    <audio id="ring" :src="ring" controls hidden></audio>
  </EasemobChatCallKitProvider>
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
