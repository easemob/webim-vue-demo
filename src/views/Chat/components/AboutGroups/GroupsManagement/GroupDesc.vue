<script setup>
import { ref, toRefs, onMounted, computed, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import store from '@/store';
const props = defineProps({
  memberRole: {
    type: Boolean,
    required: true,
    default: false,
  },
  groupId: {
    type: String,
    required: true,
    default: '',
  },
});
const { memberRole, groupId } = toRefs(props);
const getGroupDetailFromGroupList = computed(() => {
  return store.getters.getGroupDetailMap.get(groupId.value) || {};
});
const introduceRef = ref(null);
const isEdit = ref(false);
const groupDescValue = ref('');
const editGroupsDesc = async (type, oldGroupDesc) => {
  if (type === 'edit') {
    isEdit.value = true;
    nextTick(() => {
      introduceRef.value.focus();
    });
    groupDescValue.value = oldGroupDesc;
  }
  if (type === 'save') {
    if (groupDescValue.value === oldGroupDesc) return (isEdit.value = false);
    const params = {
      groupId: groupId.value,
      description: groupDescValue.value,
    };
    try {
      await store.dispatch('modifyGroupInfo', params);
      ElMessage({
        message: '群组详情修改成功~',
        type: 'success',
        center: true,
      });
      isEdit.value = false;
    } catch (error) {
      ElMessage({
        message: error.message,
        type: 'error',
        center: true,
      });
      isEdit.value = false;
    }
  }
};
onMounted(() => {
  nextTick(() => {
    editGroupsDesc('edit', getGroupDetailFromGroupList.value.description);
  });
});
</script>
<template>
  <div class="app_container">
    <p
      class="group_desc"
      v-if="!isEdit"
      @click="editGroupsDesc('edit', getGroupDetailFromGroupList.description)"
    >
      {{ getGroupDetailFromGroupList.description || '暂无群描述' }}
    </p>
    <el-input
      v-if="isEdit"
      v-model="groupDescValue"
      ref="introduceRef"
      maxlength="512"
      show-word-limit
      :autosize="{ minRows: 2, maxRows: 4 }"
      type="textarea"
      class="notice_detail"
      placeholder="请输入群组详情~"
      resize="none"
      @blur="editGroupsDesc('save', getGroupDetailFromGroupList.description)"
    />
  </div>
</template>
<style lang="scss" scoped>
.notice_detail {
  font-family: 'PingFang SC';
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 20px;
  color: #606266;
  width: 440px;
}

.group_desc {
  cursor: pointer;
}

:deep(.el-textarea__inner) {
  border-radius: 5px;
}
</style>
