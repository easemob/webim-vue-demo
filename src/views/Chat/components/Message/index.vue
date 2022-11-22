<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import _ from 'lodash'
import { EaseChatClient } from '@/IM/initwebsdk'
import { useStore } from 'vuex'
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import { messageType, warningText } from '@/constant'
// import { useScroll } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import { Close } from '@element-plus/icons-vue'
/* 组件 */
import MessageList from './components/messageList.vue'
import InputBox from './components/inputBox.vue'
import UserStatus from '@/components/UserStatus'
import GroupsDetails from '@/views/Chat/components/AboutGroups/GroupsDetails'
/* store */
const store = useStore()
/* route */
const route = useRoute()
const { CHAT_TYPE } = messageType
const { EASEIM_HINT, SWINDLER_GO_DIE } = warningText
const nowPickInfo = ref({})
const friendList = computed(() => store.state.Contacts.friendList)
const groupList = computed(() => store.state.Contacts.groupList)
/* loginstatus */
const loginState = computed(() => store.state.loginState)
/* header 操作 */
const drawer = ref(false) //抽屉显隐
//删除好友
const delTheFriend = () => {
    console.log(nowPickInfo.value)
    if (nowPickInfo.value?.id) {
        const targetId = nowPickInfo.value.id
        EaseChatClient.deleteContact(targetId)
        ElMessage({ type: 'success', center: true, message: '好友已删除~' })
    }
}
//加入好友到黑名单
// const addFriendToBlackList = () => {

// }
/* warningTips */
const isShowWarningTips = computed(() => store.state.isShowWarningTips)
const randomTips = computed(() => {
    return _.toString(_.sampleSize(SWINDLER_GO_DIE, 1))
})
const closeWarningTips = () => store.commit('CLOSE_WARNING_TIPS')
/* userInfo */
//获取路由ID对应的信息
const getIdInfo = async ({ id, chatType }) => {
    //类型为单聊
    if (chatType === CHAT_TYPE.SINGLE) {
        if (friendList.value[id]) {
            nowPickInfo.value.userInfo = friendList.value[id]
        } else {
            return
        }
    }
    //类型为群组
    if (chatType === CHAT_TYPE.GROUP) {
        const goupid = groupList.value[id]?.groupid && groupList.value[id]?.groupid
        goupid && await store.dispatch('fetchMultiGoupsInfos', goupid)
        if (groupList.value[id]?.groupDetail) {
            return nowPickInfo.value.groupDetail = groupList.value[id].groupDetail
        } else {
            //如果不存在用户属性则请求获取该群群详情。
            await store.dispatch('getAssignGroupDetail', id)
            return nowPickInfo.value.groupDetail = groupList.value[id].groupDetail
        }
    }
}
//监听路由改变获取对应的getIdInfo
const stopWatchRoute = watch(() => route.query, (routeVal) => {
    console.log('>>>>>>>>监听到路由参数变化', routeVal)
    if (routeVal) {
        nowPickInfo.value = { ...routeVal }
        loginState.value && getIdInfo(routeVal)
    }
}, {
    immediate: true
})
//获取群组详情
const groupDetail = computed(() => groupList.value[nowPickInfo.value.id] && groupList.value[nowPickInfo.value.id].groupDetail || {})
//离开该路由销毁route监听
onBeforeRouteLeave(() => {
    stopWatchRoute()
})
/* 消息相关 */
const loadingHistoryMsg = ref(false) //是否正在加载中
const isMoreHistoryMsg = ref(true) //加载文案展示为加载更多还是已无更多。
const notScrollBottom = ref(false) //是否滚动置底
//获取历史记录
const fechHistoryMessage = (loadType) => {
    if (!nowPickInfo.value) return []
    return async () => {
        loadingHistoryMsg.value = true
        notScrollBottom.value = true
        if (loadType == 'fistLoad') {
            const { messages } = await store.dispatch('getHistoryMessage', { ...nowPickInfo.value, cursor: -1 })
            if (messages.length > 0) {
                //返回数组有数据显示加载更多
                isMoreHistoryMsg.value = true
            } else {
                //否则已无更多。
                isMoreHistoryMsg.value = false
            }
            setTimeout(() => {
                scrollMessageList('bottom')
            }, 500)

        }
        else {
            const fistMessageId = messageData.value[0] && messageData.value[0].id
            const { messages } = await store.dispatch('getHistoryMessage', { ...nowPickInfo.value, cursor: fistMessageId })
            if (messages.length > 0) {
                //返回数组有数据显示加载更多
                isMoreHistoryMsg.value = true
            } else {
                //否则已无更多。
                isMoreHistoryMsg.value = false
            }
            scrollMessageList('normal')
        }
        loadingHistoryMsg.value = false
        notScrollBottom.value = false
    }

}
//获取其id对应的消息内容
const messageData = computed(() => {
    //如果Message.messageList中不存在的话调用拉取漫游取一下历史消息
    return nowPickInfo.value.id && store.state.Message.messageList[nowPickInfo.value.id] || fechHistoryMessage('fistLoad')()
})

const messageContainer = ref(null)
// const innerRef = ref(null);
// const { arrivedState, } = useScroll(messageContainer)
// const { top } = toRefs(arrivedState)
//控制消息滚动
const scrollMessageList = (direction) => {
    //direction滚动方向 bottom向下滚动 normal向上滚动 
    nextTick(() => {
        const messageNodeList = document.querySelectorAll('.messageList_box')
        const fistMsgElement = messageNodeList[0]
        const lastMsgElement = messageNodeList[messageNodeList.length - 1]
        console.log('lastMsgElement', lastMsgElement)
        console.log('fistMsgElement', fistMsgElement)
        //直接滚动置底
        if (direction === 'bottom') {
            lastMsgElement && lastMsgElement.scrollIntoView(false)
        }
        //保持当前的消息位于当前可视窗口
        if (direction === 'normal') {
            fistMsgElement.scrollIntoView(true)
        }
    })
}
const scroll = ({ scrollTop }) => {
    console.log('scrollscrollscroll', scrollTop)
}
//监听到消息内容改变 置底滚动。
watch(() => store.state.Message.messageList[nowPickInfo.value.id], () => {
    setTimeout(() => {
        scrollMessageList('bottom')
    }, 300)
}, {
    deep: true
})
//监听到nowPickInfo改变 让消息直接置底
watch(() => route.query, () => nextTick(() => {
    if (Object.keys(nowPickInfo.value).length > 0) {
        nextTick(() => {
            // messageContainer.value.setScrollTop(100000)
            scrollMessageList('bottom')
        })
    }
}))

//消息重新编辑
const inputBox = ref(null)
const reEditMessage = (msg) => inputBox.value.textContent = msg


</script>
<template>
  <el-container v-if="loginState" class="app_container">
    <el-header class="chat_message_header">
      <template v-if="nowPickInfo.chatType === CHAT_TYPE.SINGLE">
        <div v-if="nowPickInfo.userInfo" class="chat_user_box">
          <span class="chat_user_name"> {{ nowPickInfo.userInfo.nickname || nowPickInfo.id }}</span>
          <UserStatus :userStatus="nowPickInfo.userInfo.userStatus" />
        </div>
        <div v-else>{{ nowPickInfo.id }}<span style="font-size:10px">(非好友)</span></div>
      </template>
      <template v-if="nowPickInfo.chatType === CHAT_TYPE.GROUP">
        <div v-if="nowPickInfo.groupDetail" class="chat_user_box">
          <span class="chat_user_name">
            {{ groupDetail.name || '' }} {{ `(${groupDetail.affiliations_count || ''})`
            }}
          </span>

        </div>
        <div v-else class="chat_user_box">
          <span class="chat_user_name">
            {{ groupDetail.name || nowPickInfo.id }}
          </span>

        </div>
      </template>
      <!-- 群组展示抽屉 -->
      <span class="more" v-if="nowPickInfo.groupDetail && nowPickInfo.chatType === CHAT_TYPE.GROUP"
        @click="drawer = !drawer">
        <svg width="18" height="4" viewBox="0 0 18 4" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="2" cy="2" r="2" fill="#333333" />
          <circle cx="9" cy="2" r="2" fill="#333333" />
          <circle cx="16" cy="2" r="2" fill="#333333" />
        </svg>
      </span>
      <!-- 单人展示删除拉黑 -->
      <span class="more" v-else>
        <el-dropdown placement="bottom-end" trigger="click">
          <svg width="18" height="4" viewBox="0 0 18 4" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="2" cy="2" r="2" fill="#333333" />
            <circle cx="9" cy="2" r="2" fill="#333333" />
            <circle cx="16" cy="2" r="2" fill="#333333" />
          </svg>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="delTheFriend">
                删除好友
              </el-dropdown-item>
              <!-- <el-dropdown-item @click="addFriendToBlackList">
                加入黑名单
              </el-dropdown-item> -->
            </el-dropdown-menu>
          </template>
        </el-dropdown>

      </span>
    </el-header>
    <div v-if="isShowWarningTips" class="easeim_safe_tips">
      <p>{{ EASEIM_HINT }}</p>
      <p>【防骗提示】{{ randomTips }}</p>
      <span class="easeim_close_tips" @click="closeWarningTips">
        <el-icon>
          <Close />
        </el-icon>
      </span>

    </div>
    <el-main class="chat_message_main">
      <el-scrollbar class="main_container" ref="messageContainer" @scroll="scroll">
        <div class="innerRef">
          <div v-show="isMoreHistoryMsg" class="chat_message_tips">
            <div v-show="messageData.length > 0 && messageData[0].type !== 'inform'" class="load_more_msg">
              <el-link v-show="!loadingHistoryMsg" :disabled="!isMoreHistoryMsg" :underline="false"
                @click="fechHistoryMessage()()">
                加载更多
              </el-link>
              <el-link v-show="loadingHistoryMsg" disabled>消息加载中...</el-link>
            </div>
          </div>
          <MessageList :messageData="messageData" @scrollMessageList="scrollMessageList"
            @reEditMessage="reEditMessage" />
        </div>
      </el-scrollbar>
    </el-main>
    <el-footer class="chat_message_inputbar">
      <InputBox ref="inputBox" :nowPickInfo="nowPickInfo" />
    </el-footer>
    <el-drawer v-if="nowPickInfo.chatType === CHAT_TYPE.GROUP" v-model="drawer" :show-close="false"
      :close-on-click-modal="true" direction="rtl" :modal="true" size="280px">
      <GroupsDetails :nowGroupId="nowPickInfo.id" :groupDetail="groupDetail" />
    </el-drawer>
  </el-container>
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
  border-radius: 0 3px 0 0;
  border-bottom: 1px solid #E6E6E6;

  .chat_user_box {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    height: 20px;
    max-width: 80%;

    .chat_user_name {
      font-family: 'PingFang SC';
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-style: normal;
      font-weight: 400;
      font-size: 17px;
      line-height: 20px;
      letter-spacing: 0.3px;
      color: #333333;
    }
  }


  .more {
    display: flex;
    width: 35px;
    height: 100%;
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

.easeim_safe_tips {
  position: relative;
  padding: 12px 20px;
  background-color: #FFF4E6;
  color: #ff8c39;
  line-height: 18px;
  font-family: PingFang SC;
  font-style: normal;
  font-weight: 400;
  text-align: justify;
  font-size: 12px;
  border: none;

  .easeim_close_tips {
    position: absolute;
    right: 10px;
    top: 10px;
  }
}

.chat_message_main {
  padding: 0;
  background: #F9F9F9;

  .main_container {
    padding: 0 20px;
    height: 100%;
    // overflow-y: scroll;

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
  border-radius: 0 0 3px 0;


}

::v-deep .el-drawer {
  margin-top: 60px;
  width: 150px;
  height: calc(100% - 60px);
  border-radius: 5px 0 0 5px;

  .el-drawer__header {
    margin-bottom: 0;
    padding-top: 0;
  }

  .el-drawer__body {
    padding: 0;
    // padding-left: 16px;
  }
}
</style>
