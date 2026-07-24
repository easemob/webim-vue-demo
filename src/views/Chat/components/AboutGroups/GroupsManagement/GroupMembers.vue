<script setup>
import { ref, toRefs, computed, onMounted } from 'vue';
import { getCurrentUserId } from '@/IM';
import { Search, Minus, Plus } from '@element-plus/icons-vue';
import { useGetUserMapInfo, useSordedContactsWithPinyin } from '@/hooks';
/* store */
import store from '@/store';
import _ from 'lodash';
import { ElMessage, ElMessageBox } from 'element-plus';
/* props */
const props = defineProps({
  groupId: {
    type: String,
    required: true,
    default: '',
  },
  memberRole: {
    type: Boolean,
    required: true,
    default: false,
  },
});
const { groupId, memberRole } = toRefs(props);
/* 当前登陆的id */
const loginUserId = computed(() => getCurrentUserId());
/* 数据获取 */
//群组成员
const getGroupMembersList = computed(() => {
  return store.getters.getGroupMembersMap.get(groupId.value);
});
const groupMemberAttributes = computed(() => {
  return store.getters.getGroupMemberAttributesMap.get(groupId.value) || {};
});
//群组详情
const groupDetail = computed(() => {
  return store.getters.getGroupDetailMap.get(groupId.value);
});
/* 群成员操作相关 */
//获取id对应的昵称（群成员属性昵称>用户属性>环信id）
const {
  getContactsAvatarById,
  getContactsNickNameById,
  getUserDisplayNameById,
} = useGetUserMapInfo();
const getMemberDisplayName = (userId) => {
  if (!userId) return '';
  return getUserDisplayNameById(userId) || userId;
};
const getGroupMemberUserId = (member) => member.user.userId;
const getGroupMemberAttributes = (userId) => groupMemberAttributes.value[userId] || {};
const getGroupMemberNamecard = (userId) =>
  getGroupMemberAttributes(userId).groupNamecard || '';
const memberAttributesLoading = ref(false);
const memberAttributeDialogVisible = ref(false);
const editingMemberId = ref('');
const groupNamecardInput = ref('');
const fetchGroupMembersAttributes = async () => {
  const userIds = (getGroupMembersList.value || [])
    .map(getGroupMemberUserId)
    .filter(Boolean);
  if (userIds.length === 0) return;
  memberAttributesLoading.value = true;
  try {
    await store.dispatch('fetchGroupMembersAttributesFromServer', {
      groupId: groupId.value,
      userIds,
      keys: ['groupNamecard'],
    });
  } catch (error) {
    console.error('[SDK 5.0 Group] getMembersAttributes UI failed', {
      groupId: groupId.value,
      userIds,
      error,
    });
  } finally {
    memberAttributesLoading.value = false;
  }
};
onMounted(async () => {
  if (!getGroupMembersList.value) {
    await store.dispatch('fetchGroupsMemberFromServer', { groupId: groupId.value });
  }
  await fetchGroupMembersAttributes();
});
const openGroupNamecardDialog = (member) => {
  const userId = getGroupMemberUserId(member);
  if (!userId) return;
  editingMemberId.value = userId;
  groupNamecardInput.value = getGroupMemberNamecard(userId);
  memberAttributeDialogVisible.value = true;
};
const submitGroupNamecard = async () => {
  if (!editingMemberId.value) return;
  memberAttributesLoading.value = true;
  try {
    await store.dispatch('setGroupMemberAttributes', {
      groupId: groupId.value,
      userId: editingMemberId.value,
      memberAttributes: {
        groupNamecard: groupNamecardInput.value,
      },
    });
    memberAttributeDialogVisible.value = false;
  } catch (error) {
    console.error('[SDK 5.0 Group] setMemberAttributes UI failed', {
      groupId: groupId.value,
      userId: editingMemberId.value,
      groupNamecard: groupNamecardInput.value,
      error,
    });
    ElMessage.error(error?.message || '群名片设置失败');
  } finally {
    memberAttributesLoading.value = false;
  }
};
const showGroupsMembersName = computed(() => {
  return (item) => {
    const userId = getGroupMemberUserId(item);
    if (!userId) return '';
    if (item.role === 'owner') {
      return userId === loginUserId.value
        ? '我【群主】'
        : getMemberDisplayName(userId) + '【群主】';
    }
    if (userId) {
      const displayName =
        userId === loginUserId.value
          ? '我'
          : getMemberDisplayName(userId);
      return item.role === 'admin' ? `${displayName}【管理员】` : displayName;
    }
  };
});
//是否已在群中
const isInGroupMemberList = (hxId) => {
  return getGroupMembersList.value.some(
    (member) => getGroupMemberUserId(member) === hxId,
  );
};
const { sortedFriendListWithRemark } = useSordedContactsWithPinyin();
/**
 * 是否容许邀请加群成员
 * 涉及指标为2
 * @param {Boolean} public 是否为公开群
 * @param {Boolean} allowInvites 是否容许普通群组成员邀请人入群
 * @description 在公开群中，只容许群主管理员邀请人入群，而私有群则可设置是否容许普通群成员邀请人加群。
 */
const isAllowedToInviteMember = computed(() => {
  if (!groupDetail.value) return false;
  if (groupDetail.value.public && memberRole.value) {
    return true;
  }
  if (groupDetail.value.public !== true && groupDetail.value.allowInvites) {
    return true;
  }
  if (!groupDetail.value.public && memberRole.value) {
    return true;
  }
  return false;
});
const invitableFriendList = computed(() => {
  const sourceData = _.flatMap(_.values(sortedFriendListWithRemark.value));
  return sourceData.filter((item) => !isInGroupMemberList(item.userId));
});
const groupedInvitableFriendList = computed(() => {
  return _.groupBy(invitableFriendList.value, (item) => {
    const firstLetter = item?.pinyin?.[0] || item?.userId?.[0] || ' ';
    return String(firstLetter).toUpperCase();
  });
});
//邀请成员
const inviteNewMemberInTheGroup = async (hxId) => {
  ElMessageBox.confirm('确定要邀请该成员？', '邀请成员', {
    confirmButtonText: '确认',
    type: 'warning',
    callback: async (action) => {
      if (action === 'confirm') {
        await store.dispatch('inviteUserJoinTheGroup', {
          userIds: [hxId],
          groupId: groupId.value,
        });
      }
    },
  });
};
//移出群成员
const removeTheMember = async (params) => {
  const member = getGroupMemberUserId(params);
  if (!member) return;
  ElMessageBox.confirm('确定要移出该成员？', '移出群成员', {
    confirmButtonText: '确认移出',
    type: 'warning',
    callback: async (action) => {
      if (action === 'confirm') {
        await store.dispatch('removeTheGroupMember', {
          userIds: [member],
          groupId: groupId.value,
        });
      }
    },
  });
};
/* 完成操作 */

/* 搜索逻辑 */
//创建用户搜索部分
const serachInputValue = ref('');
const searchResultList = ref([]);
const searchUsers = (keyword) => {
  let _searchResultList = [];
  const searchSourceData = invitableFriendList.value;
  searchSourceData.forEach((item) => {
    const str = item.userId + item.remark;
    if (str.includes(keyword)) {
      _searchResultList.push(item);
    }
  });
  searchResultList.value = _searchResultList;
};
</script>
<template>
  <div class="taboo_box">
    <div class="taboo_left" v-if="getGroupMembersList">
      <!-- 搜索栏 -->
      <div class="search_friend_box">
        <el-input
          class="search_friend_input"
          v-model="serachInputValue"
          placeholder="搜索"
          @input="searchUsers"
          :prefix-icon="Search"
        >
        </el-input>
      </div>
      <el-row
        style="height: 100%; margin-top: 5px"
        v-if="sortedFriendListWithRemark"
      >
        <el-col :span="24" class="friend_user_list_box">
          <el-scrollbar>
            <!-- 普通展示模式 -->
            <template v-if="!serachInputValue">
              <div
                v-for="(sortedItem, key) in groupedInvitableFriendList"
                :key="key"
              >
                <div class="title">
                  {{ key === ' ' ? '#' : key.toUpperCase() }}
                </div>

                <div v-for="item in sortedItem" :key="item.userId">
                  <div class="friend_user_list">
                    <div class="friend_user_list_left">
                      <el-avatar
                        :src="getContactsAvatarById(item?.userId)"
                      ></el-avatar>
                      <b class="friend_list_username">{{
                        getContactsNickNameById(item?.userId)
                      }}</b>
                    </div>
                    <!-- public 为true（公开群不容许群成员邀请他人入群。）memberRole（管理员群主公开私有都可以邀请他人入群）  -->
                    <template v-if="isAllowedToInviteMember">
                      <el-button
                        type="primary"
                        :icon="Plus"
                        circle
                        size="small"
                        @click="inviteNewMemberInTheGroup(item.userId)"
                      ></el-button>
                    </template>
                  </div>
                </div>
              </div>
            </template>
            <!-- 搜索模式 -->
            <template v-else>
              <div v-for="item in searchResultList" :key="item.userId">
                <div class="friend_user_list">
                  <div class="friend_user_list_left">
                    <el-avatar
                      :src="getContactsAvatarById(item?.userId)"
                    ></el-avatar>
                    <b class="friend_list_username">{{
                      getContactsNickNameById(item?.userId)
                    }}</b>
                  </div>
                  <template v-if="isAllowedToInviteMember">
                    <el-button
                      type="primary"
                      :icon="Plus"
                      circle
                      size="small"
                      @click="inviteNewMemberInTheGroup(item.userId)"
                    ></el-button>
                  </template>
                </div>
              </div>
            </template>
          </el-scrollbar>
        </el-col>
      </el-row>
    </div>
    <div
      class="taboo_right"
      v-if="getGroupMembersList && getGroupMembersList.length > 0"
    >
      <el-scrollbar>
        <div class="group_members_handle_box">
          <p class="title">
            群成员
            {{
              `${groupDetail.memberCount ?? '-'}/${groupDetail.maxMembers ?? '-'}`
            }}
            <el-button
              link
              type="primary"
              :loading="memberAttributesLoading"
              @click="fetchGroupMembersAttributes"
            >
              刷新群名片
            </el-button>
          </p>
          <div class="now_exit_group_members">
            <div
              v-for="item in getGroupMembersList"
              :key="getGroupMemberUserId(item)"
            >
              <div class="friend_user_list">
                <div class="friend_user_list_left">
                  <el-avatar
                    :src="getContactsAvatarById(getGroupMemberUserId(item))"
                  ></el-avatar>
                  <div class="group_member_text">
                    <b class="friend_list_username">{{
                      showGroupsMembersName(item)
                    }}</b>
                    <span class="group_member_namecard">
                      群名片：{{ getGroupMemberNamecard(getGroupMemberUserId(item)) || 'SDK 未返回' }}
                    </span>
                    <pre class="group_member_attributes_raw">{{ JSON.stringify(getGroupMemberAttributes(getGroupMemberUserId(item)), null, 2) }}</pre>
                  </div>
                </div>

                <div class="group_member_actions">
                  <el-button
                    type="primary"
                    size="small"
                    @click="openGroupNamecardDialog(item)"
                  >
                    设置群名片
                  </el-button>
                  <el-button
                    v-if="
                      memberRole && getGroupMemberUserId(item) !== loginUserId
                    "
                    type="danger"
                    :icon="Minus"
                    circle
                    size="small"
                    @click="removeTheMember(item)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
    <el-dialog
      v-model="memberAttributeDialogVisible"
      title="设置群名片"
      width="360px"
      :destroy-on-close="true"
    >
      <div class="group_member_attribute_dialog">
        <p>成员：{{ editingMemberId }}</p>
        <el-input
          v-model="groupNamecardInput"
          placeholder="请输入 groupNamecard"
          clearable
        />
      </div>
      <template #footer>
        <el-button @click="memberAttributeDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="memberAttributesLoading"
          @click="submitGroupNamecard"
        >
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.taboo_box {
  position: relative;
  display: flex;
}

.taboo_title {
  font-family: 'PingFang SC';
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.01px;
  color: #303133;
  margin-bottom: 26px;
}

.taboo_left {
  // flex: 5;
  text-align: center;
  width: 50%;
  max-height: 466px;
  min-height: 266px;
  overflow: hidden;
  border-right: 1px solid #dcdfe6;

  .friend_user_list_box {
    height: calc(100% - 36px);
    width: 100%;
    // overflow: auto;
    box-sizing: border-box;
    padding: 15px 10px;
  }
}

:deep(.el-input__prefix) {
  margin-left: 3px;
}

.taboo_right {
  width: 50%;
  max-height: 466px;
  min-height: 266px;
  overflow: hidden;
}

.group_members_handle_box {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  padding: 0 0 0 12px;
  overflow: auto;
  box-sizing: border-box;

  .now_exit_group_members {
    width: 100%;
  }
}

.title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  height: 40px;
  width: 100%;
  line-height: 40px;
  color: #999;
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
    justify-content: flex-start;
    min-width: 0;
    flex: 1;

    .friend_list_username {
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 500;
      font-size: 14px;
      line-height: 20px;
      color: #333333;
    }
  }

  .group_member_text {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    margin-left: 10px;
  }

  .group_member_namecard {
    color: #8a94a6;
    font-size: 12px;
    line-height: 16px;
    word-break: break-all;
  }

  .group_member_attributes_raw {
    max-width: 180px;
    max-height: 54px;
    margin: 0;
    padding: 4px 6px;
    overflow: auto;
    border-radius: 4px;
    background: #f7f8fa;
    color: #607089;
    font-size: 11px;
    line-height: 14px;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .group_member_actions {
    display: flex;
    flex: none;
    align-items: center;
    gap: 6px;
  }

  .checked_btn {
    width: 20px;
    height: 20px;
    cursor: pointer;

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

  .circle_close:hover {
    color: #0091ff;
  }
}

.group_member_attribute_dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #333333;
  font-size: 14px;
}
</style>
