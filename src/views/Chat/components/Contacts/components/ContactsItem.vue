<script setup>
import { useStore } from 'vuex';
// import router from '@/router'
import { CHAT_TYPE } from '@/IM/constant';
import { useSordedContactsWithPinyin, useGetUserMapInfo } from '@/hooks';
/* store */
const store = useStore();

//点击对应联系人跳转至用户详情页
//获取处理排序后的好友列表
const { sortedFriendListWithRemark } = useSordedContactsWithPinyin();
const { getContactsNickNameById, getContactsAvatarById } = useGetUserMapInfo();
</script>

<template>
  <div class="friendItem_container">
    <div
      v-for="(friendName, friendItemKey) in sortedFriendListWithRemark"
      :key="friendItemKey"
    >
      <div class="friend_main">
        <div class="friend_title">
          <p>
            {{ friendItemKey === ' ' ? '#' : friendItemKey.toUpperCase() }}
          </p>

          <el-divider style="margin: 0" />
        </div>

        <el-row>
          <el-col
            class="friendItem_box"
            :span="24"
            v-for="{ userId } in friendName"
            :key="userId"
            @click="
              $emit('toContacts', {
                id: userId,
                chatType: CHAT_TYPE.SINGLE,
              })
            "
          >
            <el-avatar
              style="margin-right: 11px"
              :size="33.03"
              :src="getContactsAvatarById(userId)"
            >
            </el-avatar>
            <span class="friend_name">
              {{ getContactsNickNameById(userId) }}
            </span>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.friendItem_box {
  height: 66px;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  // background: #000;
  padding: 0 22px;
  background: #efefef;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  /* identical to box height */
  text-align: center;
  color: #333333;
  cursor: pointer;

  .friend_name {
    display: inline-block;
    text-align: left;
    width: 80%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    background: #dcdcdc;
  }
}

.friend_main {
  width: 100%;

  .friend_title {
    width: 100%;
    height: 32px;
    mix-blend-mode: normal;
    opacity: 0.21;
    font-size: 14px;
    padding-left: 23px;
    font-weight: 400;
    font-size: 12px;
    line-height: 32px;
    letter-spacing: 0.342857px;
  }
}
</style>
