<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { CHAT_TYPE } from '@/IM/constant';
import { useGetUserMapInfo } from '@/hooks';
const store = useStore();
const { getGroupAvatarByGroupId, getGroupNameByGroupId } = useGetUserMapInfo();
//点击对应联系人跳转至用户详情页
//群组列表
const joinedGroupList = computed(() => store.getters.getJoinedGroupList);
</script>
<template>
  <div class="joinedGroupItem_container">
    <el-row v-for="groupItem in joinedGroupList" :key="groupItem.groupId">
      <el-col
        class="groupItem_box"
        :span="24"
        @click="
          $emit('toContacts', {
            id: groupItem.groupId,
            chatType: CHAT_TYPE.GROUP,
          })
        "
      >
        <el-avatar
          style="margin-right: 11px"
          :size="33.03"
          :src="getGroupAvatarByGroupId(groupItem.groupId)"
        >
        </el-avatar>
        <span class="group_name">
          {{
            `${getGroupNameByGroupId(groupItem.groupId)}（${
              groupItem.affiliationsCount
            }）`
          }}
        </span>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
.groupItem_box {
  height: 66px;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 0 23px;
  background: #efefef;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  /* identical to box height */
  text-align: center;
  color: #333333;
  cursor: pointer;

  .group_name {
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
.loading_container {
  height: 30px;
  // background: #000;
  color: #333333;
}
</style>
