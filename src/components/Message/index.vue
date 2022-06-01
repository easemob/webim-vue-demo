<script setup>
import { ref, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { messageType } from '@/constant'
const store = useStore()
const route = useRoute()
const drawer = ref(false)
const { CHAT_TYPE } = messageType

//获取路由ID对应的信息
const getIdInfo = ({ id, chatType }) => {

  console.log('>>>>>', id, chatType)
  if (chatType === CHAT_TYPE.GROUP) {
    store.dispatch('getAssignGroupDetail', id)
  }

}
watch(() => route.query, (routeVal) => {
  // console.log('route', newVal, route.query)
  if (routeVal) {
    getIdInfo(routeVal)

  }
}, {
  immediate: true
})



</script>
<template>
  <el-container class="app_container">
    <el-header class="chat_message_header">
      <div class="chat_user_name"> 小当家</div>
      <span class="more" @click="drawer = !drawer">
        ...
      </span>
    </el-header>

    <el-main class="chat_message_main">
      <div v-for="item in 200">{{ item }}</div>

    </el-main>
    <el-footer class="chat_message_inputbar">
      <div class="chat_func_box"></div>
    </el-footer>

  </el-container>
  <el-drawer v-model="drawer" title="I am the title" direction="rtl" :modal="false" size="20%">
    <span>Hi, there!</span>
  </el-drawer>
</template>



<style lang="scss" scoped>
.app_container {
  height: 100%;
  border-left: 1px solid #E6E6E6;
}

.chat_message_header {
  position: relative;
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
  height: 61px;
  background: #F9F9F9;
  border-bottom: 1px solid #E6E6E6;

  .chat_user_name {
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 400;
    font-size: 17px;
    line-height: 24px;
    letter-spacing: 0.3px;
    color: #333333;
  }

  .more {
    display: flex;
    width: 35px;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    cursor: pointer;
    transition: all .3s;

    &:hover {
      transform: scale(1.1);
    }
  }
}

.chat_message_main {
  background: #F9F9F9;
  overflow-y: scroll;
}

.chat_message_inputbar {
  height: 25%;
  padding: 0;
  background-color: #F9F9F9;

  .chat_func_box {
    height: 40px;
    width: 100%;
    border-radius: 5px;
    background-color: #f7f7f7;
    border-top: 1px solid #E6E6E6;
    border-bottom: 1px solid #E6E6E6;
  }

}
</style>
