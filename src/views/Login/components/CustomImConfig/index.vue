<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import _ from 'lodash';
import { useStorage } from '@vueuse/core';
import {
  IM_ENVIRONMENTS,
  IM_ENV_OPTIONS,
  createImEnvironmentConfig,
  normalizeImEnvironmentConfig,
} from './imEnvPresets';
const centerDialogVisible = ref(false);
const webimConfig = useStorage(
  'webimConfig',
  createImEnvironmentConfig(IM_ENVIRONMENTS.NGI),
);
const configRef = ref(null);
const configForm = ref(createImEnvironmentConfig(IM_ENVIRONMENTS.NGI));
const pendingEnvironment = ref('');
const getConfigFormByEnvironment = (environment) => {
  const targetEnvironment = environment || IM_ENVIRONMENTS.NGI;
  const savedConfig = normalizeImEnvironmentConfig(webimConfig.value);
  if (savedConfig.environment === targetEnvironment) {
    return _.cloneDeep(savedConfig);
  }
  return createImEnvironmentConfig(targetEnvironment);
};
const initConfigForm = () => {
  if (pendingEnvironment.value) {
    configForm.value = getConfigFormByEnvironment(pendingEnvironment.value);
    pendingEnvironment.value = '';
    return;
  }
  configForm.value = normalizeImEnvironmentConfig(webimConfig.value);
};
const openWithEnvironment = (environment) => {
  pendingEnvironment.value = environment;
  centerDialogVisible.value = true;
};
const handleEnvironmentChange = (environment) => {
  configForm.value = getConfigFormByEnvironment(environment);
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
      webimConfig.value = normalizeImEnvironmentConfig(
        _.cloneDeep(configForm.value),
      );
      window.localStorage.setItem(
        'IM_LOGIN_ENVIRONMENT',
        webimConfig.value.environment,
      );
      window.localStorage.setItem('IM_IS_OPEN_CUSTOM_SERVER_CONFIG', 'true');
      window.localStorage.removeItem('EASEIM_loginUser');
      resetForm(configRef);

      ElMessage({
        type: 'success',
        message: '配置保存成功，正在刷新并使用最新配置登录~',
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
defineExpose({ centerDialogVisible, openWithEnvironment });
</script>
<template>
  <el-dialog
    v-model="centerDialogVisible"
    title="服务器配置"
    width="30%"
    center
    modal
    :show-close="false"
    @open="initConfigForm"
  >
    <el-form ref="configRef" :model="configForm" label-width="120px">
      <el-form-item prop="environment" label="环境">
        <el-select
          v-model="configForm.environment"
          placeholder="请选择环境"
          style="width: 100%"
          @change="handleEnvironmentChange"
        >
          <el-option
            v-for="item in IM_ENV_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item prop="appKey" label="AppKey" :rules="appKeyRules">
        <el-input v-model="configForm.appKey" />
      </el-form-item>
      <el-form-item prop="isPrivate" label="私有化配置">
          <el-switch
            v-model="configForm.isPrivate"
            :disabled="
              configForm.environment === IM_ENVIRONMENTS.NGI ||
              configForm.environment === IM_ENVIRONMENTS.VIP6
            "
        />
      </el-form-item>
      <el-form-item
        v-if="configForm.isPrivate"
        prop="restServer"
        label="apiUrl地址"
        required
      >
        <el-input v-model="configForm.restServer" />
      </el-form-item>
      <el-form-item
        v-if="configForm.isPrivate"
        prop="imServer"
        label="socketUrl地址"
        required
      >
        <el-input v-model="configForm.imServer" />
      </el-form-item>
      <el-form-item
        v-if="configForm.isPrivate"
        prop="syncWsUrl"
        label="syncWsUrl"
      >
        <el-input v-model="configForm.syncWsUrl" placeholder="wss://..." />
      </el-form-item>
      <!-- <el-form-item v-if="configForm.isPrivate" prop="port" label="端口号">
        <el-input v-model="configForm.port" placeholder="8080" />
      </el-form-item> -->
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="resetForm(configRef)">取消配置</el-button>
        <el-button type="primary" @click="saveImConfig(configRef)"
          >保存配置</el-button
        >
      </span>
    </template>
  </el-dialog>
</template>
<style lang="scss" scoped></style>
