<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import dateFormater from '@/utils/dateFormater';
import { CHAT_TYPE } from '@/IM/constant';
import { CUSTOM_MSG_EVENT_TYPE, SESSION_MESSAGE_TYPE } from '@/constant';
import _ from 'lodash';
import { useRouter, useRoute } from 'vue-router';
/* 头像相关 */
import informIcon from '@/assets/images/avatar/inform.png';
import defaultAvatar from '@/assets/images/avatar/theme2x.png';
import defaultGroupAvatar from '@/assets/images/avatar/jiaqun2x.png';
import { useGetUserMapInfo } from '@/hooks';
import { MESSAGE_TYPE } from '@/IM/constant';
/* route */
const route = useRoute();
/* router */
const router = useRouter();
/* store */
const store = useStore();
const emit = defineEmits(['toInformDetails', 'toChatMessage']);
//登录用户ID
const loginUserId = computed(() => store.state.loginUserInfo.hxId);
//取系统通知数据
const informDetail = computed(() => {
  const informDetailArr = store.state.Conversation.informDetail;
  const lastInformDeatail = informDetailArr[0] || {};
  const untreated = _.sumBy(informDetailArr, 'untreated') || 0;
  return { untreated, lastInformDeatail };
});

//获取群组详情（展示群组名称等信息）
const groupDetailMap = computed(() => store.getters.getGroupDetailMap);
//取会话数据
const conversationFromMethod = computed(() => {
  return store.getters.conversationFromMethod;
});
const conversationList = computed(() => {
  if (conversationFromMethod.value) {
    return store.getters.conversationListFromLocal;
  } else {
    return store.getters.conversationListFromServer;
  }
});
//处理会话name
const {
  getGroupNameByGroupId,
  getGroupAvatarByGroupId,
  getUserDisplayNameById,
  getUserDisplayAvatarById,
} = useGetUserMapInfo();
const handleConversationName = computed(() => {
  return (conversationItem) => {
    const { conversationType, conversationId } = conversationItem;
    if (conversationType === CHAT_TYPE.SINGLE) {
      return getUserDisplayNameById(conversationId);
    }
    if (conversationType === CHAT_TYPE.GROUP) {
      return getGroupNameByGroupId(conversationId);
    }
  };
});
//处理会话头像
const handleConversationAvatar = computed(() => {
  return (conversationItem) => {
    const { conversationType, conversationId } = conversationItem;
    if (conversationType === CHAT_TYPE.SINGLE) {
      return getUserDisplayAvatarById(conversationId);
    }
    if (conversationType === CHAT_TYPE.GROUP) {
      return getGroupAvatarByGroupId(conversationId);
    }
  };
});
//处理lastmsg的from昵称
const handleLastMsgNickName = computed(() => {
  return (conversationItem) => {
    const { conversationId: groupId, lastMessage } = conversationItem;
    const { from: userId } = lastMessage || {};
    if (!userId || userId === loginUserId.value) {
      return '我：';
    } else {
      return `${getUserDisplayNameById(userId, groupId)} ：`;
    }
  };
});
//处理lastmsg预览内容
const handleLastMsgContent = computed(() => {
  return (msgBody) => {
    const { type, msg } = msgBody;
    let resultContent = '';
    //如果消息类型，在预设非展示文本类型中，就返回预设值
    if (SESSION_MESSAGE_TYPE[type]) {
      resultContent = SESSION_MESSAGE_TYPE[type];
    } else if (type === MESSAGE_TYPE.CUSTOM) {
      //如果为自定义类型消息就匹配自定义消息对应的lastmsg文本
      if (msgBody.customEvent) {
        (CUSTOM_MSG_EVENT_TYPE[msgBody.customEvent] &&
          (resultContent = CUSTOM_MSG_EVENT_TYPE[msgBody.customEvent])) ||
          '';
      }
    } else if (msgBody?.isRecall) {
      return (resultContent = '撤回了一条消息');
    } else {
      resultContent = msg;
    }
    return resultContent;
  };
});
//取网络状态
const networkStatus = computed(() => {
  return store.state.networkStatus;
});
//普通会话
const checkedConverItemIndex = ref(null);
const debouncedToChatMessage = _.debounce(
  (conversationId, conversationType) => {
    emit('toChatMessage', conversationId, conversationType);
  },
  300,
); // 300毫秒内的连续触发将被防抖处理
const toChatMessage = (conversationItem, index) => {
  checkedConverItemIndex.value = index;
  const { conversationId, unReadCount, customField, conversationType } =
    conversationItem;
  if (unReadCount > 0) {
    store.dispatch('clearConversationUnreadCount', {
      conversationId: conversationId,
      chatType: conversationType,
    });
  }
  if (customField?.mention)
    store.dispatch('clearConversationMention', conversationItem);
  //跳转至对应的消息界面
  // 使用防抖函数来跳转至对应的消息界面
  debouncedToChatMessage(conversationId, conversationType);
};
//删除某条会话
const deleteConversation = (conversationItem) => {
  const { conversationId } = conversationItem;
  store.dispatch('removeLocalConversation', conversationItem);
  //如果删除的itemKey与当前的message会话页的id一致则跳转至会话默认页。
  if (route?.query?.id && route.query.id === conversationId) {
    router.push('/chat/conversation');
  }
};
/* 加载到底拉取新数据 */
const scrollbarComp = ref(null);
const loadingStatus = ref(false);
const conversationListFromServerCursor = computed(() => {
  return store.getters.conversationListFromServerCursor;
});
const loadMoreConversation = () => {
  if (loadingStatus.value) return;
  //如果存在游标则容许加载更多
  if (conversationListFromServerCursor.value) {
    store.dispatch('getConversationListFromServer', { isInit: false });
  }
};
const onScrollToBottom = (event) => {
  //当前会话获取模式如果不为server模式则不容许加载更多，因为本地会话列表是一次拉取并不需要分页。
  if (!conversationFromMethod.value) return;
  const { scrollTop } = event;
  // 获取滚动条的容器元素
  const scrollWrap = scrollbarComp.value?.wrapRef;
  // 检查滚动位置是否接近底部
  const isNearBottom =
    scrollWrap?.scrollHeight - scrollTop <= scrollWrap?.clientHeight + 1;
  if (isNearBottom) {
    if (loadingStatus.value) return;
    loadMoreConversation();
  }
};
</script>
<template>
  <el-scrollbar
    ref="scrollbarComp"
    class="session_list"
    style="overflow: auto"
    tag="ul"
    @scroll="onScrollToBottom"
  >
    <li class="offline_hint" v-if="!networkStatus">
      <span class="plaint_icon">!</span> 网络不给力，请检查网络设置。
    </li>
    <!-- 系统通知会话 -->
    <li
      v-if="
        JSON.stringify(informDetail.lastInformDeatail) !== '{}' &&
        informDetail.untreated >= 1
      "
      class="session_list_item"
      @click="$emit('toInformDetails')"
    >
      <div class="item_body item_left">
        <!-- 通知头像 -->
        <div class="session_other_avatar">
          <el-avatar :size="34" :src="informIcon" />
        </div>
      </div>
      <div class="item_body item_main">
        <div class="name">系统通知</div>
        <div class="last_msg_body">
          {{ informDetail.lastInformDeatail.from }}:{{
            informDetail.lastInformDeatail.desc
          }}
        </div>
      </div>
      <div class="item_body item_right">
        <span class="time">{{
          dateFormater('MM/DD/HH:mm', informDetail.lastInformDeatail.time)
        }}</span>
        <span class="unReadNum_box" v-if="informDetail.untreated >= 1">
          <sup
            class="unReadNum_count"
            v-text="
              informDetail.untreated >= 99 ? '99+' : informDetail.untreated
            "
          ></sup>
        </span>
      </div>
    </li>
    <!-- 普通会话 -->
    <template v-if="conversationList.length > 0">
      <li
        v-for="(item, index) in conversationList"
        :key="item.conversationId"
        @click="toChatMessage(item, index)"
        :style="{
          background: checkedConverItemIndex === index ? '#E5E5E5' : '',
        }"
      >
        <el-popover
          popper-class="conversation_popover"
          placement="right-end"
          trigger="contextmenu"
          :show-arrow="false"
          :offset="-10"
        >
          <template #reference>
            <div class="session_list_item">
              <div class="item_body item_left">
                <div class="session_other_avatar">
                  <el-avatar :size="34" :src="handleConversationAvatar(item)">
                  </el-avatar>
                </div>
              </div>
              <div class="item_body item_main">
                <div class="name">
                  {{ handleConversationName(item) }}
                </div>
                <div class="last_msg_body">
                  <span
                    class="last_msg_body_mention"
                    v-if="item?.customField?.mention"
                    >[有人@我]</span
                  >
                  <span v-show="item.conversationType === CHAT_TYPE.GROUP">{{
                    handleLastMsgNickName(item)
                  }}</span>
                  {{
                    item.lastMessage && handleLastMsgContent(item.lastMessage)
                  }}
                </div>
              </div>
              <div class="item_body item_right">
                <span class="time">{{
                  dateFormater('MM/DD/HH:mm', item?.lastMessage?.time)
                }}</span>
                <span class="unReadNum_box" v-if="item.unReadCount >= 1">
                  <sup
                    class="unReadNum_count"
                    v-text="item.unReadCount >= 99 ? '99+' : item.unReadCount"
                  ></sup>
                </span>
              </div>
            </div>
          </template>
          <template #default>
            <div class="session_list_delete" @click="deleteConversation(item)">
              删除会话
            </div>
          </template>
        </el-popover>
      </li>
    </template>
    <template v-else>
      <el-empty description="暂无最近会话" />
    </template>
  </el-scrollbar>
</template>

<style lang="scss" scoped>
.session_list {
  position: relative;
  height: 100%;
  padding: 0;
  margin: 0;
}

.offline_hint {
  width: 100%;
  height: 30px;
  text-align: center;
  line-height: 30px;
  color: #f35f81;
  background: #fce7e8;
  font-size: 7px;

  .plaint_icon {
    display: inline-block;
    width: 15px;
    height: 15px;
    color: #e5e5e5;
    text-align: center;
    line-height: 15px;
    font-size: 7px;
    font-weight: bold;
    background: #e6686e;
    border-radius: 50%;
  }
}

.session_list .session_list_item {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  height: 66px;
  background: #f0f0f0;
  color: var(--el-color-primary);
  border-bottom: 1px solid var(--el-border-color);
  cursor: pointer;

  &:hover {
    background: #e5e5e5;
  }

  .item_body {
    display: flex;
    height: 100%;
  }

  .item_left {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-left: 14px;
    margin-right: 10px;
  }

  .item_main {
    width: 225px;
    max-width: 225px;
    height: 34px;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;

    .name {
      min-width: 56px;
      max-width: 180px;
      height: 17px;
      font-weight: 400;
      font-size: 14px;
      /* identical to box height */
      color: #333333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .last_msg_body {
      max-width: 185px;
      height: 17px;
      font-weight: 400;
      font-size: 12px;
      line-height: 17px;
      letter-spacing: 0.3px;
      color: #a3a3a3;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .last_msg_body_mention {
      font-size: 12px;
      line-height: 17px;
      font-weight: bold;
      color: red;
    }
  }

  .item_right {
    width: 25%;
    height: 34px;
    flex-direction: column;
    align-items: flex-end;
    margin-right: 10px;

    .time {
      font-size: 10px;
      font-weight: 400;
      font-size: 10px;
      line-height: 14px;
      letter-spacing: 0.25px;
      color: #a3a3a3;
    }

    .unReadNum_box {
      margin-top: 10px;
      vertical-align: middle;

      .unReadNum_count {
        display: inline-block;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        color: #fff;
        font-weight: normal;
        font-size: 12px;
        line-height: 20px;
        white-space: nowrap;
        text-align: center;
        background: #f5222d;
        border-radius: 10px;
        box-sizing: border-box;
      }
    }
  }
}

.session_list_item_active {
  background: #d2d2d2;
}

.session_list .session_list_item + .list_item {
  margin-top: 10px;
}

.session_list_delete {
  cursor: pointer;
  transition: all 0.5s;

  &:hover {
    background: #e1e1e1;
  }
}
</style>
