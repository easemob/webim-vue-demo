<template>
  <el-dialog v-model="dialogVisible" title="编辑消息" width="30%">
    <el-input
      class="modifymessage_input"
      v-model="editMessageContent.msg"
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
import { CHAT_TYPE } from '@/IM/constant';
import { ElMessage } from 'element-plus';
import { Check, Close } from '@element-plus/icons-vue';
const store = useStore();
const dialogVisible = ref(false);
const editMessageContent = reactive({
  msg: '',
  to: '',
  id: '',
  chatType: CHAT_TYPE.SINGLE,
});
const loading = ref(false);
const saveEditedMessage = async () => {
  loading.value = true;
  if (!editMessageContent.msg) {
    ElMessage.warning('消息内容不能为空');
  }
  try {
    await store.dispatch('modifyMessage', { ...editMessageContent });
  } catch (error) {
    if (error?.type === 50) {
      ElMessage({
        type: 'error',
        message: '该消息可编辑次数已达上限',
        center: true,
      });
    } else {
      ElMessage({
        type: 'error',
        message: '消息编辑失败请稍后重试',
        center: true,
      });
    }
  } finally {
    initModifyMessage();
    loading.value = false;
    dialogVisible.value = false;
  }
};
const initModifyMessage = (msgBody) => {
  //initModifyMessage 第二个形参传true，置空待编辑消息内容。
  dialogVisible.value = true;
  nextTick(() => {
    if (msgBody) {
      const { id, msg, to, chatType } = msgBody;
      //
      editMessageContent.msg = msg;
      editMessageContent.to = to;
      editMessageContent.id = id;
      editMessageContent.chatType = chatType;
    } else {
      editMessageContent.msg = '';
      editMessageContent.to = '';
      editMessageContent.id = '';
      editMessageContent.chatType = CHAT_TYPE.SINGLE;
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
