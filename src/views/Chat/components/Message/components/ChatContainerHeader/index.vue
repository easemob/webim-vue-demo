<script setup>
import { toRefs, computed } from 'vue'
import UserStatus from '@/components/UserStatus'
import { CHAT_TYPE } from '@/constant'
import store from '@/store'
const props = defineProps({
    routeQueryData: {
        type: Object,
        default: () => ({
            id: '',
            chatType: CHAT_TYPE.SINGLE
        }),
        required: true
    }
})
const { routeQueryData } = toRefs(props)
//处理获取单人用户昵称等信息。
const presonUserInfo = computed(() => {
    return store.getters.getFriendList[routeQueryData.value.id] ?? {}
})
//获取个人在线状态信息
const getPersonUserStatus = computed(() => {
    return presonUserInfo.value?.userStatus ?? {}
})

//获取群组相关信息

const groupDetail = computed(() => {
    const groupDetail = store.getters.getJoinedGroupList.filter((item) => {
        if (item.groupId === routeQueryData.value.id) {
            return item
        }
    })
    return groupDetail[0] ?? {}
})
</script>
<template>
    <el-header class="chat_message_header">
        <template v-if="routeQueryData.chatType === CHAT_TYPE.SINGLE">
            <div class="chat_user_box">
                <span class="chat_user_name">
                    {{ presonUserInfo?.nickname || routeQueryData.id }}</span
                >
                <UserStatus :userStatus="getPersonUserStatus" />
            </div>
        </template>
        <template v-if="routeQueryData.chatType === CHAT_TYPE.GROUP">
            <div class="chat_user_box">
                <span class="chat_user_name">
                    {{ groupDetail.groupName || '' }}
                    {{ `(${groupDetail?.affiliationsCount || ''})` }}
                </span>
            </div>
        </template>
        <slot name="more"></slot>
    </el-header>
</template>

<style lang="scss" scoped>
@import './index.scss';
</style>
