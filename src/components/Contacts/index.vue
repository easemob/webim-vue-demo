<script setup>
import router from '@/router';
const toMessage = () => {
  router.push('/chat/contacts/message');
};
</script>
<template>
  <div>
    <el-container>
      <el-aside width="200px">
        联系人页
        <div @click="toMessage">选择消息</div></el-aside
      >
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </div>
</template>

<style lang="scss" scoped></style>
