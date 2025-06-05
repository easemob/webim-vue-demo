<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import router from '@/router';
import _ from 'lodash';
/* 相关组件 */
import SearchInput from '@/components/SearchInput';
import Welcome from '@/components/Welcome';
import FriendItem from './components/ContactsItem.vue';
import JoinedGroupItem from './components/JoinedGroupsItem.vue';
/* 头像相关 */
import informIcon from '@/assets/images/avatar/inform.png';
/* store */
const store = useStore();
//好友列表
const getContactsWithRemarkMap = computed(
  () => store.getters.getContactsWithRemarkMap,
);
//联系人列表数
const contactsSize = computed(
  () => store.getters.getContactsWithRemarkMap.size,
);
//群组列表
const joinedGroupList = computed(() => store.getters.getJoinedGroupList);
//加入的群组总数
const joinedGroupTotal = computed(() => store.getters.getJoinedGroupTotal);
//搜索部分的总数据(合并好友数据以及群组列表数据为输入框搜索数据源)
const searchInputSrourceData = computed(() => {
  return [...getContactsWithRemarkMap.value.values(), ...joinedGroupList.value];
});
//
/* 路由跳转 */
//跳转至inform
const toInformDetails = () => {
  router.push('/chat/contacts/informdetails');
};
//跳转至 contactInfo
const toContacts = ({ id, chatType }) => {
  router.push({
    path: '/chat/contacts/contactInfos',
    query: { id: id, chatType: chatType },
  });
};

//取网络状态
const networkStatus = computed(() => {
  return store.state.networkStatus;
});

//取系统通知数据
const informDetail = computed(() => {
  const informDetailArr = store.state.Conversation.informDetail;
  const lastInformDeatail = informDetailArr[0] || {};
  const untreated = _.sumBy(informDetailArr, 'untreated') || 0;
  return { untreated, lastInformDeatail };
});

/* 联系人折叠面板相关逻辑 */
const CONTACTS_TYPE = {
  FRIEND: '1',
  GROUP: '2',
};
const activeName = ref(CONTACTS_TYPE.FRIEND);
//处理滚动加载更多
const loadingStatus = ref(false);
const loadMore = async () => {
  if (activeName.value === CONTACTS_TYPE.GROUP) {
    loadingStatus.value = true;
    try {
      store.dispatch('fetchJoinedGroupListFromServer');
    } catch (error) {
      console.log('>>>>>>>接口获取失败', error);
    } finally {
      loadingStatus.value = false;
    }
  }
};
const scrollbarComp = ref(null);
const onScrollToBottom = (event) => {
  const { scrollTop } = event;
  // 获取滚动条的容器元素
  const scrollWrap = scrollbarComp.value?.wrapRef;
  // 检查滚动位置是否接近底部
  const isNearBottom =
    scrollWrap?.scrollHeight - scrollTop <= scrollWrap?.clientHeight + 1;
  if (isNearBottom) {
    if (loadingStatus.value) return;
    loadMore();
  }
};
</script>

<template>
  <el-container style="height: 100%">
    <el-aside class="contacts_box">
      <SearchInput
        :searchType="'contacts'"
        :searchData="searchInputSrourceData"
        @toContacts="toContacts"
      />
      <el-scrollbar
        ref="scrollbarComp"
        class="contacts_collapse"
        tag="div"
        :always="false"
        @scroll="onScrollToBottom"
      >
        <div class="offline_hint" v-if="!networkStatus">
          <span class="plaint_icon">!</span>
          网络不给力，请检查网络设置。
        </div>
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

        <!-- 联系人列表 -->
        <el-collapse v-model="activeName" accordion>
          <!-- 群组 -->
          <el-collapse-item
            :title="`群聊 ( ${joinedGroupTotal} )`"
            :name="CONTACTS_TYPE.GROUP"
          >
            <template v-if="joinedGroupList?.length > 0">
              <JoinedGroupItem @toContacts="toContacts" />
            </template>
            <template v-else>
              <el-empty description="暂无加入的群组..." />
            </template>
          </el-collapse-item>
          <!-- 好友 -->
          <el-collapse-item
            :title="`联系人 ( ${contactsSize} )`"
            :name="CONTACTS_TYPE.FRIEND"
          >
            <template v-if="contactsSize > 0">
              <FriendItem @toContacts="toContacts" />
            </template>
            <template v-else>
              <el-empty description="暂无联系人..." />
            </template>
          </el-collapse-item>
        </el-collapse>
      </el-scrollbar>
    </el-aside>
    <el-main ref class="contacts_infors_main_box">
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

.informDetail_title {
  width: 100%;
  line-height: 32px;
  padding: 0 8px;
  background: #fff;
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
  background: #efefef;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;

  &:hover {
    background: #dcdcdc;
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
./components/JoinedGroupsItem.vue./components/ContactsItem.vue
