<script setup>
import { toRefs, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import UserStatus from '@/components/UserStatus';
import { CHAT_TYPE } from '@/constant';
import store from '@/store';
import { useGetUserMapInfo } from '@/hooks';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
const props = defineProps({
  routeQueryData: {
    type: Object,
    default: () => ({
      id: '',
      chatType: CHAT_TYPE.SINGLE,
    }),
    required: true,
  },
});
const { routeQueryData } = toRefs(props);
const router = useRouter();
//处理获取单人用户昵称等信息。
const { getContactsNickNameById, getGroupNameByGroupId } = useGetUserMapInfo();
const getContactsNickName = computed(() => {
  return getContactsNickNameById(routeQueryData.value.id);
});
const threadTitle = computed(() => {
  if (!routeQueryData.value.isChatThread) return '';
  return routeQueryData.value.threadName || routeQueryData.value.id || '';
});
const threadParentTitle = computed(() => {
  if (!routeQueryData.value.isChatThread) return '';
  return getGroupNameByGroupId(routeQueryData.value.groupId) || '';
});
const backToParentGroup = () => {
  if (!routeQueryData.value.groupId) {
    ElMessage.error('缺少父群组 ID，无法返回群组');
    return;
  }
  router.push({
    path: '/chat/conversation/message',
    query: {
      id: routeQueryData.value.groupId,
      chatType: CHAT_TYPE.GROUP,
    },
  });
};

//获取群组相关信息
const groupDetail = computed(() => {
  if (routeQueryData.value.isChatThread) return {};
  const groupDetail = store.getters.getJoinedGroupList.filter((item) => {
    if (item.groupId === routeQueryData.value.id) {
      return item;
    }
  });
  return groupDetail[0] ?? {};
});

//获取某用户的在订阅状态
const getPersonUserStatus = computed(() => {
  return (
    store.getters.getContactsUsersPresenceMap.get(routeQueryData.value.id) ?? {}
  );
});
const isSubscribedUserPresence = computed(() => {
  return (userId) => {
    return store.getters.getContactsUsersPresenceMap.has(userId);
  };
});
onMounted(() => {
  const { chatType, id: conversationId } = routeQueryData.value;
  if (
    chatType !== CHAT_TYPE.GROUP &&
    !isSubscribedUserPresence.value(conversationId)
  ) {
    store.dispatch('subFriendsPresence', [conversationId]);
  }
});
</script>
<template>
  <el-header class="chat_message_header">
    <template v-if="routeQueryData.chatType === CHAT_TYPE.SINGLE">
      <div class="chat_user_box">
        <span class="chat_user_name"> {{ getContactsNickName }}</span>
        <UserStatus :userStatus="getPersonUserStatus" />
      </div>
    </template>
    <template v-if="routeQueryData.chatType === CHAT_TYPE.GROUP">
      <div class="chat_user_box">
        <el-button
          v-if="routeQueryData.isChatThread"
          class="thread_back_button"
          link
          :icon="ArrowLeft"
          @click="backToParentGroup"
        >
          返回群组
        </el-button>
        <span v-if="routeQueryData.isChatThread" class="chat_user_name">
          {{ threadTitle }}
          <small v-if="threadParentTitle"> - {{ threadParentTitle }}</small>
        </span>
        <span v-else class="chat_user_name">
          {{ getGroupNameByGroupId(routeQueryData.id) || '' }}
          {{ `(${groupDetail?.memberCount ?? '-'})` }}
        </span>
      </div>
    </template>
    <slot name="more"></slot>
  </el-header>
</template>

<style lang="scss" scoped>
@import './index.scss';
</style>
