<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { onLineStatus } from '@/constant';
import { ElNotification } from 'element-plus';
import Ease from '@/IM/initwebsdk';

const store = useStore();
const loginUserOnlineStatus = computed(() => store.state.loginUserOnlineStatus);
console.log('loginUserOnlineStatus', loginUserOnlineStatus);
const selectOnlineMode = async (statusType) => {
  console.log('checkedStatusType', statusType);
  let option = {
    description: statusType,
  };
  try {
    await Ease.conn.publishPresence(option);
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
  <div style="display: flex; align-items: center">
    <ul class="chat_status_change">
      <li
        class="chat_status_change_item"
        :class="loginUserOnlineStatus === itemKey && 'active_status_style'"
        v-for="(item, itemKey, index) in onLineStatus"
        :key="item"
        @click="selectOnlineMode(itemKey)"
      >
        <img class="icon" :src="item.icon" alt="" />
        <span class="label">{{ item.label }}</span>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.chat_status_change {
  width: 100%;
  .chat_status_change_item {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: start;
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
      width: 15px;
      height: 15px;
    }
  }
  .active_status_style {
    font-weight: bold;
    transform: scale(1.1);
  }
}
</style>
