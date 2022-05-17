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
</template>
<script setup>
import { useStore } from 'vuex';
import router from '@/router';
import Ease from '@/IM/initwebsdk';
import { useSDKErrorNotifi } from '@/hooks';
const store = useStore();
Ease.conn.addEventHandler('connection&message', {
  onConnected: () => {
    console.log('>>>>>环信连接成功');
    store.commit('CHANGE_LOGIN_STATUS', true);
    getMyUserInfos();
    router.replace('/chat');
  },
  onDisconnected: () => {
    router.push('/login');
    store.commit('CHANGE_LOGIN_STATUS', false);
  },

  onError: (error) => {
    console.log('on error', error);
    useSDKErrorNotifi(error.type, error.message);
  },
});
Ease.conn.addEventHandler('presenceStatusChange', {
  onPresenceStatusChange: (status) => {
    console.log('状态更新', status);
    getUserPresence(...status);
  },
});
//获取登陆用户属性
const getMyUserInfos = () => {
  const userId = Ease.conn.user;
  store.dispatch('getMyUserInfo', userId);
};
//处理登陆用户状态的变更
const getUserPresence = (status) => {
  store.dispatch('handlePresenceChanges', status);
};
</script>
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
