<template>
  <el-dialog
    custom-class="setting_func_diglog"
    v-model="dialogVisible"
    title="分享名片"
    width="500px"
    @close="onShareDialogClose"
  >
    <el-input
      class="search_friend_input"
      v-model="serachInputValue"
      placeholder="搜索"
      @input="searchFriend"
      :prefix-icon="Search"
    >
    </el-input>
    <el-divider style="margin: top 20px; margin-bottom: 12px" />
    <el-scrollbar height="300px">
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
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialogVisible">取消</el-button>
        <el-button type="primary" @click="sendShareUserCardMessage">
          确认分享
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, toRefs, computed } from 'vue';
import store from '@/store';
import { Search, CircleCheckFilled } from '@element-plus/icons-vue';
import { useGetUserMapInfo, useUserInfoExt } from '@/hooks';
import { EMClient } from '@/IM';
import { CHAT_TYPE, MESSAGE_TYPE } from '@/IM/constant';
import { handleSDKErrorNotifi } from '@/utils/handleSomeData';
const props = defineProps({
  chatType: {
    type: String,
    default: CHAT_TYPE.SINGLE,
    required: true,
  },
  targetId: {
    type: String,
    default: '',
    required: true,
  },
});
const { chatType, targetId } = toRefs(props);
//modal显隐
const dialogVisible = ref(false);
const closeDialogVisible = () => (dialogVisible.value = false);
//监听到dialog关闭
const onShareDialogClose = () => {
  closeDialogVisible();
  searchResultList.value = [];
  serachInputValue.value = '';
  shareContactUserId.value = '';
};
const { getContactsAvatarById, getContactsNickNameById } = useGetUserMapInfo();
const shareContactUserId = ref('');
//是否选中
const isInCheckedContactList = computed(() => {
  return (userId) => {
    return shareContactUserId.value.includes(userId);
  };
});
const onClickCheckedBtn = (userId) => {
  shareContactUserId.value = userId;
};
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
/* 发送个人名片 */
const getUserInfos = () => {
  if (!shareContactUserId.value) return;
  const userInfo =
    store.getters.getContactsUserInfosMap.get(shareContactUserId.value) || {};
  return userInfo;
};
const { setUserInfoExt } = useUserInfoExt();
const sendShareUserCardMessage = async () => {
  const msgOptions = {
    type: MESSAGE_TYPE.CUSTOM,
    to: targetId.value,
    chatType: chatType.value,
    customEvent: 'userCard',
    customExts: {
      uid: shareContactUserId.value,
      ...getUserInfos(),
    },
  };
  //在消息体内携带该用户的昵称头像信息
  setUserInfoExt(msgOptions);
  try {
    const msg = EMClient.Message.create(msgOptions);
    const { message } = await EMClient.send(msg);
    console.log('message', message);
    await store.dispatch('senedShowTypeMessage', message);
  } catch (error) {
    console.error('发送信息卡片消息失败', error);
    handleSDKErrorNotifi(error.type, error.message);
  } finally {
    closeDialogVisible();
    searchResultList.value = [];
    serachInputValue.value = '';
    shareContactUserId.value = '';
  }
};
defineExpose({
  dialogVisible,
});
</script>

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
</style>
