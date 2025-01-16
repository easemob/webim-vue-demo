<script setup>
import { ref, reactive, computed, toRefs, watch } from 'vue';
import { useStore } from 'vuex';
import _ from 'lodash';
import { ElNotification } from 'element-plus';
import { handleSDKErrorNotifi } from '@/utils/handleSomeData';
import { EMClient } from '@/IM';
import { CHAT_TYPE } from '@/IM/constant';
import { Search, CircleCheckFilled } from '@element-plus/icons-vue';
import { useGetUserMapInfo } from '@/hooks';
/* 路由 */
import router from '@/router';
const emit = defineEmits(['closeDialogVisible']);
const props = defineProps({
  dialogVisible: {
    type: Boolean,
    default: false,
  },
});
const { dialogVisible } = toRefs(props);
const store = useStore();

const nextStep = ref(0); //下一步
const renderFriendList = ref([]);
const checkedContactList = ref([]);
//是否选中
const isInCheckedContactList = computed(() => {
  return (userId) => {
    return checkedContactList.value.includes(userId);
  };
});
const onClickCheckedBtn = (userId) => {
  if (checkedContactList.value.includes(userId)) {
    checkedContactList.value = _.pull(checkedContactList.value, userId);
  } else {
    checkedContactList.value.push(userId);
  }
};
/* 好友数据处理逻辑 */
const { getContactsAvatarById, getContactsNickNameById } = useGetUserMapInfo();
const getContactsWithRemarkList = computed(() => [
  ...store.getters.getContactsWithRemarkMap.values(),
]);

/* 搜索逻辑 */
//创建用户搜索部分
const serachInputValue = ref('');
const searchResultList = ref([]);
const searchFriend = () => {
  if (serachInputValue.value) {
    const resultArr = _.filter(getContactsWithRemarkList.value, (v) =>
      getContactsNickNameById(v.userId).includes(serachInputValue.value),
    );
    searchResultList.value = resultArr;
  }
};
/* 创建群组form */
//创建群组群组所用参数
const groupCreateForm = reactive({
  groupname: '',
  desc: '',
  members: [],
  public: true,
  approval: true,
  allowinvites: true,
  inviteNeedConfirm: true,
  maxusers: 200,
});
//监听关闭初始化form内容
watch(dialogVisible, (newVal) => {
  if (!newVal) {
    _.assign(groupCreateForm, sourceForm());
  }
});
const sourceForm = () => {
  return {
    groupname: '',
    desc: '',
    members: [],
    public: true,
    approval: true,
    allowinvites: true,
    inviteNeedConfirm: true,
    maxusers: 200,
  };
};
//创建群组
const createNewGroups = async () => {
  groupCreateForm.members = checkedContactList.value;
  if (groupCreateForm.groupname === '')
    return ElNotification.error('请设置群组名称！');
  try {
    const { data } = await EMClient.createGroup({
      data: { ...groupCreateForm },
    });
    //更新群组列表
    await store.dispatch('fetchJoinedGroupListFromServer', {
      startPageNum: 0,
    });
    ElNotification({
      title: '群组操作',
      message: `${groupCreateForm.groupname}创建成功！`,
      type: 'success',
    });
    router.push({
      path: '/chat/conversation/message',
      query: { id: data.groupid, chatType: CHAT_TYPE.GROUP },
    });
    store.dispatch('createInformMessage', {
      from: EMClient.user,
      to: data.groupid,
      chatType: CHAT_TYPE.GROUP,
      msg: `您的群组，【${groupCreateForm.groupname}】创建成功,聊两句吧！`,
    });
    resetTheModalStatus();
  } catch (error) {
    if (error && error.type && error.message) {
      const errorDesc = JSON.parse(error.message);
      handleSDKErrorNotifi(error.type, errorDesc.error_description);
    } else {
      handleSDKErrorNotifi(null, '未知错误');
    }
  }
};

//重置创建群Modal
const resetTheModalStatus = () => {
  nextStep.value = 0;
  serachInputValue.value = '';
  searchResultList.value = [];
  emit('closeDialogVisible');
};
</script>
<template>
  <div class="app_container">
    <el-row v-if="nextStep === 0">
      <el-col class="search_friend_box">
        <el-input
          class="search_friend_input"
          v-model="serachInputValue"
          placeholder="搜索"
          @input="searchFriend"
          :prefix-icon="Search"
        >
        </el-input>
        <el-divider style="margin: top 20px; margin-bottom: 12px" />
      </el-col>
      <el-col class="create_modal_main">
        <el-scrollbar>
          <div
            v-for="(contactItem, index) in !serachInputValue
              ? getContactsWithRemarkList
              : searchResultList"
            :key="contactItem.userId"
          >
            <div class="friend_user_list">
              <div class="friend_user_list_left">
                <el-avatar
                  :src="getContactsAvatarById(contactItem.userId)"
                ></el-avatar>
                <b class="friend_list_username">{{
                  getContactsNickNameById(contactItem.userId)
                }}</b>
              </div>
              <el-icon
                class="checked_btn"
                @click="onClickCheckedBtn(contactItem.userId)"
              >
                <CircleCheckFilled
                  v-if="isInCheckedContactList(contactItem.userId)"
                  class="checked_icon"
                />
                <span v-else class="unChecked_icon"></span>
              </el-icon>
            </div>
            <el-divider style="margin: 12px 0" />
          </div>
        </el-scrollbar>
      </el-col>
      <el-col class="create_friend_footer">
        <span
          ><b class="checked_text">{{ checkedContactList.length }}</b>
          人被选中</span
        >
        <el-button class="next_btn" plain @click="nextStep = 1"
          >下一步</el-button
        >
      </el-col>
    </el-row>
    <el-row v-else>
      <el-form
        class="create_groups__main"
        ref="groupCreate"
        :mode="groupCreateForm"
        label-position="left"
      >
        <el-form-item label="群名称">
          <el-input
            class="create_groups"
            v-model="groupCreateForm.groupname"
            size="large"
            placeholder="群组名称..."
          />
        </el-form-item>
        <el-form-item label="群详情">
          <el-input
            class="create_groups"
            v-model="groupCreateForm.desc"
            maxlength="300"
            placeholder="群组描述..."
            show-word-limit
            type="text"
          />
        </el-form-item>
        <el-form-item label="群人数">
          <el-input
            class="create_groups"
            v-model="groupCreateForm.maxusers"
            type="number"
            min="200"
            max="1000"
            :step="100"
            size="large"
          />
        </el-form-item>
        <el-form-item label="公开群">
          <el-switch
            v-model="groupCreateForm.public"
            inactive-color="#DCDFE5"
            inline-prompt
            active-text="是"
            inactive-text="否"
          />
        </el-form-item>
        <el-form-item label="需要审批">
          <el-switch
            v-model="groupCreateForm.approval"
            inactive-color="#DCDFE5"
            inline-prompt
            active-text="是"
            inactive-text="否"
          />
        </el-form-item>
        <el-form-item v-if="!groupCreateForm.public" label="成员邀请他人入群">
          <el-switch
            :disabled="groupCreateForm.public"
            v-model="groupCreateForm.allowinvites"
            inactive-color="#DCDFE5"
            active-text="允许群成员邀请"
            inactive-text="仅限群主"
          />
        </el-form-item>
        <el-form-item label="被邀请需要同意">
          <el-switch
            v-model="groupCreateForm.inviteNeedConfirm"
            inactive-color="#DCDFE5"
            inline-prompt
            active-text="是"
            inactive-text="否"
          />
        </el-form-item>
      </el-form>
      <el-row class="create_groups_btn" justify="space-around" align="middle">
        <el-col class="lastStep" :span="12" style="text-align: left">
          <el-button @click="nextStep = 0">上一步</el-button>
        </el-col>
        <el-col class="lastStep" :span="12" style="text-align: right">
          <el-button type="primary" @click="createNewGroups"
            >创建群组</el-button
          >
        </el-col>
      </el-row>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
:deep(.search_friend_input) > .el-input__wrapper {
  background: #f7f7f7;
  box-shadow: none;
}

.search_friend_box {
  position: relative;

  .search_friend_input {
    height: 40px;
  }

  .search_friend_box_content {
    position: absolute;
    left: 0;
    top: 50px;
    width: 100%;
    min-height: 280px;
    max-height: 80%;
    overflow-y: auto;
    background: #fff;
    z-index: 99;
  }
}

.create_modal_main {
  height: 280px;
  max-height: 300px;
  overflow-y: auto;
}

.friend_user_list {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

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
      color: #333;
    }
  }

  .checked_btn {
    width: 20px;
    height: 20px;
    cursor: pointer;

    .checked_icon {
      font-size: 20px;
      color: #3f8ff7;
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

.create_friend_footer {
  height: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;

  .checked_text {
    font-weight: 600;
    font-size: 12px;
    line-height: 17px;
    letter-spacing: 0.3px;
    color: #5a5a5a;
  }

  .next_btn {
    width: 124px;
    height: 40px;
    --el-button-text-color: var(--el-color-primary);
    --el-button-border-color: var(--el-color-primary);
  }
}

.create_groups__main {
  width: 100%;
  padding: 0 59px;
}

.create_groups_btn {
  width: 100%;
  height: 50px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

/* 改掉当前组件 el-form-item的部分默认样式 */
:deep(.el-form-item__content) {
  justify-content: flex-end;
}

:deep(.create_groups) > .el-input__wrapper {
  border-radius: 5px;
  height: 40px;
}
</style>
