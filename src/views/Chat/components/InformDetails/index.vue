<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import EaseIM from '@/IM/initwebsdk';
import dateFormater from '@/utils/dateFormater';
import { informType } from '@/constant';
import { Delete } from '@element-plus/icons-vue';
const store = useStore()
const { INFORM_FROM } = informType
const informList = computed(() => store.state.Conversation.informDetail)

//清除inform的未读
const clearUnread = (inform, index) => {
  if (inform.untreated) {
    store.commit('CLEAR_UNTREATED_STATUS', index)
  }
}
//清空所有通知
const clearAllInform = () => store.commit('CLEAR_INFORM_LIST')

//处理申请
const handleClickBtn = ({ informData, index, type }) => {
  console.log('handleClick', informData)
  const loginUserId = EaseIM.conn.user;
  const { fromType, from } = informData;
  //好友申请操作相关
  if (fromType === INFORM_FROM.FRIEND) {
    let handleFriendApply = {
      'agree': () => {
        console.log('agree')
        EaseIM.conn.acceptContactInvite(from)
      },
      'refuse': () => {
        EaseIM.conn.declineContactInvite(from)
        //拒绝并更改当前通知卡片按钮状态
        store.commit('UPDATE_INFORM_BTNSTATUS', { index, status: 2 })

      }
    }
    handleFriendApply[type]()
  }
  console.log('informData', informData.operation)
  //邀请群组操作相关
  if (fromType === INFORM_FROM.GROUP && informData.operation === 'inviteToJoin') {
    const handleGroupInvite = {
      agree: async () => {
        await EaseIM.conn.acceptGroupInvite({ invitee: loginUserId, groupId: informData.groupId })
        store.commit('UPDATE_INFORM_BTNSTATUS', { index, btnStatus: 1 })
        store.dispatch('fetchGroupList', {
          pageNum: 1,
          pageSize: 500
        })
      },
      refuse: async () => {
        await EaseIM.conn.rejectGroupInvite({ invitee: loginUserId, groupId: informData.groupId })
        store.commit('UPDATE_INFORM_BTNSTATUS', { index, btnStatus: 2 })
      },
    }
    handleGroupInvite[type]()
  }

}

</script>
<template>
  <el-container class="app_container">
    <div class="inforom_details_box">
      <div class="inforom_details_box_header">
        <div class="clear_inforom">
          <el-popconfirm title="清空当前所有通知?" @confirm="clearAllInform">
            <template #reference>
              <el-icon>
                <Delete />
              </el-icon>
            </template>
          </el-popconfirm>
        </div>

      </div>
      <el-scrollbar tag="div">
        <div v-for="(item, index) in informList" :key="item.time">
          <div class="inforom_details_time"><span class="time"> {{ dateFormater('MM-DD HH:mm', item.time) }}</span>
          </div>
          <el-card class="inforom_details_card" @click="clearUnread(item, index)" shadow="never">
            <template #header>
              <div class="card-header">
                <span>{{ item.title }} {{ item.fromType === INFORM_FROM.GROUP &&
                    `(${item.groupId})` || ''
                }}</span>
              </div>
            </template>
            <span v-if="item.untreated" class="badge"></span>
            <div class="card-main">
              <div class="text item">{{ item.from }}：{{ item.desc }} </div>
              <el-dropdown v-if="item.isOpearationBtn && item.operationStatus < 1" trigger="click" split-button
                type="primary" @command="handleClickBtn">
                同意
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ informData: item, index, type: 'agree' }">同意</el-dropdown-item>
                    <el-dropdown-item :command="{ informData: item, index, type: 'refuse' }">拒绝</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <div v-if="item.operationStatus">
                <span>{{ item.operationStatus === 1 ? '已同意' : item.operationStatus === 2 ? '已拒绝' : '' }}</span>
              </div>
            </div>

          </el-card>
        </div>
      </el-scrollbar>

    </div>

  </el-container>
</template>

<style lang="scss" scoped>
.app_container {
  width: 100%;
  height: 100%;
  background: #F9F9F9;
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
        background: #FFF;
        box-shadow: var(--el-box-shadow-light);
      }
    }

    .inforom_details_card {
      position: relative;
      margin: 35px auto;
      width: 85%;
      height: 150px;
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
      }
    }

    ::v-deep .inforom_details_card {
      overflow: auto
    }
  }
}
</style>
