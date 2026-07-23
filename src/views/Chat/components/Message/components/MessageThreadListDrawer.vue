<script setup>
import { ref, toRefs, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { ElMessage, ElMessageBox } from 'element-plus';
import { CHAT_TYPE, MESSAGE_TYPE } from '@/IM/constant';
import { CUSTOM_MSG_EVENT_TYPE, SESSION_MESSAGE_TYPE } from '@/constant';
import dateFormater from '@/utils/dateFormater';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  groupId: {
    type: String,
    default: '',
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);
const { modelValue, groupId } = toRefs(props);
const router = useRouter();
const store = useStore();

const loading = ref(false);
const actionLoading = ref(false);
const threads = ref([]);
const latestMessageMap = ref({});
const threadDetail = ref(null);
const threadMembers = ref([]);
const selectedThread = ref(null);
const cursor = ref('');
const membersCursor = ref('');
const hasMore = ref(false);
const membersHasMore = ref(false);
const loadError = ref('');
const latestMessageError = ref('');
const joinedOnly = ref(false);
const pageSize = 20;

const getThreadId = (thread) => thread?.chatThreadId || '';

const getThreadName = (thread) =>
  thread?.name || getThreadId(thread);

const getThreadMemberName = (member) =>
  member?.memberId || '';

const normalizeThreadDetailResponse = (response) =>
  response || null;

const normalizeThreadMembersResponse = (response) => {
  const entities = response?.items || [];
  return {
    list: Array.isArray(entities) ? entities : [],
    cursor: response?.cursor || '',
  };
};

const normalizeThreadListResponse = (response) => {
  const entities = response?.items || [];
  return {
    list: Array.isArray(entities) ? entities : [],
    cursor: response?.cursor || '',
  };
};

const normalizeThreadLatestMessageResponse = (response) => {
  const entities = response?.items || [];
  return Array.isArray(entities) ? entities : [];
};

const getThreadLatestMessage = (thread) => {
  const threadId = getThreadId(thread);
  if (!threadId) return null;
  return latestMessageMap.value[threadId]?.lastMessage || null;
};

const isEmptyObject = (value) =>
  value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).length === 0;

const getLatestMessageText = (message) => {
  if (!message || isEmptyObject(message)) return '暂无最新消息';
  if (message.isRecall) return '撤回了一条消息';
  if (SESSION_MESSAGE_TYPE[message.type]) return SESSION_MESSAGE_TYPE[message.type];
  if (message.type === MESSAGE_TYPE.CUSTOM) {
    return CUSTOM_MSG_EVENT_TYPE[message.customEvent] || '[自定义消息]';
  }
  if (message.type === MESSAGE_TYPE.COMMAND) return '[透传消息]';
  return message.msg || message.payload?.text || '暂无最新消息';
};

const getLatestMessageTime = (message) => {
  const timestamp = message?.time || message?.timestamp;
  return timestamp ? dateFormater('MM/DD/HH:mm', timestamp) : '';
};

const loadThreadLatestMessages = async (threadList) => {
  const threadIds = threadList.map(getThreadId).filter(Boolean).slice(0, 20);
  if (threadIds.length === 0) return;
  try {
    latestMessageError.value = '';
    const response = await store.dispatch('fetchMessageThreadLastMessages', {
      chatThreadIds: threadIds,
    });
    const latestMessages = normalizeThreadLatestMessageResponse(response);
    const nextMap = { ...latestMessageMap.value };
    latestMessages.forEach((item) => {
      const threadId = getThreadId(item);
      if (threadId) {
        nextMap[threadId] = item;
      }
    });
    latestMessageMap.value = nextMap;
  } catch (error) {
    latestMessageError.value = error?.message || '批量获取消息话题最新消息失败';
    console.error('[Thread] getChatThreadLastMessage UI failed', {
      chatThreadIds: threadIds,
      error,
    });
    ElMessage.error(latestMessageError.value);
  }
};

const loadThreads = async (loadMore = false) => {
  if (!groupId.value) return;
  if (loading.value) return;
  loading.value = true;
  try {
    loadError.value = '';
    latestMessageError.value = '';
    if (!loadMore) {
      latestMessageMap.value = {};
    }
    const response = await store.dispatch(
      joinedOnly.value ? 'fetchJoinedMessageThreads' : 'fetchMessageThreads',
      {
        parentId: groupId.value,
        cursor: loadMore ? cursor.value : '',
        pageSize,
      },
    );
    const result = normalizeThreadListResponse(response);
    threads.value = loadMore ? [...threads.value, ...result.list] : result.list;
    cursor.value = result.cursor;
    hasMore.value = !!result.cursor;
    await loadThreadLatestMessages(result.list);
  } catch (error) {
    loadError.value = error?.message || '获取群组子区列表失败';
    console.error('[Thread] getChatThreads UI failed', {
      parentId: groupId.value,
      cursor: loadMore ? cursor.value : '',
      pageSize,
      error,
    });
    ElMessage.error(loadError.value);
  } finally {
    loading.value = false;
  }
};

const refreshSelectedThread = async () => {
  if (!selectedThread.value) return;
  await loadThreadDetail(selectedThread.value);
  await loadThreadMembers(selectedThread.value, false);
};

const loadThreadDetail = async (thread) => {
  const chatThreadId = getThreadId(thread);
  if (!chatThreadId) return;
  selectedThread.value = thread;
  actionLoading.value = true;
  try {
    const response = await store.dispatch('fetchMessageThreadDetail', {
      chatThreadId,
    });
    threadDetail.value = normalizeThreadDetailResponse(response);
    ElMessage.success('子区详情已刷新');
  } catch (error) {
    console.error('[Thread] getChatThreadDetail UI failed', {
      chatThreadId,
      error,
    });
    ElMessage.error(error?.message || '获取子区详情失败');
  } finally {
    actionLoading.value = false;
  }
};

const loadThreadMembers = async (thread, loadMore = false) => {
  const chatThreadId = getThreadId(thread);
  if (!chatThreadId) return;
  selectedThread.value = thread;
  actionLoading.value = true;
  try {
    const response = await store.dispatch('fetchMessageThreadMembers', {
      chatThreadId,
      cursor: loadMore ? membersCursor.value : '',
      pageSize,
    });
    const result = normalizeThreadMembersResponse(response);
    threadMembers.value = loadMore
      ? [...threadMembers.value, ...result.list]
      : result.list;
    membersCursor.value = result.cursor;
    membersHasMore.value = !!result.cursor;
  } catch (error) {
    console.error('[Thread] getChatThreadMembers UI failed', {
      chatThreadId,
      error,
    });
    ElMessage.error(error?.message || '获取子区成员失败');
  } finally {
    actionLoading.value = false;
  }
};

const joinMessageThread = async (thread) => {
  const chatThreadId = getThreadId(thread);
  if (!chatThreadId) return;
  actionLoading.value = true;
  try {
    await store.dispatch('joinMessageThread', { chatThreadId });
    ElMessage.success('加入子区成功');
    await refreshSelectedThread();
  } catch (error) {
    ElMessage.error(error?.message || '加入子区失败');
  } finally {
    actionLoading.value = false;
  }
};

const leaveMessageThread = async (thread) => {
  const chatThreadId = getThreadId(thread);
  if (!chatThreadId) return;
  actionLoading.value = true;
  try {
    await store.dispatch('leaveMessageThread', { chatThreadId });
    ElMessage.success('退出子区成功');
    await refreshSelectedThread();
  } catch (error) {
    ElMessage.error(error?.message || '退出子区失败');
  } finally {
    actionLoading.value = false;
  }
};

const renameMessageThread = async (thread) => {
  const chatThreadId = getThreadId(thread);
  if (!chatThreadId) return;
  try {
    const { value } = await ElMessageBox.prompt(
      '请输入新的消息话题名称',
      '修改名称',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputValue: getThreadName(thread),
        inputPattern: /\S+/,
        inputErrorMessage: '名称不能为空',
      },
    );
    const name = String(value || '').trim();
    if (!name) return;
    actionLoading.value = true;
    await store.dispatch('renameMessageThread', { chatThreadId, name });
    ElMessage.success('修改名称成功');
    await loadThreads(false);
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '修改名称失败');
    }
  } finally {
    actionLoading.value = false;
  }
};

const destroyMessageThread = async (thread) => {
  const chatThreadId = getThreadId(thread);
  if (!chatThreadId) return;
  try {
    await ElMessageBox.confirm('确认解散该消息话题？', '解散子区', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    });
    actionLoading.value = true;
    await store.dispatch('destroyMessageThread', { chatThreadId });
    ElMessage.success('解散子区成功');
    selectedThread.value = null;
    threadDetail.value = null;
    threadMembers.value = [];
    await loadThreads(false);
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '解散子区失败');
    }
  } finally {
    actionLoading.value = false;
  }
};

const removeMessageThreadMember = async (thread, member) => {
  const chatThreadId = getThreadId(thread);
  const username = getThreadMemberName(member);
  if (!chatThreadId || !username) return;
  actionLoading.value = true;
  try {
    await store.dispatch('removeMessageThreadMember', {
      chatThreadId,
      username,
    });
    ElMessage.success(`${username} 已移出成员`);
    await loadThreadMembers(thread, false);
  } catch (error) {
    ElMessage.error(error?.message || `${username} 移出成员失败`);
  } finally {
    actionLoading.value = false;
  }
};

const toggleJoinedOnly = async () => {
  joinedOnly.value = !joinedOnly.value;
  selectedThread.value = null;
  threadDetail.value = null;
  threadMembers.value = [];
  await loadThreads(false);
};

const closeDrawer = () => {
  emit('update:modelValue', false);
};

const openThread = (thread) => {
  const threadId = getThreadId(thread);
  if (!threadId) {
    ElMessage.error('话题数据缺少 chatThreadId');
    return;
  }
  closeDrawer();
  router.push({
    path: '/chat/conversation/message',
    query: {
      id: threadId,
      chatType: CHAT_TYPE.GROUP,
      isChatThread: 'true',
      groupId: groupId.value,
      threadName: getThreadName(thread),
    },
  });
};

watch(
  () => modelValue.value,
  (visible) => {
    if (visible) {
      loadThreads(false);
    }
  },
);

defineExpose({
  loadThreads,
});
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    class="message_thread_list_drawer"
    direction="rtl"
    size="320px"
    :destroy-on-close="true"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="message_thread_list_header">
        <span>{{ joinedOnly ? '我加入的子区' : '群组子区列表' }}</span>
        <el-button size="small" :loading="loading" @click="loadThreads(false)">
          刷新
        </el-button>
      </div>
    </template>
    <div class="message_thread_list_content">
      <div class="thread_list_toolbar">
        <el-button size="small" :loading="loading" @click="toggleJoinedOnly">
          {{ joinedOnly ? '全部子区' : '我加入的子区' }}
        </el-button>
      </div>
      <el-scrollbar height="calc(100vh - 150px)">
        <div v-if="loadError" class="thread_list_error">
          服务端返回：{{ loadError }}
        </div>
        <div v-else-if="latestMessageError" class="thread_list_error">
          最新消息接口返回：{{ latestMessageError }}
        </div>
        <el-empty
          v-else-if="!loading && threads.length === 0"
          description="暂无子区"
        />
        <div
          v-for="thread in threads"
          :key="getThreadId(thread)"
          class="thread_list_item"
          @click="openThread(thread)"
        >
          <div class="thread_summary">
            <div class="thread_title_row">
              <div class="thread_name">{{ getThreadName(thread) }}</div>
              <span v-if="thread.messageCount" class="thread_count">
                {{ thread.messageCount }} 条
              </span>
            </div>
            <div class="thread_meta">{{ getThreadId(thread) }}</div>
            <div class="thread_last_message">
              <span class="thread_last_message_text">
                {{ getLatestMessageText(getThreadLatestMessage(thread)) }}
              </span>
              <span class="thread_last_message_time">
                {{ getLatestMessageTime(getThreadLatestMessage(thread)) }}
              </span>
            </div>
          </div>
          <div class="thread_actions" @click.stop>
            <div class="thread_primary_actions">
              <el-button size="small" :loading="actionLoading" @click="joinMessageThread(thread)">
                加入
              </el-button>
              <el-button size="small" :loading="actionLoading" @click="leaveMessageThread(thread)">
                退出
              </el-button>
              <el-button size="small" :loading="actionLoading" @click="renameMessageThread(thread)">
                改名
              </el-button>
            </div>
            <div class="thread_secondary_actions">
              <el-button link size="small" :loading="actionLoading" @click="loadThreadDetail(thread)">
                详情
              </el-button>
              <el-button link size="small" :loading="actionLoading" @click="loadThreadMembers(thread)">
                成员
              </el-button>
              <el-button link size="small" type="danger" :loading="actionLoading" @click="destroyMessageThread(thread)">
                解散
              </el-button>
            </div>
          </div>
        </div>
        <div v-if="hasMore" class="thread_load_more">
          <el-button link :loading="loading" @click="loadThreads(true)">
            加载更多
          </el-button>
        </div>
        <div v-if="selectedThread" class="thread_management_panel">
          <div class="thread_management_title">
            当前子区：{{ getThreadName(selectedThread) }}
          </div>
          <pre v-if="threadDetail" class="thread_detail">{{ JSON.stringify(threadDetail, null, 2) }}</pre>
          <div class="thread_members_title">子区成员</div>
          <div
            v-for="member in threadMembers"
            :key="getThreadMemberName(member)"
            class="thread_member_item"
          >
            <span>{{ getThreadMemberName(member) }}</span>
            <el-button
              link
              size="small"
              type="danger"
              :loading="actionLoading"
              @click="removeMessageThreadMember(selectedThread, member)"
            >
              移出成员
            </el-button>
          </div>
          <el-button
            v-if="membersHasMore"
            link
            size="small"
            :loading="actionLoading"
            @click="loadThreadMembers(selectedThread, true)"
          >
            加载更多成员
          </el-button>
        </div>
      </el-scrollbar>
    </div>
  </el-drawer>
</template>

<style lang="scss" scoped>
.message_thread_list_header {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.message_thread_list_content {
  padding: 0 20px 16px;
}

.thread_list_toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.thread_list_error {
  padding: 12px;
  border: 1px solid #ffd6d6;
  border-radius: 6px;
  background: #fff2f2;
  color: #f56c6c;
  font-size: 13px;
  line-height: 18px;
  word-break: break-word;
}

.thread_list_item {
  margin-bottom: 10px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.thread_list_item:hover {
  border-color: #dcdfe6;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
}

.thread_summary {
  padding: 12px 12px 10px;
}

.thread_title_row {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.thread_name {
  min-width: 0;
  overflow: hidden;
  color: #333333;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread_count {
  flex-shrink: 0;
  color: #909399;
  font-size: 12px;
  line-height: 18px;
}

.thread_meta {
  margin-top: 3px;
  overflow: hidden;
  color: #999999;
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread_last_message {
  display: flex;
  min-width: 0;
  justify-content: space-between;
  gap: 12px;
  margin-top: 6px;
  color: #666666;
  font-size: 12px;
  line-height: 18px;
}

.thread_last_message_text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread_last_message_time {
  flex-shrink: 0;
  color: #999999;
}

.thread_load_more {
  padding: 12px 0;
  text-align: center;
}

.thread_actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid #f0f2f5;
  background: #fafafa;
}

.thread_primary_actions,
.thread_secondary_actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.thread_primary_actions :deep(.el-button) {
  min-width: 44px;
  padding: 5px 10px;
}

.thread_primary_actions :deep(.el-button + .el-button),
.thread_secondary_actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.thread_management_panel {
  margin-top: 12px;
  padding: 10px;
  border: 1px solid #eeeeee;
  border-radius: 6px;
  background: #fafafa;
}

.thread_management_title,
.thread_members_title {
  color: #333333;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}

.thread_detail {
  max-height: 180px;
  overflow: auto;
  margin: 8px 0;
  padding: 8px;
  border-radius: 4px;
  background: #ffffff;
  color: #606266;
  font-size: 12px;
  line-height: 16px;
  white-space: pre-wrap;
  word-break: break-word;
}

.thread_member_item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid #eeeeee;
  color: #606266;
  font-size: 12px;
}
</style>
