<script setup>
import { ref, toRefs, computed, onMounted } from 'vue';
import { EMClient } from '@/IM';
import { Search, Minus, Plus, Select } from '@element-plus/icons-vue';
import { useGetUserMapInfo, useSordedContactsWithPinyin } from '@/hooks';
/* store */
import store from '@/store';
import _ from 'lodash';
import { ElMessageBox } from 'element-plus';
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
console.log('memberRole', memberRole.value);
/* 当前登陆的id */
const loginUserId = computed(() => EMClient.user);
/* 数据获取 */
//群组成员
const getGroupMembersList = computed(() => {
  return store.getters.getGroupMembersMap.get(groupId.value);
});
onMounted(async () => {
  if (!getGroupMembersList.value) {
    store.dispatch('fetchGroupsMemberFromServer', groupId.value);
  }
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
const showGroupsMembersName = computed(() => {
  return (item) => {
    if (item.member) {
      return item.member === loginUserId.value
        ? '我'
        : getUserDisplayNameById(item.member);
    }
    if (item.owner) {
      return item.owner === loginUserId.value
        ? '我【群主】'
        : getUserDisplayNameById(item.owner) + '【群主】';
    }
  };
});
//是否已在群中
const isInGroupMemberList = (hxId) => {
  return getGroupMembersList.value.some((m) => (m.member || m.owner) === hxId);
};
const { sortedFriendListWithRemark } = useSordedContactsWithPinyin();
/**
 * 是否容许邀请加群成员
 * 涉及指标为2
 * @param {Boolean} public 是否为公开群
 * @param {Boolean} allowinvites 是否容许普通群组成员邀请人入群
 * @description 在公开群中，只容许群主管理员邀请人入群，而私有群则可设置是否容许普通群成员邀请人加群。
 */
const isAllowedToInviteMember = computed(() => {
  if (groupDetail.value.public && memberRole.value) {
    return true;
  }
  if (groupDetail.value.public !== true && groupDetail.value.allowinvites) {
    return true;
  }
  if (!groupDetail.value.public && memberRole.value) {
    return true;
  }
  return false;
});
console.log('isAllowedToInviteMember', isAllowedToInviteMember.value);
//邀请成员
const inviteNewMemberInTheGroup = async (hxId) => {
  ElMessageBox.confirm('确定要邀请该成员？', '邀请成员', {
    confirmButtonText: '确认',
    type: 'warning',
    callback: async (action) => {
      if (action === 'confirm') {
        await store.dispatch('inviteUserJoinTheGroup', {
          users: hxId,
          groupId: groupId.value,
        });
      }
    },
  });
};
//移出群成员
const removeTheMember = async (params) => {
  const { member } = params;
  ElMessageBox.confirm('确定要移出该成员？', '移出群成员', {
    confirmButtonText: '确认移出',
    type: 'warning',
    callback: async (action) => {
      if (action === 'confirm') {
        await store.dispatch('removeTheGroupMember', {
          username: member,
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
  const searchSourceData = _.flatMap(
    _.values(sortedFriendListWithRemark.value),
  );
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
                v-for="(sortedItem, key) in sortedFriendListWithRemark"
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
                        v-if="!isInGroupMemberList(item.userId)"
                        type="primary"
                        :icon="Plus"
                        circle
                        size="small"
                        @click="inviteNewMemberInTheGroup(item.userId)"
                      ></el-button>
                      <el-icon v-else class="checked_btn">
                        <Select />
                      </el-icon>
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
                  <template v-if="!groupDetail.public && memberRole">
                    <el-button
                      v-if="!isInGroupMemberList(item.userId)"
                      type="primary"
                      :icon="Plus"
                      circle
                      size="small"
                      @click="inviteNewMemberInTheGroup(item.userId)"
                    ></el-button>
                    <el-icon v-else class="checked_btn">
                      <Select />
                    </el-icon>
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
              `${getGroupMembersList.length}/${groupDetail.maxusers || '500'}`
            }}
          </p>
          <div class="now_exit_group_members">
            <div
              v-for="item in getGroupMembersList"
              :key="item.member || item.owner"
            >
              <div class="friend_user_list">
                <div class="friend_user_list_left">
                  <el-avatar
                    :src="getContactsAvatarById(item.member || item.owner)"
                  ></el-avatar>
                  <b class="friend_list_username">{{
                    showGroupsMembersName(item)
                  }}</b>
                </div>

                <el-button
                  v-if="
                    memberRole && (item.member || item.owner) !== loginUserId
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
      </el-scrollbar>
    </div>
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
</style>
