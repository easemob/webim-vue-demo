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
import { useRoute } from 'vue-router';
import Ease from '@/IM/initwebsdk';
import { useSDKErrorNotifi } from '@/hooks';

const route = useRoute();
const sotre = useStore();
console.log(sotre);
Ease.conn.addEventHandler('connection&message', {
  onConnected: () => {
    console.log('>>>>>环信连接成功');
    router.push('/chat');
    sotre.commit('CHANGE_LOGIN_STATUS', true);
  },
  onDisconnected: () => {
    router.push('/login');
    sotre.commit('CHANGE_LOGIN_STATUS', false);
  },

  onError: (error) => {
    console.log('on error', error);
    useSDKErrorNotifi(error.type, error.message);
  },
});
</script>
<style type="scss">
@import './styles/reset/reset.css';
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.5s;
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
