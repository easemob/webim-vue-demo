<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { requireManager } from '@/IM';
import { CONVERSATION_TYPE } from '@/IM/constant';
import dateFormater from '@/utils/dateFormater';
import { ElMessageBox, ElMessage } from 'element-plus';
import { Delete } from '@element-plus/icons-vue';

const store = useStore();
const router = useRouter();
const contactManager = () => requireManager('contactManager');
const groupManager = () => requireManager('groupManager');
const informList = computed(() => store.state.Conversation.informDetail);

const clearUnread = (inform, index) => {
  if (inform.untreated) store.commit('CLEAR_UNTREATED_STATUS', index);
};

const clearAllInform = () => {
  ElMessageBox.confirm('确认清除所有系统通知?', '清除系统通知', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => store.commit('CLEAR_INFORM_LIST'))
    .catch(() => {});
};

const eventTitle = (eventName) => eventName || 'SDK 5.0 系统通知';

const eventUserId = (payload) => payload?.userInfo?.userId || '';

const canHandleEvent = (informData) =>
  ['onContactInvited', 'onInvitationReceived', 'onRequestToJoinReceived'].includes(
    informData.sdkEventName,
  );

const updateOperationStatus = (index, operationStatus) => {
  store.commit('UPDATE_INFORM_BTNSTATUS', { index, btnStatus: operationStatus });
};

const handleClickBtn = async ({ informData, index, type }) => {
  const payload = informData.sdkPayload;
  try {
    if (informData.sdkEventName === 'onContactInvited') {
      const userId = eventUserId(payload);
      if (!userId) throw new Error('SDK 5.0 onContactInvited 未下发 userInfo.userId');
      if (type === 'agree') {
        await contactManager().acceptContactInvite({ userId });
      } else {
        await contactManager().declineContactInvite({ userId });
      }
      updateOperationStatus(index, type === 'agree' ? 1 : 2);
      return;
    }

    const groupId = payload?.groupId;
    if (!groupId) throw new Error(`${informData.sdkEventName} 未下发 groupId`);
    if (informData.sdkEventName === 'onInvitationReceived') {
      if (type === 'agree') {
        await groupManager().acceptInvitation({ groupId });
        updateOperationStatus(index, 1);
        await store.dispatch('fetchJoinedGroupListFromServer');
        router.push({
          path: '/chat/contacts/contactInfos',
          query: {
            conversationId: groupId,
            conversationType: CONVERSATION_TYPE.GROUP,
          },
        });
      } else {
        await groupManager().rejectInvitation({ groupId });
        updateOperationStatus(index, 2);
      }
      return;
    }

    const userId = payload?.applicant?.userId;
    if (!userId) {
      throw new Error('SDK 5.0 onRequestToJoinReceived 未下发 applicant.userId');
    }
    if (type === 'agree') {
      await groupManager().acceptGroupJoinRequest({ userId, groupId });
      updateOperationStatus(index, 1);
    } else {
      await groupManager().rejectGroupJoinRequest({ userId, groupId });
      updateOperationStatus(index, 2);
    }
  } catch (error) {
    console.error('[SDK 5.0 System Notification] action failed', {
      eventName: informData.sdkEventName,
      payload,
      error,
    });
    ElMessage({
      type: 'error',
      center: true,
      message: error?.message || 'SDK 5.0 操作失败',
    });
  }
};
</script>

<template>
  <el-container class="app_container" v-if="informList.length > 0">
    <div class="inforom_details_box">
      <div class="inforom_details_box_header">
        <div class="clear_inforom">
          <el-icon @click="clearAllInform"><Delete /></el-icon>
        </div>
      </div>
      <el-scrollbar tag="div">
        <div v-for="(item, index) in informList" :key="item.receivedAt">
          <div class="inforom_details_time">
            <span class="time">{{ dateFormater('MM-DD HH:mm', item.receivedAt) }}</span>
          </div>
          <el-card
            class="inforom_details_card"
            @click="clearUnread(item, index)"
            shadow="never"
          >
            <template #header>
              <div class="card-header"><span>{{ eventTitle(item.sdkEventName) }}</span></div>
            </template>
            <span v-if="item.untreated" class="badge"></span>
            <div class="card-main">
              <pre class="text item sdk5-payload">{{ JSON.stringify(item.sdkPayload, null, 2) }}</pre>
              <el-dropdown
                v-if="canHandleEvent(item) && item.operationStatus < 1"
                trigger="click"
                split-button
                type="primary"
                @command="handleClickBtn"
              >
                是否同意
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ informData: item, index, type: 'agree' }">同意</el-dropdown-item>
                    <el-dropdown-item :command="{ informData: item, index, type: 'refuse' }">拒绝</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <div v-if="item.operationStatus">
                <span>{{ item.operationStatus === 1 ? '已同意' : '已拒绝' }}</span>
              </div>
            </div>
          </el-card>
        </div>
      </el-scrollbar>
    </div>
  </el-container>
  <el-empty v-else style="height: 100%" description="暂无新的系统通知" />
</template>

<style lang="scss" scoped>
.app_container {
  width: 100%;
  height: 100%;
  background: #f9f9f9;
  border-radius: 0 5px 5px 0;

  .inforom_details_box {
    width: 100%;
    height: calc(100% - 60px);

    .inforom_details_box_header {
      height: 60px;
      width: 100%;
      font-size: 20px;

      .clear_inforom {
        float: right;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 80px;
        height: 100%;
      }
    }

    .inforom_details_time {
      width: 100%;
      height: 35px;
      display: flex;
      justify-content: center;
      align-items: center;

      .time {
        display: inline-block;
        width: 100px;
        height: 20px;
        text-align: center;
        line-height: 20px;
        font-size: 7px;
        border-radius: 20px;
        background: #fff;
      }
    }

    .inforom_details_card {
      position: relative;
      margin: 35px auto;
      width: 85%;
      min-height: 150px;
      cursor: pointer;
      transition: all 0.1s;

      &:active {
        transform: scale(1.01);
      }

      .badge {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: red;
        position: absolute;
        right: 0;
        top: 0;
      }

      .card-main {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;

        .text {
          font-family: 'PingFang SC';
          font-style: normal;
          font-weight: 400;
          font-size: 16px;
          line-height: 22px;
          letter-spacing: 0.6px;
          color: #999999;
          max-width: 80%;
          word-break: break-all;
          white-space: pre-wrap;
        }
      }
    }

    :deep(.inforom_details_card) {
      overflow: auto;
    }
  }
}
</style>
