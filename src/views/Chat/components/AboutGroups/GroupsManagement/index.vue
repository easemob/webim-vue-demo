<script setup>
import { ref, toRefs } from 'vue';
import GroupDesc from './GroupDesc.vue';
import GroupAnnoun from './GroupAnnoun.vue';
import GroupMembers from './GroupMembers.vue';
import GroupBlackList from './GroupBlackList.vue';
import GroupMuteList from './GroupMuteList.vue';
const props = defineProps({
  modalType: {
    type: String,
    required: true,
    default: 'groupDesc',
  },
  groupModalTitle: {
    type: Object,
    required: true,
    default: () => ({ title: '', type: 0 }),
  },
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
const dialogVisible = ref(false);
defineExpose({
  dialogVisible,
});
const { modalType, groupModalTitle } = toRefs(props);

const diffModal = {
  groupDesc: {
    width: '480px',
    title: '群描述',
    components: GroupDesc,
  },
  announcements: {
    width: '480px',
    title: '群公告',
    components: GroupAnnoun,
  },
  groupmembers: {
    width: '840px',
    title: '群成员',
    components: GroupMembers,
  },
  groupBlacklist: {
    width: '840px',
    title: '群组黑名单',
    components: GroupBlackList,
  },
  groupMutelist: {
    width: '840px',
    title: '群组禁言名单',
    components: GroupMuteList,
  },
};

//完成事件
const groupModalComp = ref(null);
const save = () => {
  if (groupModalComp.value && groupModalComp.value.saveHandleMembers) {
    groupModalComp.value.saveHandleMembers();
  }
  dialogVisible.value = false;
};
</script>
<template>
  <el-dialog
    v-model="dialogVisible"
    :destroy-on-close="true"
    :title="
      (diffModal[modalType] && diffModal[modalType].title) ||
      groupModalTitle.title
    "
    :width="diffModal[modalType] && diffModal[modalType].width"
  >
    <component
      ref="groupModalComp"
      :is="diffModal[modalType] && diffModal[modalType].components"
      :groupModalTitle="groupModalTitle"
      :memberRole="memberRole"
      :groupId="groupId"
      @save="save"
    >
    </component>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">完成</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
:deep(.el-dialog) > .el-dialog__body {
  padding: 0;
}
</style>
./GroupDesc.vue
