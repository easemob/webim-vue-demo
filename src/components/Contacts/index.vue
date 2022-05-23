<script setup>
import SearchInput from '@/components/searchInput'
import router from '@/router';
const toMessage = () => {
  router.push('/chat/contacts/message');
};
</script>
<template>

  <el-container style="height: 100%;">
    <el-aside class="contacts_box">
      <SearchInput />
      联系人页
      <div @click="toMessage">选择消息</div>
    </el-aside>
    <el-main>
      <router-view></router-view>
    </el-main>
  </el-container>

</template>

<style lang="scss" scoped>
.contacts_box {
  position: relative;
  width: 30%;
  background: #cfdbf171;
  overflow: hidden;
}
</style>
