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

//群组黑名单
const groupBlacklist = computed(() => {
  return store.getters.getGroupDetailMap.get(groupId.value)?.blacklist;
});
//群组成员
const getGroupMembersList = computed(() => {
  return store.getters.getGroupMembersMap.get(groupId.value);
});
const { getUserDisplayNameById, getUserDisplayAvatarById } =
  useGetUserMapInfo();
onMounted(async () => {
  if (!getGroupMembersList.value) {
    await store.dispatch('fetchGroupsMemberFromServer', groupId.value);
  }
});

let tobeAddedBlackList = ref([]);
const handleAddBlackList = (memberId) => {
  ElMessageBox.alert('确定要操作该成员？', '成员变更', {
    confirmButtonText: '确认',
    callback: async (action) => {
      if (action === 'confirm') {
        if (isInBlackList.value(memberId)) {
          tobeAddedBlackList.value = tobeAddedBlackList.value.filter(
            (item) => item !== memberId,
          );
          //存在黑名单中移除
          await store.dispatch('removeTheMemberFromBlackList', {
            groupId: groupId.value,
            usernames: [memberId],
          });
        } else {
          await store.dispatch('addMemberToBlackList', {
            groupId: groupId.value,
            usernames: [memberId],
          });
        }
      }
    },
  });
};
const isInBlackList = computed(() => {
  return (memberId) => {
    return (
      groupBlacklist.value.includes(memberId) ||
      tobeAddedBlackList.value.includes(memberId)
    );
  };
});
const inBlackMemberList = computed(() => {
  return groupBlacklist.value.concat(tobeAddedBlackList.value);
});
//搜索群成员列表逻辑
const serachInputValue = ref('');
const searchResultValue = ref([]);
const searchUsers = () => {
  searchResultValue.value = getGroupMembersList.value.filter((item) => {
    return item?.member?.includes(serachInputValue.value);
  });
};
</script>
<template>
  <div class="group_black_list_container">
    <div class="group_member_list_container">
      <el-scrollbar>
        <div class="search_input_container">
          <el-input
            style="height: 36px"
            v-model="serachInputValue"
            placeholder="搜索"
            @input="searchUsers"
            :prefix-icon="Search"
          >
          </el-input>
        </div>
        <div
          v-for="{ member, owner } in !serachInputValue
            ? getGroupMembersList
            : searchResultValue"
          :key="member || owner"
        >
          <template v-if="member">
            <div class="friend_user_list">
              <div class="friend_user_list_left">
                <el-avatar :src="getUserDisplayAvatarById(member)"></el-avatar>
                <b class="friend_list_username">{{
                  getUserDisplayNameById(member)
                }}</b>
              </div>
              <el-button
                type="primary"
                :icon="Plus"
                circle
                size="small"
                @click="handleAddBlackList(member)"
              />
            </div>
            <el-divider style="margin: 12px 0" />
          </template>
        </div>
      </el-scrollbar>
    </div>
    <div class="inside_black_list_container" v-if="groupBlacklist.length">
      <el-scrollbar>
        <div v-for="member in inBlackMemberList" :key="member">
          <div class="friend_user_list">
            <div class="friend_user_list_left">
              <el-avatar :src="getUserDisplayAvatarById(member)"></el-avatar>
              <b class="friend_list_username">{{
                getUserDisplayNameById(member)
              }}</b>
            </div>
            <el-button
              type="danger"
              :icon="Minus"
              circle
              size="small"
              @click="handleAddBlackList(member)"
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
  // flex: 1;
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

  .checked_btn {
    width: 20px;
    height: 20px;
    cursor: pointer;
    margin: 0 10px;

    .checked_icon {
      font-size: 20px;
      color: #0091ff;
    }

    .unChecked_icon {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #979797;
      border-radius: 50%;
    }
  }
}
</style>
