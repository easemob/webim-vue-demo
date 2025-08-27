<script setup>
import { ref } from 'vue';
import { mountAllEMListener } from '@/IM/listener';
import { EMClient } from '@/IM';
import ring from '@/assets/ring.mp3';
/* callkit */
// import EaseCallKit from '@/components/EaseCallKit';
// import InviteCallMembers from '@/components/InviteCallMembers';
import { ElMessage } from 'element-plus';
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
/* EaseCallKit 相关 */
const easeCallKit = ref(null);
const inviteCallComp = ref(null);
//多人会议使用-弹出邀请模态框
const showModal = ({ groupId }) => {
  inviteCallComp.value.alertDialog(groupId);
};
//多人会议使用-传递给邀请组件发送邀请消息
const sendMulitInviteMsg = (targetIMId) => {
  const callType = 2;
  easeCallKit.value.inMultiChanelSendInviteMsg(targetIMId, callType);
};
</script>
<template>
  <router-view v-slot="{ Component }">
    <transition name="slide-fade" mode="out-in" :duration="{ enter: 500, leave: 300 }">
      <component :is="Component" />
    </transition>
  </router-view>
  <!-- 铃声标签 -->
  <audio id="ring" :src="ring" controls hidden></audio>
  <!-- About EaseCallKit -->
  <!-- <EaseCallKit
    ref="easeCallKit"
    :EaseIMClient="EMClient"
    :msgCreateFunc="EMClient.Message"
    @onInviteMembers="showModal"
  />
  <InviteCallMembers
    ref="inviteCallComp"
    @sendMulitInviteMsg="sendMulitInviteMsg"
  /> -->
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
