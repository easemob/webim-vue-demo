<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
import { getCurrentUserId, requireManager } from '@/IM';
import { CONVERSATION_TYPE } from '@/IM/constant';
import router from '@/router';
import SearchInput from '@/components/SearchInput';
import Welcome from '@/components/Welcome';
import { logChatroomActionResult } from '@/utils/chatroomActionLog';
import {
  isImAuthFailedReason,
  redirectToLoginClearImSession,
} from '@/utils/imAuthRedirect';
import { getSdk5ErrorMessage } from '@/utils/sdk5ErrorInfo';

/** SDK IDs may be numbers or strings; normalize them for pending-operation state. */
function normalizeChatroomId(id) {
  if (id == null || id === '') return '';
  return String(id);
}

const store = useStore();

const chatroomList = ref([]);
const loading = ref(false);
const joiningRoomIds = ref(new Set());
const searchKeyword = ref('');
const chatRoomManager = () => requireManager('chatRoomManager');

const activeName = ref('1');
const joinRoomExt = ref('webim_vue_demo');

const checkLoginStatus = () => {
  if (!getCurrentUserId()) {
    ElMessage.error('用户未登录，请先登录');
    router.push('/login');
    return false;
  }
  return true;
};

const isJoiningRoom = (chatRoomId) => {
  const key = normalizeChatroomId(chatRoomId);
  if (!key) return false;
  return joiningRoomIds.value.has(key);
};

const setJoiningRoom = (chatRoomId, joining) => {
  const key = normalizeChatroomId(chatRoomId);
  if (!key) return;
  const nextJoiningRoomIds = new Set(joiningRoomIds.value);
  if (joining) {
    nextJoiningRoomIds.add(key);
  } else {
    nextJoiningRoomIds.delete(key);
  }
  joiningRoomIds.value = nextJoiningRoomIds;
};

const isJoinedRoom = (chatRoomId) => {
  const key = normalizeChatroomId(chatRoomId);
  if (!key) return false;
  return store.state.joinedChatroomIds.has(key);
};

const setJoinedRoom = (chatRoomId, joined) => {
  store.commit('SET_JOINED_CHATROOM_STATUS', { chatRoomId, joined });
};

const getAllChatroomMemberCount = (item) => {
  const rawCount = item?.memberCount;
  if (rawCount == null || rawCount === '') return null;
  const count = Number(rawCount);
  return Number.isFinite(count) ? count : null;
};

const getChatrooms = async () => {
  if (!checkLoginStatus()) return;
  const GET_CHAT_ROOMS_METHOD = 'getChatRooms';
  const chatRoomListParams = { pageNum: 1, pageSize: 1000 };
  loading.value = true;
  try {
    const res = await chatRoomManager().getChatRoomList(chatRoomListParams);
    const rooms = Array.isArray(res.items) ? res.items : [];
    console.log(
      `获取聊天室列表成功:`,
      `\n调用方法: ${GET_CHAT_ROOMS_METHOD}`,
      `\n方法入参:`,
      chatRoomListParams,
      `\n原始返回数据:`,
      res,
      `\n返回的聊天室数据:`,
      rooms,
      `\n聊天室总数:`,
      rooms.length,
      `\n当前用户:`,
      getCurrentUserId(),
      `\n第一个聊天室的数据结构:`,
      rooms.length > 0 ? JSON.stringify(rooms[0], null, 2) : '无数据',
    );
    if (rooms.length > 0) {
      console.log(`第一个所有聊天室的原始数据:`, JSON.stringify(rooms[0], null, 2));
    }

    chatroomList.value = rooms;
    console.log(`所有聊天室列表处理完成:`, JSON.stringify(chatroomList.value, null, 2));
  } catch (error) {
    console.error(
      `获取聊天室列表失败:`,
      `\n调用方法: ${GET_CHAT_ROOMS_METHOD}`,
      `\n方法入参:`,
      chatRoomListParams,
      `\n当前用户:`,
      getCurrentUserId(),
      `\n错误码:`,
      error.code,
      `\n错误消息:`,
      error.message,
      `\n完整错误信息:`,
      error,
    );
    if (isImAuthFailedReason(error)) {
      redirectToLoginClearImSession();
      return;
    }
    ElMessage.error(getSdk5ErrorMessage(error, '获取聊天室列表失败'));
  } finally {
    loading.value = false;
  }
};

const refreshChatroomListsFromServer = async () => {
  await getChatrooms();
};

const joinChatroom = async (chatRoomId) => {
  if (!checkLoginStatus()) return;
  if (isJoiningRoom(chatRoomId)) {
    console.warn(
      `[ChatroomUI] 忽略重复加入请求:`,
      `\n调用方法: joinChatRoom`,
      `\n目标聊天室ID:`,
      chatRoomId,
      `\n当前用户:`,
      getCurrentUserId(),
    );
    return;
  }
  const JOIN_CHAT_ROOM_METHOD = 'joinChatRoom';
  const joinChatRoomParams = {
    chatRoomId,
    ext: joinRoomExt.value,
    leaveOtherRooms: false,
  };
  setJoiningRoom(chatRoomId, true);
  try {
    console.log(
      `开始加入聊天室:`,
      `\n调用方法: ${JOIN_CHAT_ROOM_METHOD}`,
      `\n方法入参:`,
      joinChatRoomParams,
      `\n当前用户:`,
      getCurrentUserId(),
      `\n目标聊天室ID:`,
      chatRoomId,
    );
    const res = await chatRoomManager().joinChatRoom(joinChatRoomParams);

    logChatroomActionResult(
      'ChatroomIndex',
      JOIN_CHAT_ROOM_METHOD,
      joinChatRoomParams,
      res,
      {
        currentUserId: getCurrentUserId(),
      },
    );
    setJoinedRoom(chatRoomId, true);
    ElMessage.success('加入聊天室成功');
    console.log(`加入聊天室成功:`, {
      method: JOIN_CHAT_ROOM_METHOD,
      params: joinChatRoomParams,
      response: res,
      currentUser: getCurrentUserId(),
    });
    toChatroomMessage(chatRoomId);
  } catch (error) {
    console.error(
      `加入聊天室失败:`,
      `\n调用方法: ${JOIN_CHAT_ROOM_METHOD}`,
      `\n方法入参:`,
      joinChatRoomParams,
      `\n目标聊天室ID:`,
      chatRoomId,
      `\n当前用户:`,
      getCurrentUserId(),
      `\n完整错误信息:`,
      error,
      `\n错误码:`,
      error.code,
      `\n错误详情:`,
      error.details,
      `\n错误消息:`,
      error.message,
    );

    if (isImAuthFailedReason(error)) {
      redirectToLoginClearImSession();
      return;
    }

    const joinChatroomErrorMessage = `加入聊天室${chatRoomId}失败：${getSdk5ErrorMessage(error, '未知错误')}`;
    ElMessage.error(joinChatroomErrorMessage);
  } finally {
    setJoiningRoom(chatRoomId, false);
  }
};

const toChatroomMessage = (chatRoomId) => {
  router.push({
    path: '/chat/chatroom/message',
    query: {
      conversationId: chatRoomId,
      conversationType: CONVERSATION_TYPE.CHATROOM,
    },
  });
};

const toChatroomDetails = async (chatRoomId) => {
  await getChatrooms();
  router.push({
    path: '/chat/chatroom/details',
    query: {
      chatRoomId,
      refreshAt: Date.now(),
    },
  });
};

const filteredChatroomList = computed(() => {
  if (!searchKeyword.value) return chatroomList.value;
  return chatroomList.value.filter(
    (item) =>
      item.name?.includes(searchKeyword.value) ||
      item.chatRoomId?.includes(searchKeyword.value),
  );
});

const networkStatus = computed(() => {
  return store.state.networkStatus;
});

onMounted(() => {
  getChatrooms();
});
</script>

<template>
  <el-container style="height: 100%">
    <el-aside class="chatroom_box">
      <SearchInput
        :searchType="'chatroom'"
        :searchData="[]"
        v-model="searchKeyword"
      />
      <el-scrollbar class="chatroom_collapse" tag="div" :always="false">
        <div class="offline_hint" v-if="!networkStatus">
          <span class="plaint_icon">!</span>
          网络不给力，请检查网络设置。
        </div>

        <div class="action_buttons">
          <el-button size="small" @click="refreshChatroomListsFromServer">
            刷新列表
          </el-button>
        </div>

        <el-collapse v-model="activeName" accordion>
          <el-collapse-item
            :title="`所有聊天室 ( ${chatroomList.length} )`"
            name="1"
          >
            <template v-if="filteredChatroomList.length > 0">
              <div
                v-for="item in filteredChatroomList"
                :key="item.chatRoomId"
                class="chatroom_item"
              >
                <div class="item_left">
                  <el-avatar :size="40" :src="item.avatar || ''">
                    {{ item.name?.charAt(0) }}
                  </el-avatar>
                </div>
                <div class="item_main">
                  <div class="name">{{ item.name }}</div>
                  <div class="desc">聊天室ID：{{ item.chatRoomId }}</div>
                  <div class="info">
                    <span>成员: {{ getAllChatroomMemberCount(item) ?? '--' }}</span>
                  </div>
                </div>
                <div class="item_right">
                  <el-button
                    v-if="isJoinedRoom(item.chatRoomId)"
                    type="success"
                    size="small"
                    @click="toChatroomMessage(item.chatRoomId)"
                  >
                    进入聊天室
                  </el-button>
                  <el-button
                    v-else
                    type="primary"
                    size="small"
                    :loading="isJoiningRoom(item.chatRoomId)"
                    :disabled="isJoiningRoom(item.chatRoomId)"
                    @click="joinChatroom(item.chatRoomId)"
                  >
                    加入
                  </el-button>
                  <el-button size="small" @click="toChatroomDetails(item.chatRoomId)">
                    详情
                  </el-button>
                </div>
              </div>
            </template>
            <template v-else>
              <el-empty description="暂无聊天室..." />
            </template>
          </el-collapse-item>

        </el-collapse>
      </el-scrollbar>
    </el-aside>
    <el-main ref class="chatroom_infors_main_box">
      <router-view></router-view>
      <Welcome />
    </el-main>
  </el-container>
</template>

<style lang="scss" scoped>
.chatroom_box {
  position: relative;
  background: #cfdbf171;
  min-width: 324px;
  user-select: none;

  .chatroom_collapse {
    height: calc(100% - 60px);
    overflow: auto;
  }
}

.action_buttons {
  display: flex;
  gap: 10px;
  padding: 10px;
}

:deep(.el-collapse-item__header) {
  padding: 0 8px;
  font-family: 'PingFang SC';
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 24px;
  letter-spacing: 0.342857px;
  color: #333333;
}

:deep(.el-collapse-item__content) {
  padding: 0;
}

.chatroom_item {
  position: relative;
  width: 100%;
  min-height: 80px;
  padding: 10px 8px;
  background: #fff;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;

  &:hover {
    background: #f5f5f5;
  }

  .item_left {
    margin-right: 10px;
  }

  .item_main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .name {
      font-weight: 500;
      font-size: 14px;
      line-height: 20px;
      color: #333333;
    }

    .desc {
      font-size: 12px;
      color: #999;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 150px;
    }

    .info {
      font-size: 11px;
      color: #666;
      display: flex;
      gap: 10px;
    }
  }

  .item_right {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
}

.chatroom_infors_main_box {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0;
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
</style>
