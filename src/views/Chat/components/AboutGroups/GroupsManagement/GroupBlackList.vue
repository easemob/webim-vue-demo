<script setup>
import { computed, ref, toRefs, onMounted } from 'vue';
import store from '@/store';
import { ElMessageBox } from 'element-plus';
import { Search, Minus, Plus } from '@element-plus/icons-vue';
import { useGetUserMapInfo } from '@/hooks';

const props = defineProps({
  groupId: {
    type: String,
    required: true,
    default: '',
  },
});
const { groupId } = toRefs(props);

const groupBlacklist = computed(() => {
  return store.getters.getGroupBlocklistMap.get(groupId.value) || [];
});
const getGroupMembersList = computed(() => {
  return store.getters.getGroupMembersMap.get(groupId.value) || [];
});
const { getUserDisplayNameById, getUserDisplayAvatarById } =
  useGetUserMapInfo();

onMounted(async () => {
  try {
    await Promise.all([
      store.dispatch('fetchGroupsMemberFromServer', { groupId: groupId.value }),
      store.dispatch('fetchGroupsBlackListFromServer', groupId.value),
    ]);
  } catch (error) {
    console.error('[SDK 5.0 Group] group blocklist panel load failed', {
      groupId: groupId.value,
      error,
    });
  }
});

const isInBlackList = (memberId) =>
  groupBlacklist.value.some((entry) => entry.user.userId === memberId);

const handleBlackListMember = (memberId) => {
  ElMessageBox.alert('确定要操作该成员？', '成员变更', {
    confirmButtonText: '确认',
    callback: async (action) => {
      if (action !== 'confirm') return;
      if (isInBlackList(memberId)) {
        await store.dispatch('removeTheMemberFromBlackList', {
          groupId: groupId.value,
          userIds: [memberId],
        });
        return;
      }
      await store.dispatch('addMemberToBlackList', {
        groupId: groupId.value,
        userIds: [memberId],
      });
    },
  });
};

const searchInputValue = ref('');
const searchResult = computed(() => {
  const keyword = searchInputValue.value;
  if (!keyword) return getGroupMembersList.value;
  return getGroupMembersList.value.filter((member) =>
    member.user.userId.includes(keyword),
  );
});
</script>

<template>
  <div class="group_black_list_container">
    <div class="group_member_list_container">
      <el-scrollbar>
        <div class="search_input_container">
          <el-input
            v-model="searchInputValue"
            style="height: 36px"
            placeholder="搜索"
            :prefix-icon="Search"
          />
        </div>
        <div v-for="member in searchResult" :key="member.user.userId">
          <div class="friend_user_list">
            <div class="friend_user_list_left">
              <el-avatar :src="getUserDisplayAvatarById(member.user.userId)" />
              <b class="friend_list_username">
                {{ getUserDisplayNameById(member.user.userId) }}
              </b>
            </div>
            <el-button
              type="primary"
              :icon="Plus"
              circle
              size="small"
              @click="handleBlackListMember(member.user.userId)"
            />
          </div>
          <el-divider style="margin: 12px 0" />
        </div>
      </el-scrollbar>
    </div>
    <div class="inside_black_list_container" v-if="groupBlacklist.length">
      <el-scrollbar>
        <div v-for="entry in groupBlacklist" :key="entry.user.userId">
          <div class="friend_user_list">
            <div class="friend_user_list_left">
              <el-avatar :src="getUserDisplayAvatarById(entry.user.userId)" />
              <b class="friend_list_username">
                {{ getUserDisplayNameById(entry.user.userId) }}
              </b>
            </div>
            <el-button
              type="danger"
              :icon="Minus"
              circle
              size="small"
              @click="handleBlackListMember(entry.user.userId)"
            />
          </div>
          <el-divider style="margin: 12px 0" />
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.group_black_list_container {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
}
.group_member_list_container,
.inside_black_list_container {
  width: 50%;
  text-align: center;
  max-height: 466px;
  min-height: 466px;
  overflow: hidden;
  border-right: 1px solid #dcdfe6;
  padding: 0 10px;
}
.inside_black_list_container {
  padding: 0 10px;
  border-right: none;
}
.search_input_container {
  margin-bottom: 10px;
}
.friend_user_list {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 45px;

  .friend_user_list_left {
    display: flex;
    align-items: center;
    justify-content: center;

    .friend_list_username {
      margin-left: 10px;
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 500;
      font-size: 14px;
      line-height: 20px;
      color: #333333;
    }
  }
}
</style>
