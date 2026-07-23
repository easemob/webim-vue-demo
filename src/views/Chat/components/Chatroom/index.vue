<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
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

// 设置聊天室事件监听器，只记录真实 SDK 事件
const setupChatroomEventHandler = () => {
  if (chatroomEventHandler) {
    chatRoomManager().removeEventHandler('CHATROOM');
  }

  chatroomEventHandler = chatRoomManager().addEventHandler('CHATROOM', {
    onChatRoomDestroyed: () => ElMessage.warning('聊天室已解散'),
    onRemovedFromChatRoom: () => ElMessage.warning('你已被移出聊天室'),
    onMembersJoined: () => {},
    onMembersExited: () => {},
    onAllMemberMuteStateChanged: (payload) => {
      ElMessage[payload.isMuted ? 'warning' : 'success'](
        payload.isMuted ? '聊天室已开启全员禁言' : '聊天室已解除全员禁言',
      );
    },
    onAllowListAdded: () => ElMessage.success('你已被添加到聊天室白名单'),
    onAllowListRemoved: () => ElMessage.warning('你已被移出聊天室白名单'),
    onAnnouncementChanged: () => ElMessage.info('聊天室公告已更新'),
    onMuteListAdded: () => ElMessage.warning('你已被禁言'),
    onMuteListRemoved: () => ElMessage.success('你已被解除禁言'),
    onAdminAdded: () => ElMessage.success('你已被设置为管理员'),
    onAdminRemoved: () => ElMessage.warning('你已被移除管理员'),
    onOwnerChanged: () => ElMessage.info('聊天室所有者已变更'),
    onChatRoomInfoChanged: () => ElMessage.info('聊天室信息已更新'),
    onAttributesUpdate: () => ElMessage.info('聊天室自定义属性已更新'),
    onAttributesRemoved: () => ElMessage.info('聊天室自定义属性已删除'),
  });
};

const isJoiningRoom = (roomId) => {
  const key = normalizeChatroomId(roomId);
  if (!key) return false;
  return joiningRoomIds.value.has(key);
};

const setJoiningRoom = (roomId, joining) => {
  const key = normalizeChatroomId(roomId);
  if (!key) return;
  const nextJoiningRoomIds = new Set(joiningRoomIds.value);
  if (joining) {
    nextJoiningRoomIds.add(key);
  } else {
    nextJoiningRoomIds.delete(key);
  }
  joiningRoomIds.value = nextJoiningRoomIds;
};

const isJoinedRoom = (roomId) => {
  const key = normalizeChatroomId(roomId);
  if (!key) return false;
  return store.state.joinedChatroomIds.has(key);
};

const setJoinedRoom = (roomId, joined) => {
  store.commit('SET_JOINED_CHATROOM_STATUS', { roomId, joined });
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
      `\n错误类型:`,
      error.type,
      `\n错误消息:`,
      error.message,
      `\n完整错误信息:`,
      error,
    );
    ElMessage.error(error?.message || '获取聊天室列表失败');
  } finally {
    loading.value = false;
  }
};

const refreshChatroomListsFromServer = async () => {
  await getChatrooms();
};

const joinChatroom = async (roomId) => {
  if (!checkLoginStatus()) return;
  if (isJoiningRoom(roomId)) {
    console.warn(
      `[ChatroomUI] 忽略重复加入请求:`,
      `\n调用方法: joinChatRoom`,
      `\n目标聊天室ID:`,
      roomId,
      `\n当前用户:`,
      getCurrentUserId(),
    );
    return;
  }
  const JOIN_CHAT_ROOM_METHOD = 'joinChatRoom';
  const joinChatRoomParams = {
    chatRoomId: roomId,
    ext: joinRoomExt.value,
    leaveOtherRooms: false,
  };
  setJoiningRoom(roomId, true);
  try {
    console.log(
      `开始加入聊天室:`,
      `\n调用方法: ${JOIN_CHAT_ROOM_METHOD}`,
      `\n方法入参:`,
      joinChatRoomParams,
      `\n当前用户:`,
      getCurrentUserId(),
      `\n目标聊天室ID:`,
      roomId,
    );
    const res = await chatRoomManager().joinChatRoom(joinChatRoomParams);

    logChatroomActionResult(
      'ChatroomIndex',
      JOIN_CHAT_ROOM_METHOD,
      joinChatRoomParams,
      res,
      {
        from: getCurrentUserId(),
      },
    );
    setJoinedRoom(roomId, true);
    ElMessage.success('加入聊天室成功');
    console.log(`加入聊天室成功:`, {
      method: JOIN_CHAT_ROOM_METHOD,
      params: joinChatRoomParams,
      response: res,
      currentUser: getCurrentUserId(),
    });
    toChatroomMessage(roomId);
  } catch (error) {
    console.error(
      `加入聊天室失败:`,
      `\n调用方法: ${JOIN_CHAT_ROOM_METHOD}`,
      `\n方法入参:`,
      joinChatRoomParams,
      `\n目标聊天室ID:`,
      roomId,
      `\n当前用户:`,
      getCurrentUserId(),
      `\n完整错误信息:`,
      error,
      `\n错误类型:`,
      error.type,
      `\n错误数据:`,
      error.data,
      `\n错误消息:`,
      error.message,
    );

    if (isImAuthFailedReason(error)) {
      redirectToLoginClearImSession();
      return;
    }

    const joinChatroomErrorMessage = `加入聊天室${roomId}失败：${error?.message || '未知错误'}`;
    ElMessage.error(joinChatroomErrorMessage);
  } finally {
    setJoiningRoom(roomId, false);
  }
};

const toChatroomMessage = (roomId) => {
  router.push({
    path: '/chat/chatroom/message',
    query: {
      conversationId: roomId,
      conversationType: CONVERSATION_TYPE.CHATROOM,
    },
  });
};

const toChatroomDetails = async (roomId) => {
  await getChatrooms();
  router.push({
    path: '/chat/chatroom/details',
    query: {
      roomId,
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

let chatroomEventHandler = null;

onMounted(() => {
  getChatrooms();
  setupChatroomEventHandler();
});

onUnmounted(() => {
  if (chatroomEventHandler) {
    chatRoomManager().removeEventHandler('CHATROOM');
  }
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
                  <div class="desc">SDK 5.0 列表未返回聊天室描述</div>
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
