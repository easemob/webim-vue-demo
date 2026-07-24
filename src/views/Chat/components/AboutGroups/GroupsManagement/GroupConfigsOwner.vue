<script setup>
import { computed, ref, toRefs, watch } from 'vue';
import { ElMessage } from 'element-plus';
import store from '@/store';

const GROUP_CONFIG_FIELDS = [
  { key: 'public', label: '公开群' },
  { key: 'joinApprovalRequired', label: '入群需要审批' },
  { key: 'allowInvites', label: '允许普通成员邀请' },
  { key: 'inviteNeedConfirm', label: '邀请入群需要确认' },
];

const props = defineProps({
  groupId: {
    type: String,
    required: true,
    default: '',
  },
});

const { groupId } = toRefs(props);
const updateLoading = ref(false);
const ownerLoading = ref(false);
const newOwner = ref('');
const operationResult = ref(null);
const operationError = ref(null);
const configForm = ref({
  public: 'unset',
  joinApprovalRequired: 'unset',
  allowInvites: 'unset',
  inviteNeedConfirm: 'unset',
  maxMembers: '',
});

const groupDetail = computed(() => {
  return store.getters.getGroupDetailMap.get(groupId.value) || {};
});

const formatValue = (value) => JSON.stringify(value, null, 2);

const buildErrorPayload = (action, error) => ({
  action,
  groupId: groupId.value,
  name: error?.name,
  message: error?.message || String(error),
  statusCode: error?.statusCode,
  code: error?.code,
});

const resetConfigForm = () => {
  const detail = groupDetail.value;
  GROUP_CONFIG_FIELDS.forEach(({ key }) => {
    configForm.value[key] =
      typeof detail[key] === 'boolean' ? String(detail[key]) : 'unset';
  });
  configForm.value.maxMembers =
    typeof detail.maxMembers === 'number' ? String(detail.maxMembers) : '';
};

const buildConfigs = () => {
  const configs = {};
  GROUP_CONFIG_FIELDS.forEach(({ key }) => {
    if (configForm.value[key] !== 'unset') {
      configs[key] = configForm.value[key] === 'true';
    }
  });
  if (configForm.value.maxMembers !== '') {
    configs.maxMembers = Number(configForm.value.maxMembers);
  }
  return configs;
};

const updateGroupConfigs = async () => {
  const configs = buildConfigs();
  if (Object.keys(configs).length === 0) {
    ElMessage.warning('请选择至少一个要提交的群配置字段');
    return;
  }
  if (
    Object.prototype.hasOwnProperty.call(configs, 'maxMembers') &&
    !Number.isFinite(configs.maxMembers)
  ) {
    ElMessage.warning('maxMembers 必须是数字');
    return;
  }
  updateLoading.value = true;
  operationError.value = null;
  try {
    operationResult.value = await store.dispatch('updateGroupConfigs', {
      groupId: groupId.value,
      configs,
    });
    ElMessage.success('群配置更新成功');
  } catch (error) {
    operationError.value = buildErrorPayload('updateConfigs', error);
    ElMessage.error(error?.message || '群配置更新失败');
  } finally {
    updateLoading.value = false;
  }
};

const changeGroupOwner = async () => {
  if (!newOwner.value.trim()) {
    ElMessage.warning('请输入新群主用户 ID');
    return;
  }
  ownerLoading.value = true;
  operationError.value = null;
  try {
    operationResult.value = await store.dispatch('changeGroupOwner', {
      groupId: groupId.value,
      newOwner: newOwner.value.trim(),
    });
    ElMessage.success('群主转让成功');
  } catch (error) {
    operationError.value = buildErrorPayload('changeOwner', error);
    ElMessage.error(error?.message || '群主转让失败');
  } finally {
    ownerLoading.value = false;
  }
};

watch(groupDetail, resetConfigForm, { immediate: true });
</script>

<template>
  <div class="group_configs_owner">
    <div class="section">
      <div class="section_title">群配置</div>
      <div class="section_hint">
        只提交明确选择的 SDK 5.0 `GroupUpdateConfigsInput` 字段。
      </div>
      <div
        v-for="field in GROUP_CONFIG_FIELDS"
        :key="field.key"
        class="form_row"
      >
        <span>{{ field.label }}</span>
        <el-select v-model="configForm[field.key]" size="small">
          <el-option label="不提交" value="unset" />
          <el-option label="true" value="true" />
          <el-option label="false" value="false" />
        </el-select>
      </div>
      <div class="form_row">
        <span>最大成员数 maxMembers</span>
        <el-input
          v-model="configForm.maxMembers"
          size="small"
          placeholder="为空则不提交"
          clearable
        />
      </div>
      <el-button
        type="primary"
        :loading="updateLoading"
        @click="updateGroupConfigs"
      >
        更新群配置
      </el-button>
    </div>

    <div class="section">
      <div class="section_title">转让群主</div>
      <el-input
        v-model="newOwner"
        size="small"
        placeholder="请输入新群主用户 ID"
        clearable
      />
      <el-button
        type="warning"
        :loading="ownerLoading"
        @click="changeGroupOwner"
      >
        转让群主
      </el-button>
    </div>

    <div class="section raw_box">
      <div class="section_title">SDK 真实群详情</div>
      <pre>{{ formatValue(operationResult || groupDetail) }}</pre>
    </div>
    <div class="section raw_box error" v-if="operationError">
      <div class="section_title">SDK 真实错误</div>
      <pre>{{ formatValue(operationError) }}</pre>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.group_configs_owner {
  padding: 0 24px 12px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}

.section_title {
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.section_hint {
  color: #7a7f87;
  font-size: 12px;
}

.form_row {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  color: #333;
  font-size: 13px;
}

.raw_box pre {
  max-height: 200px;
  overflow: auto;
  padding: 10px;
  border-radius: 8px;
  background: #f7f8fa;
  color: #333;
  font-size: 12px;
  line-height: 18px;
  white-space: pre-wrap;
  word-break: break-all;
}

.raw_box.error pre {
  background: #fff3f0;
  color: #d33a2c;
}
</style>
