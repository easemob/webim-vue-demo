<script setup>
import { ref, computed, onMounted } from 'vue';
/* vuex */
import { useStore } from 'vuex';
/* router */
import router from '@/router';
/* icon */
import { Plus } from '@element-plus/icons-vue';
/* 组件 */
import UserInfoCard from './components/UserInfoCard.vue';
import UserOnlineStatusCard from './components/UserOnlineStatusCard.vue';
import SettingComponents from './components/SettingComponents'
/* constants */
import { onLineStatus } from '@/constant';
/* vueUse */
import { onClickOutside } from '@vueuse/core';

const store = useStore();
/* 取用户头像 */
let loginUserAvatar = computed(() => {
  return store.getters.loginUserInfo.avatarurl;
});

/* 用户在线状态--样式展示逻辑 */
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
let grayContacts = require('@/assets/images/tabbar/1491654067271_.pic.jpg');
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
/* 用户信息卡片显隐 */
const isShowUserInfoCard = ref(false);
const changeUserInfoCard = ref(null);
onClickOutside(changeUserInfoCard, () => (isShowUserInfoCard.value = false));


/* 设置部分 */
const settingComp = ref(null)
const settingPopover = ref(null)
const modalType = ref('');
const isShowPopover = ref(false)
//设置相关icon
const createGroupIcon = require('@/assets/images/tabbar/1461654066965_.pic.jpg')
const applyJoinGroupIcon = require('@/assets/images/tabbar/1471654067125_.pic.jpg')
const applyAddFriendIcon = require('@/assets/images/tabbar/1481654067168_.pic.jpg')
onClickOutside(settingPopover, () => (isShowPopover.value = false));
const showInputModal = (type) => {
  modalType.value = type
  settingComp.value.dialogVisible = true
  console.log('>>>>>>跳转对应modal')
}


</script>

<template>
  <!-- 头像 -->
  <div class="chat_avatar">
    <el-avatar :src="loginUserAvatar" @click="isShowUserInfoCard = true">
    </el-avatar>
    <el-popover popper-class="user_status_popover" :width="10" trigger="click" placement="right-start"
      :show-arrow="false">
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
  <!-- 设置添加部分 -->
  <div class="chat_settings">
    <el-popover popper-class="setting_popover" ref="settingPopover" v-model:visible="isShowPopover"
      placement="right-end" trigger="click">
      <template #reference>
        <el-icon @click="isShowPopover = true">
          <Plus />
        </el-icon>
      </template>
      <template #default>
        <div class="setting_fun_list">
          <div class="func_item" @click="showInputModal('createNewGroups')">
            <span class="settting_fun_icon">
              <img :src="createGroupIcon" alt="">
            </span>
            <span class="setting_fun_text">创建群组</span>
          </div>
          <div class="func_item" @click="showInputModal('applyJoinGroups')">
            <span class="settting_fun_icon">
              <img :src="applyJoinGroupIcon" alt="">
            </span>
            <span class="setting_fun_text apply_groups">
              <b class="line"></b>
              申请入群
              <b class="line"></b>
            </span>
          </div>
          <div class="func_item" @click="showInputModal('addNewFriend')">
            <span class="settting_fun_icon">
              <img :src="applyAddFriendIcon" alt="">
            </span>
            <span class="setting_fun_text">添加好友</span>
          </div>
        </div>
      </template>
    </el-popover>
  </div>
  <SettingComponents ref="settingComp" :modalType="modalType" />
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
      transition: all .5s;

      &:hover {
        transform: scale(1.3);
      }

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
    transition: all .5s;

    &:hover {
      transform: scale(1.3);
    }
  }
}

.chat_settings {
  position: absolute;
  bottom: 46px;
  font-size: 24px;
  color: #8e8e8e;
  cursor: pointer;
  transition: all .5s;

  &:hover {
    color: #1b83f9;
    transform: scale(1.3);
  }

  .chat_setting_item {
    width: 100%;
    height: 30px;
  }
}

.setting_fun_list {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;


  .func_item {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    width: 100%;

    &:hover {
      background-color: #F2F2F2;
    }

    .settting_fun_icon {
      // display: flex;
      // background: pink;

      img {
        width: 20px;
        height: 20px;
      }
    }

    .setting_fun_text {
      display: inline-block;
      text-align: center;
      height: 50px;
      line-height: 50px;
      width: 70px;
      cursor: pointer;
    }

    .apply_groups {
      display: flex;
      flex-direction: column;

    }
  }

}

.line {
  display: inline-block;
  width: 100%;
  height: 1px;
  background: #000;
}
</style>
