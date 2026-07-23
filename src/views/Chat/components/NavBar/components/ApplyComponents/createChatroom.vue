<script setup>
import { reactive, toRefs, watch } from 'vue';
import { ElMessage, ElNotification } from 'element-plus';
import { handleSDKErrorNotifi } from '@/utils/handleSomeData';
import { CHAT_TYPE } from '@/IM/constant';
import router from '@/router';
import eventEmitter from '@/utils/eventEmitter';

const emit = defineEmits(['closeDialogVisible']);
const props = defineProps({
  dialogVisible: {
    type: Boolean,
    default: false,
  },
});
const { dialogVisible } = toRefs(props);

const sourceForm = () => ({
  name: '',
  description: '',
  maxusers: 200,
  members: '',
});

const chatroomCreateForm = reactive(sourceForm());

watch(dialogVisible, (newVal) => {
  if (!newVal) {
    Object.assign(chatroomCreateForm, sourceForm());
  }
});

const resolveChatroomId = (data) => {
  if (!data || typeof data !== 'object') return '';
  return data.id || data.chatroomid || data.chatRoomId || data.roomId || '';
};

const isPermissionError = (error) => {
  const text = [error?.message, error?.data, error?.error, error?.reason]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    text.includes('no permission') ||
    text.includes('permission') ||
    text.includes('group_authorization') ||
    text.includes('forbidden')
  );
};

const createChatroom = async () => {
  if (!chatroomCreateForm.name.trim()) {
    ElNotification.error('请设置聊天室名称！');
    return;
  }

  const members = String(chatroomCreateForm.members || '')
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  try {
    throw new Error(
      'SDK 5.0 current package does not expose createChatRoom; no fallback is configured.',
    );

    ElNotification({
      title: '聊天室操作',
      message: `${chatroomCreateForm.name} 创建成功！`,
      type: 'success',
    });

    eventEmitter.emit('chatroomMembershipChanged');
    emit('closeDialogVisible');

    if (roomId) {
      router.push({
        path: '/chat/chatroom/message',
        query: {
          id: roomId,
          chatType: CHAT_TYPE.CHATROOM,
        },
      });
    } else {
      router.push('/chat/chatroom');
    }
  } catch (error) {
    if (isPermissionError(error)) {
      ElMessage.error(
        '当前账号没有创建聊天室权限，仅应用超级管理员可创建聊天室',
      );
      return;
    }

    if (error && error.type && error.message) {
      let errorDesc = null;
      try {
        errorDesc = JSON.parse(error.message);
      } catch (parseError) {
        errorDesc = { error_description: error.message };
      }
      handleSDKErrorNotifi(error.type, errorDesc?.error_description);
    } else {
      handleSDKErrorNotifi(null, '创建聊天室失败');
    }
  }
};
</script>

<template>
  <div class="create_chatroom__main">
    <div class="create_chatroom_row">
      <div class="create_chatroom_label">聊天室名称</div>
      <div class="create_chatroom_field">
        <el-input
          class="create_chatroom"
          v-model="chatroomCreateForm.name"
          size="large"
          maxlength="128"
          placeholder="请输入聊天室名称"
        />
      </div>
    </div>
    <div class="create_chatroom_row">
      <div class="create_chatroom_label">聊天室描述</div>
      <div class="create_chatroom_field">
        <el-input
          class="create_chatroom"
          v-model="chatroomCreateForm.description"
          maxlength="300"
          placeholder="请输入聊天室描述"
          show-word-limit
          type="textarea"
          :rows="4"
        />
      </div>
    </div>
    <div class="create_chatroom_row">
      <div class="create_chatroom_label">人数上限</div>
      <div class="create_chatroom_field">
        <el-input
          class="create_chatroom"
          v-model="chatroomCreateForm.maxusers"
          type="number"
          min="1"
          max="5000"
          size="large"
        />
      </div>
    </div>
    <div class="create_chatroom_row">
      <div class="create_chatroom_label">初始成员</div>
      <div class="create_chatroom_field">
        <el-input
          class="create_chatroom"
          v-model="chatroomCreateForm.members"
          maxlength="1000"
          placeholder="可选，输入用户 ID，多个用英文逗号或换行分隔"
          show-word-limit
          type="textarea"
          :rows="3"
        />
      </div>
    </div>
    <p class="create_chatroom_tip">
      仅应用超级管理员可创建聊天室；创建成功后将自动进入聊天室页面。
    </p>
    <div class="create_chatroom_btn">
      <el-button type="primary" @click="createChatroom">创建聊天室</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.create_chatroom__main {
  width: 100%;
  padding: 0 24px;
  box-sizing: border-box;
  overflow: hidden;
}

.create_chatroom_btn {
  display: flex;
  justify-content: flex-end;
}

.create_chatroom_row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 22px;
  gap: 16px;
}

.create_chatroom_tip {
  margin: 6px 0 20px;
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
}

.create_chatroom_label {
  flex: 0 0 110px;
  color: #606266;
  font-size: 14px;
  line-height: 40px;
}

.create_chatroom_field {
  flex: 1;
  width: 0;
  min-width: 0;
}

:deep(.create_chatroom) {
  width: 100%;
}

:deep(.create_chatroom .el-input__wrapper),
:deep(.create_chatroom .el-textarea__inner) {
  border-radius: 5px;
  box-sizing: border-box;
}

:deep(.create_chatroom .el-input__wrapper) {
  height: 40px;
}
</style>
