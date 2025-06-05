<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { EMClient } from '@/IM';
import { CHAT_TYPE } from '@/IM/constant';
import dateFormater from '@/utils/dateFormater';
import { INFORM_FROM } from '@/constant';
import { ElMessageBox, ElMessage } from 'element-plus';
import { Delete } from '@element-plus/icons-vue';
const store = useStore();
const router = useRouter();

const informList = computed(() => store.state.Conversation.informDetail);

//清除inform的未读
const clearUnread = (inform, index) => {
  if (inform.untreated) {
    store.commit('CLEAR_UNTREATED_STATUS', index);
  }
};
//清空所有通知
const clearAllInform = () => {
  ElMessageBox.confirm('确认清除所有系统通知?', '清除系统通知', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      store.commit('CLEAR_INFORM_LIST');
    })
    .catch(() => {
      return;
    });
};

//处理申请
const handleClickBtn = ({ informData, index, type }) => {
  const loginUserId = EMClient.user;
  const { fromType, from } = informData;
  //好友申请操作相关
  if (fromType === INFORM_FROM.FRIEND) {
    const handleFriendApply = {
      agree: () => {
        EMClient.acceptContactInvite(from);
        store.commit('UPDATE_INFORM_BTNSTATUS', { index, btnStatus: 1 });
      },
      refuse: () => {
        EMClient.declineContactInvite(from);
        //拒绝并更改当前通知卡片按钮状态
        store.commit('UPDATE_INFORM_BTNSTATUS', { index, btnStatus: 2 });
      },
    };
    handleFriendApply[type]();
  }

  //邀请群组操作相关
  if (
    fromType === INFORM_FROM.GROUP &&
    informData.operation === 'inviteToJoin'
  ) {
    const handleGroupInvite = {
      agree: async () => {
        try {
          await EMClient.acceptGroupInvite({
            invitee: loginUserId,
            groupId: informData.groupId,
          });
          store.commit('UPDATE_INFORM_BTNSTATUS', {
            index,
            btnStatus: 1,
          });
          await store.dispatch('fetchJoinedGroupListFromServer', {
            startPageNum: 0,
          });
          //同意之后跳转至对应的群组详情
          router.push({
            path: '/chat/contacts/contactInfos',
            query: {
              id: informData.groupId,
              chatType: CHAT_TYPE.GROUP,
            },
          });
        } catch (error) {
          ElMessage({
            type: 'error',
            center: true,
            message: '加入失败请稍后重试！',
          });
          return;
        }
      },
      refuse: async () => {
        await EMClient.rejectGroupInvite({
          invitee: loginUserId,
          groupId: informData.groupId,
        });
        store.commit('UPDATE_INFORM_BTNSTATUS', { index, btnStatus: 2 });
      },
    };
    handleGroupInvite[type]();
  }
  //其他用户申请加入群组操作
  if (
    fromType === INFORM_FROM.GROUP &&
    informData.operation === 'requestToJoin'
  ) {
    const handleGroupInvite = {
      agree: async () => {
        try {
          EMClient.acceptGroupJoinRequest({
            applicant: from,
            groupId: informData.groupId,
          });
          store.commit('UPDATE_INFORM_BTNSTATUS', {
            index,
            btnStatus: 1,
          });
        } catch (error) {
          ElMessage({
            type: 'error',
            center: true,
            message: '同意失败请稍后重试！',
          });
          return;
        }
      },
      refuse: async () => {
        EMClient.rejectGroupJoinRequest({
          applicant: from,
          groupId: informData.groupId,
          reason: '不好意思，不同意你的入群申请！',
        });
        store.commit('UPDATE_INFORM_BTNSTATUS', { index, btnStatus: 2 });
      },
    };
    handleGroupInvite[type]();
  }
};
</script>
<template>
  <el-container class="app_container" v-if="informList.length > 0">
    <div class="inforom_details_box">
      <div class="inforom_details_box_header">
        <div v-if="informList.length > 0" class="clear_inforom">
          <!-- <el-popconfirm title="清空当前所有通知?" @confirm="clearAllInform">
            <template #reference>
             
            </template>
          </el-popconfirm> -->
          <el-icon @click="clearAllInform">
            <Delete />
          </el-icon>
        </div>
      </div>
      <el-scrollbar tag="div">
        <div v-for="(item, index) in informList" :key="item.time">
          <div class="inforom_details_time">
            <span class="time">
              {{ dateFormater('MM-DD HH:mm', item.time) }}</span
            >
          </div>
          <el-card
            class="inforom_details_card"
            @click="clearUnread(item, index)"
            shadow="never"
          >
            <template #header>
              <div class="card-header">
                <span
                  >{{ item.title }}
                  {{
                    (item.fromType === INFORM_FROM.GROUP &&
                      `(${item.groupId})`) ||
                    ''
                  }}</span
                >
              </div>
            </template>
            <span v-if="item.untreated" class="badge"></span>
            <div class="card-main">
              <div class="text item">{{ item.from }}：{{ item.desc }}</div>
              <el-dropdown
                v-if="item.isOpearationBtn && item.operationStatus < 1"
                trigger="click"
                split-button
                type="primary"
                @command="handleClickBtn"
              >
                是否同意
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      :command="{
                        informData: item,
                        index,
                        type: 'agree',
                      }"
                      >同意</el-dropdown-item
                    >
                    <el-dropdown-item
                      :command="{
                        informData: item,
                        index,
                        type: 'refuse',
                      }"
                      >拒绝</el-dropdown-item
                    >
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <div v-if="item.operationStatus">
                <span>{{
                  item.operationStatus === 1
                    ? '已同意'
                    : item.operationStatus === 2
                    ? '已拒绝'
                    : ''
                }}</span>
              </div>
            </div>
          </el-card>
        </div>
      </el-scrollbar>
    </div>
  </el-container>
  <el-empty style="height: 100%" v-else description="暂无新的系统通知" />
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
        // box-shadow: var(--el-box-shadow-light);
      }
    }

    .inforom_details_card {
      position: relative;
      margin: 35px auto;
      width: 85%;
      min-height: 150px;
      // height: 150px;
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
          white-space: wrap;
        }
      }
    }

    :deep(.inforom_details_card) {
      overflow: auto;
    }
  }
}
</style>
