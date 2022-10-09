<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

/* 组件 */
import ShareMyInfoCard from './components/ShareMyInfoCard.vue'
const store = useStore();
const userInfos = computed(() => {
  return store.getters.loginUserInfo ?? {};
});
const loginUserId = computed(() => { return store.state.loginUserInfo.hxId })
const bodyIcon = require('@/assets/images/gender/Group76.png')
const girlIcon = require('@/assets/images/gender/Group77.png')
const genderIcon = {
  "1": bodyIcon,
  "2": girlIcon
}
/* share */
const shareInfo = ref(null);
const showShareInfoModal = () => {
  console.log('>>>>>>>分享卡片')
  shareInfo.value.dialogTableVisible = true;

}
</script>
<template>
  <div class="user_info_card line3">
    <div class="info_fist_col">
      <el-avatar class="avatar" :size="56" :src="userInfos.avatarurl" />
      <div class="name_box">
        <span class="nickname">{{
        userInfos.nickname
        ? userInfos.nickname
        : loginUserId
        }}</span>
        <img v-if="userInfos.gender && genderIcon[userInfos.gender]" class="gender"
          :src="genderIcon[userInfos.gender]" />
      </div>

    </div>
    <el-divider style="margin:0;" />
    <div class="info_second_col">
      <p class="add"><b class="label"> 地区：</b><span class="address">北京·海淀区</span></p>

      <div class="share_my_info_card" @click.stop="showShareInfoModal">
        <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2.61914 14.0156H9.38086C10.0293 14.0156 10.5215 13.8477 10.8574 13.5117C11.1973 13.1758 11.3672 12.6875 11.3672 12.0469V6.33984C11.3672 5.69922 11.1973 5.21094 10.8574 4.875C10.5215 4.53906 10.0293 4.37109 9.38086 4.37109H7.82812V5.67773H9.26953C9.52344 5.67773 9.71875 5.74414 9.85547 5.87695C9.99219 6.00586 10.0605 6.20508 10.0605 6.47461V11.9121C10.0605 12.1816 9.99219 12.3828 9.85547 12.5156C9.71875 12.6484 9.52344 12.7148 9.26953 12.7148H2.72461C2.4668 12.7148 2.26953 12.6484 2.13281 12.5156C2 12.3828 1.93359 12.1816 1.93359 11.9121V6.47461C1.93359 6.20508 2 6.00586 2.13281 5.87695C2.26953 5.74414 2.4668 5.67773 2.72461 5.67773H4.18945V4.37109H2.61914C1.9707 4.37109 1.47656 4.53906 1.13672 4.875C0.800781 5.20703 0.632812 5.69531 0.632812 6.33984V12.0469C0.632812 12.6914 0.800781 13.1797 1.13672 13.5117C1.47656 13.8477 1.9707 14.0156 2.61914 14.0156ZM5.99414 9.28711C6.16602 9.28711 6.30859 9.22852 6.42188 9.11133C6.53906 8.99414 6.59766 8.85547 6.59766 8.69531V2.87109L6.55078 2.00977L6.88477 2.44922L7.66406 3.27539C7.76953 3.38867 7.90039 3.44531 8.05664 3.44531C8.19727 3.44531 8.32031 3.39844 8.42578 3.30469C8.53125 3.20703 8.58398 3.08398 8.58398 2.93555C8.58398 2.79883 8.5293 2.67383 8.41992 2.56055L6.46289 0.679688C6.38477 0.601563 6.30664 0.548828 6.22852 0.521484C6.1543 0.490234 6.07617 0.474609 5.99414 0.474609C5.91602 0.474609 5.83984 0.490234 5.76562 0.521484C5.69141 0.548828 5.61328 0.601563 5.53125 0.679688L3.57422 2.56055C3.46484 2.67383 3.41016 2.79883 3.41016 2.93555C3.41016 3.08398 3.46094 3.20703 3.5625 3.30469C3.66797 3.39844 3.79297 3.44531 3.9375 3.44531C4.09766 3.44531 4.23047 3.38867 4.33594 3.27539L5.10938 2.44922L5.44922 2.00977L5.39648 2.87109V8.69531C5.39648 8.85547 5.45508 8.99414 5.57227 9.11133C5.68945 9.22852 5.83008 9.28711 5.99414 9.28711Z"
            fill="#0091FF" />
        </svg>
      </div>

    </div>
    <ShareMyInfoCard ref="shareInfo" />
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
      animation: avatar .3s linear 1;
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
    color: #A3A3A3;

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

::v-deep .el-dialog__header {
  background: #F2F2F2;
  margin: 0;
}
</style>
