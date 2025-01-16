<script setup>
import { ref, toRefs } from 'vue';
import CreateGroups from './createGroups.vue';
import ApplyJoinGroups from './applyJoinGroups';
import AddFriends from './addFriends.vue';
const props = defineProps({
  modalType: {
    type: String,
    default: 'createNewGroups',
  },
});
const { modalType } = toRefs(props);
//Title展示
const modalTitle = {
  createNewGroups: '创建群聊',
  applyJoinGroups: '申请入群',
  addNewFriend: '添加好友',
};
//匹配不同的modalType展示对应的组件
const showComponent = {
  createNewGroups: CreateGroups,
  applyJoinGroups: ApplyJoinGroups,
  addNewFriend: AddFriends,
};
//modal显隐
const dialogVisible = ref(false);
//open时 初始化个别子组件所需要的数据
const settingComps = ref(null);
//手动控制dialog关闭
const closeDialogVisible = () => (dialogVisible.value = false);
defineExpose({
  dialogVisible,
});
</script>
<template>
  <el-dialog
    custom-class="setting_func_diglog"
    v-model="dialogVisible"
    :title="modalTitle[modalType]"
    width="500px"
  >
    <!-- 动态组件 -->
    <component
      ref="settingComps"
      :is="showComponent[modalType]"
      @closeDialogVisible="closeDialogVisible"
      :dialogVisible="dialogVisible"
    >
    </component>
  </el-dialog>
</template>
<style lang="scss" scoped></style>
