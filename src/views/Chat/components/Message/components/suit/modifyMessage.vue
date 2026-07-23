<template>
  <el-dialog v-model="dialogVisible" title="编辑消息" width="30%">
    <el-input
      class="modifymessage_input"
      v-model="editMessageContent.content"
      :autosize="{ minRows: 2, maxRows: 4 }"
      type="textarea"
    />
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false" :icon="Close">取消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="saveEditedMessage"
          :icon="Check"
        >
          {{ loading ? '更新中' : '保存' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue';
import { useStore } from 'vuex';
import { CONVERSATION_TYPE } from '@/IM/constant';
import { ElMessage } from 'element-plus';
import { Check, Close } from '@element-plus/icons-vue';
const store = useStore();
const dialogVisible = ref(false);
const editMessageContent = reactive({
  content: '',
  messageId: '',
  conversationId: '',
  conversationType: CONVERSATION_TYPE.SINGLE,
  isChatThread: false,
  parentConversationId: '',
});
const loading = ref(false);
const saveEditedMessage = async () => {
  loading.value = true;
  try {
    await store.dispatch('modifyMessage', { ...editMessageContent });
  } catch (error) {
    console.error('[Message Modify] modifyMessage failed', error);
    ElMessage({
      type: 'error',
      message: error?.message || JSON.stringify(error),
      center: true,
    });
  } finally {
    loading.value = false;
    dialogVisible.value = false;
  }
};
const initModifyMessage = (message) => {
  dialogVisible.value = true;
  nextTick(() => {
    if (message) {
      editMessageContent.content = message.body.content;
      editMessageContent.messageId =
        message.msgServerId || message.msgLocalId;
      editMessageContent.conversationId = message.conversationId;
      editMessageContent.conversationType = message.conversationType;
      editMessageContent.isChatThread = message.isChatThread === true;
      editMessageContent.parentConversationId = message.parentConversationId || '';
    } else {
      editMessageContent.content = '';
      editMessageContent.messageId = '';
      editMessageContent.conversationId = '';
      editMessageContent.conversationType = CONVERSATION_TYPE.SINGLE;
      editMessageContent.isChatThread = false;
      editMessageContent.parentConversationId = '';
    }
  });
};

defineExpose({
  initModifyMessage,
});
</script>

<style lang="scss" scoped>
.modify_input_container {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 15px;
}
.modify_input_btn_container {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  margin-top: 5px;
}
.modify_input_btn {
  width: 15px;
  height: 15px;
  cursor: pointer;
}
.modify_input_btn:hover {
  transform: scale(1.2);
}
:deep(.el-textarea__inner) {
  border-radius: 5px;
  resize: none;
}
</style>
