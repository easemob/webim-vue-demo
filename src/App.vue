<script setup>
import { useStore } from 'vuex';
import { useLocalStorage } from '@vueuse/core';
import router from '@/router';
import EaseIM from '@/IM/initwebsdk';
import { useSDKErrorNotifi, useSetMessageKey } from '@/hooks';
import { informType } from '@/constant'
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
  const { value = {} } = useLocalStorage('friendList')
  if (Object.values(JSON.parse(value)).length > 0) return
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
    console.log('>>>>>presenceStatusChange', status)
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
  onRecallMessage: function (message) {
    otherRecallMessage(message)
  },    // 收到消息撤回回执。
})
//接收的消息往store中push
const pushNewMessage = (message) => {
  store.dispatch('createNewMessage', message)
}
//收到他人的撤回指令
const otherRecallMessage = (message) => {
  console.log('>>>>>收到他人撤回', message);
  const { from, to, mid } = message;
  //单对单的撤回to必然为登陆的用户id，群组发起撤回to必然为群组id 所以key可以这样来区分群组或者单人。
  let key = to === EaseIM.conn.user ? from : to;
  console.log('>>>>>收到他人撤回', key);
  store.commit('CHANGE_MESSAGE_BODAY', { type: 'recall', key, mid });
  store.dispatch('gatherConversation', key)
}
/* 好友关系相关监听 */
const { INFORM_FROM } = informType
EaseIM.conn.addEventHandler('friendListen', {
  // 收到好友邀请触发此方法。
  onContactInvited: (data) => {
    //写入INFORM
    console.log('>>>>>>收到好友申请', data)
    submitInformData(INFORM_FROM.FRIEND, data)
  },
  // 联系人被删除时触发此方法。
  onContactDeleted: (data) => {
    //写入INFORM
    console.log('>>>>收到好友关系解散', data)
    submitInformData(INFORM_FROM.FRIEND, data)
  },
  // 新增联系人会触发此方法。
  onContactAdded: (data) => {
    console.log('>>>>好友新增监听', data)
    submitInformData(INFORM_FROM.FRIEND, data)
    //新增好友重新获取好友列表
    fetchFriendList()

  },
  // 好友请求被拒绝时触发此方法。
  onContactRefuse: (data) => {
    //写入INFORM
    console.log('>>>>>>好友申请被拒绝', data)
    data.type = 'other_person_refuse'
    submitInformData(INFORM_FROM.FRIEND, data)
  },
  // 好友请求被同意时触发此方法。
  onContactAgreed: (data) => {
    //写入INFORM
    console.log('>>>>>对方统一了好友申请', data)
    //改掉data中的type
    data.type = 'other_person_agree'
    submitInformData(INFORM_FROM.FRIEND, data)
  }
})
const submitInformData = (fromType, informContent) => {
  console.log('>>>submitInformData>>>', fromType, informContent)
  store.dispatch('createNewInform', { fromType, informContent })

}

/* 群组相关监听 */
EaseIM.conn.addEventHandler('groupEvent', {
  onGroupChange: (msg) => {
    switch (msg.type) {
      case 'rmGroupMute':
        // 解除群组一键禁言。
        break;
      case 'muteGroup':
        // 设置群组一键禁言。
        break;
      case 'deleteAnnouncement':
        // 删除群公告。
        break;
      case 'updateAnnouncement':
        // 更新群公告。
        break;
      case 'removeMute':
        // 解除禁言。
        break;
      case 'addMute':
        // 禁言用户。
        break;
      case 'removeAdmin':
        // 移除管理员。
        break;
      case 'addAdmin':
        // 添加管理员。
        break;
      case 'changeOwner':
        // 转让群组。
        break;
      case 'direct_joined':
        // 用户直接被拉进群。
        break;
      case 'leaveGroup':
        // 退群。
        break;
      case 'memberJoinPublicGroupSuccess':
        // 加入公开群成功。
        break;
      case 'removedFromGroup':
        // 从群组移除。
        break;
      case 'invite_decline':
        // 拒绝加群邀请。
        break;
      case 'invite_accept':
        // 接收加群邀请（群含权限情况）。
        break;
      case 'invite':
        // 加群邀请。
        break;
      case 'joinPublicGroupDeclined':
        // 拒绝入群申请。
        break;
      case 'joinPublicGroupSuccess':
        // 同意入群申请。
        break;
      case 'joinGroupNotifications':
        // 申请入群。
        break;
      case 'leave':
        // 退出群。
        break;
      case 'join':
        // 加入群。
        break;
      case 'deleteGroupChat':
        // 解散群。
        break;
      default:
        break;
    }
  }
})


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
