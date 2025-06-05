<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { onLineStatus } from '@/constant';
import { ElNotification } from 'element-plus';
import { EMClient } from '@/IM';

const store = useStore();
const loginUserOnlineStatus = computed(() => store.state.loginUserOnlineStatus);

const selectOnlineMode = async (statusType) => {
  const option = {
    description: statusType,
  };
  try {
    await EMClient.publishPresence(option);
  } catch (error) {
    ElNotification({
      title: 'Easemob',
      message: '在线状态修改失败，请稍后重试！',
      type: 'error',
    });
  }
};
</script>
<template>
  <div style="width: 100%; height: 100%; display: flex; align-items: center">
    <ul class="chat_status_change">
      <li
        class="chat_status_change_item"
        :class="loginUserOnlineStatus === itemKey && 'active_status_style'"
        v-for="(item, itemKey, index) in onLineStatus"
        :key="item"
        @click="selectOnlineMode(itemKey)"
      >
        <span class="icon" :style="item.style"></span>
        <span class="label">{{ item.label }}</span>
        <span v-if="loginUserOnlineStatus === itemKey" class="checked_icon">
          <svg
            width="10"
            height="8"
            viewBox="0 0 8 6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.07703 6C2.91931 6 2.76221 5.93476 2.64189 5.80495L0.180012 3.13821C-0.0600039 2.87793 -0.0600039 2.45555 0.180012 2.19527C0.420651 1.93498 0.810286 1.93498 1.0503 2.19527L3.07703 4.39054L6.9497 0.195718C7.18971 -0.0652393 7.57935 -0.0652393 7.81999 0.195718C8.06 0.456003 8.06 0.877704 7.81999 1.13799L3.51218 5.80495C3.39186 5.93476 3.23413 6 3.07703 6Z"
              fill="#333333"
            />
          </svg>
        </span>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.chat_status_change {
  width: 140px;
  height: 134px;

  .chat_status_change_item {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    height: 30px;
    border-radius: 5px;
    margin: 3px;
    font-weight: 200;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      font-weight: bold;
      transform: scale(1.1);
    }

    .label {
      margin-left: 10px;
      font-size: 17px;
    }

    .icon {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .checked_icon {
      position: absolute;
      right: 10px;
      top: 10%;
    }
  }

  .active_status_style {
    font-weight: bold;
    transform: scale(1.1);
    padding: 0 3px;
    background-color: #f2f2f2;
    box-sizing: border-box;
  }
}
</style>
