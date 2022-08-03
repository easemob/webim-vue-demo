<script setup>
import { computed } from 'vue'
import { useStore } from "vuex"
// import router from '@/router'
import { messageType } from '@/constant'
/* 默认头像 */
import defaultAvatar from '@/assets/images/avatar/theme2x.png'
/* store */
const store = useStore()

//处理friendList进行分类处理
const classifyFriendList = computed(() => store.state.Contacts.sortedFriendList)
//点击对应联系人跳转至用户详情页
const { CHAT_TYPE } = messageType
</script>

<template>
    <div class="friendItem_container">
        <div v-for="(friendName, friendItemKey) in  classifyFriendList" :key="friendItemKey">
            <div class="friend_main">
                <div class="friend_title">{{ friendItemKey === ' ' ? '#' : friendItemKey.toUpperCase() }}</div>
                <el-row>
                    <el-col class="friendItem_box" :span="24" v-for="item in friendName" :key="item.hxId"
                        @click="$emit('toContacts', { id: item.hxId, chatType: CHAT_TYPE.SINGLE })">
                        <el-avatar style="margin-right: 10px;" :src="item.avatarurl ? item.avatarurl : defaultAvatar">
                        </el-avatar>
                        {{ item.nickname ? item.nickname : item.hxId }}
                    </el-col>
                </el-row>
            </div>
        </div>
    </div>
</template>



<style lang="scss" scoped>
.friendItem_box {
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

.friend_main {
    width: 100%;

    .friend_title {
        font-size: 14px;
        padding: 0 15px;
    }
}
</style>