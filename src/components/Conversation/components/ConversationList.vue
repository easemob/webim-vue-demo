<script setup>
import { ref, computed, defineEmits } from 'vue';
import { useStore } from 'vuex';
import router from '@/router';
import EaseIM from '@/IM/initwebsdk'
import dateFormater from '@/utils/dateFormat'
import { messageType } from '@/constant'
/* 头像相关 */
import informIcon from '@/assets/images/avatar/inform.png'
/* store */
const store = useStore();
const { CHAT_TYPE } = messageType
//取系统通知数据
const informDetail = computed(() => {
  let informDetailArr = store.state.Conversation.informDetail;
  let lastInformDeatail = informDetailArr[0] || {}
  let untreated = _.sumBy(informDetailArr, 'untreated') || 0;
  return { untreated, lastInformDeatail };
});
// console.log('>>>>>informDetail', informDetail.lastInformDeatail)
//取好友列表(主要使用好友下的用户属性相关)
const friendList = computed(() => store.state.Contacts.friendList
)

//取群组列表（展示群组名称）
const joinedGroupList = computed(() => store.state.Contacts.groupList)
console.log('conversationList joinedGroupList ', joinedGroupList.value);

//取会话数据
const conversationList = computed(() => {
  return store.state.Conversation.conversationListData;
});

//处理会话name 
const handleConversationName = computed(() => {
  return (item) => {
    if (item.conversationType === CHAT_TYPE.SINGLE) {
      return friendList.value[item.conversationKey] && friendList.value[item.conversationKey].nickname || item.conversationInfo.name
    }
    if (item.conversationType === CHAT_TYPE.GROUP) {
      if (joinedGroupList.value[item.conversationKey] && joinedGroupList.value[item.conversationKey].groupDetail) {
        return joinedGroupList.value[item.conversationKey].groupDetail.name
      } else if (joinedGroupList.value[item.conversationKey] && joinedGroupList.value[item.conversationKey].groupname) {
        return joinedGroupList.value[item.conversationKey].groupname
      } else {
        return item.conversationKey
      }

    }
  }
})
//取网络状态
const networkStatus = computed(() => {
  return store.state.networkStatus
})

const emit = defineEmits(['toInformDetails', 'toChatMessage'])
//普通会话
let checkedConverItemIndex = ref(null);
const toChatMessage = (item, itemKey, index) => {
  checkedConverItemIndex.value = index;
  if (item && item.unreadMessageNum > 0) store.commit('CLEAR_UNREAD_NUM', itemKey)
  //跳转至对应的消息界面
  emit('toChatMessage', itemKey, item.conversationType)
};
//删除某条会话
const deleteConversation = (itemKey) => {
  console.log('选中的会话key', itemKey)
  store.commit('DELETE_ONE_CONVERSATION', itemKey)
}
//加载到底拉取新数据
// const load = () => {
//   console.log('>>>>>加载到底');
// };

</script>
<template>
  <ul class="session_list" style="overflow: auto" @click="getItem">
    <li class="offline_hint" v-if="!networkStatus"><span class="plaint_icon">!</span> 网络不给力，请检查网络设置。</li>
    <!-- 系统通知会话 -->
    <li v-if="JSON.stringify(informDetail.lastInformDeatail) !== '{}'" class="session_list_item"
      @click="$emit('toInformDetails')">
      <div class="item_body item_left">
        <!-- 通知头像 -->
        <div class="session_other_avatar">
          <el-avatar :src="informIcon" />
        </div>
      </div>
      <div class="item_body item_main">
        <div class="name">系统通知</div>
        <div class="last_msg_body">{{ informDetail.lastInformDeatail.from }}：{{ informDetail.lastInformDeatail.desc }}
        </div>
      </div>
      <div class="item_body item_right">
        <span class="time">{{ dateFormater('MM/DD/HH:mm', informDetail.lastInformDeatail.time) }}</span>
        <span class="unReadNum_box" v-if="informDetail.untreated >= 1">
          <sup class="unReadNum_count" v-text="informDetail.untreated >= 99 ? '99+' : informDetail.untreated"></sup>
        </span>
      </div>
    </li>

    <!-- 普通会话 -->
    <li v-if="conversationList" v-for="( item, itemKey, index) in conversationList" :key="itemKey"
      @click="toChatMessage(item, itemKey, index)"
      :style="{ background: (checkedConverItemIndex === index ? '#E5E5E5' : '') }">
      <el-popover popper-class="conversation_popover" placement="right-end" trigger="contextmenu" :show-arrow="false"
        :offset="-10">
        <template #reference>
          <div class="session_list_item">
            <div class="item_body item_left">
              <div class="session_other_avatar">

                <el-avatar
                  :src="friendList[item.conversationKey] && friendList[item.conversationKey].avatarurl ? friendList[item.conversationKey].avatarurl : item.conversationInfo.avatarUrl">
                </el-avatar>
              </div>
            </div>
            <div class="item_body item_main">
              <div class="name">{{ handleConversationName(item) }}</div>
              <div class="last_msg_body">{{ item.fromInfo.fromId }}：{{ item.latestMessage.msg }}
              </div>
            </div>
            <div class="item_body item_right">
              <span class="time">{{ dateFormater('MM/DD/HH:mm', item.latestSendTime) }}</span>
              <span class="unReadNum_box" v-if="item.unreadMessageNum >= 1">
                <sup class="unReadNum_count" v-text="item.unreadMessageNum >= 99 ? '99+' : item.unreadMessageNum"></sup>
              </span>
            </div>
          </div>

        </template>
        <template #default>
          <div class="session_list_delete" @click="deleteConversation(itemKey)">删除会话</div>
        </template>
      </el-popover>
    </li>
    <el-empty v-else description="暂无会话..." />
  </ul>
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
  color: #F35F81;
  background: #FCE7E8;
  font-size: 7px;

  .plaint_icon {
    display: inline-block;
    width: 15px;
    height: 15px;
    color: #E5E5E5;
    text-align: center;
    line-height: 15px;
    font-size: 7px;
    font-weight: bold;
    background: #E6686E;
    border-radius: 50%;
  }
}

.session_list .session_list_item {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 66px;
  background: #f0f0f0;
  color: var(--el-color-primary);
  cursor: pointer;

  &:hover {
    background: #E5E5E5;
  }

  .item_body {
    display: flex;
    height: 100%;
  }

  .item_left {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    width: 25%;
    padding: 0;
  }

  .item_main {
    width: 50%;
    height: 40px;
    flex-direction: column;
    justify-content: space-around;
    align-items: flex-start;

    .name {
      min-width: 56px;
      max-height: 20px;
      font-size: 14px;
      font-weight: bold;
      color: #000;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .last_msg_body {
      margin-top: 5px;
      max-width: 185px;
      height: 17px;
      color: #a3a3a3;
      font-size: 12px;
      font-weight: 300;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .item_right {
    width: 25%;
    height: 45px;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-around;
    margin-right: 10px;

    .time {
      font-size: 10px;
      color: #a3a3a3;
      font-weight: 400;
    }

    .unReadNum_box {
      vertical-align: middle;

      .unReadNum_count {
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
      }
    }
  }
}

.session_list_item_active {
  background: #d2d2d2;
}

.session_list .session_list_item+.list_item {
  margin-top: 10px;
}

.session_list_delete {
  cursor: pointer;
  transition: all .5s;

  &:hover {
    background: #E1E1E1;
  }
}
</style>
