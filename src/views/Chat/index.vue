<script setup>
import NavBar from '@/views/Chat/components/NavBar';
// import { useRoute } from 'vue-router'
// const route = useRoute()

</script>
<template>
  <div class="app-container">
    <el-container class="chat_container">
      <el-aside class="chat_nav_bar" width="80px">
        <NavBar />
      </el-aside>
      <el-main class="chat_main_box">
        <router-view>
        </router-view>
      </el-main>
    </el-container>
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background: url('@/assets/images/web-demo-base.png');
  background-size: cover;
  backdrop-filter: blur(5px);

  .chat_container {
    width: 85%;
    height: 95%;
    background: #F2F2F2;
    position: relative;
    top: 50%;
    /*
      	transform的百分比相对的是自身的宽度或高度( refer to the size of bounding box )
      */
    transform: translateY(-50%);
    margin: auto auto;
    border-radius: 5px;

    .chat_nav_bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      border-radius: 5px 0 0 5px;
      width: 80px;
      background: #262626;
      overflow: hidden;
    }

    .chat_main_box {
      // height: 100%;
      // overflow: hidden;
      padding: 0;
    }
  }
}
</style>
