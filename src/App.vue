<script setup>
import { useStore } from 'vuex';
import { useLocalStorage } from '@vueuse/core';
import router from '@/router';
import EaseIM from '@/IM/initwebsdk';
import _ from 'lodash'
import { useSDKErrorNotifi, useSetMessageKey } from '@/hooks';

const store = useStore();
EaseIM.logger.disableAll()
/* connect 相关监听 */
EaseIM.conn.addEventHandler('connection', {
  onConnected: () => {
    console.log('>>>>>环信连接成功');
    store.commit('CHANGE_LOGIN_STATUS', true);
    fetchLoginUsersInitData()
    router.replace('/chat');
  },
  onDisconnected: () => {
    router.push('/login');
    store.commit('CHANGE_LOGIN_STATUS', false);
  },
  onOnline: () => {
    store.commit('CHANGE_NETWORK_STATUS', true)
  },                  // 本机网络连接成功。
  onOffline: () => {
    store.commit('CHANGE_NETWORK_STATUS', false)
  },                 // 本机网络掉线。
  onError: (error) => {
    console.log('on error', error);
    useSDKErrorNotifi(error.type, error.message);
  },
});
//fetch 登陆用户的初始数据
const fetchLoginUsersInitData = () => {
  getMyUserInfos()
  fetchFriendList()
  fetchGroupList()
}
//获取登陆用户属性
const getMyUserInfos = () => {
  const userId = EaseIM.conn.user;
  // store.dispatch('getMyUserInfo', userId);
};
//获取好友列表
const fetchFriendList = () => {
  store.dispatch('fetchFriendList')
}
//获取加入的群组列表
const fetchGroupList = () => {
  //如果本地存储里不存在群组列表则调用获取群组列表
  const { value = {} } = useLocalStorage('groupList')
  if (Object.values(JSON.parse(value)).length > 0) return
  const pageParams = {
    pageNum: 1,
    pageSize: 500,
  }
  store.dispatch('fetchGroupList', pageParams)
}
/* presence 相关监听 */
EaseIM.conn.addEventHandler('presenceStatusChange', {
  onPresenceStatusChange: (status) => {
    getUserPresence(...status);
  },
});
//处理登陆用户状态的变更
const getUserPresence = (status) => {
  store.dispatch('handlePresenceChanges', status);
};
/* message 相关监听 */
EaseIM.conn.addEventHandler('messageListen', {
  onTextMessage: function (message) {
    console.log('>>>>>>>App mesage', message)
    console.log('useSetMessageKey', useSetMessageKey(message))
    pushNewMessage(message)
  },    // 收到文本消息。
  onEmojiMessage: function (message) {
    pushNewMessage(message)
  },   // 收到表情消息。
  onImageMessage: function (message) {
    pushNewMessage(message)
  },   // 收到图片消息。
  onCmdMessage: function (message) {
  },     // 收到命令消息。
  onAudioMessage: function (message) {
    pushNewMessage(message)
  },   // 收到音频消息。
  onLocationMessage: function (message) {
    pushNewMessage(message)
  },// 收到位置消息。
  onFileMessage: function (message) {
    pushNewMessage(message)
  },    // 收到文件消息。
  onCustomMessage: function (message) {
    pushNewMessage(message)
  },  // 收到自定义消息。
  onVideoMessage: function (message) {
    pushNewMessage(message)
  },     // 收到视频消息。
  onRecallMessage: function (message) { },    // 收到消息撤回回执。
})
//侦听一个响应式对象或数组将始终返回该对象的当前值和上一个状态值的引用。为了完全侦听深度嵌套的对象和数组，可能需要对值进行深拷贝。
// watchEffect(() => _.cloneDeep(store.state.Message.messageList), (newVal, oldVal) => {
//   console.log('>>>>执行监听器', newVal, oldVal)
//   store.dispatch('gatherConversation', newVal)
//   //布置该监听为新消息添加后针对于会话列表进行收集更新
// }, { deep: true })


//接收的消息往store中push
const pushNewMessage = (message) => {
  let key = useSetMessageKey(message)
  store.dispatch('createNewMessage', message)
  store.dispatch('gatherConversation', key)

}



</script>
<template>
  <router-view v-slot="{ Component }">
    <transition name="slide-fade" mode="out-in" :duration="{ enter: 500, leave: 300 }">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style type="scss">
@import './styles/reset/reset.css';

.slide-fade-enter-active {
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
}
</style>
