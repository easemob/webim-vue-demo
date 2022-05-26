<script setup>
import { ref, computed } from 'vue';
/* vuex */
import { useStore } from 'vuex';
/* router */
import router from '@/router';
/* icon */
import { Plus } from '@element-plus/icons-vue';
/* 组件 */
import UserInfoCard from './components/UserInfoCard.vue';
import UserOnlineStatusCard from './components/UserOnlineStatusCard.vue';
/* constants */
import { onLineStatus } from '@/constant';
/* vueUse */
import { onClickOutside } from '@vueuse/core';

const store = useStore();
/* 取用户头像 */
let loginUserAvatar = computed(() => {
  return store.getters.loginUserInfo.avatarurl;
});

/* 关于用户在线状态--图标展示 */

let loginUserOnlineStatusIcon = computed(() => {
  const loginUserOnlineStatus = store.state.loginUserOnlineStatus;
  if (loginUserOnlineStatus === 'Unset' || loginUserOnlineStatus === '') {
    return '';
  } else {
    return onLineStatus[loginUserOnlineStatus].style;
  }
});

/* tabbar icon 路由跳转 */
let skipRouterName = ref('conversation');
let highligthConversation = require('@/assets/images/tabbar/sessionhighlight2x.png');
let grayConversation = require('@/assets/images/tabbar/session2x.png');
let highligthContacts = require('@/assets/images/tabbar/comtactshighlight2x.png');
let grayContacts = require('@/assets/images/tabbar/comtacts2x.png');
const changeSkipRouterName = (routerName) => {
  skipRouterName.value = routerName;
  router.push(`/chat/${routerName}`);
};

/* 取会话以及系统消息未读数控制会话icon badge显隐 */
const conversationUnreadCount = computed(() => {

  let informCount = _.sumBy(store.state.Conversation.informDetail, 'untreated') || 0
  let commonConversationCount = _.sumBy(_.values(store.state.Conversation.conversationListData), 'unreadMessageNum')
  return { informCount, commonConversationCount }
})
console.log('>>>>conversationUnreadCount>>>>>', conversationUnreadCount)
/* 用户信息卡片显隐 */
const isShowUserInfoCard = ref(false);
const changeUserInfoCard = ref(null);
onClickOutside(changeUserInfoCard, () => (isShowUserInfoCard.value = false));
</script>

<template>
  <!-- 头像 -->
  <div class="chat_avatar">
    <el-avatar :src="loginUserAvatar" @click="isShowUserInfoCard = true">
    </el-avatar>
    <el-popover v-if="loginUserOnlineStatusIcon" trigger="click" placement="right-start" :show-arrow="false">
      <template #reference>
        <div class="online_status" :style="loginUserOnlineStatusIcon"></div>
      </template>
      <!-- 用户在线状态切换卡片 -->
      <UserOnlineStatusCard />
    </el-popover>
  </div>
  <!-- 用户个人信息卡片 -->
  <UserInfoCard ref="changeUserInfoCard" v-show="isShowUserInfoCard" />
  <!-- 去往会话 -->
  <div class="chat_converation chat_icon_box" @click="changeSkipRouterName('conversation')">
    <div class="img_box">
      <img :src="
        skipRouterName === 'conversation'
          ? highligthConversation
          : grayConversation
      " alt="">
      <span v-if="conversationUnreadCount.informCount || conversationUnreadCount.commonConversationCount"
        class="badge"></span>
    </div>
  </div>
  <!-- 去往联系人 -->
  <div class="chat_contacts chat_icon_box" @click="changeSkipRouterName('contacts')">
    <img class="chat_contacts_icon" :src="skipRouterName === 'contacts' ? highligthContacts : grayContacts" alt="" />
  </div>
  <div class="chat_settings">
    <el-icon>
      <Plus />
    </el-icon>
  </div>
</template>

<style lang="scss" scoped>
.chat_avatar {
  margin-top: 43px;
  position: relative;
  width: 44px;
  height: 44px;
  transition: all 0.3s;

  &:hover {
    transform: scale(1.3);
  }

  span {
    display: inline-block;
    width: 100%;
    height: 100%;
  }

  .online_status {
    position: absolute;
    right: 0;
    bottom: 0;
    display: inline-block;
    width: 10px;
    height: 10px;
    background: #fff;
    border-radius: 50%;
    transition: all 0.3s;
    cursor: pointer;

    &:hover {
      transform: scale(1.2);
    }
  }
}


.chat_icon_box {

  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 15px;
  width: 100%;
  height: 67px;
  text-align: center;
  line-height: 67px;

}

.chat_converation {
  .img_box {
    position: relative;
    width: 30px;
    height: 30px;

    img {
      display: inline-block;
      width: 27px;
      height: 27px;
    }

    .badge {
      position: absolute;
      right: 0;
      top: 15px;
      display: inline-block;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: red;

    }
  }

}

.chat_contacts {
  img {
    display: inline-block;
    width: 27px;
    height: 27px;
  }
}

.chat_settings {
  position: absolute;
  bottom: 46px;
  font-size: 24px;
  color: #8e8e8e;
  cursor: pointer;

  &:hover {
    color: #1b83f9;
  }
}
</style>
