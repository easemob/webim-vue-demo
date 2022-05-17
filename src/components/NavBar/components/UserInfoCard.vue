<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { Share } from '@element-plus/icons-vue';
const store = useStore();
const userInfos = computed(() => {
  return store.getters.loginUserInfo;
});
console.log('userInfos', userInfos);
</script>
<template>
  <el-card class="user_info_card" shadow="hover">
    <div class="info_fist_col">
      <el-avatar class="avatar" :src="userInfos.avatarurl" />
      <span class="nickname">{{
        userInfos.nickname
          ? userInfos.nickname + '(' + userInfos.hxId + ')'
          : userInfos.hxId
      }}</span>
      <el-icon class="share_icon"><Share /></el-icon>
    </div>
    <div class="info_second_col">
      地区：<span class="text">{{
        userInfos.add ? userInfos.add : '地球'
      }}</span>
    </div>
  </el-card>
</template>

<style lang="scss" scoped>
.user_info_card {
  position: absolute;
  left: 80px;
  top: 50px;
  z-index: 999;
  transition: all 0.5s;
  width: 226px;
  height: 132px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .info_fist_col {
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
    .avatar {
      width: 33px;
      height: 33px;
    }
    .nickname {
      margin-left: 10px;
      display: inline-block;
      // width: 60px;
    }
    .share_icon {
      position: absolute;
      right: 0;
      top: 25%;

      transition: all 0.3s;
      &:hover {
        transform: scale(1.2);
        box-shadow: 1px 1px 3px #b8b8b8;
      }
    }
  }
  .info_second_col {
    margin-top: 15px;
    margin-left: 45px;
    display: inline-block;
    height: 50px;
    line-height: 50px;
    .text {
      color: #b8b8b8;
      font-weight: 300;
    }
  }
}
</style>
