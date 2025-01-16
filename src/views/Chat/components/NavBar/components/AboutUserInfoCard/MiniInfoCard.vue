<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const userInfos = computed(() => {
  return store.getters.loginUserInfo ?? {};
});
const loginUserId = computed(() => {
  return store.state.loginUserInfo.hxId;
});
const bodyIcon = require('@/assets/images/gender/Group76.png');
const girlIcon = require('@/assets/images/gender/Group77.png');
const genderIcon = {
  1: bodyIcon,
  2: girlIcon,
};
</script>
<template>
  <div class="user_info_card line3">
    <div class="info_fist_col">
      <el-avatar class="avatar" :size="56" :src="userInfos.avatarurl" />
      <div class="name_box">
        <span class="nickname">{{
          userInfos.nickname ? userInfos.nickname : loginUserId
        }}</span>
        <img
          v-if="userInfos.gender && genderIcon[userInfos.gender]"
          class="gender"
          :src="genderIcon[userInfos.gender]"
        />
      </div>
    </div>
    <el-divider style="margin: 0" />
    <div class="info_second_col">
      <p class="add">
        <b class="label"> 地区：</b><span class="address">北京·朝阳区</span>
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 头像相关动效 */
@keyframes avatar {
  0% {
    width: 0;
    height: 0;
  }

  50% {
    width: 30px;
    height: 30px;
  }

  100% {
    width: 60px;
    height: 60px;
  }
}

.user_info_card {
  position: absolute;
  left: 75px;
  top: 50px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.20633);
  z-index: 999;
  transition: all 0.5s;
  width: 180px;
  height: 170px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  padding: 0 14px 16px 10px;

  .info_fist_col {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    // height: 190px;

    .avatar {
      width: 60px;
      height: 60px;
      animation: avatar 0.3s linear 1;
      transition: all 0.8s;

      &:hover {
        box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.20633);
        transform: rotate(360deg);
      }
    }

    .name_box {
      height: 30px;
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-items: center;

      .nickname {
        max-width: 130px;
        margin-top: 3px;
        display: inline-block;
        font-family: 'PingFang SC';
        font-style: normal;
        font-weight: 600;
        font-size: 16px;
        line-height: 22px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #333333;
      }

      .gender {
        width: 18px;
        height: 18px;
      }
    }
  }

  .info_second_col {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 24px;
    margin-top: 12px;
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 400;
    font-size: 13px;
    line-height: 24px;
    /* identical to box height, or 185% */

    letter-spacing: 0.229412px;
    color: #a3a3a3;

    .share_my_info_card {
      display: flex;
      align-items: center;
      height: 24px;
      cursor: pointer;
      transition: all 0.5;

      &:hover {
        transform: scale(1.2);
      }
    }
  }
}

:deep(.el-dialog__header) {
  background: #f2f2f2;
  margin: 0;
}
</style>
