<script setup>
import { onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus'
import EaseIM from '@/IM/initwebsdk'
import NavBar from '@/views/Chat/components/NavBar'
// /* CallKit */
// import EaseCallKit from '@/components/EaseCallKit'
import { useChannelEvent } from '@/components/EaseCallKit/hooks';
const { SUB_CHANNEL_EVENT, UN_SUB_CHANNEL_ENENT } = useChannelEvent()
SUB_CHANNEL_EVENT('EASECALLKIT', (param) => {
  console.log('%c>>>>>>订阅事件触发', 'color:blue', param);
  const { type, message } = param;
  const MESSAGE_TYPE = {
    'SUCCESS': 'success',
    'WARNING': 'warning',
    'FAIL': 'error',
    'INFO': 'info'
  }
  ElMessage({
    type: MESSAGE_TYPE[type],
    message: message,
    center:true
  })
})
onBeforeUnmount(() => {
  UN_SUB_CHANNEL_ENENT('EASECALLKIT')
})
</script>
<template>
  <div class="app-container">
    <el-container class="chat_container">
      <el-aside class="chat_nav_bar" width="72px">
        <NavBar />
      </el-aside>
      <el-main class="chat_main_box">
        <router-view>
        </router-view>
      </el-main>
      <!-- <EaseCallKit :EaseIM="EaseIM" :connectionName="'conn'" /> -->
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
    background: #FFF;
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
