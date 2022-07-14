<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import router from '@/router';
/* 相关组件 */
import SearchInput from '@/components/searchInput'
import InformDetails from '@/components/InformDetails'
import FriendItem from './components/friendItem.vue'
import GroupItem from './components/joinedGroupItem.vue'

/* store */
const store = useStore()
//好友列表
const friendList = computed(() => store.state.Contacts.friendList)
//群组列表
const joinedGroupList = computed(() => store.state.Contacts.groupList)

/* 路由跳转 */
//跳转至inform
const toInformDetails = () => {
  router.push('/chat/conversation/informdetails');
}
//跳转至 contactInfo
const toContacts = ({ id, chatType }) => {
  console.log('>>>>>>触发跳转')
  router.push({ path: '/chat/contacts/contactInfo', query: { id: id, chatType: chatType } })
}
</script>


<template>
  <el-container style="height: 100%;">
    <el-aside class="contacts_box">
      <SearchInput :searchType="'conversation'" :searchData="[]" />
      <div class="contacts_collapse">
        <el-collapse>
          <el-collapse-item title="系统通知">
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

.contacts_infors_main_box {
  width: 100%;
  height: 100%;
  padding: 0;
}
</style>
