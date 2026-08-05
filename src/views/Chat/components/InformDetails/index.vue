<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { requireManager } from '@/IM';
import { CONVERSATION_TYPE } from '@/IM/constant';
import dateFormater from '@/utils/dateFormater';
import { ElMessageBox, ElMessage } from 'element-plus';
import { Delete } from '@element-plus/icons-vue';

const store = useStore();
const router = useRouter();
const route = useRoute();
const contactManager = () => requireManager('contactManager');
const groupManager = () => requireManager('groupManager');
const informList = computed(() => store.state.Conversation.informDetail);
const sdkEventRecords = computed(() => store.state.Conversation.sdkEventRecords || []);
const activeEventDomain = ref('all');
const eventDomains = [
  { value: 'all', label: '全部事件' },
  { value: 'singleChat', label: '单聊事件' },
  { value: 'contact', label: '联系人事件' },
  { value: 'group', label: '群组事件' },
  { value: 'chatRoom', label: '聊天室事件' },
];
const selectedEventName = computed(() =>
  typeof route.query.eventName === 'string' ? route.query.eventName : '',
);
const selectedEventDomain = computed(() =>
  typeof route.query.domain === 'string' ? route.query.domain : '',
);
const selectedEventReceivedAt = computed(() => {
  const receivedAt = Number(route.query.receivedAt);
  return Number.isFinite(receivedAt) ? receivedAt : null;
});
const hasSelectedEvent = computed(
  () =>
    !!selectedEventName.value &&
    !!selectedEventDomain.value &&
    selectedEventReceivedAt.value !== null,
);
const selectedEventRecord = computed(() => {
  if (!hasSelectedEvent.value) return null;
  return sdkEventRecords.value.find(
    (record) =>
      record.domain === selectedEventDomain.value &&
      record.eventName === selectedEventName.value &&
      record.receivedAt === selectedEventReceivedAt.value,
  );
});
const visibleEventRecords = computed(() =>
  hasSelectedEvent.value
    ? selectedEventRecord.value
      ? [selectedEventRecord.value]
      : []
    : activeEventDomain.value === 'all'
      ? sdkEventRecords.value
      : sdkEventRecords.value.filter((record) => record.domain === activeEventDomain.value),
);

const clearAllInform = () => {
  ElMessageBox.confirm('确认清除当前 SDK 事件记录?', '清除事件记录', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      store.commit('CLEAR_SDK_EVENT_RECORDS');
      store.commit('CLEAR_INFORM_LIST');
    })
    .catch(() => {});
};

const eventTitle = (eventName) => eventName || '未命名 SDK 5.0 事件';

const eventDomainLabel = (domain) =>
  eventDomains.find((item) => item.value === domain)?.label || '其他 SDK 事件';

const eventTarget = (record) => {
  const payload = Array.isArray(record?.payload)
    ? record.payload[0]
    : record?.payload;
  if (!payload || typeof payload !== 'object') return 'SDK 未下发目标 ID';
  return (
    payload.conversationId ||
    payload.groupId ||
    payload.chatRoomId ||
    payload.userInfo?.userId ||
    payload.applicant?.userId ||
    'SDK 未下发目标 ID'
  );
};

const linkedInform = (record) =>
  informList.value.find(
    (inform) =>
      inform.sdkEventName === record.eventName && inform.sdkPayload === record.payload,
  );

const linkedInformIndex = (record) =>
  informList.value.findIndex(
    (inform) =>
      inform.sdkEventName === record.eventName && inform.sdkPayload === record.payload,
  );

const eventUserId = (payload) => payload?.userInfo?.userId || '';

const canHandleEvent = (informData) =>
  ['onContactInvited', 'onInvitationReceived', 'onRequestToJoinReceived'].includes(
    informData.sdkEventName,
  );

const updateOperationStatus = (index, operationStatus) => {
  if (index < 0) return;
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
  <el-container class="app_container" v-if="sdkEventRecords.length > 0">
    <div class="inforom_details_box">
      <div class="inforom_details_box_header">
        <div class="event_center_title">
          <strong>SDK 5.0 事件中心</strong>
          <span>仅展示当前登录周期内 SDK 实际下发的事件</span>
        </div>
        <el-radio-group v-model="activeEventDomain" size="small" class="event_domain_filters">
          <el-radio-button
            v-for="domain in eventDomains"
            :key="domain.value"
            :value="domain.value"
          >
            {{ domain.label }}
          </el-radio-button>
        </el-radio-group>
        <div class="clear_inforom">
          <el-tooltip content="清除当前 SDK 事件记录" placement="left">
            <el-icon @click="clearAllInform"><Delete /></el-icon>
          </el-tooltip>
        </div>
      </div>
      <el-scrollbar tag="div">
        <div v-for="record in visibleEventRecords" :key="`${record.receivedAt}-${record.eventName}`">
          <div class="inforom_details_time">
            <span class="time">{{ dateFormater('MM-DD HH:mm:ss', record.receivedAt) }}</span>
          </div>
          <el-card
            class="inforom_details_card"
            shadow="never"
          >
            <template #header>
              <div class="card-header">
                <span class="event_domain">{{ eventDomainLabel(record.domain) }}</span>
                <strong>{{ eventTitle(record.eventName) }}</strong>
              </div>
            </template>
            <div class="card-main">
              <dl class="event_summary">
                <div><dt>目标 ID</dt><dd>{{ eventTarget(record) }}</dd></div>
                <div><dt>当前账号</dt><dd>{{ record.currentUserId || 'SDK 未返回' }}</dd></div>
                <div><dt>事件时间</dt><dd>{{ dateFormater('YYYY-MM-DD HH:mm:ss', record.receivedAt) }}</dd></div>
              </dl>
              <pre class="text item sdk5-payload">{{ JSON.stringify(record.payload, null, 2) }}</pre>
              <el-dropdown
                v-if="linkedInform(record) && canHandleEvent(linkedInform(record)) && linkedInform(record).operationStatus < 1"
                trigger="click"
                split-button
                type="primary"
                @command="handleClickBtn"
              >
                是否同意
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ informData: linkedInform(record), index: linkedInformIndex(record), type: 'agree' }">同意</el-dropdown-item>
                    <el-dropdown-item :command="{ informData: linkedInform(record), index: linkedInformIndex(record), type: 'refuse' }">拒绝</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <div v-if="linkedInform(record)?.operationStatus">
                <span>{{ linkedInform(record).operationStatus === 1 ? '已同意' : '已拒绝' }}</span>
              </div>
            </div>
          </el-card>
        </div>
        <el-empty
          v-if="visibleEventRecords.length === 0"
          :image-size="80"
          :description="hasSelectedEvent ? '未找到对应的 SDK 事件记录' : `${eventDomainLabel(activeEventDomain)}当前未收到 SDK 事件`"
        />
      </el-scrollbar>
    </div>
  </el-container>
  <el-empty v-else style="height: 100%" description="当前登录周期内未收到 SDK 事件" />
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
      min-height: 94px;
      width: 100%;
      font-size: 20px;
      padding: 16px 24px 8px;
      box-sizing: border-box;

      .event_center_title {
        display: flex;
        align-items: baseline;
        gap: 12px;

        span {
          font-size: 12px;
          color: #909399;
        }
      }

      .event_domain_filters {
        margin-top: 12px;
      }

      .clear_inforom {
        float: right;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 32px;
        height: 32px;
        cursor: pointer;
      }
    }

    .inforom_details_time {
      width: 100%;
      height: 28px;
      display: flex;
      justify-content: center;
      align-items: center;

      .time {
        display: inline-block;
        width: 148px;
        height: 20px;
        text-align: center;
        line-height: 20px;
        font-size: 11px;
        border-radius: 20px;
        background: #fff;
      }
    }

    .inforom_details_card {
      position: relative;
      margin: 12px auto 22px;
      width: 85%;
      min-height: 150px;
      border-left: 3px solid #409eff;

      .card-header {
        display: flex;
        align-items: center;
        gap: 10px;

        .event_domain {
          padding: 2px 7px;
          border-radius: 10px;
          background: #ecf5ff;
          color: #409eff;
          font-size: 12px;
        }
      }

      .card-main {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 12px;

        .event_summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin: 0;

          div {
            min-width: 0;
          }

          dt {
            color: #909399;
            font-size: 12px;
          }

          dd {
            margin: 4px 0 0;
            color: #303133;
            font-size: 13px;
            overflow-wrap: anywhere;
          }
        }

        .text {
          font-family: 'PingFang SC';
          font-style: normal;
          font-weight: 400;
          font-size: 16px;
          line-height: 22px;
          letter-spacing: 0.6px;
          color: #999999;
          max-width: 100%;
          margin: 0;
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
