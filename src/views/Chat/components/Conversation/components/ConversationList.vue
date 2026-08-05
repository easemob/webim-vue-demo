<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import dateFormater from '@/utils/dateFormater';
import { CONVERSATION_TYPE } from '@/IM/constant';
import _ from 'lodash';
import { useRouter, useRoute } from 'vue-router';
import { requireManager } from '@/IM';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getSdk5ErrorMessage } from '@/utils/sdk5ErrorInfo';
import {
  CONVERSATION_PUSH_REMIND_TYPES,
  getConversationPushRemindType,
  isPushSettingSupportedConversation,
} from '@/utils/conversationPushSettings';
/* 头像相关 */
import informIcon from '@/assets/images/avatar/inform.png';
import defaultAvatar from '@/assets/images/avatar/theme2x.png';
import defaultGroupAvatar from '@/assets/images/avatar/jiaqun2x.png';
import { useGetUserMapInfo } from '@/hooks';
import { CONVERSATION_MARK, hasConversationMark } from '@/constant';
/* route */
const route = useRoute();
/* router */
const router = useRouter();
/* store */
const store = useStore();
const chatManager = () => requireManager('chatManager');
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
const conversationList = computed(() => {
  return store.getters.conversationListFromServer;
});
//处理会话name
const {
  getGroupNameByGroupId,
  getGroupAvatarByGroupId,
  getUserDisplayNameById,
  getUserDisplayAvatarById,
  getChatroomNameByChatroomId,
  getChatroomAvatarByChatroomId,
} = useGetUserMapInfo();
const handleConversationName = computed(() => {
  return (conversationItem) => {
    if (!conversationItem) return '未知会话';
    const { conversationType, conversationId } = conversationItem;
    if (conversationType === CONVERSATION_TYPE.SINGLE) {
      return getUserDisplayNameById(conversationId) || conversationId;
    }
    if (conversationType === CONVERSATION_TYPE.GROUP) {
      return getGroupNameByGroupId(conversationId) || conversationId;
    }
    if (conversationType === CONVERSATION_TYPE.CHATROOM) {
      return getChatroomNameByChatroomId(conversationId) || conversationId;
    }
    return conversationId;
  };
});
//处理会话头像
const handleConversationAvatar = computed(() => {
  return (conversationItem) => {
    if (!conversationItem) return defaultAvatar;
    const { conversationType, conversationId } = conversationItem;
    if (conversationType === CONVERSATION_TYPE.SINGLE) {
      return getUserDisplayAvatarById(conversationId) || defaultAvatar;
    }
    if (conversationType === CONVERSATION_TYPE.GROUP) {
      return getGroupAvatarByGroupId(conversationId) || defaultGroupAvatar;
    }
    if (conversationType === CONVERSATION_TYPE.CHATROOM) {
      return getChatroomAvatarByChatroomId(conversationId) || defaultGroupAvatar;
    }
    return defaultAvatar;
  };
});
//处理 SDK 5.0 最后一条消息发送者昵称
const handleLastMsgNickName = computed(() => {
  return (conversationItem) => {
    const { conversationId: groupId, lastMessage } = conversationItem;
    const userId = lastMessage?.sender?.userId;
    if (!userId || userId === loginUserId.value) {
      return '我：';
    } else {
      return `${getUserDisplayNameById(userId, groupId)} ：`;
    }
  };
});
const getLastMessageContent = (message) => {
  const body = message?.body || {};
  switch (message?.type) {
    case 'text':
      return body.content || '';
    case 'image':
    case 'file':
    case 'voice':
    case 'video':
      return body.filename || '';
    case 'location':
      return body.address || '';
    case 'cmd':
      return body.action || '';
    case 'custom':
      return body.event || '';
    case 'combine':
      return body.summary || '';
    default:
      return '';
  }
};
//处理 SDK 5.0 最后一条消息预览内容
const handleLastMsgContent = (message) => {
  const messageTypePreview = {
    image: '[图片]',
    file: '[文件]',
    voice: '[语音]',
    location: '[位置]',
    video: '[视频]',
  };
  return messageTypePreview[message?.type] || getLastMessageContent(message);
};
//取网络状态
const networkStatus = computed(() => {
  return store.state.networkStatus;
});
//普通会话
const checkedConverItemIndex = ref(null);
const toChatMessage = (conversationItem, index) => {
  checkedConverItemIndex.value = index;
  const { conversationId, customField, conversationType, readAt, unreadCount } = conversationItem;
  const supportsReadReceipt = [
    CONVERSATION_TYPE.SINGLE,
    CONVERSATION_TYPE.GROUP,
  ].includes(conversationType);
  if (supportsReadReceipt) {
    store.dispatch('setIncomingReadReceiptBoundary', {
      conversationId,
      conversationType,
      readAt,
      unreadCount,
    });
  }
  if (customField?.mention)
    store.dispatch('clearConversationMention', conversationItem);
  emit('toChatMessage', conversationId, conversationType);
  if (supportsReadReceipt) {
    store.dispatch('clearConversationUnreadCount', {
      conversationId,
      conversationType,
    });
  }
};
//删除某条会话
const deleteConversation = async (conversationItem) => {
  const { conversationId, conversationType } = conversationItem;
  
  // 检查会话类型，如果是聊天室会话，不支持删除操作
  if (conversationType === CONVERSATION_TYPE.CHATROOM) {
    ElMessage.info('聊天室会话不支持删除操作');
    return;
  }

  try {
    await store.dispatch('removeLocalConversation', conversationItem);
    ElMessage.success('删除会话成功');
    if (
      route?.query?.conversationId &&
      route.query.conversationId === conversationId
    ) {
      router.push('/chat/conversation');
    }
  } catch (error) {
    console.error('删除会话失败', error);
    ElMessage.error('删除会话失败');
  }
};

//置顶/取消置顶会话
const pinConversation = async (conversationItem) => {
  const { conversationId, conversationType, isPinned } = conversationItem;
  
  // 检查会话类型，如果是聊天室会话，不支持置顶操作
  if (conversationType === CONVERSATION_TYPE.CHATROOM) {
    ElMessage.info('聊天室会话不支持置顶/取消置顶操作');
    return;
  }
  
  try {
    const result = await chatManager().setConversationPinned({
      conversationId,
      conversationType,
      pinned: !isPinned,
    });
    if (typeof result.isPinned !== 'boolean') {
      console.error('[Conversation] setConversationPinned missing SDK 5.0 isPinned', {
        conversationId,
        conversationType,
        result,
      });
      ElMessage.error('置顶状态未更新：SDK 未下发 isPinned');
      return;
    }
    store.commit('UPDATE_CONVERSATION_PIN_STATUS', [
      {
        conversationId: result.conversationId,
        isPinned: result.isPinned,
        pinnedTimestamp: result.pinnedTime,
      },
    ]);

    ElMessage.success(isPinned ? '取消置顶成功' : '置顶成功');
  } catch (error) {
    console.error('置顶/取消置顶会话失败', error);
    const errorText = getSdk5ErrorMessage(error).toLowerCase();

    if (
      errorText.includes('50') &&
      (errorText.includes('pin') ||
        errorText.includes('pinned') ||
        errorText.includes('top'))
    ) {
      ElMessage.error('最多只能置顶 50 个会话');
    } else {
      ElMessage.error(isPinned ? '取消置顶失败' : '置顶失败');
    }
  }
};

//标记/取消标记会话
const toggleConversationMark = async (conversationItem) => {
  const { conversationId, conversationType, marks } = conversationItem;
  
  // 检查会话类型，如果是聊天室会话，不支持标记操作
  if (conversationType === CONVERSATION_TYPE.CHATROOM) {
    ElMessage.info('聊天室会话不支持标记操作');
    return;
  }
  
  const hasMark = hasConversationMark(marks, CONVERSATION_MARK.STAR);
  
  try {
    if (!hasMark) {
      // 添加标记
      await chatManager().addConversationMark({
        conversationId,
        conversationType,
        mark: CONVERSATION_MARK.STAR,
      });
      store.commit('UPDATE_CONVERSATION_MARK_STATUS', {
        conversationId,
        mark: CONVERSATION_MARK.STAR,
        isMarked: true,
      });
      ElMessage.success('标星成功');
    } else {
      // 移除标记
      await chatManager().removeConversationMark({
        conversations: [
          { conversationId, conversationType },
        ],
        mark: CONVERSATION_MARK.STAR,
      });
      store.commit('UPDATE_CONVERSATION_MARK_STATUS', {
        conversationId,
        mark: CONVERSATION_MARK.STAR,
        isMarked: false,
      });
      ElMessage.success('取消标星成功');
    }
  } catch (error) {
    console.error('标记/取消标记会话失败', error);
    ElMessage.error(hasMark ? '取消标星失败' : '标星失败');
  }
};
const pushSettingDialogVisible = ref(false);
const pushSettingLoading = ref(false);
const pushSettingSaving = ref(false);
const globalConversationClearLoading = ref('');
const selectedPushConversation = ref(null);
const selectedPushRemindType = ref('ALL');
const selectedDndDurationMinutes = ref(60);
const currentPushRemindType = ref('');
const currentPushSettingRaw = ref(null);
const selectedPushConversationName = computed(() => {
  return selectedPushConversation.value
    ? handleConversationName.value(selectedPushConversation.value)
    : '';
});
const openConversationPushSetting = async (conversationItem) => {
  if (!isPushSettingSupportedConversation(conversationItem.conversationType)) {
    ElMessage.info('当前会话类型不支持单会话推送通知设置');
    return;
  }
  selectedPushConversation.value = conversationItem;
  pushSettingDialogVisible.value = true;
  await refreshConversationPushSetting();
};
const refreshConversationPushSetting = async () => {
  if (!selectedPushConversation.value) return;
  pushSettingLoading.value = true;
  try {
    const result = await store.dispatch(
      'getConversationPushSetting',
      selectedPushConversation.value,
    );
    currentPushSettingRaw.value = result;
    const remindType = getConversationPushRemindType(result);
    currentPushRemindType.value = remindType;
    if (remindType) {
      selectedPushRemindType.value = remindType;
    }
  } catch (error) {
    ElMessage.error(error?.message || '获取推送通知设置失败');
  } finally {
    pushSettingLoading.value = false;
  }
};
const saveConversationPushSetting = async () => {
  if (!selectedPushConversation.value) return;
  pushSettingSaving.value = true;
  try {
    await store.dispatch('setConversationPushSetting', {
      conversation: selectedPushConversation.value,
      remindType: selectedPushRemindType.value,
    });
    ElMessage.success('推送通知方式设置成功');
    await refreshConversationPushSetting();
  } catch (error) {
    ElMessage.error(error?.message || '推送通知方式设置失败');
  } finally {
    pushSettingSaving.value = false;
  }
};
const saveConversationDndDuration = async () => {
  if (!selectedPushConversation.value) return;
  pushSettingSaving.value = true;
  try {
    await store.dispatch('setConversationDndDuration', {
      conversation: selectedPushConversation.value,
      durationMinutes: selectedDndDurationMinutes.value,
    });
    ElMessage.success('免打扰时长设置成功');
    await refreshConversationPushSetting();
  } catch (error) {
    ElMessage.error(error?.message || '免打扰时长设置失败');
  } finally {
    pushSettingSaving.value = false;
  }
};
const clearConversationPushSetting = async () => {
  if (!selectedPushConversation.value) return;
  pushSettingSaving.value = true;
  try {
    await store.dispatch(
      'clearConversationPushSetting',
      selectedPushConversation.value,
    );
    currentPushRemindType.value = '';
    currentPushSettingRaw.value = null;
    ElMessage.success('已清除会话推送通知方式');
    await refreshConversationPushSetting();
  } catch (error) {
    ElMessage.error(error?.message || '清除推送通知方式失败');
  } finally {
    pushSettingSaving.value = false;
  }
};
const clearAllConversationUnreadMessageCount = async () => {
  if (globalConversationClearLoading.value) return;
  globalConversationClearLoading.value = 'unread';
  try {
    await store.dispatch('clearAllConversationUnreadMessageCount');
    ElMessage.success('全部会话未读数已清空');
  } catch (error) {
    console.error('[Conversation] clearAllConversationUnreadMessageCount UI failed', {
      error,
    });
    ElMessage.error(error?.message || '全部会话未读数清空失败');
  } finally {
    globalConversationClearLoading.value = '';
  }
};
const clearAllMessagesAndConversations = async () => {
  if (globalConversationClearLoading.value) return;
  try {
    await ElMessageBox.confirm(
      '该操作会调用 SDK 5.0 清空当前用户的所有会话和服务端漫游消息，确认继续？',
      '清空全部消息与会话',
      {
        confirmButtonText: '确认清空',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
    globalConversationClearLoading.value = 'all';
    await store.dispatch('clearAllMessagesAndConversations');
    ElMessage.success('全部消息与会话已清空');
    if (route?.query?.conversationId) {
      router.push('/chat/conversation');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('[Conversation] clearAllMessagesAndConversations UI failed', {
        error,
      });
      ElMessage.error(error?.message || '全部消息与会话清空失败');
    }
  } finally {
    globalConversationClearLoading.value = '';
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
    loadingStatus.value = true;
    store
      .dispatch('getConversationListFromServer', { isInit: false })
      .finally(() => {
        loadingStatus.value = false;
      });
  }
};
const onScrollToBottom = (event) => {
  // 服务端会话列表按 cursor 分页。
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
    <li class="session_global_actions">
      <el-button
        link
        type="primary"
        size="small"
        :loading="globalConversationClearLoading === 'unread'"
        :disabled="!!globalConversationClearLoading"
        @click.stop="clearAllConversationUnreadMessageCount"
      >
        清空全部未读
      </el-button>
      <el-button
        link
        type="danger"
        size="small"
        :loading="globalConversationClearLoading === 'all'"
        :disabled="!!globalConversationClearLoading"
        @click.stop="clearAllMessagesAndConversations"
      >
        清空全部消息与会话
      </el-button>
    </li>
    <!-- 系统通知会话 -->
    <li
      v-if="
        JSON.stringify(informDetail.lastInformDeatail) !== '{}' &&
        informDetail.untreated >= 1
      "
      class="session_list_item"
      @click="$emit('toInformDetails', informDetail.lastInformDeatail)"
    >
      <div class="item_body item_left">
        <!-- 通知头像 -->
        <div class="session_other_avatar">
          <el-avatar :size="34" :src="informIcon" />
        </div>
      </div>
      <div class="item_body item_main">
        <div class="name">事件中心</div>
        <div class="last_msg_body">
          {{ informDetail.lastInformDeatail.sdkEventName }}
        </div>
      </div>
      <div class="item_body item_right">
        <span class="time">{{
          dateFormater('MM/DD/HH:mm', informDetail.lastInformDeatail.receivedAt)
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
            <div class="session_list_item" @click="toChatMessage(item, index)">
              <div class="item_body item_left">
                <div class="session_other_avatar">
                  <el-avatar :size="34" :src="handleConversationAvatar(item)">
                  </el-avatar>
                </div>
              </div>
              <div class="item_body item_main">
                <div class="name">
                  {{ handleConversationName(item) }}
                  <span v-if="item.isPinned" class="pin-icon">📌</span>
                  <span
                    v-if="hasConversationMark(item.marks, CONVERSATION_MARK.STAR)"
                    class="mark-icon"
                    >⭐</span
                  >
                </div>
                <div class="last_msg_body">
                  <span
                    class="last_msg_body_mention"
                    v-if="item?.customField?.mention"
                    >[有人@我]</span
                  >
                  <span v-show="item.conversationType === CONVERSATION_TYPE.GROUP">{{
                    handleLastMsgNickName(item)
                  }}</span>
                  {{
                    item.lastMessage && handleLastMsgContent(item.lastMessage)
                  }}
                </div>
              </div>
              <div class="item_body item_right">
                <span class="time">{{
                  item?.lastMessage?.timestamp
                    ? dateFormater('MM/DD/HH:mm', item.lastMessage.timestamp)
                    : ''
                }}</span>
                <span class="unReadNum_box" v-if="item.unreadCount >= 1">
                  <sup
                    class="unReadNum_count"
                    v-text="item.unreadCount >= 99 ? '99+' : item.unreadCount"
                  ></sup>
                </span>
              </div>
            </div>
          </template>
          <template #default>
            <div class="session_list_pin" @click="pinConversation(item)">
              {{ item.isPinned ? '取消置顶' : '置顶会话' }}
            </div>
            <div class="session_list_mark" @click="toggleConversationMark(item)">
              {{
                hasConversationMark(item.marks, CONVERSATION_MARK.STAR)
                  ? '取消标星'
                  : '标星会话'
              }}
            </div>
            <div class="session_list_delete" @click="deleteConversation(item)">
              删除会话
            </div>
            <div
              class="session_list_push"
              @click="openConversationPushSetting(item)"
            >
              推送通知设置
            </div>
          </template>
        </el-popover>
      </li>
    </template>
    <template v-else>
      <el-empty description="暂无最近会话" />
    </template>
  </el-scrollbar>
  <el-dialog
    v-model="pushSettingDialogVisible"
    title="推送通知设置"
    width="420px"
    :destroy-on-close="true"
  >
    <div v-loading="pushSettingLoading" class="push_setting_dialog">
      <p class="push_setting_line">
        <span class="push_setting_label">会话</span>
        <span>{{ selectedPushConversationName }}</span>
      </p>
      <p class="push_setting_line">
        <span class="push_setting_label">会话 ID</span>
        <span>{{ selectedPushConversation?.conversationId }}</span>
      </p>
      <p class="push_setting_line">
        <span class="push_setting_label">会话类型</span>
        <span>{{ selectedPushConversation?.conversationType }}</span>
      </p>
      <p class="push_setting_line">
        <span class="push_setting_label">当前设置</span>
        <span>{{ currentPushRemindType || '继承 app 设置或服务端未返回' }}</span>
      </p>
      <el-radio-group v-model="selectedPushRemindType" class="push_setting_modes">
        <el-radio
          v-for="item in CONVERSATION_PUSH_REMIND_TYPES"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </el-radio>
      </el-radio-group>
      <div class="push_setting_dnd">
        <span class="push_setting_dnd_label">免打扰时长</span>
        <el-input-number
          v-model="selectedDndDurationMinutes"
          :min="1"
          :max="10080"
          :step="60"
          step-strictly
        />
        <span>分钟</span>
        <el-button
          :loading="pushSettingSaving"
          @click="saveConversationDndDuration"
        >
          设置免打扰
        </el-button>
      </div>
      <pre class="push_setting_raw">{{
        JSON.stringify(currentPushSettingRaw, null, 2)
      }}</pre>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="refreshConversationPushSetting">刷新</el-button>
        <el-button
          :loading="pushSettingSaving"
          @click="clearConversationPushSetting"
        >
          清除设置
        </el-button>
        <el-button
          type="primary"
          :loading="pushSettingSaving"
          @click="saveConversationPushSetting"
        >
          保存
        </el-button>
      </span>
    </template>
  </el-dialog>
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

.session_global_actions {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 6px;
  min-height: 34px;
  padding: 4px 8px;
  border-bottom: 1px solid var(--el-border-color);
  background: #f7f8fa;
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
      
      .pin-icon, .mark-icon {
        margin-left: 5px;
        font-size: 14px;
      }
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

.session_list_pin,
.session_list_mark,
.session_list_delete,
.session_list_push {
  cursor: pointer;
  min-width: 96px;
  padding: 8px 12px;
  box-sizing: border-box;
  font-size: 13px;
  line-height: 18px;
  white-space: nowrap;
  color: #333333;
  transition: all 0.5s;

  &:hover {
    background: #e1e1e1;
  }
}

.push_setting_dialog {
  min-height: 180px;
}

.push_setting_line {
  display: flex;
  gap: 12px;
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 20px;
  color: #333333;
}

.push_setting_label {
  width: 64px;
  flex: 0 0 64px;
  color: #666666;
}

.push_setting_modes {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  margin: 8px 0 12px;
}

.push_setting_dnd {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 12px;
  font-size: 13px;
  color: #333333;
}

.push_setting_dnd_label {
  flex: 0 0 auto;
  color: #666666;
}

.push_setting_raw {
  max-height: 120px;
  margin: 0;
  padding: 8px;
  overflow: auto;
  font-size: 12px;
  line-height: 18px;
  color: #666666;
  background: #f6f7f9;
  border-radius: 4px;
}
</style>
