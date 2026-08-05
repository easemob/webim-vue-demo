<script setup>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { getCurrentUserId, logout } from '@/IM';
import router from '@/router';
const dialogVisible = ref(false);
const isClearStorage = ref(true);
const store = useStore();

const logoutTheUser = async () => {
  try {
    await logout();
  } catch (error) {
    console.error('[Logout] SDK 5.0 logout failed', error);
    return;
  }
  store.commit('CLEAR_JOINED_CHATROOM_IDS');
  store.commit('CLEAR_SDK_EVENT_RECORDS');
  if (isClearStorage.value) {
    clearLocalStorage();
  }
  window.localStorage.removeItem('EASEIM_loginUser');
  dialogVisible.value = false;
  router.replace('/login');
};

const clearLocalStorage = () => {
  const storageType = ['INFORM', 'conversationList', 'search_hisory'];
  const loginUserId = getCurrentUserId();
  const storageKey = `EASEIM_${loginUserId}`;
  storageType.map((item) => {
    return window.localStorage.removeItem(`${storageKey}_${item}`);
  });
  window.localStorage.removeItem('EASEIM_loginUser');
};
defineExpose({
  dialogVisible,
});
</script>
<template>
  <el-dialog
    custom-class="login_diglog"
    v-model="dialogVisible"
    title="退出登录"
    width="480px"
    :destroy-on-close="true"
  >
    <span class="logout_title">确认退出当前登录账号？</span>
    <br />
    <span class="logout_clear">
      <el-checkbox v-model="isClearStorage" label="清除账号缓存" size="small" />
    </span>
    <template #footer>
      <span class="dialog-footer">
        <el-button style="width: 113.6px" @click="dialogVisible = false"
          >取消</el-button
        >
        <el-button style="width: 113.6px" type="primary" @click="logoutTheUser"
          >确认退出</el-button
        >
      </span>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.logout_title {
  font-family: 'PingFang SC';
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 22px;
  /* or 157% */

  text-align: justify;

  color: #3a3a3a;
}

.logout_clear {
  font-size: 7px;
  font-weight: bold;
}
</style>
