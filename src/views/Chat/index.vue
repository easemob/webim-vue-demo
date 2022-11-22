<script setup>
import { onBeforeUnmount } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import EaseIM from '@/IM/initwebsdk'
import NavBar from '@/views/Chat/components/NavBar'
import { messageType } from '@/constant'
// /* CallKit */
// import EaseCallKit from '@/components/EaseCallKit'
import { useChannelEvent } from '@/components/EaseCallKit/hooks'
/* store */
const store = useStore()
/* constants */
const { CHAT_TYPE } = messageType
/**
 * 此处为Callkit中对外暴露的其内部对外抛出的事件通知，
 * 可通过引入useChannelEvent，订阅其通知处理一些UI层面的提示。
 */
const { EVENT_NAME, SUB_CHANNEL_EVENT, UN_SUB_CHANNEL_ENENT } = useChannelEvent()
SUB_CHANNEL_EVENT(EVENT_NAME, (param) => {
    console.log('%c>>>>>>订阅事件触发', 'color:blue', param)
    const { type, message } = param
    const MESSAGE_TYPE = {
        'SUCCESS': 'success',
        'WARNING': 'warning',
        'FAIL': 'error',
        'INFO': 'info'
    }
    if (type === 'FAIL' || type === 'SUCCESS') {
        ElMessage({
            type: MESSAGE_TYPE[type],
            message: message,
            center: true
        })
        const params = {
            from: EaseIM.conn.user,
            to: param.eventHxId,
            chatType: param.callType === 2 ? CHAT_TYPE.GROUP : CHAT_TYPE.SINGLE,
            msg: message
        }

        store.dispatch('createInformMessage', params)
    }
    if (type === 'INFO') {
        const params = {
            from: EaseIM.conn.user,
            to: param.eventHxId,
            chatType: param.callType === 2 ? CHAT_TYPE.GROUP : CHAT_TYPE.SINGLE,
            msg: message
        }

        store.dispatch('createInformMessage', params)
    }
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
