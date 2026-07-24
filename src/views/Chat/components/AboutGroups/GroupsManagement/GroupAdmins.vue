<script setup>
import { computed, onMounted, ref, toRefs } from 'vue';
import { Search, Minus, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import store from '@/store';
import { useGetUserMapInfo } from '@/hooks';

const props = defineProps({
  groupId: {
    type: String,
    required: true,
    default: '',
  },
});
const { groupId } = toRefs(props);

const loading = ref(false);
const operationError = ref(null);
const searchInputValue = ref('');
const { getUserDisplayNameById, getUserDisplayAvatarById } =
  useGetUserMapInfo();

const groupAdmins = computed(() => {
  return store.getters.getGroupAdminsMap.get(groupId.value) || [];
});
const groupMembers = computed(() => {
  return store.getters.getGroupMembersMap.get(groupId.value) || [];
});
const adminIds = computed(() => {
  return new Set(groupAdmins.value.map((admin) => admin.userId).filter(Boolean));
});
const candidateMembers = computed(() => {
  return groupMembers.value.filter((member) => {
    const memberId = member.user.userId;
    return member.role !== 'owner' && !adminIds.value.has(memberId);
  });
});
const searchedMembers = computed(() => {
  const keyword = searchInputValue.value.trim();
  if (!keyword) return candidateMembers.value;
  return candidateMembers.value.filter((member) =>
    member.user.userId.includes(keyword),
  );
});

const formatValue = (value) => JSON.stringify(value, null, 2);

const buildErrorPayload = (action, userId, error) => ({
  action,
  groupId: groupId.value,
  userId,
  name: error?.name,
  message: error?.message || String(error),
  statusCode: error?.statusCode,
  code: error?.code,
});

const loadGroupAdmins = async () => {
  loading.value = true;
  operationError.value = null;
  try {
    await Promise.all([
      store.dispatch('fetchGroupsMemberFromServer', { groupId: groupId.value }),
      store.dispatch('fetchGroupAdminsFromServer', groupId.value),
    ]);
  } catch (error) {
    operationError.value = buildErrorPayload('getAdmins', '', error);
    console.error('[SDK 5.0 Group] admins panel load failed', {
      groupId: groupId.value,
      error,
    });
  } finally {
    loading.value = false;
  }
};

const addAdmin = async (memberId) => {
  if (!memberId) return;
  try {
    await ElMessageBox.confirm('确定要添加该群管理员？', '添加群管理员', {
      confirmButtonText: '确认添加',
      cancelButtonText: '取消',
      type: 'warning',
    });
    loading.value = true;
    operationError.value = null;
    await store.dispatch('addGroupAdmin', {
      groupId: groupId.value,
      userId: memberId,
    });
  } catch (error) {
    if (error === 'cancel') return;
    operationError.value = buildErrorPayload('addAdmin', memberId, error);
    ElMessage.error(error?.message || '添加群管理员失败');
  } finally {
    loading.value = false;
  }
};

const removeAdmin = async (adminId) => {
  if (!adminId) return;
  try {
    await ElMessageBox.confirm('确定要移除该群管理员？', '移除群管理员', {
      confirmButtonText: '确认移除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    loading.value = true;
    operationError.value = null;
    await store.dispatch('removeGroupAdmin', {
      groupId: groupId.value,
      userId: adminId,
    });
  } catch (error) {
    if (error === 'cancel') return;
    operationError.value = buildErrorPayload('removeAdmin', adminId, error);
    ElMessage.error(error?.message || '移除群管理员失败');
  } finally {
    loading.value = false;
  }
};

onMounted(loadGroupAdmins);
</script>

<template>
  <div class="group_admins_container" v-loading="loading">
    <div class="group_member_list_container">
      <el-scrollbar>
        <div class="search_input_container">
          <el-input
            v-model="searchInputValue"
            style="height: 36px"
            placeholder="搜索可添加管理员的群成员"
            :prefix-icon="Search"
          />
        </div>
        <div v-for="member in searchedMembers" :key="member.user.userId">
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
              @click="addAdmin(member.user.userId)"
            />
          </div>
          <el-divider style="margin: 12px 0" />
        </div>
        <el-empty
          v-if="searchedMembers.length === 0"
          description="SDK 当前没有可添加的群成员"
        />
      </el-scrollbar>
    </div>
    <div class="inside_admin_list_container">
      <el-scrollbar>
        <div class="admin_header">
          群组管理员：{{ groupAdmins.length }}
          <el-button link type="primary" @click="loadGroupAdmins">
            重新查询
          </el-button>
        </div>
        <div v-for="admin in groupAdmins" :key="admin.userId">
          <div class="friend_user_list">
            <div class="friend_user_list_left">
              <el-avatar :src="getUserDisplayAvatarById(admin.userId)" />
              <div class="admin_user_text">
                <b class="friend_list_username">
                  {{ getUserDisplayNameById(admin.userId) || admin.userId }}
                </b>
                <span class="admin_user_id">ID：{{ admin.userId }}</span>
              </div>
            </div>
            <el-button
              type="danger"
              :icon="Minus"
              circle
              size="small"
              @click="removeAdmin(admin.userId)"
            />
          </div>
          <el-divider style="margin: 12px 0" />
        </div>
        <el-empty
          v-if="groupAdmins.length === 0"
          description="SDK 当前返回空管理员列表"
        />
      </el-scrollbar>
    </div>
    <div class="raw_box">
      <div class="raw_title">SDK 真实管理员列表</div>
      <pre>{{ formatValue(groupAdmins) }}</pre>
      <template v-if="operationError">
        <div class="raw_title error_title">SDK 真实错误</div>
        <pre>{{ formatValue(operationError) }}</pre>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.group_admins_container {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.group_member_list_container,
.inside_admin_list_container {
  text-align: center;
  max-height: 466px;
  min-height: 466px;
  overflow: hidden;
  border-right: 1px solid #dcdfe6;
  padding: 0 10px;
}

.inside_admin_list_container {
  border-right: none;
}

.search_input_container,
.admin_header {
  margin-bottom: 10px;
}

.admin_header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #333333;
  font-size: 13px;
}

.friend_user_list {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: 45px;

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

.admin_user_text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.admin_user_id {
  margin-left: 10px;
  color: #8a8f99;
  font-size: 12px;
}

.raw_box {
  grid-column: 1 / span 2;
  padding: 10px;
  border-top: 1px solid #ebeef5;
  background: #f7f8fa;
}

.raw_title {
  margin-bottom: 6px;
  color: #333333;
  font-size: 13px;
  font-weight: 600;
}

.error_title {
  color: #f56c6c;
}

.raw_box pre {
  max-height: 160px;
  overflow: auto;
  margin: 0 0 10px;
  color: #333333;
  font-size: 12px;
  white-space: pre-wrap;
}
</style>
