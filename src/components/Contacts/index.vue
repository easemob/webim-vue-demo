<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import router from '@/router'
import _ from 'lodash'
import dateFormater from '@/utils/dateFormat'
/* 相关组件 */
import SearchInput from '@/components/searchInput'
import FriendItem from './components/friendItem.vue'
import GroupItem from './components/joinedGroupItem.vue'
/* 头像相关 */
import informIcon from '@/assets/images/avatar/inform.png'
/* store */
const store = useStore()
//好友列表
const friendList = computed(() => store.state.Contacts.friendList)
//群组列表
const joinedGroupList = computed(() => store.state.Contacts.groupList)

//搜索部分的总数据
const searchData = computed(() => {
  let totalsearchData = Object.assign(_.cloneDeep(friendList.value), _.cloneDeep(joinedGroupList.value))
  return Object.values(totalsearchData)
})
// console.log('searchDatasearchData', searchData.value)
/* 路由跳转 */
//跳转至inform
const toInformDetails = () => {
  router.push('/chat/contacts/informdetails');
}
//跳转至 contactInfo
const toContacts = ({ id, chatType }) => {
  console.log('>>>>>>触发跳转')
  router.push({ path: '/chat/contacts/contactInfo', query: { id: id, chatType: chatType } })
}

//取网络状态
const networkStatus = computed(() => {
  return store.state.networkStatus
})

//取系统通知数据
const informDetail = computed(() => {
  let informDetailArr = store.state.Conversation.informDetail;
  let lastInformDeatail = informDetailArr[0] || {}
  let untreated = _.sumBy(informDetailArr, 'untreated') || 0;
  return { untreated, lastInformDeatail };
});
</script>


<template>
  <el-container style="height: 100%;">
    <el-aside class="contacts_box">
      <SearchInput :searchType="'contacts'" :searchData="searchData" @toContacts="toContacts" />

      <div class="contacts_collapse">
        <div class="offline_hint" v-if="!networkStatus"><span class="plaint_icon">!</span> 网络不给力，请检查网络设置。</div>
        <el-collapse>
          <el-collapse-item title="系统通知">
            <div class="informDetail_box" @click="toInformDetails">
              <div class="item_body item_left">
                <!-- 通知头像 -->
                <div class="session_other_avatar">
                  <el-avatar :src="informIcon" />
                </div>
              </div>
              <div class="item_body item_main">
                <div class="name">新通知</div>
                <div class="last_msg_body">{{ informDetail.lastInformDeatail.from }}：{{
                    informDetail.lastInformDeatail.desc
                }}
                </div>
              </div>
              <div class="item_body item_right">

                <span class="unReadNum_box" v-if="informDetail.untreated >= 1">
                  <sup class="unReadNum_count"
                    v-text="informDetail.untreated >= 99 ? '99+' : informDetail.untreated"></sup>
                </span>
              </div>
              <span class="time">{{ dateFormater('MM/DD/HH:mm', informDetail.lastInformDeatail.time) }}</span>
            </div>
          </el-collapse-item>
          <el-collapse-item :title="`联系人 ( ${Object.keys(friendList).length} )`">
            <FriendItem @toContacts="toContacts" />
          </el-collapse-item>
          <el-collapse-item :title="`群聊 ( ${Object.keys(joinedGroupList).length} )`">
            <GroupItem @toContacts="toContacts" />
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-aside>
    <el-main class="contacts_infors_main_box">
      <router-view></router-view>
    </el-main>
  </el-container>

</template>

<style lang="scss" scoped>
.contacts_box {
  position: relative;
  width: 25%;
  background: #cfdbf171;

  .contacts_collapse {
    height: calc(100% - 60px);
    overflow: auto;
  }
}

/* 修改el-collapse 的一部分默认样式 */
::v-deep .el-collapse-item__header {
  padding: 0 8px;
}

::v-deep .el-collapse-item__content {
  padding: 0;
}

.informDetail_box {
  position: relative;
  width: 100%;
  height: 80px;
  padding: 0 15px;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;

  .item_main {
    .name {
      font-weight: bold;
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
    width: 40px;

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

  .time {
    position: absolute;
    right: 4px;
    top: 4px;
    color: #a3a3a3;
    font-size: 7px;
  }

}

.contacts_infors_main_box {
  width: 100%;
  height: 100%;
  padding: 0;
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
</style>
