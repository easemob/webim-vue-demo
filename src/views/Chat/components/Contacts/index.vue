<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import router from '@/router'
import _ from 'lodash'
/* 相关组件 */
import SearchInput from '@/components/SearchInput'
import Welcome from '@/components/Welcome'
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
      <el-scrollbar class="contacts_collapse" tag="div" :always="false">
        <div class="offline_hint" v-if="!networkStatus"><span class="plaint_icon">!</span> 网络不给力，请检查网络设置。</div>
        <!-- 系统通知 -->
        <div class="informDetail_box" @click="toInformDetails">
          <div class="item_body item_left">
            <!-- 通知头像 -->
            <div class="session_other_avatar">
              <el-avatar :size="37.54" :src="informIcon" />
            </div>
          </div>
          <div class="item_body item_main">
            <div class="name">新通知</div>
          </div>
        </div>


        <!-- 联系人群组列表 -->
        <el-collapse>
          <el-collapse-item :title="`联系人 ( ${Object.keys(friendList).length} )`">
            <template v-if="Object.keys(friendList).length > 0">
              <FriendItem @toContacts="toContacts" />
            </template>
            <template v-else>
              <el-empty description="暂无联系人..." />
            </template>
          </el-collapse-item>
          <el-collapse-item :title="`群聊 ( ${Object.keys(joinedGroupList).length} )`">
            <template v-if="Object.keys(joinedGroupList).length > 0">
              <GroupItem @toContacts="toContacts" />
            </template>
            <template v-else>
              <el-empty description="暂无加入的群组..." />
            </template>
          </el-collapse-item>
        </el-collapse>
      </el-scrollbar>
    </el-aside>
    <el-main class="contacts_infors_main_box">
      <router-view></router-view>
      <Welcome />
    </el-main>
  </el-container>

</template>

<style lang="scss" scoped>
.contacts_box {
  position: relative;
  background: #cfdbf171;
  min-width: 324px;
  user-select: none;

  .contacts_collapse {
    height: calc(100% - 60px);
    overflow: auto;
  }
}

/* 修改el-collapse 的一部分默认样式 */
::v-deep .el-collapse-item__header {
  padding: 0 8px;
  font-family: 'PingFang SC';
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 24px;
  letter-spacing: 0.342857px;
  color: #333333;
}

::v-deep .el-collapse-item__content {
  padding: 0;
}

.informDetail_title {
  width: 100%;
  line-height: 32px;
  padding: 0 8px;
  background: #FFF;
  mix-blend-mode: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 24px;
  letter-spacing: 0.342857px;
  color: #333333;
  box-sizing: border-box;
}

.informDetail_box {
  position: relative;
  width: 100%;
  height: 66px;
  padding: 0 8px;
  background: #EFEFEF;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;

  &:hover {
    background: #DCDCDC;
  }

  .item_main {
    .name {
      margin-left: 11px;
      font-weight: 500;
      font-size: 14px;
      line-height: 20px;
      color: #333333;
    }
  }
}

.contacts_infors_main_box {
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
