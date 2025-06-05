<script setup>
import { ref, watch, nextTick, computed, onMounted } from 'vue';
import _ from 'lodash';
import { EMClient } from '@/IM';
import { CHAT_TYPE } from '@/IM/constant';
import { useStore } from 'vuex';
import { useRoute, onBeforeRouteLeave } from 'vue-router';
import { EASEIM_HINT, SWINDLER_GO_DIE, WARM_TIP } from '@/constant';
import { ElMessage } from 'element-plus';
import { Close } from '@element-plus/icons-vue';
import waterMark from '@/utils/waterMark';
/* 组件 */
import ChatMessageListItem from './components/ChatMessageListItem';
import ChatInputBox from './components/ChatInputBox';
import GroupsDetails from '@/views/Chat/components/AboutGroups/GroupsDetails';
import ChatContainerHeader from './components/ChatContainerHeader';
/* store */
const store = useStore();
/* route */
const route = useRoute();

/* loginstatus */
const loginState = computed(() => store.state.loginState);
/* header 操作 */
const drawer = ref(false); //抽屉显隐
const handleDrawer = () => {
  drawer.value = !drawer.value;
};
//删除好友
const delTheFriend = async () => {
  if (routeQueryData.value?.id) {
    const targetId = routeQueryData.value.id;
    try {
      await EMClient.deleteContact(targetId);
      store.commit('DELETE_CONTACTS_FROM_MAP', targetId);
      ElMessage({ type: 'success', center: true, message: '好友已删除~' });
    } catch (error) {}
  }
};
//加入好友到黑名单
// const addFriendToBlackList = () => {

// }
/* warningTips */
const isShowWarningTips = computed(() => store.state.isShowWarningTips);
const randomTips = computed(() => {
  return _.toString(_.sampleSize(SWINDLER_GO_DIE, 1));
});
/* warterMark */
onMounted(() => {
  const chatContainer = document.querySelector('.chat_message_main');
  chatContainer && waterMark({ container: chatContainer });
});
const closeWarningTips = () => store.commit('CLOSE_WARNING_TIPS');
/* userInfo */
const routeQueryData = ref({
  id: '',
  chatType: CHAT_TYPE.SINGLE,
});
const getRouteQueryWithIdInfo = (data) => {
  const { id, chatType } = data;
  routeQueryData.value.id = id;
  routeQueryData.value.chatType = chatType;
};
//监听路由改变获取对应的getIdInfo
const stopWatchRoute = watch(
  () => route.query,
  (routeVal) => {
    if (routeVal) {
      getRouteQueryWithIdInfo(routeVal);
    }
  },
  {
    immediate: true,
  },
);

//离开该路由销毁route监听
onBeforeRouteLeave(() => {
  stopWatchRoute();
});
/* 消息相关 */
const loadingHistoryMsg = ref(false); //是否正在加载中
const isMoreHistoryMsg = ref(true); //加载文案展示为加载更多还是已无更多。
const notScrollBottom = ref(false); //是否滚动置底
//获取历史记录
const fechHistoryMessage = (loadType) => {
  if (!routeQueryData.value) return [];
  return async () => {
    loadingHistoryMsg.value = true;
    notScrollBottom.value = true;
    if (loadType == 'fistLoad') {
      const { messages } = await store.dispatch('getHistoryMessage', {
        ...routeQueryData.value,
        cursor: -1,
      });
      if (messages.length > 0) {
        //返回数组有数据显示加载更多
        isMoreHistoryMsg.value = true;
      } else {
        //否则已无更多。
        isMoreHistoryMsg.value = false;
      }
      setTimeout(() => {
        scrollMessageList('bottom');
      }, 500);
    } else {
      const fistMessageId = messageData.value[0] && messageData.value[0].id;
      const { messages } = await store.dispatch('getHistoryMessage', {
        ...routeQueryData.value,
        cursor: fistMessageId,
      });
      if (messages.length > 0) {
        //返回数组有数据显示加载更多
        isMoreHistoryMsg.value = true;
      } else {
        //否则已无更多。
        isMoreHistoryMsg.value = false;
      }
      scrollMessageList('normal');
    }
    loadingHistoryMsg.value = false;
    notScrollBottom.value = false;
  };
};
//获取其id对应的消息内容
const messageData = computed(() => {
  //如果Message.messageList中不存在的话调用拉取漫游取一下历史消息
  if (loginState.value) {
    return (
      (routeQueryData.value.id &&
        store.state.Message.messageList[routeQueryData.value.id]) ||
      fechHistoryMessage('fistLoad')()
    );
  }
});

const messageContainer = ref(null);
//控制消息滚动
const scrollMessageList = (direction) => {
  //direction滚动方向 bottom向下滚动 normal向上滚动
  nextTick(() => {
    const messageNodeList = document.querySelectorAll('.messageList_box');
    const fistMsgElement = messageNodeList[0];
    const lastMsgElement = messageNodeList[messageNodeList.length - 1];
    //直接滚动置底
    if (direction === 'bottom') {
      lastMsgElement && lastMsgElement.scrollIntoView(false);
    }
    //保持当前的消息位于当前可视窗口
    if (direction === 'normal') {
      fistMsgElement.scrollIntoView(true);
    }
  });
};
// const scroll = ({ scrollTop }) => {
//
// }
watch(
  () => messageData,
  (newMsg, oldMsg) => {
    nextTick(() => {
      //判断拉取漫游导致的消息变化不需要执行滚动置底
      if (notScrollBottom.value) {
        return;
      } else {
        setTimeout(() => {
          scrollMessageList('bottom');
        }, 300);
      }
    });
  },
  {
    deep: true,
    immediate: true,
  },
);
watch(
  () => route.query,
  () => {
    if (Object.keys(routeQueryData.value).length > 0) {
      nextTick(() => {
        scrollMessageList('bottom');
      });
    }
  },
);

//消息重新编辑
const inputBoxComp = ref(null);
const reEditMessage = (msg) => inputBoxComp.value?.handleEditTextMessage(msg);
//消息引用
const messageQuote = (msg) => inputBoxComp.value?.handleQuoteMessage(msg);
</script>
<template>
  <el-container v-if="loginState" class="app_container">
    <!-- 聊天页头部 -->
    <ChatContainerHeader :routeQueryData="routeQueryData">
      <template v-slot:more>
        <!-- 群组展示抽屉 -->
        <div
          class="more"
          v-if="routeQueryData.chatType === CHAT_TYPE.GROUP"
          @click="handleDrawer"
        >
          <svg
            width="18"
            height="4"
            viewBox="0 0 18 4"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="2" cy="2" r="2" fill="#333333" />
            <circle cx="9" cy="2" r="2" fill="#333333" />
            <circle cx="16" cy="2" r="2" fill="#333333" />
          </svg>
        </div>
        <div class="more" v-if="routeQueryData.chatType === CHAT_TYPE.SINGLE">
          <el-dropdown placement="bottom-end" trigger="click">
            <svg
              width="18"
              height="4"
              viewBox="0 0 18 4"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
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
        </div>
      </template>
      <svg
        width="18"
        height="4"
        viewBox="0 0 18 4"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="2" cy="2" r="2" fill="#333333" />
        <circle cx="9" cy="2" r="2" fill="#333333" />
        <circle cx="16" cy="2" r="2" fill="#333333" />
      </svg>
    </ChatContainerHeader>
    <!-- 友情提示框 -->
    <div v-if="isShowWarningTips" class="easeim_safe_tips">
      <p>{{ EASEIM_HINT }}</p>
      <p>【防骗提示】{{ randomTips }}</p>
      <p v-show="routeQueryData.chatType === CHAT_TYPE.GROUP">
        {{ WARM_TIP }}
      </p>
      <span class="easeim_close_tips" @click="closeWarningTips">
        <el-icon>
          <Close />
        </el-icon>
      </span>
    </div>
    <!-- 消息内容区域 -->
    <el-main class="chat_message_main">
      <el-scrollbar class="main_container" ref="messageContainer">
        <div class="innerRef">
          <div v-show="isMoreHistoryMsg" class="chat_message_tips">
            <div
              v-show="messageData?.length && messageData[0].type !== 'inform'"
              class="load_more_msg"
            >
              <el-link
                v-show="!loadingHistoryMsg"
                :disabled="!isMoreHistoryMsg"
                :underline="false"
                @click="fechHistoryMessage()()"
              >
                加载更多
              </el-link>
              <el-link v-show="loadingHistoryMsg" disabled
                >消息加载中...</el-link
              >
            </div>
          </div>
          <ChatMessageListItem
            :routeQueryData="routeQueryData"
            :messageData="messageData"
            @scrollMessageList="scrollMessageList"
            @reEditMessage="reEditMessage"
            @messageQuote="messageQuote"
          />
        </div>
      </el-scrollbar>
    </el-main>
    <!-- 输入框区别 -->
    <el-footer class="chat_message_inputbar">
      <ChatInputBox ref="inputBoxComp" :routeQueryData="routeQueryData" />
    </el-footer>
    <!-- 聊天右侧抽屉 -->
    <el-drawer
      v-model="drawer"
      :show-close="false"
      :close-on-click-modal="true"
      :destroy-on-close="true"
      direction="rtl"
      :modal="true"
      size="280px"
    >
      <GroupsDetails
        ref="groupsDetailsComponent"
        :groupId="routeQueryData.id"
        @handleDrawer="handleDrawer"
      />
    </el-drawer>
  </el-container>
</template>

<style lang="scss" scoped>
@import './index.scss';
</style>
