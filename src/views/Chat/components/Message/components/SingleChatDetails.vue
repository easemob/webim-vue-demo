<script setup>
import { computed } from 'vue';
import ConversationDndSwitch from '@/components/ConversationDndSwitch';
import { useGetUserMapInfo } from '@/hooks';
import {
  Bell,
  Delete,
  EditPen,
  List,
  User,
  UserFilled,
} from '@element-plus/icons-vue';

const props = defineProps({
  userId: {
    type: String,
    default: '',
  },
  conversationId: {
    type: String,
    required: true,
  },
  contactUnavailableReason: {
    type: String,
    default: '',
  },
  isInBlackList: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'setRemark',
  'addBlackList',
  'removeBlackList',
  'openBlackList',
  'clearMessages',
  'deleteContact',
  'contactActionUnavailable',
]);

const { getContactsNickNameById, getUserDisplayAvatarById } = useGetUserMapInfo();
const displayName = computed(() => getContactsNickNameById(props.userId));
const avatarUrl = computed(() => getUserDisplayAvatarById(props.userId));
const canUseContactUserActions = computed(() => Boolean(props.userId));
const emitContactAction = (eventName) => {
  if (!canUseContactUserActions.value) {
    emit('contactActionUnavailable', eventName);
    return;
  }
  emit(eventName);
};
const triggerBlocklistAction = (nextValue, source) => {
  if (!canUseContactUserActions.value) {
    emit('contactActionUnavailable', 'blocklist');
    return;
  }
  const eventName = nextValue ? 'addBlackList' : 'removeBlackList';
  console.log('[Blocklist UI] toggle requested', {
    source,
    conversationId: props.conversationId,
    userId: props.userId,
    currentValue: props.isInBlackList,
    requestedValue: nextValue,
    eventName,
  });
  emit(eventName);
};
const onBlocklistRowClick = () =>
  triggerBlocklistAction(!props.isInBlackList, 'row-click');
const onBlocklistSwitchChange = (nextValue) =>
  triggerBlocklistAction(nextValue, 'switch-change');
</script>

<template>
  <div class="single_chat_details">
    <div class="single_chat_profile">
      <el-avatar class="single_chat_avatar" :src="avatarUrl" shape="square">
        {{ displayName || userId || '未知用户' }}
      </el-avatar>
      <div class="single_chat_user_id">
        会话ID: {{ conversationId }}
      </div>
      <div
        class="single_chat_user_id"
        :class="{ unresolved: !userId }"
      >
        用户ID: {{ userId || 'SDK 5.0 未返回' }}
      </div>
      <div
        v-if="!userId && contactUnavailableReason"
        class="single_chat_unavailable_reason"
      >
        {{ contactUnavailableReason }}
      </div>
    </div>

    <div class="single_chat_action_list">
      <div
        class="single_chat_action_item"
        :class="{ disabled: !canUseContactUserActions }"
        @click="emitContactAction('setRemark')"
      >
        <el-icon class="single_chat_action_icon"><User /></el-icon>
        <span class="single_chat_action_label">备注</span>
        <el-icon class="single_chat_action_more"><EditPen /></el-icon>
      </div>
      <div class="single_chat_action_item">
        <el-icon class="single_chat_action_icon"><Bell /></el-icon>
        <ConversationDndSwitch
          class="single_chat_dnd_switch"
          label="消息免打扰"
          :conversation-id="conversationId"
          conversation-type="singleChat"
        />
      </div>
      <div
        class="single_chat_action_item"
        :class="{ disabled: !canUseContactUserActions }"
        @click="onBlocklistRowClick"
      >
        <el-icon class="single_chat_action_icon"><UserFilled /></el-icon>
        <span class="single_chat_action_label">{{
          isInBlackList ? '移出黑名单' : '加入黑名单'
        }}</span>
        <el-switch
          :model-value="isInBlackList"
          :disabled="!canUseContactUserActions"
          @click.stop
          @update:model-value="onBlocklistSwitchChange"
        />
      </div>
      <div class="single_chat_action_item" @click="emit('openBlackList')">
        <el-icon class="single_chat_action_icon"><List /></el-icon>
        <span class="single_chat_action_label">黑名单列表</span>
        <el-icon class="single_chat_action_more"><EditPen /></el-icon>
      </div>
      <div class="single_chat_action_item" @click="emit('clearMessages')">
        <el-icon class="single_chat_action_icon"><Delete /></el-icon>
        <span class="single_chat_action_label">清空聊天记录</span>
      </div>
      <div
        class="single_chat_action_item danger"
        :class="{ disabled: !canUseContactUserActions }"
        @click="emitContactAction('deleteContact')"
      >
        <el-icon class="single_chat_action_icon"><UserFilled /></el-icon>
        <span class="single_chat_action_label">删除联系人</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.single_chat_details {
  height: 100%;
  background: #f7f8fa;
  color: #111;
}

.single_chat_profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 34px 24px 24px;
  background: #fff;
}

.single_chat_avatar {
  width: 116px;
  height: 116px;
  border-radius: 6px;
  font-size: 44px;
  background: #2ea8f7;
}

.single_chat_user_id {
  margin-top: 18px;
  font-size: 14px;
  color: #9aa1aa;
}

.single_chat_user_id + .single_chat_user_id {
  margin-top: 6px;
}

.single_chat_user_id.unresolved {
  color: #f56c6c;
}

.single_chat_unavailable_reason {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 4px;
  background: #fff1f0;
  color: #d93026;
  font-size: 12px;
  line-height: 1.5;
}

.single_chat_action_list {
  background: #fff;
}

.single_chat_action_item {
  display: flex;
  align-items: center;
  min-height: 68px;
  padding: 0 24px;
  cursor: pointer;
  border-bottom: 1px solid #e5e7eb;
}

.single_chat_action_item.disabled {
  cursor: not-allowed;
  color: #b8bec8;
}

.single_chat_action_item.disabled .single_chat_action_icon,
.single_chat_action_item.disabled .single_chat_action_more {
  color: #b8bec8;
}

.single_chat_action_icon {
  width: 34px;
  margin-right: 12px;
  font-size: 22px;
  color: #3f4750;
}

.single_chat_action_label {
  flex: 1;
  font-size: 17px;
  font-weight: 600;
}

.single_chat_action_more {
  font-size: 20px;
  color: #3f4750;
}

.single_chat_dnd_switch {
  flex: 1;
}

.single_chat_dnd_switch :deep(.conversation_dnd_label) {
  font-size: 17px;
  font-weight: 600;
  color: #111;
}

.danger {
  margin-top: 10px;
  color: #ff1744;
}
</style>
