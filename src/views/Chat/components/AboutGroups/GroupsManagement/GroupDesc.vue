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
//获取加入的群组列表
const getJoinedGroupList = computed(() => store.getters.getJoinedGroupList);
const getGroupDetailFromGroupList = computed(() => {
  const group = getJoinedGroupList.value.filter((groupItem) => {
    if (groupItem.groupId === groupId.value) {
      return groupItem;
    }
  });
  return group[0];
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
      modifyType: 1,
      content: groupDescValue.value,
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
        message: '群组详情修改失败~',
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
      maxlength="50"
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
