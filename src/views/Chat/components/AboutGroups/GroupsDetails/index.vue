<script setup>
import { ref, toRefs, computed, nextTick, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
/* IMSDK */
import { getCurrentUserId } from '@/IM';
import { GROUP_ROLE_TYPE } from '@/IM/constant';
/* components */
import GroupsManagement from '../GroupsManagement';
/* icons */
import { ArrowRight, Edit, View } from '@element-plus/icons-vue';
import store from '@/store';
import ConversationDndSwitch from '@/components/ConversationDndSwitch';
/* porps */
const props = defineProps({
  groupId: {
    type: String,
    required: true,
    default: '',
  },
});
/* emits */
const emits = defineEmits(['handleDrawer']);
/*
 * groupDetail（群详情接口返回的数据）
 * 主要包含群名称，群主id，群组desc，群组人数，群组禁言状态是否容许邀请...。
 **/
const { groupId } = toRefs(props);
//获取加入的群组列表
const getJoinedGroupList = computed(() => store.getters.getJoinedGroupList);
//获取群组详情（展示群组名称等信息）
const getGroupDetailFromGroupList = computed(() => {
  const group = getJoinedGroupList.value.filter((groupItem) => {
    if (groupItem.groupId === groupId.value) {
      return groupItem;
    }
  });
  return group[0] || {};
});
/* 群组展示相关核心数据获取 */
//权限判断（黑名单以及禁言列表的获取，只有群主管理员）
const memberRole = computed(() => {
  const role = getGroupDetailFromGroupList.value?.role;
  //判断是否在权限名单内
  if (role === GROUP_ROLE_TYPE.ADMIN || role === GROUP_ROLE_TYPE.OWNER) {
    return true;
  } else {
    return false;
  }
});

/* 群组管理 */
const groupmanagement = ref(null);
const modalType = ref('');
const groupModalTitle = ref({ title: '', type: 0 });
//群公告
const getGroupAnnouncement = computed(() => {
  return store.getters.getGroupDetailMap.get(groupId.value)?.announcement;
});
//弹出群管理相关modal框
const alertManagementModal = (type, groupType) => {
  const titleType = {
    1: '黑名单',
    2: '禁言',
  };
  modalType.value = type;
  groupmanagement.value.dialogVisible = true;
  if (groupType > -1) {
    groupModalTitle.value.title = titleType[groupType];
    groupModalTitle.value.type = groupType;
  }
};
//修改群组名称
const editGroupNameInput = ref(null);
const isEdit = ref(false);
const groupName = ref('');
const groupAvatarInput = ref(null);
const groupExtInput = ref(null);
const isEditGroupAvatar = ref(false);
const isEditGroupExt = ref(false);
const groupAvatar = ref('');
const groupExt = ref('');
const editGroupName = async (type, oldGroupName) => {
  if (type === 'save') {
    if (groupName.value === oldGroupName) return (isEdit.value = false);
    const params = {
      groupId: groupId.value,
      modifyType: 0,
      content: groupName.value,
    };
    try {
      await store.dispatch('modifyGroupInfo', params);
      ElMessage({
        message: '群组名称修改成功~',
        type: 'success',
        center: true,
      });
      isEdit.value = false;
    } catch (error) {
      console.error(error);
      ElMessage({
        message: '群组名称修改失败~',
        type: 'error',
        center: true,
      });
      isEdit.value = false;
    }
  }
  if (type === 'edit') {
    isEdit.value = true;

    nextTick(() => {
      editGroupNameInput.value.focus();
      groupName.value = oldGroupName;
    });
  }
};
const getGroupExtValue = (groupDetail = {}) => {
  return groupDetail.ext || '';
};
const editGroupField = async (type, oldValue, fieldConfig) => {
  if (type === 'edit') {
    fieldConfig.editRef.value = true;
    fieldConfig.valueRef.value = oldValue || '';
    nextTick(() => {
      fieldConfig.inputRef.value?.focus();
    });
    return;
  }
  if (type !== 'save') return;
  if (fieldConfig.valueRef.value === (oldValue || '')) {
    fieldConfig.editRef.value = false;
    return;
  }
  try {
    await store.dispatch('modifyGroupInfo', {
      groupId: groupId.value,
      modifyType: fieldConfig.modifyType,
      content: fieldConfig.valueRef.value,
    });
    ElMessage({
      message: `${fieldConfig.label}修改成功~`,
      type: 'success',
      center: true,
    });
  } catch (error) {
    console.error(`${fieldConfig.label}修改失败`, error);
    ElMessage({
      message: error?.message || `${fieldConfig.label}修改失败`,
      type: 'error',
      center: true,
    });
  } finally {
    fieldConfig.editRef.value = false;
  }
};
const editGroupAvatar = (type, oldValue) =>
  editGroupField(type, oldValue, {
    modifyType: 2,
    label: '群头像',
    valueRef: groupAvatar,
    editRef: isEditGroupAvatar,
    inputRef: groupAvatarInput,
  });
const editGroupExt = (type, oldValue) =>
  editGroupField(type, oldValue, {
    modifyType: 3,
    label: '群扩展信息',
    valueRef: groupExt,
    editRef: isEditGroupExt,
    inputRef: groupExtInput,
  });
//修改我的群组昵称
const editMyGroupNickNameInput = ref(null);
const isEditMyGroupNickname = ref(false);
const myGroupNickname = ref('');
const editMyGroupNickName = async (type, oldMyGroupNickname) => {
  if (type === 'save') {
    if (myGroupNickname.value === oldMyGroupNickname)
      return (isEditMyGroupNickname.value = false);
    const params = {
      groupId: groupId.value,
      nickName: myGroupNickname.value,
    };

    try {
      await store.dispatch('setInTheGroupInfo', params);
      ElMessage({
        message: '本群昵称修改成功~',
        type: 'success',
        center: true,
      });
    } catch (error) {
      ElMessage({
        message: '本群昵称修改失败~',
        type: 'error',
        center: true,
      });
    } finally {
      isEditMyGroupNickname.value = false;
    }
  }
  if (type === 'edit') {
    isEditMyGroupNickname.value = true;

    nextTick(() => {
      editMyGroupNickNameInput.value.focus();
      myGroupNickname.value = oldMyGroupNickname;
    });
  }
};
const inTheGroupNickname = computed(() => {
  const groupIdValue = groupId.value;
  const loginUserValue = getCurrentUserId();
  const groupProfile = store.getters['UsersProfile/getInTheGroupInfo'](
    loginUserValue,
    groupIdValue,
  );
  const myNickname = groupProfile?.nickName;
  return myNickname || '';
});

//退出、解散群组
const quitThisGroup = async () => {
  try {
    await ElMessageBox.confirm(
      '将要从本群退出，确认要退出此群吗？',
      '群组提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
    await store.dispatch('leaveIntheGroup', { groupId: groupId.value });
    ElMessage({
      message: '退出群组成功~',
      type: 'success',
      center: true,
    });
    emits('handleDrawer');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage({
        message: '退出群组失败~',
        type: 'error',
        center: true,
      });
    }
  }
};
const dissolveThisGroup = async () => {
  try {
    await ElMessageBox.confirm(
      '将要将本群解散，确认要解散此群吗？',
      '群组提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'error',
      },
    );
    await store.dispatch('destroyInTheGroup', { groupId: groupId.value });
    ElMessage({
      message: '解散群组成功~',
      type: 'success',
      center: true,
    });
    emits('handleDrawer');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage({
        message: '解散群组失败~',
        type: 'error',
        center: true,
      });
    }
  }
};

//群组黑名单人数
const groupBlacklist = computed(() => {
  return store.getters.getGroupDetailMap.get(groupId.value)?.blacklist;
});
//群组禁言人数
const groupMutelist = computed(() => {
  return store.getters.getGroupDetailMap.get(groupId.value)?.mutelist;
});
const currentGroupDetail = computed(() => {
  return store.getters.getGroupDetailMap.get(groupId.value) || {};
});
const memberCountDisplay = computed(() => {
  return (
    currentGroupDetail.value.memberCount ??
    getGroupDetailFromGroupList.value.memberCount ??
    '-'
  );
});
const maxUsersDisplay = computed(() => {
  return (
    currentGroupDetail.value.maxMembers ??
    getGroupDetailFromGroupList.value.maxMembers ??
    '-'
  );
});
const handleUpdateGroupData = async () => {
  try {
    await store.dispatch('fetchGroupDetailFromServer', [groupId.value]);
  } catch (error) {
    console.error(error);
  }
  //更新群组公告
  if (!getGroupAnnouncement.value && getGroupAnnouncement.value !== '') {
    try {
      await store.dispatch('fetchAnnounmentFromServer', groupId.value);
    } catch (error) {
      console.error(error);
    }
  }
  //获取当前群组内禁言名单或管理员名单（仅群主或管理员有权限调用）
  if (memberRole.value) {
    try {
      !groupBlacklist.value &&
        (await store.dispatch('fetchGroupsBlackListFromServer', groupId.value));
      !groupMutelist.value &&
        (await store.dispatch('fetchGroupsMuteListFromServer', groupId.value));
    } catch (error) {
      console.error(error);
    }
  }
  /* !暂注释此功能调用 */
  // store.dispatch('fetchInTheGroupInfoFromServer', groupId.value);
};
onMounted(() => {
  handleUpdateGroupData();
});
</script>
<template>
  <div class="app_container" v-if="getGroupDetailFromGroupList">
    <!-- 群名称 -->
    <div class="group_func_card group_name">
      <div class="title">
        群名称
        <el-icon
          class="icon"
          v-if="memberRole"
          @click="editGroupName('edit', getGroupDetailFromGroupList.name)"
        >
          <Edit />
        </el-icon>
      </div>
      <div class="content">
        <div v-if="!isEdit">
          {{ getGroupDetailFromGroupList.name || '' }}
        </div>
        <el-input
          v-else
          class="group_name_input"
          ref="editGroupNameInput"
          v-model="groupName"
          size="small"
          maxlength="128"
          show-word-limit
          @blur="editGroupName('save', getGroupDetailFromGroupList.name)"
        >
        </el-input>
      </div>
    </div>
    <el-divider style="margin: 0" />
    <!-- 群头像 -->
    <div class="group_func_card group_avatar">
      <div class="title">
        群头像
        <el-icon
          class="icon"
          v-if="memberRole"
          @click="
            editGroupAvatar(
              'edit',
              currentGroupDetail.avatarUrl ||
                getGroupDetailFromGroupList.avatarUrl,
            )
          "
        >
          <Edit />
        </el-icon>
      </div>
      <div class="content">
        <div v-if="!isEditGroupAvatar">
          {{
            currentGroupDetail.avatarUrl ||
            getGroupDetailFromGroupList.avatarUrl ||
            '暂无群头像~'
          }}
        </div>
        <el-input
          v-else
          class="group_name_input"
          ref="groupAvatarInput"
          v-model="groupAvatar"
          size="small"
          placeholder="请输入群头像 URL"
          @blur="
            editGroupAvatar(
              'save',
              currentGroupDetail.avatarUrl ||
                getGroupDetailFromGroupList.avatarUrl,
            )
          "
        />
      </div>
    </div>
    <el-divider style="margin: 0" />
    <!-- 群描述 -->
    <div class="group_func_card group_description">
      <div class="title">
        群描述
        <el-icon class="icon" @click="alertManagementModal('groupDesc')">
          <Edit v-if="memberRole" />
        </el-icon>
      </div>
      <div class="content">
        {{ getGroupDetailFromGroupList.description || '暂无群描述~' }}
      </div>
    </div>
    <el-divider style="margin: 0" />
    <!-- 群扩展 -->
    <div class="group_func_card group_ext">
      <div class="title">
        群扩展
        <el-icon
          class="icon"
          v-if="memberRole"
          @click="editGroupExt('edit', getGroupExtValue(currentGroupDetail))"
        >
          <Edit />
        </el-icon>
      </div>
      <div class="content">
        <div v-if="!isEditGroupExt">
          {{ getGroupExtValue(currentGroupDetail) || '暂无群扩展~' }}
        </div>
        <el-input
          v-else
          ref="groupExtInput"
          v-model="groupExt"
          maxlength="512"
          show-word-limit
          :autosize="{ minRows: 2, maxRows: 4 }"
          type="textarea"
          placeholder="请输入群扩展信息"
          resize="none"
          @blur="editGroupExt('save', getGroupExtValue(currentGroupDetail))"
        />
      </div>
    </div>
    <el-divider style="margin: 0" />
    <!-- 本地群组昵称 -->
    <!-- !其他端UIKIT暂不支持此设置，因此暂时注释。 -->
    <!-- <div class="group_func_card group_name">
      <div class="title">
        我在本群的昵称
        <el-icon class="icon" @click="editMyGroupNickName('edit', inTheGroupNickname)">
          <Edit />
        </el-icon>
      </div>
      <div class="content">
        <div v-if="!isEditMyGroupNickname">
          {{ inTheGroupNickname || '暂未设置该群昵称' }}
        </div>
        <el-input v-else class="group_name_input" ref="editMyGroupNickNameInput" v-model="myGroupNickname" size="small"
          maxlength="15" show-word-limit @blur="editMyGroupNickName('save', inTheGroupNickname)" />
      </div>
    </div>
    <el-divider style="margin: 0" /> -->
    <!-- 群公告 -->
    <div class="group_func_card group_announcements">
      <div class="title">
        群公告
        <el-icon class="icon" @click="alertManagementModal('announcements')">
          <Edit v-if="memberRole" />
          <View v-else />
        </el-icon>
      </div>
      <div class="content" title="查看更多">
        {{ getGroupAnnouncement || '暂无群公告~' }}
      </div>
    </div>
    <el-divider style="margin: 0" />
    <!-- 群成员 -->
    <div class="group_list_card group_member">
      <div class="label">群成员</div>
      <div class="main">
        <div class="member_count">
          {{
            `${
              memberCountDisplay
            }/${maxUsersDisplay}`
          }}
        </div>
        <div class="more_list" @click="alertManagementModal('groupmembers')">
          <ArrowRight />
        </div>
      </div>
    </div>
    <el-divider style="margin: 0" />
    <div class="group_list_card group_conversation_dnd">
      <div class="label">消息免打扰</div>
      <div class="main">
        <ConversationDndSwitch
          label="消息免打扰"
          :show-label="false"
          :conversation-id="groupId"
          conversation-type="groupChat"
        />
      </div>
    </div>
    <el-divider style="margin: 0" />
    <!-- 群共享文件 -->
    <div class="group_list_card group_shared_files">
      <div class="label">群共享文件</div>
      <div class="main">
        <div class="member_count">上传 / 下载 / 删除</div>
        <div class="more_list" @click="alertManagementModal('sharedFiles')">
          <ArrowRight />
        </div>
      </div>
    </div>
    <el-divider style="margin: 0" />
    <template v-if="memberRole">
      <!-- 黑名单 -->
      <div class="group_list_card group_blacklist">
        <div class="label">黑名单</div>
        <div class="main">
          <div class="member_count">
            {{ groupBlacklist?.length || '暂无' }}
          </div>
          <div
            class="more_list"
            @click="alertManagementModal('groupBlacklist')"
          >
            <ArrowRight />
          </div>
        </div>
      </div>
      <el-divider style="margin: 0" />
      <!-- 禁言名单 -->
      <div class="group_list_card group_mutelist">
        <div class="label">禁言名单</div>
        <div class="main">
          <div class="member_count">
            {{ groupMutelist?.length || '暂无' }}
          </div>
          <div class="more_list" @click="alertManagementModal('groupMutelist')">
            <ArrowRight />
          </div>
        </div>
      </div>
      <el-divider style="margin: 0" />
    </template>
    <!-- 群组操作按钮 -->
    <div class="group_list_handle_box">
      <template
        v-if="getGroupDetailFromGroupList.role === GROUP_ROLE_TYPE.OWNER"
      >
        <el-button
          type="danger"
          class="group_list_card_btn"
          plain
          @click="dissolveThisGroup"
          >解散群组</el-button
        >
      </template>
      <template v-else>
        <el-button
          type="danger"
          class="group_list_card_btn"
          plain
          @click="quitThisGroup"
          >退出群组</el-button
        >
      </template>
    </div>

    <GroupsManagement
      ref="groupmanagement"
      :modalType="modalType"
      :groupModalTitle="groupModalTitle"
      :memberRole="memberRole"
      :groupId="groupId"
    />
  </div>
</template>
<style lang="scss" scoped>
@import './index.scss';
</style>
