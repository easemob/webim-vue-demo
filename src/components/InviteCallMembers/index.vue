<script setup>
import { ref, toRaw } from 'vue';
import { useStore } from 'vuex';
import { EMClient } from '@/IM';
/* store */
const store = useStore();
/* emits */
const emits = defineEmits(['sendMulitInviteMsg']);
const dialogVisible = ref(false);
const members = ref([]);

/* 弹出dialog */
const alertDialog = (groupId) => {
  dialogVisible.value = true;
  getGroupMemberList(groupId);
};
//获取该群对应的群成员
const getGroupMemberList = async (groupId) => {
  if (!groupId) return;
  const memberList = [];
  const sourceMembers = store.getters.getGroupMembersMap.get(groupId) || [];
  if (sourceMembers.length > 0) {
    sourceMembers.length > 0 &&
      sourceMembers.forEach((item) => {
        memberList.push(item.member || item.owner);
      });
    members.value = memberList;
  } else {
    await store.dispatch('fetchGroupsMemberFromServer', groupId);
    const sourceMembers = store.getters.getGroupMembersMap.get(groupId) || [];
    sourceMembers.length > 0 &&
      sourceMembers.forEach((item) => {
        memberList.push(item.member || item.owner);
      });
    members.value = memberList;
  }
};
/* 处理选中members */
const checkedMembers = ref([]);
const confirmInvite = () => {
  if (checkedMembers.value.length > 0) {
    emits('sendMulitInviteMsg', Object.assign([], toRaw(checkedMembers.value)));
  }
  checkedMembers.value = [];
  dialogVisible.value = false;
};

defineExpose({
  alertDialog,
});
</script>
<template>
  <el-dialog v-model="dialogVisible" title="邀请入会" width="50%">
    <el-checkbox-group v-model="checkedMembers">
      <el-checkbox
        v-for="item in members"
        :key="item"
        :label="item"
        :disabled="item === EMClient.user"
        >{{ item }}</el-checkbox
      >
    </el-checkbox-group>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmInvite">邀请</el-button>
      </span>
    </template>
  </el-dialog>
</template>
<style lang="scss" scoped></style>
