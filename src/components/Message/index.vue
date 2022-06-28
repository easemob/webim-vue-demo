<script setup>
import { ref, watch, toRaw, toRefs, nextTick, computed } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { messageType } from '@/constant'
import { useScroll } from '@vueuse/core'
//组件
import MessageList from './components/messageList.vue'
import InputBox from './components/inputBox.vue'
const store = useStore()
const route = useRoute()
const drawer = ref(false) //抽屉显隐
const { CHAT_TYPE } = messageType
const nowPickInfo = ref({});
const friendList = computed(() => store.state.Contacts.friendList)
const groupList = computed(() => store.state.Contacts.groupList)
//获取路由ID对应的信息
const getIdInfo = async ({ id, chatType }) => {
  //类型为单聊
  if (chatType === CHAT_TYPE.SINGLE) {
    if (friendList.value[id].userInfo) {
      nowPickInfo.value.userInfo = friendList[id].userInfo
    } else {
      return
    }
  }
  //类型为群组
  if (chatType === CHAT_TYPE.GROUP) {
    if (groupList.value[id].groupDetail) {
      return nowPickInfo.value.groupDetail = groupList.value[id].groupDetail
    } else {
      await store.dispatch('getAssignGroupDetail', id)
      return nowPickInfo.value.groupDetail = groupList.value[id].groupDetail
    }
  }
}
//监听路由改变获取对应的getIdInfo
watch(() => route.query, (routeVal) => {
  if (routeVal) {
    nowPickInfo.value = { ...routeVal }
    getIdInfo(routeVal)
  }
}, {
  immediate: true
})

const loadingHistoryMsg = ref(false); //是否正在加载中
const isMoreHistoryMsg = ref(true) //加载文案展示为加载更多还是已无更多。
const notScrollBottom = ref(false); //是否滚动置底
//获取历史记录
const fechHistoryMessage = (loadType) => {
  if (!nowPickInfo.value) return []
  console.log('>>>>>>开始拉取漫游');
  return async () => {
    loadingHistoryMsg.value = true;
    notScrollBottom.value = true;
    if (loadType == 'fistLoad') {
      console.log('》》》》》》》本次请求为首次加载历史消息')
      let res = await store.dispatch('getHistoryMessage', nowPickInfo.value)
      if (res.length > 0) {
        //返回数组有数据显示加载更多
        isMoreHistoryMsg.value = true;
      } else {
        //否则已无更多。
        isMoreHistoryMsg.value = false;
      }
      console.log('>>>>>首次加载漫游消息拉取完成')
      scrollMessageList('bottom')
    }
    else {
      let res = await store.dispatch('getHistoryMessage', nowPickInfo.value)
      if (res.length > 0) {
        //返回数组有数据显示加载更多
        isMoreHistoryMsg.value = true;
      } else {
        //否则已无更多。
        isMoreHistoryMsg.value = false;
      }
      scrollMessageList('normal')
    }
    loadingHistoryMsg.value = false
    notScrollBottom.value = false;
  }


  // return []
}
//获取其id对应的消息内容
const messageData = computed(() => {
  //如果Message.messageList中不存在的话调用拉取漫游取一下历史消息
  return nowPickInfo.value.id && store.state.Message.messageList[nowPickInfo.value.id] || fechHistoryMessage('fistLoad')()
})

const messageContainer = ref(null);
const { arrivedState, } = useScroll(messageContainer)
const { top } = toRefs(arrivedState)
//控制消息滚动
const scrollMessageList = (direction) => {
  //direction滚动方向 bottom向下滚动 normal向上滚动 
  nextTick(() => {
    const messageNodeList = messageContainer.value.childNodes
    const fistMsgElement = messageNodeList[2];
    const lastMsgElement = messageNodeList[messageNodeList.length - 2];
    console.log('lastMsgElement', lastMsgElement);
    console.log('fistMsgElement', fistMsgElement);
    //直接滚动置底
    if (direction === 'bottom') {
      // lastMsgElement.scrollIntoView(false);
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
    //保持当前的消息位于当前可视窗口
    if (direction === 'normal') {
      fistMsgElement.scrollIntoView(true)
      console.log('>>>>>开始保持当前位置并滚动');
    }
  })
}
//监听到消息内容改变 置底滚动。
watch(() => store.state.Message.messageList[nowPickInfo.value.id], (messageData) => {
  console.log('>>>>监听到的messageData', messageData, notScrollBottom.value)
  scrollMessageList('bottom')

}, {
  deep: true
})

//监听到nowPickInfo改变 让消息直接置底
watch(nowPickInfo, () => nextTick(() => { messageContainer.value.scrollTop = messageContainer.value.scrollHeight; }))
// 滚动置顶拉取历史消息
// const { arrivedState, } = useScroll(messageContainer)
// const { top } = toRefs(arrivedState)
// watch(top, async (isTop) => {
//   if (isTop && !loadingHistoryMsg.value) {
//     fechHistoryMessage()
//   }
// })

//消息重新编辑
const inputBox = ref(null)
const reEditMessage = (msg) => inputBox.value.textContent = msg;

</script>
<template>
  <el-container class="app_container">
    <el-header class="chat_message_header">
      <div v-if="nowPickInfo.chatType === CHAT_TYPE.SINGLE" class="chat_user_name">{{ nowPickInfo.id }}</div>
      <div v-if="nowPickInfo.chatType === CHAT_TYPE.GROUP" class="chat_user_name">
        {{ nowPickInfo.groupDetail && nowPickInfo.groupDetail.name || '' }} {{ `(${nowPickInfo.groupDetail &&
            nowPickInfo.groupDetail.affiliations_count || ''})`
        }}
      </div>
      <span class="more" @click="drawer = !drawer">
        ...
      </span>
    </el-header>

    <el-main class="chat_message_main">
      <div class="main_container" ref="messageContainer">
        <div class="chat_message_tips">
          <div class="load_more_msg">
            <el-link v-if="!loadingHistoryMsg" :disabled="!isMoreHistoryMsg" :underline="false"
              v-text="isMoreHistoryMsg ? '加载更多' : '已无更多'" @click="fechHistoryMessage()()">
            </el-link>
            <el-link v-else disabled>消息加载中...</el-link>
          </div>

        </div>
        <MessageList :messageData="messageData" @scrollMessageList="scrollMessageList" @reEditMessage="reEditMessage" />
      </div>


    </el-main>
    <el-footer class="chat_message_inputbar">
      <InputBox ref="inputBox" :nowPickInfo="nowPickInfo" />
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
  padding: 0;
  background: #F9F9F9;

  .main_container {
    padding: 0 20px;
    height: 100%;
    overflow-y: scroll;

    .chat_message_tips {
      margin-top: 5px;
      width: 100%;
      height: 30px;
      text-align: center;
      line-height: 30px;

      .load_more_msg {
        width: 200px;
        height: 30px;
        border-radius: 20px;
        margin: 0 auto;
        background: rgba(114, 112, 112, 0.143);
        font-size: 13px;
        letter-spacing: .5px;
        // box-shadow: 1px 1px 1px 1px rgba(128, 128, 128, 0.193);
      }
    }
  }

}

.chat_message_inputbar {
  width: 100%;
  height: 25%;
  padding: 0;
  background-color: #F9F9F9;


}
</style>
