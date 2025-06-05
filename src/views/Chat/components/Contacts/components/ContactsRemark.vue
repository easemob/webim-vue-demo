<script setup>
import { ref, toRefs, computed, watch, nextTick } from 'vue';
import { Edit, Select } from '@element-plus/icons-vue';
import store from '@/store';
import { ElMessage } from 'element-plus';
const props = defineProps({
  userId: {
    type: String,
    default: '',
    requered: true,
  },
});
const { userId } = toRefs(props);

const getUserRemark = computed(() => {
  return store.getters['UsersProfile/getDisplayRemark'](userId.value);
});
const userRemark = ref('');
const editRemarkInputComp = ref(null);
const isEdit = ref(false);
const changeRemarkEditMode = () => {
  nextTick(() => {
    editRemarkInputComp?.value?.focus();
  });
  isEdit.value = !isEdit.value;
};
const saveEditedRemark = async () => {
  if (userRemark.value === getUserRemark.value) return (isEdit.value = false);
  console.log('>>>>>>保存备注');
  try {
    await store.dispatch('setContactsRemark', {
      userId: userId.value,
      remark: userRemark.value,
    });
    ElMessage({
      message: '备注保存',
      type: 'success',
      center: true,
    });
  } catch (error) {
    ElMessage({
      message: '保存失败',
      type: 'error',
      center: true,
    });
  } finally {
    isEdit.value = false;
  }
};
watch(
  () => userId.value,
  (newVal) => {
    userRemark.value = getUserRemark.value;
  },
  {
    immediate: true,
  },
);
</script>
<template>
  <div class="contacts_remark_container">
    <div class="contacts_edit_box">
      <p class="contacts_edit_left">
        <span>备注：</span>
        <span v-if="!isEdit" class="contacts_edit_content">
          {{ userRemark || '暂未设置好友备注...' }}</span
        >
        <el-input
          v-show="isEdit"
          ref="editRemarkInputComp"
          v-model.trim="userRemark"
          class="edit_remark_input"
          maxlength="15"
          @blur="saveEditedRemark"
        ></el-input>
        <el-icon class="edit_remark_icon" title="保存备注">
          <Select v-show="isEdit" @click.prevent.stop="changeRemarkEditMode" />
        </el-icon>
      </p>
      <el-icon class="edit_remark_icon" title="编辑备注">
        <Edit v-show="!isEdit" @click.prevent.stop="changeRemarkEditMode" />
      </el-icon>
    </div>

    <slot> </slot>
  </div>
</template>

<style lang="scss" scoped>
.contacts_remark_container {
  width: 100%;
}
.contacts_edit_box {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.contacts_edit_left {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 17px;
}
.contacts_edit_content {
  font-size: 13px;
  color: #6a6868;
}
.edit_remark_input {
  width: 70%;
}
.edit_remark_icon {
  margin: 0 5px;
  transition: all 1 ease-in;
  &:hover {
    scale: 1.2;
  }
}
:deep(.edit_remark_input) > .el-input__wrapper {
  border-radius: 5px;
}
</style>
