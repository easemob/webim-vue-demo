<script setup>
import { ref, toRefs, computed, onMounted, nextTick } from 'vue';
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
const getGroupAnnouncement = computed(() => {
  return store.getters.getGroupDetailMap.get(groupId.value)?.announcement;
});
const announcementRef = ref(null);
const isEdit = ref(false);
const announcmentValue = ref('');
const editAnnouncment = async (type, oldAnnouncment) => {
  if (type === 'edit') {
    isEdit.value = true;
    nextTick(() => {
      announcementRef.value.focus();
    });
    announcmentValue.value = oldAnnouncment;
  }
  if (type === 'save') {
    if (announcmentValue.value === oldAnnouncment)
      return (isEdit.value = false);

    const params = {
      groupId: groupId.value,
      announcement: announcmentValue.value,
    };
    try {
      store.dispatch('modifyGroupAnnouncement', params);
      ElMessage({
        message: '群组详情修改成功~',
        type: 'success',
        center: true,
      });
      isEdit.value = false;
    } catch (error) {
      ElMessage({
        message: '群组详情修改失败，请稍后重试~',
        type: 'error',
        center: true,
      });
      isEdit.value = false;
    }
  }
};
onMounted(() => {
  nextTick(() => {
    editAnnouncment('edit', getGroupAnnouncement.value);
  });
});
</script>
<template>
  <div class="app_container">
    <!-- 群主及管理员可编辑 -->
    <template v-if="memberRole">
      <p v-if="!isEdit" @click="editAnnouncment('edit', getGroupAnnouncement)">
        {{ getGroupAnnouncement || '暂无群公告~' }}
      </p>
      <el-input
        v-if="isEdit"
        ref="announcementRef"
        v-model="announcmentValue"
        maxlength="500"
        show-word-limit
        :autosize="{ minRows: 2, maxRows: 4 }"
        type="textarea"
        class="announcment_detail"
        placeholder="请输入群组公告~"
        resize="none"
        @blur="editAnnouncment('save', getGroupAnnouncement)"
      />
    </template>
    <!-- 仅供查看 -->
    <p v-else>{{ getGroupAnnouncement || '暂无群公告~' }}</p>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-textarea__inner) {
  border-radius: 5px;
}
</style>
