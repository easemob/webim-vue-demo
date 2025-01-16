<script setup>
const tang = require('@/assets/images/Group 78@3x.png');
const maskGroup = require('@/assets/images/Mask_group2.png');
</script>
<template>
  <div class="app_contanier">
    <div class="welcome_box">
      <img class="tang" :src="tang" />
      <h1 class="welcome_box_title">欢迎体验 环信 Easemob 即时通讯</h1>
      <p class="welcome_box_text">
        此Demo包含单聊群聊，添加好友，创建群组等功能，更多其他功能等你发现，快去试试吧！
      </p>
    </div>
    <img class="maskGroup" :src="maskGroup" />
  </div>
</template>

<style type="scss" scoped>
.app_contanier {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  background: url('../../assets/images/Mask_group.png') no-repeat;
  background-size: 100% 100%;
  border-radius: 0 5px 5px 0;
  overflow: hidden;
}

.welcome_box {
  position: relative;
  margin-top: 140px;
  margin-left: 100px;
  width: 637px;
  height: 400px;
}

.tang {
  position: absolute;
  left: -30px;
  top: 0;
  width: 32px;
  height: 32px;
}

.welcome_box_title {
  font-family: 'PingFang SC';
  font-style: normal;
  font-weight: 500;
  font-size: 24px;
  line-height: 34px;
  letter-spacing: 1px;
  color: #333333;
}

.welcome_box_text {
  margin-top: 12px;
  font-family: 'PingFang SC';
  font-style: normal;
  font-weight: 300;
  font-size: 16px;
  line-height: 22px;
  letter-spacing: 1.5px;
  color: #a3a3a3;
}

.maskGroup {
  position: absolute;
  right: 0;
  top: 25%;
}
</style>
