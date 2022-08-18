<script setup>
import { ref, computed, watch } from 'vue';
/* vuex */
import { useStore } from 'vuex';
/* router */
import router from '@/router';
/* route */
import { useRoute } from 'vue-router';
/* lodash */
import _ from 'lodash';
/* icon */
import { Plus } from '@element-plus/icons-vue';
/* 组件 */
import MiniInfoCard from './components/AboutUserInfoCard/MiniInfoCard.vue';
import UserOnlineStatusCard from './components/UserOnlineStatusCard.vue';
import SettingComponents from './components/SettingComponents'
import Logout from './components/Logout.vue';
import EditUserInfoCard from './components/AboutUserInfoCard/EditUserInfoCard.vue'
/* constants */
import { onLineStatus } from '@/constant';
/* vueUse */
import { onClickOutside } from '@vueuse/core';
const route = useRoute()


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
    return onLineStatus[loginUserOnlineStatus] && onLineStatus[loginUserOnlineStatus].style || '';
  }
});

/* tabbar icon 路由跳转 */
let skipRouterName = ref('conversation');
let highligthConversation = require('@/assets/images/tabbar/sessionhighlight2x.png');
let grayConversation = require('@/assets/images/tabbar/session2x.png');
let highligthContacts = require('@/assets/images/tabbar/comtactshighlight2x.png');
let grayContacts = require('@/assets/images/tabbar/1491654067271_.pic.jpg');
const changeSkipRouterName = (routerName) => {
  router.push(`/chat/${routerName}`);
};
watch(() => route.path, (newPath) => {
  if (newPath.includes('/chat/conversation')) {
    skipRouterName.value = 'conversation';
  }
  if (newPath.includes('/chat/contacts')) {
    console.log('>>>>>存在赋值为联系人样式')
    skipRouterName.value = 'contacts';
  }
})
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


/* 新建功能部分 */
const settingComp = ref(null)
const settingPopover = ref(null)
const modalType = ref('');
const isShowPopover = ref(false)
//新建功能相关icon
const createGroupIcon = require('@/assets/images/tabbar/1461654066965_.pic.jpg')
const applyJoinGroupIcon = require('@/assets/images/tabbar/1471654067125_.pic.jpg')
const applyAddFriendIcon = require('@/assets/images/tabbar/1481654067168_.pic.jpg')
onClickOutside(settingPopover, () => (isShowPopover.value = false));
const showInputModal = (type) => {
  modalType.value = type
  settingComp.value.dialogVisible = true
  console.log('>>>>>>跳转对应modal')
}

/* 更多操作部分more_settings */
const edituserinfo = ref(null)
const logout = ref(null)


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
  <MiniInfoCard ref="changeUserInfoCard" v-show="isShowUserInfoCard" />
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
  <!-- 新建添加部分 -->
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
          <div class="func_item" @click="showInputModal('addNewFriend')">
            <span class="settting_fun_icon">
              <img :src="applyAddFriendIcon" alt="">
            </span>
            <span class="setting_fun_text">添加好友</span>
          </div>
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
        </div>
      </template>
    </el-popover>
  </div>
  <!-- 更多设置 -->
  <div class="more_settings">
    <el-popover popper-class="setting_popover" placement="right-end" :width="150" trigger="click">
      <template #reference>
        <div class="more_settings_icon">
          <svg width="27" height="20" viewBox="0 0 27 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M7.91406 3.19434H25.2559C25.5436 3.19434 25.7848 3.09701 25.9795 2.90234C26.1826 2.70768 26.2842 2.46647 26.2842 2.17871C26.2842 1.89095 26.1826 1.64974 25.9795 1.45508C25.7848 1.25195 25.5436 1.15039 25.2559 1.15039H7.91406C7.6263 1.15039 7.38086 1.25195 7.17773 1.45508C6.98307 1.64974 6.88574 1.89095 6.88574 2.17871C6.88574 2.46647 6.98307 2.70768 7.17773 2.90234C7.38086 3.09701 7.6263 3.19434 7.91406 3.19434ZM7.91406 10.875H25.2559C25.5436 10.875 25.7848 10.7777 25.9795 10.583C26.1826 10.3799 26.2842 10.1344 26.2842 9.84668C26.2842 9.55892 26.1826 9.31771 25.9795 9.12305C25.7848 8.92839 25.5436 8.83105 25.2559 8.83105H7.91406C7.6263 8.83105 7.38086 8.92839 7.17773 9.12305C6.98307 9.31771 6.88574 9.55892 6.88574 9.84668C6.88574 10.1344 6.98307 10.3799 7.17773 10.583C7.38086 10.7777 7.6263 10.875 7.91406 10.875ZM7.91406 18.543H25.2559C25.5436 18.543 25.7848 18.4456 25.9795 18.251C26.1826 18.0563 26.2842 17.8151 26.2842 17.5273C26.2842 17.2396 26.1826 16.9984 25.9795 16.8037C25.7848 16.6006 25.5436 16.499 25.2559 16.499H7.91406C7.6263 16.499 7.38086 16.6006 7.17773 16.8037C6.98307 16.9984 6.88574 17.2396 6.88574 17.5273C6.88574 17.8151 6.98307 18.0563 7.17773 18.251C7.38086 18.4456 7.6263 18.543 7.91406 18.543ZM2.30273 3.76562C2.74284 3.76562 3.11947 3.61328 3.43262 3.30859C3.74577 2.99544 3.90234 2.61882 3.90234 2.17871C3.90234 1.73014 3.74577 1.35352 3.43262 1.04883C3.11947 0.735677 2.74284 0.579102 2.30273 0.579102C1.86263 0.579102 1.486 0.735677 1.17285 1.04883C0.859701 1.35352 0.703125 1.73014 0.703125 2.17871C0.703125 2.61882 0.859701 2.99544 1.17285 3.30859C1.486 3.61328 1.86263 3.76562 2.30273 3.76562ZM2.30273 11.4463C2.74284 11.4463 3.11947 11.2897 3.43262 10.9766C3.74577 10.6634 3.90234 10.2868 3.90234 9.84668C3.90234 9.40658 3.74577 9.02995 3.43262 8.7168C3.11947 8.40365 2.74284 8.24707 2.30273 8.24707C1.86263 8.24707 1.486 8.40365 1.17285 8.7168C0.859701 9.02995 0.703125 9.40658 0.703125 9.84668C0.703125 10.2868 0.859701 10.6634 1.17285 10.9766C1.486 11.2897 1.86263 11.4463 2.30273 11.4463ZM2.30273 19.127C2.74284 19.127 3.11947 18.9704 3.43262 18.6572C3.74577 18.3441 3.90234 17.9674 3.90234 17.5273C3.90234 17.0788 3.74577 16.7021 3.43262 16.3975C3.11947 16.0843 2.74284 15.9277 2.30273 15.9277C1.86263 15.9277 1.486 16.0843 1.17285 16.3975C0.859701 16.7021 0.703125 17.0788 0.703125 17.5273C0.703125 17.9674 0.859701 18.3441 1.17285 18.6572C1.486 18.9704 1.86263 19.127 2.30273 19.127Z"
              fill="#8E8E8E" />
          </svg>
        </div>
      </template>
      <template #default>
        <div class="setting_fun_list">
          <!-- 用户信息查看编辑 -->
          <div class="func_item" @click="edituserinfo.dialogVisible = true">
            <span class="settting_fun_icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id="mask0_358_22978" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="1" y="13" width="18"
                  height="7">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M1.66693 13.9138H18.2035V19.1663H1.66693V13.9138Z"
                    fill="white" />
                </mask>
                <g mask="url(#mask0_358_22978)">
                  <path fill-rule="evenodd" clip-rule="evenodd"
                    d="M3.9029 15.1638C3.395 15.1638 2.98272 15.5563 2.98272 16.038V17.0422C2.98272 17.5247 3.395 17.9163 3.9029 17.9163H15.9669C16.4748 17.9163 16.888 17.5247 16.888 17.0422V16.038C16.888 15.5563 16.4748 15.1638 15.9669 15.1638H3.9029ZM15.9669 19.1663H3.9029C2.66956 19.1663 1.66693 18.2138 1.66693 17.0422V16.038C1.66693 14.8672 2.66956 13.9138 3.9029 13.9138H15.9669C17.2003 13.9138 18.2038 14.8672 18.2038 16.038V17.0422C18.2038 18.2138 17.2003 19.1663 15.9669 19.1663V19.1663Z"
                    fill="#333333" />
                </g>
                <path fill-rule="evenodd" clip-rule="evenodd"
                  d="M17.247 11.5199H13.5864C13.4466 11.5199 13.3334 11.3991 13.3334 11.2499C13.3334 11.1008 13.4466 10.9799 13.5864 10.9799H17.247C17.3868 10.9799 17.5 11.1008 17.5 11.2499C17.5 11.3991 17.3868 11.5199 17.247 11.5199"
                  fill="#333333" />
                <path fill-rule="evenodd" clip-rule="evenodd"
                  d="M13.6838 11.0833C13.6128 11.0833 13.5552 11.1483 13.5552 11.2283C13.5552 11.3091 13.6128 11.3741 13.6838 11.3741H17.1496C17.2206 11.3741 17.2783 11.3091 17.2783 11.2283C17.2783 11.1483 17.2206 11.0833 17.1496 11.0833H13.6838ZM17.1496 11.6233H13.6838C13.4901 11.6233 13.3334 11.4466 13.3334 11.2283C13.3334 11.0108 13.4901 10.8333 13.6838 10.8333H17.1496C17.3433 10.8333 17.5 11.0108 17.5 11.2283C17.5 11.4466 17.3433 11.6233 17.1496 11.6233V11.6233Z"
                  fill="#333333" />
                <mask id="mask1_358_22978" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="1" y="1" width="13"
                  height="13">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M1.66669 1.54346H13.109V13.2855H1.66669V1.54346Z"
                    fill="white" />
                </mask>
                <g mask="url(#mask1_358_22978)">
                  <path fill-rule="evenodd" clip-rule="evenodd"
                    d="M7.38784 2.87655C4.97553 2.87655 3.01284 4.9121 3.01284 7.41432C3.01284 9.91655 4.97553 11.9521 7.38784 11.9521C9.80015 11.9521 11.7628 9.91655 11.7628 7.41432C11.7628 4.9121 9.80015 2.87655 7.38784 2.87655M7.38784 13.2854C4.23335 13.2854 1.66669 10.6517 1.66669 7.41432C1.66669 4.17699 4.23335 1.54321 7.38784 1.54321C10.5432 1.54321 13.109 4.17699 13.109 7.41432C13.109 10.6517 10.5432 13.2854 7.38784 13.2854"
                    fill="#333333" />
                </g>
              </svg>
            </span>
            <span class="setting_fun_text">用户信息</span>
          </div>
          <!-- 退出登陆 -->
          <div class="func_item" @click="logout.dialogVisible = true">
            <span class="settting_fun_icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6.02125 4.18042C3.90653 5.49657 2.5 7.84403 2.5 10.5156C2.5 14.6507 5.85404 18 9.99496 18C14.1359 18 17.4899 14.6507 17.4899 10.5156C17.4899 7.85386 16.0932 5.51621 13.9982 4.19024"
                  stroke="#333333" stroke-width="1.4" stroke-miterlimit="10" stroke-linecap="round" />
                <path d="M10.054 2V8.87542" stroke="#333333" stroke-width="1.4" stroke-miterlimit="10"
                  stroke-linecap="round" />
              </svg>

            </span>
            <span class="setting_fun_text">退出登陆</span>
          </div>
        </div>
      </template>
    </el-popover>


  </div>
  <div class="components">
    <!-- 群组新建 申请入群 添加好友模块 -->
    <SettingComponents ref="settingComp" :modalType="modalType" />
    <!-- 用户属性编辑 -->
    <EditUserInfoCard ref="edituserinfo" />
    <!-- 退出登陆模块 -->
    <Logout ref="logout" />
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
  bottom: 92px;
  font-size: 30px;
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

.more_settings {
  position: absolute;
  bottom: 46px;
  color: #8e8e8e;
  cursor: pointer;
  transition: all .5s;

  &:hover {
    transform: scale(1.3);
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

.settting_fun_icon {
  font-size: 20px;
}

.line {
  display: inline-block;
  width: 100%;
  height: 1px;
  background: #000;
}

.components {
  ::v-deep .edit_userinfo_diglog {
    border-radius: 4px;
    overflow: hidden;
  }

  ::v-deep .edit_userinfo_diglog>.el-dialog__header {
    padding: 0;
    margin-right: 0px;
  }

  ::v-deep .edit_userinfo_diglog>.el-dialog__body {
    padding: 0;
    border-radius: 4px;
  }

}
</style>
