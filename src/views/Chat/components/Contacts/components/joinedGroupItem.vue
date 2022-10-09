<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import defaultGroupAvatarUrl from '@/assets/images/avatar/jiaqun2x.png'
import { messageType } from '@/constant'
const store = useStore()

//点击对应联系人跳转至用户详情页
const { CHAT_TYPE } = messageType
//获取当前加入的群组列表
const joinedGroupList = computed(() => store.state.Contacts.groupList)
</script>
<template>
    <div class="joinedGroupItem_container">
        <el-row v-for=" groupItem in  joinedGroupList" :key="groupItem.groupid">
            <el-col class="groupItem_box" :span="24"
                @click="$emit('toContacts', { id: groupItem.groupid, chatType: CHAT_TYPE.GROUP })">
                <el-avatar style="margin-right: 11px;" :size="33.03" :src="defaultGroupAvatarUrl">
                </el-avatar>
                <span class="group_name">
                    {{ groupItem.groupname }}
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
    background: #EFEFEF;
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
        background: #DCDCDC;
    }
}
</style>