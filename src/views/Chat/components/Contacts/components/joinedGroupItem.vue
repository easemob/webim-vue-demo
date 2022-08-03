<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import defaultGroupAvatarUrl from '@/assets/images/avatar/jiaqun2x.png';
import { messageType } from '@/constant'
const store = useStore();

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
                <el-avatar style="margin-right: 10px;" :src="defaultGroupAvatarUrl">
                </el-avatar>
                {{ groupItem.groupname }}
            </el-col>
        </el-row>
    </div>
</template>



<style lang="scss" scoped>
.groupItem_box {
    height: 80px;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    // background: #000;
    padding: 0 15px;
    background: #EFEFEF;

    &:active {
        background: #DCDCDC;
    }
}
</style>