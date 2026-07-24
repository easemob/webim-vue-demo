<script setup>
import { toRefs, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import UserStatus from '@/components/UserStatus';
import { CONVERSATION_TYPE } from '@/IM/constant';
import store from '@/store';
import { useGetUserMapInfo } from '@/hooks';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
const props = defineProps({
  routeQueryData: {
    type: Object,
    default: () => ({
      conversationId: '',
      conversationType: CONVERSATION_TYPE.SINGLE,
    }),
    required: true,
  },
});
const { routeQueryData } = toRefs(props);
const router = useRouter();
//处理获取单人用户昵称等信息。
const { getContactsNickNameById, getGroupNameByGroupId } = useGetUserMapInfo();
const getContactsNickName = computed(() => {
  return getContactsNickNameById(routeQueryData.value.conversationId);
});
const threadTitle = computed(() => {
  if (!routeQueryData.value.isChatThread) return '';
  return routeQueryData.value.threadName || routeQueryData.value.conversationId || '';
});
const threadParentTitle = computed(() => {
  if (!routeQueryData.value.isChatThread) return '';
  return getGroupNameByGroupId(routeQueryData.value.parentConversationId) || '';
});
const backToParentGroup = () => {
  if (!routeQueryData.value.parentConversationId) {
    ElMessage.error('缺少父群组 ID，无法返回群组');
    return;
  }
  router.push({
    path: '/chat/conversation/message',
    query: {
      conversationId: routeQueryData.value.parentConversationId,
      conversationType: CONVERSATION_TYPE.GROUP,
    },
  });
};

//获取群组相关信息
const groupDetail = computed(() => {
  if (routeQueryData.value.isChatThread) return {};
  const groupDetail = store.getters.getJoinedGroupList.filter((item) => {
    if (item.groupId === routeQueryData.value.conversationId) {
      return item;
    }
  });
  return groupDetail[0] ?? {};
});

//获取某用户的在订阅状态
const getPersonUserStatus = computed(() => {
  return (
    store.getters.getContactsUsersPresenceMap.get(routeQueryData.value.conversationId) ?? {}
  );
});
const isSubscribedUserPresence = computed(() => {
  return (userId) => {
    return store.getters.getContactsUsersPresenceMap.has(userId);
  };
});
onMounted(() => {
  const { conversationType, conversationId } = routeQueryData.value;
  if (
    conversationType === CONVERSATION_TYPE.SINGLE &&
    conversationId &&
    !isSubscribedUserPresence.value(conversationId)
  ) {
    store.dispatch('subFriendsPresence', [conversationId]);
  }
});
</script>
<template>
  <el-header class="chat_message_header">
    <template v-if="routeQueryData.conversationType === CONVERSATION_TYPE.SINGLE">
      <div class="chat_user_box">
        <span class="chat_user_name"> {{ getContactsNickName }}</span>
        <UserStatus :userStatus="getPersonUserStatus" />
      </div>
    </template>
    <template v-if="routeQueryData.conversationType === CONVERSATION_TYPE.GROUP">
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
          {{ getGroupNameByGroupId(routeQueryData.conversationId) || '' }}
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
