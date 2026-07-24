<script setup>
import { computed, ref, toRefs, onMounted } from 'vue';
import store from '@/store';
import { Search, Minus, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useGetUserMapInfo } from '@/hooks';
import dateFormater from '@/utils/dateFormater';

const props = defineProps({
  groupId: {
    type: String,
    required: true,
    default: '',
  },
});
const { groupId } = toRefs(props);

const groupMutelist = computed(() => {
  return store.getters.getGroupMuteListMap.get(groupId.value) || [];
});
const groupMuteListMembership = computed(() => {
  return store.getters.getGroupMuteListMembershipMap.get(groupId.value);
});
const getGroupMembersList = computed(() => {
  return store.getters.getGroupMembersMap.get(groupId.value) || [];
});
const groupDetail = computed(() => {
  return store.getters.getGroupDetailMap.get(groupId.value) || {};
});
const loading = ref(false);
const operationError = ref(null);
const { getUserDisplayNameById, getUserDisplayAvatarById } =
  useGetUserMapInfo();

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([
      store.dispatch('fetchGroupsMemberFromServer', { groupId: groupId.value }),
      store.dispatch('fetchGroupsMuteListFromServer', groupId.value),
      store.dispatch('checkCurrentUserInGroupMuteList', groupId.value),
    ]);
  } catch (error) {
    operationError.value = buildErrorPayload('loadMuteState', error);
    console.error('[SDK 5.0 Group] group mute-list panel load failed', {
      groupId: groupId.value,
      error,
    });
  } finally {
    loading.value = false;
  }
});

const isInMuteList = (memberId) =>
  groupMutelist.value.some((entry) => entry.user.userId === memberId);

const formatValue = (value) => JSON.stringify(value, null, 2);

const buildErrorPayload = (action, error) => ({
  action,
  groupId: groupId.value,
  name: error?.name,
  message: error?.message || String(error),
  statusCode: error?.statusCode,
  code: error?.code,
});

const refreshCurrentUserMuteState = async () => {
  loading.value = true;
  operationError.value = null;
  try {
    await store.dispatch('checkCurrentUserInGroupMuteList', groupId.value);
  } catch (error) {
    operationError.value = buildErrorPayload('checkIfInMuteList', error);
    ElMessage.error(error?.message || '查询当前用户禁言状态失败');
  } finally {
    loading.value = false;
  }
};

const handleAllMemberMute = async (action) => {
  const isMuteAction = action === 'mute';
  try {
    await ElMessageBox.confirm(
      isMuteAction ? '确定要开启群全员禁言？' : '确定要解除群全员禁言？',
      isMuteAction ? '群全员禁言' : '解除群全员禁言',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
    loading.value = true;
    operationError.value = null;
    if (isMuteAction) {
      await store.dispatch('muteAllGroupMembers', groupId.value);
      return;
    }
    await store.dispatch('unmuteAllGroupMembers', groupId.value);
  } catch (error) {
    if (error === 'cancel') return;
    operationError.value = buildErrorPayload(
      isMuteAction ? 'muteAllMembers' : 'unmuteAllMembers',
      error,
    );
    ElMessage.error(error?.message || '群全员禁言操作失败');
  } finally {
    loading.value = false;
  }
};

const handleMuteMember = (memberId) => {
  ElMessageBox.alert('确定要操作该成员？', '禁言状态', {
    confirmButtonText: '确认',
    callback: async (action) => {
      if (action !== 'confirm') return;
      if (isInMuteList(memberId)) {
        await store.dispatch('removeTheMemberFromMuteList', {
          groupId: groupId.value,
          userIds: [memberId],
        });
        return;
      }
      await store.dispatch('addMemberToMuteList', {
        groupId: groupId.value,
        userIds: [memberId],
        muteDuration: 886400,
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
  <div class="group_mute_list_container" v-loading="loading">
    <div class="group_mute_status_bar">
      <span>
        SDK 全员禁言：{{
          groupDetail.muteAllMembers === undefined
            ? 'SDK 未返回'
            : groupDetail.muteAllMembers
        }}
      </span>
      <span>
        当前用户禁言：{{
          groupMuteListMembership === undefined
            ? 'SDK 未返回'
            : groupMuteListMembership
        }}
      </span>
      <el-button size="small" type="primary" @click="handleAllMemberMute('mute')">
        开启群全员禁言
      </el-button>
      <el-button size="small" type="warning" @click="handleAllMemberMute('unmute')">
        解除群全员禁言
      </el-button>
      <el-button size="small" @click="refreshCurrentUserMuteState">
        查询当前用户禁言状态
      </el-button>
    </div>
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
          <template v-if="!isInMuteList(member.user.userId)">
            <div class="friend_user_list">
              <div class="friend_user_list_left">
                <el-avatar :src="getUserDisplayAvatarById(member.user.userId)" />
                <b class="friend_list_username">
                  {{ getUserDisplayNameById(member.user.userId) || member.user.userId }}
                </b>
              </div>
              <el-button
                type="primary"
                :icon="Plus"
                circle
                size="small"
                @click="handleMuteMember(member.user.userId)"
              />
            </div>
            <el-divider style="margin: 12px 0" />
          </template>
        </div>
      </el-scrollbar>
    </div>
    <div class="inside_mute_list_container" v-if="groupMutelist.length">
      <el-scrollbar>
        <div v-for="member in groupMutelist" :key="member.user.userId">
          <div class="friend_user_list">
            <div class="friend_user_list_left">
              <el-avatar :src="getUserDisplayAvatarById(member.user.userId)" />
              <b class="friend_list_username">
                {{ getUserDisplayNameById(member.user.userId) || member.user.userId }}
              </b>
              <sup v-if="member.muteExpire" style="font: size 7px">
                【失效时间：{{ dateFormater('MM-DD-HH:mm', member.muteExpire) }}】
              </sup>
            </div>
            <el-button
              type="danger"
              :icon="Minus"
              circle
              size="small"
              @click="handleMuteMember(member.user.userId)"
            />
          </div>
          <el-divider style="margin: 12px 0" />
        </div>
      </el-scrollbar>
    </div>
    <div class="raw_box" v-if="operationError">
      <div class="raw_title">SDK 真实错误</div>
      <pre>{{ formatValue(operationError) }}</pre>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.group_mute_list_container {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}
.group_member_list_container,
.inside_mute_list_container {
  text-align: center;
  max-height: 466px;
  min-height: 466px;
  overflow: hidden;
  border-right: 1px solid #dcdfe6;
  padding: 0 10px;
}
.inside_mute_list_container {
  padding: 0 10px;
  border-right: none;
}
.search_input_container {
  margin-bottom: 10px;
}

.group_mute_status_bar {
  grid-column: 1 / span 2;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ebeef5;
  color: #333333;
  font-size: 13px;
}

.raw_box {
  grid-column: 1 / span 2;
  padding: 10px;
  border-top: 1px solid #ebeef5;
  background: #f7f8fa;
}

.raw_title {
  margin-bottom: 6px;
  color: #f56c6c;
  font-size: 13px;
  font-weight: 600;
}

.raw_box pre {
  max-height: 160px;
  overflow: auto;
  margin: 0;
  color: #333333;
  font-size: 12px;
  white-space: pre-wrap;
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
