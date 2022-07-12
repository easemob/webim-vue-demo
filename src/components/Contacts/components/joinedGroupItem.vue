<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import defaultGroupAvatarUrl from '@/assets/images/avatar/jiaqun2x.png';
const store = useStore();


//获取当前加入的群组列表
const joinedGroupList = computed(() => store.state.Contacts.groupList)
console.log('>>>>>>joinGropList', joinedGroupList.value)
</script>
<template>
    <div class="joinedGroupItem_container">
        <el-row v-for=" groupItem in  joinedGroupList">
            <el-col class="groupItem_box" :span="24">
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