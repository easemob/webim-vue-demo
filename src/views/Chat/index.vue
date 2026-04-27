<script setup>
import { onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import NavBar from '@/views/Chat/components/NavBar';

/* 新 CallKit */
import { useCallKitEvents, HANGUP_REASON } from 'easemob-chat-callkit-vue3';

/**
 * 新 CallKit 事件监听
 */
const { onCallRefused, onCallBusy, onCallEnded, onCallTimeout, onCallCanceled } = useCallKitEvents();

const unbindRefused = onCallRefused((e) => {
  if (!e.isRemote) return;
  ElMessage({ type: 'error', message: '对方已拒绝通话', center: true });
});

const unbindBusy = onCallBusy(() => {
  ElMessage({ type: 'error', message: '对方忙线中', center: true });
});

const unbindCanceled = onCallCanceled((e) => {
  if (!e.isRemote) return;
  ElMessage({ type: 'warning', message: '对方已取消通话', center: true });
});

const unbindEnded = onCallEnded((e) => {
  if (e.reason === HANGUP_REASON.HANDLE_ON_OTHER_DEVICE) {
    ElMessage({ type: 'error', message: '已在其他设备处理', center: true });
  }
});

const unbindTimeout = onCallTimeout(() => {
  ElMessage({ type: 'error', message: '通话邀请超时', center: true });
});

onBeforeUnmount(() => {
  unbindRefused();
  unbindBusy();
  unbindCanceled();
  unbindEnded();
  unbindTimeout();
});


</script>
<template>
  <div class="app-container">
    <el-container class="chat_container">
      <el-aside class="chat_nav_bar" width="72px">
        <NavBar />
      </el-aside>
      <el-main class="chat_main_box">
        <router-view> </router-view>
      </el-main>

    </el-container>
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background: url('@/assets/images/web-demo-base.png');
  background-size: cover;
  backdrop-filter: blur(5px);

  .chat_container {
    width: 85%;
    height: 95%;
    background: #fff;
    position: relative;
    top: 50%;
    transform: translateY(-50%);
    margin: auto auto;
    border-radius: 5px;

    .chat_nav_bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      border-radius: 5px 0 0 5px;
      width: 80px;
      background: #262626;
      overflow: hidden;
    }

    .chat_main_box {
      // height: 100%;
      // overflow: hidden;
      padding: 0;
    }
  }
}
</style>
