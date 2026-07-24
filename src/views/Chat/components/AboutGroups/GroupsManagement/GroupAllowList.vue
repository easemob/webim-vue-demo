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

const groupAllowlist = computed(() => {
  return store.getters.getGroupAllowlistMap.get(groupId.value) || [];
});
const isCurrentUserInAllowlist = computed(() => {
  return store.getters.getGroupAllowlistMembershipMap.get(groupId.value);
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
      store.dispatch('fetchGroupsAllowListFromServer', groupId.value),
      store.dispatch('checkCurrentUserInGroupAllowList', groupId.value),
    ]);
  } catch (error) {
    console.error('[SDK 5.0 Group] group allowlist panel load failed', {
      groupId: groupId.value,
      error,
    });
  }
});

const isInAllowList = (memberId) =>
  groupAllowlist.value.some((entry) => entry.user.userId === memberId);

const handleAllowListMember = (memberId) => {
  ElMessageBox.alert('确定要操作该成员？', '白名单状态', {
    confirmButtonText: '确认',
    callback: async (action) => {
      if (action !== 'confirm') return;
      if (isInAllowList(memberId)) {
        await store.dispatch('removeTheMemberFromAllowList', {
          groupId: groupId.value,
          userIds: [memberId],
        });
        return;
      }
      await store.dispatch('addMemberToAllowList', {
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
  return getGroupMembersList.value.filter((item) =>
    item.user.userId.includes(keyword),
  );
});
</script>

<template>
  <div class="group_allow_list_container">
    <div class="allowlist_status">
      当前用户是否在群白名单：
      <span>{{ isCurrentUserInAllowlist === undefined ? 'SDK 未返回' : isCurrentUserInAllowlist }}</span>
    </div>
    <div class="allowlist_columns">
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
          <div v-for="item in searchResult" :key="item.user.userId">
            <template v-if="!isInAllowList(item.user.userId)">
              <div class="friend_user_list">
                <div class="friend_user_list_left">
                  <el-avatar :src="getUserDisplayAvatarById(item.user.userId)" />
                  <b class="friend_list_username">
                    {{ getUserDisplayNameById(item.user.userId) || item.user.userId }}
                  </b>
                </div>
                <el-button
                  type="primary"
                  :icon="Plus"
                  circle
                  size="small"
                  @click="handleAllowListMember(item.user.userId)"
                />
              </div>
              <el-divider style="margin: 12px 0" />
            </template>
          </div>
        </el-scrollbar>
      </div>
      <div class="inside_allow_list_container" v-if="groupAllowlist.length">
        <el-scrollbar>
          <div v-for="entry in groupAllowlist" :key="entry.user.userId">
            <div class="friend_user_list">
              <div class="friend_user_list_left">
                <el-avatar :src="getUserDisplayAvatarById(entry.user.userId)" />
                <b class="friend_list_username">
                  {{ getUserDisplayNameById(entry.user.userId) || entry.user.userId }}
                </b>
              </div>
              <el-button
                type="danger"
                :icon="Minus"
                circle
                size="small"
                @click="handleAllowListMember(entry.user.userId)"
              />
            </div>
            <el-divider style="margin: 12px 0" />
          </div>
        </el-scrollbar>
      </div>
      <div class="inside_allow_list_container" v-else>
        <el-empty description="SDK 返回白名单为空" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.group_allow_list_container {
  width: 100%;
}

.allowlist_status {
  padding: 8px 10px 12px;
  color: #607089;
  font-size: 13px;
}

.allowlist_columns {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
}

.group_member_list_container,
.inside_allow_list_container {
  width: 50%;
  text-align: center;
  max-height: 466px;
  min-height: 466px;
  overflow: hidden;
  border-right: 1px solid #dcdfe6;
  padding: 0 10px;
}

.inside_allow_list_container {
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
