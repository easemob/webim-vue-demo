<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import _ from 'lodash';
import { useStorage } from '@vueuse/core';
const centerDialogVisible = ref(false);
const webimConfig = useStorage('webimConfig', {
  appKey: '',
  isPrivate: false,
  imServer: '',
  port: '',
  restServer: '',
});
const configRef = ref(null);
const configForm = ref({
  appKey: '',
  isPrivate: false,
  imServer: '',
  port: '',
  restServer: '',
});
const initConfigForm = () => {
  _.merge(configForm.value, webimConfig.value);
};
// appley rules
const appKeyRules = ref([
  { type: 'string', message: 'appkey为string类型' },
  {
    pattern: /^[a-zA-Z0-9-]+#[a-zA-Z0-9-]+$/,
    message: '请输入正确格式appKey',
  },
]);

//save config
const saveImConfig = (configRef) => {
  if (!configRef) return;
  configRef.validate((valid, fields) => {
    if (valid) {
      webimConfig.value = _.cloneDeep(configForm.value);
      resetForm(configRef);

      ElMessage({
        type: 'success',
        message: '配置保存成功~',
      });
      //配置保存成功浏览器重载
      window.location.reload();
    } else {
      ElMessage({
        type: 'error',
        message: '保存失败，请检查后重试~',
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
    <el-form ref="configRef" :model="configForm" label-width="120px">
      <el-form-item prop="appKey" label="AppKey" :rules="appKeyRules">
        <el-input v-model="configForm.appKey" />
      </el-form-item>
      <el-form-item prop="isPrivate" label="私有化配置">
        <el-switch v-model="configForm.isPrivate" />
      </el-form-item>
      <el-form-item v-if="configForm.isPrivate" prop="restServer" label="apiUrl地址" required>
        <el-input v-model="configForm.restServer" />
      </el-form-item>
      <el-form-item v-if="configForm.isPrivate" prop="imServer" label="socketUrl地址" required>
        <el-input v-model="configForm.imServer" />
      </el-form-item>
      <!-- <el-form-item v-if="configForm.isPrivate" prop="port" label="端口号">
        <el-input v-model="configForm.port" placeholder="8080" />
      </el-form-item> -->

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
