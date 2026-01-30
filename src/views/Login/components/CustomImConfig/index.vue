<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import _ from 'lodash';
import { useStorage } from '@vueuse/core';

const centerDialogVisible = ref(false);

// 使用 localStorage 存储自定义配置(线上测试专用)
const webimConfig = useStorage('EASEIM_CUSTOM_CONFIG', {
  appKey: '',
  isPrivate: false,
  imServer: '',
  restServer: '',
});

const configRef = ref(null);
const configForm = ref({
  appKey: '',
  isPrivate: false,
  imServer: '',
  restServer: '',
});

const initConfigForm = () => {
  _.merge(configForm.value, webimConfig.value);
};

// appKey 验证规则
const appKeyRules = ref([
  { type: 'string', message: 'appkey为string类型' },
  {
    pattern: /^[a-zA-Z0-9-]+#[a-zA-Z0-9-]+$/,
    message: '请输入正确格式appKey',
  },
]);

// 保存配置
const saveImConfig = (configRef) => {
  if (!configRef) return;
  configRef.validate((valid, fields) => {
    if (valid) {
      webimConfig.value = _.cloneDeep(configForm.value);
      resetForm(configRef);

      ElMessage({
        type: 'success',
        message: '配置保存成功,即将重载页面~',
      });
      
      // 延迟重载,让用户看到提示
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      ElMessage({
        type: 'error',
        message: '保存失败,请检查后重试~',
      });
    }
  });
};

const resetForm = (configRef) => {
  if (!configRef) return;
  configRef.resetFields();
  centerDialogVisible.value = false;
};

defineExpose({ centerDialogVisible });
</script>
<template>
  <el-dialog v-model="centerDialogVisible" title="服务器配置" width="30%" center modal :show-close="false"
    @open="initConfigForm">
    <el-alert
      title="注意:该配置仅用于线上测试,不影响代码源文件"
      type="info"
      :closable="false"
      style="margin-bottom: 15px;"
    />
    <el-form ref="configRef" :model="configForm" label-width="120px">
      <el-form-item prop="appKey" label="AppKey" :rules="appKeyRules">
        <el-input v-model="configForm.appKey" placeholder="例: your-appkey#your-appname" />
      </el-form-item>
      <el-form-item prop="isPrivate" label="私有化配置">
        <el-switch v-model="configForm.isPrivate" />
      </el-form-item>
      <el-form-item v-if="configForm.isPrivate" prop="restServer" label="apiUrl地址" required>
        <el-input v-model="configForm.restServer" placeholder="例: https://your-server.com" />
      </el-form-item>
      <el-form-item v-if="configForm.isPrivate" prop="imServer" label="socketUrl地址" required>
        <el-input v-model="configForm.imServer" placeholder="例: wss://your-server.com/ws" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="resetForm(configRef)">取消配置</el-button>
        <el-button type="primary" @click="saveImConfig(configRef)">保存配置</el-button>
      </span>
    </template>
  </el-dialog>
</template>
<style lang="scss" scoped></style>
