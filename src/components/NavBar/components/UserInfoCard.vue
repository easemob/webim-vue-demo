<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { Share } from '@element-plus/icons-vue';
import EaseIM from '@/IM/initwebsdk'

const store = useStore();
const userInfos = computed(() => {
  return store.getters.loginUserInfo;
});
const loginUserId = EaseIM.conn.user

</script>
<template>
  <div class="user_info_card line3" shadow="hover">
    <div class="info_fist_col">
      <el-avatar class="avatar" :src="userInfos.avatarurl" />
      <span class="nickname">{{
          userInfos.nickname
            ? userInfos.nickname + '(' + userInfos.hxId + ')'
            : `暂无昵称(${loginUserId})`
      }}</span>
    </div>
    <div class="info_second_col">
      <p class="add"><b class="label"> 地区：</b><span class="address">{{
          userInfos.add ? userInfos.add : '地球'
      }}</span></p>
      <div>
        <span>♀</span>
        <span>
          <Share style="width: 1em; height: 1em; margin-right: 8px" />
        </span>
      </div>
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
  left: 80px;
  top: 50px;
  background: #fff;
  border-radius: 2px;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.20633);
  z-index: 999;
  transition: all 0.5s;
  width: 216px;
  height: 216px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .user_info_card>.el-card__body {
    height: 100%;
    padding: 0;
  }

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
      box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.20633);
      animation: avatar .3s linear 1;
    }

    .nickname {
      margin-top: 3px;
      display: inline-block;
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 600;
      font-size: 20px;
      line-height: 28px;
      color: #0D0D0D;

    }
  }

  .info_second_col {
    margin-left: 22px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 50px;

    .add {
      font-family: 'PingFang SC';
      font-style: normal;
      font-size: 13px;
      line-height: 24px;
      letter-spacing: 0.229412px;

      .label {
        color: #333333;
        font-weight: 400;
      }

      .address {
        font-weight: 200;
        opacity: .5;
        color: #333333;
      }
    }
  }
}
</style>
