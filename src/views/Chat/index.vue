<script setup>
import { onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
import { EMClient } from '@/IM';
import { CHAT_TYPE } from '@/IM/constant';
import NavBar from '@/views/Chat/components/NavBar';

// /* CallKit */
// import EaseCallKit from '@/components/EaseCallKit'
import { useCallKitEvent } from '@/components/EaseCallKit/hooks';
/* store */
const store = useStore();
/**
 * 此处为Callkit中对外暴露的其内部对外抛出的事件通知，
 * 可通过引入useChannelEvent，订阅其通知处理一些UI层面的提示。
 */
const {
  EVENT_NAME,
  CALLKIT_EVENT_CODE,
  SUB_CHANNEL_EVENT,
  UN_SUB_CHANNEL_ENENT,
} = useCallKitEvent();
SUB_CHANNEL_EVENT(EVENT_NAME, (param) => {
  /* 
事件对外抛出包含有对应的事件type，type/code 可以自行判断处理，ext字段内有对外传出的事件中文描述，可自行选择是否使用。
*/
  const { type, ext, callType, eventHxId } = param;
  if (
    type.code === CALLKIT_EVENT_CODE.CALLEE_REFUSE ||
    type.code === CALLKIT_EVENT_CODE.CALLEE_BUSY ||
    type.code === CALLKIT_EVENT_CODE.OTHER_HANDLE
  ) {
    ElMessage({
      type: 'error',
      message: ext.message,
      center: true,
    });
    const params = {
      from: EMClient.user,
      to: eventHxId,
      chatType: callType === 2 ? CHAT_TYPE.GROUP : CHAT_TYPE.SINGLE,
      msg: ext.message,
    };
    store.dispatch('createInformMessage', { ...params });
  } else if (
    type.code === CALLKIT_EVENT_CODE.NOT_HAVE_MICROPHONE ||
    type.code === CALLKIT_EVENT_CODE.NOT_HAVE_CAMERA
  ) {
    ElMessage({
      type: 'warning',
      message: ext.message,
      center: true,
    });
  } else if (eventHxId) {
    const params = {
      from: EMClient.user,
      to: eventHxId,
      chatType: callType === 2 ? CHAT_TYPE.GROUP : CHAT_TYPE.SINGLE,
      msg: ext.message,
    };
    store.dispatch('createInformMessage', { ...params });
  }
});

onBeforeUnmount(() => {
  UN_SUB_CHANNEL_ENENT(EVENT_NAME);
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
