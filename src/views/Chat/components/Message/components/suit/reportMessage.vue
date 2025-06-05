<script setup>
import { ref, reactive, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import { EMClient } from '@/IM';

const ReportTypeOptions = [
  {
    key: '1',
    value: '涉政',
  },
  {
    key: '2',
    value: '涉黄',
  },
  {
    key: '3',
    value: '广告',
  },
  {
    key: '4',
    value: '辱骂',
  },
  {
    key: '5',
    value: '暴恐',
  },
  {
    key: '6',
    value: '违禁',
  },
  {
    key: '7',
    value: '其他',
  },
];
const dialogVisible = ref(false);
const reportMessageForm = reactive({
  mid: '',
  reportType: '涉政',
  reportReason: '',
});
const rules = reactive({
  reportReason: [
    { required: true, message: '请描述举报原因！', trigger: 'blur' },
  ],
});
const alertReportMsgModal = (msgBody) => {
  const msg = Object.assign({}, msgBody);

  if (msg.id) {
    reportMessageForm.mid = msg.id;

    dialogVisible.value = true;
  }
};
const reportMsgForm = ref(null);
const confimReportMessage = (formEl) => {
  if (!formEl) return;
  formEl.validate(async (valid) => {
    if (valid) {
      try {
        const params = {
          reportType: reportMessageForm.reportType, // 举报类型。
          reportReason: reportMessageForm.reportReason, // 举报原因。
          messageId: reportMessageForm.mid.toString(), // 消息 ID
        };

        await EMClient.reportMessage({ ...params });
        cannelReport(formEl);
        ElMessage({
          type: 'success',
          message: '已收到您的举报申请！',
          center: true,
        });
      } catch (error) {
        ElMessage({
          type: 'error',
          message: '举报失败！',
          center: true,
        });
      }
    } else {
      return false;
    }
  });
};

const cannelReport = (formEl) => {
  if (!formEl) return;
  formEl.resetFields();
  dialogVisible.value = false;
};
defineExpose({
  alertReportMsgModal,
});
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="消息举报"
    width="500px"
    :show-close="false"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
  >
    <el-form
      ref="reportMsgForm"
      :model="reportMessageForm"
      :rules="rules"
      label-position="top"
      label-width="100px"
    >
      <el-form-item label="举报类别：">
        <el-select v-model="reportMessageForm.reportType">
          <el-option
            v-for="item in ReportTypeOptions"
            :key="item.key"
            :label="item.value"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="举报原因：" prop="reportReason">
        <el-input
          v-model="reportMessageForm.reportReason"
          maxlength="150"
          placeholder="请描述举报原因..."
          show-word-limit
          type="textarea"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cannelReport(reportMsgForm)">取消</el-button>
        <el-button type="primary" @click="confimReportMessage(reportMsgForm)">
          确认
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.dialog-footer button:first-child {
  margin-right: 10px;
}

:deep(.el-textarea__inner) {
  border-radius: 5px;
  resize: none;
}

:deep(.el-input) {
  height: 40px;
}
</style>
