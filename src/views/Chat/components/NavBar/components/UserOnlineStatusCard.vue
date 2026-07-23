<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { onLineStatus } from '@/constant';
import { ElNotification } from 'element-plus';
import { requireManager } from '@/IM';

const store = useStore();
const loginUserOnlineStatus = computed(() => store.state.loginUserOnlineStatus);
const customStatus = ref('');

const publishPresenceStatus = async (statusType, successMessage) => {
  const option = {
    customStatus: statusType,
  };
  try {
    await requireManager('presenceManager').publishPresence(option);
    store.commit('SET_LOGIN_USER_ONLINE_STATUS', statusType);
    if (successMessage) {
      ElNotification({
        title: 'Easemob',
        message: successMessage,
        type: 'success',
      });
    }
  } catch (error) {
    console.error('[Presence] publishPresence failed', error);
    ElNotification({
      title: 'Easemob',
      message: '在线状态修改失败，请稍后重试！',
      type: 'error',
    });
    return false;
  }
  return true;
};

const selectOnlineMode = async (statusType) => {
  await publishPresenceStatus(statusType, '在线状态修改成功！');
};

const publishCustomPresence = async () => {
  if (!customStatus.value.trim()) {
    ElNotification({
      title: 'Easemob',
      message: '请输入自定义在线状态！',
      type: 'warning',
    });
    return;
  }
  
  const nextStatus = customStatus.value.trim();
  const success = await publishPresenceStatus(
    nextStatus,
    '自定义在线状态发布成功！',
  );
  if (success) {
    customStatus.value = '';
  }
};
</script>
<template>
  <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center">
    <ul class="chat_status_change">
      <li
        class="chat_status_change_item"
        :class="loginUserOnlineStatus === itemKey && 'active_status_style'"
        v-for="(item, itemKey) in onLineStatus"
        :key="itemKey"
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
    <div class="custom_status_container">
      <el-input
        v-model="customStatus"
        placeholder="输入自定义在线状态"
        style="width: 140px; margin-top: 10px"
      />
      <button class="custom_status_button" @click="publishCustomPresence">
        发布
      </button>
    </div>
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

.custom_status_container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 140px;
  
  .custom_status_button {
    width: 140px;
    height: 30px;
    margin-top: 5px;
    border: 1px solid #ddd;
    border-radius: 5px;
    background-color: #f2f2f2;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background-color: #e2e2e2;
    }
  }
}
</style>
