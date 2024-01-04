<script setup>
import {
    reactive,
    toRefs,
    watch,
    computed,
    defineProps,
    defineEmits
} from 'vue'
import store from '@/store'
import { EMClient } from '@/IM'
import { ElNotification } from 'element-plus'
const props = defineProps({
    dialogVisible: {
        type: Boolean,
        default: false
    }
})
const { dialogVisible } = toRefs(props)
const emit = defineEmits(['closeDialogVisible'])
const applyAddFriendsForm = reactive({
    username: '',
    applyFriendMessage: ''
})
const friendList = computed(() => store.state.Contacts.friendList)

const applyAddFriends = () => {
    if (!applyAddFriendsForm.username)
        return ElNotification({
            title: '好友操作',
            message: '好友ID不可为空！',
            center: true,
            type: 'warning'
        })
    if (Object.keys(friendList.value).includes(applyAddFriendsForm.username))
        return ElNotification({
            title: '好友操作',
            message: '该ID已成为您的好友！',
            center: true,
            type: 'warning'
        })
    if (applyAddFriendsForm.username === EMClient.user)
        return ElNotification({
            title: '好友操作',
            message: '不可添加自己为好友！',
            center: true,
            type: 'warning'
        })
    try {
        EMClient.addContact(
            applyAddFriendsForm.username,
            applyAddFriendsForm.applyFriendMessage
        )
        ElNotification({
            title: '好友操作',
            message: '好友申请已发送！',
            type: 'success'
        })
    } catch (error) {
    } finally {
        resetTheModalStatus()
    }
}
//监听关闭初始化form内容
watch(dialogVisible, (newVal) => {
    if (!newVal) {
        resetTheModalStatus()
    }
})
const resetTheModalStatus = () => {
    applyAddFriendsForm.username = ''
    applyAddFriendsForm.applyFriendMessage = ''
    emit('closeDialogVisible')
}
</script>
<template>
    <div class="app_container">
        <el-form label-position="top" label-width="100px">
            <el-form-item label="好友ID" style="margin-bottom: 20px">
                <el-input
                    class="addFriends_input"
                    v-model.trim="applyAddFriendsForm.username"
                    placeholder="请输入对方的环信ID"
                />
            </el-form-item>
            <el-form-item label="申请信息" style="margin-bottom: 28px">
                <el-input
                    class="addFriends_input"
                    v-model="applyAddFriendsForm.applyFriendMessage"
                    maxlength="150"
                    show-word-limit
                />
            </el-form-item>
            <el-form-item>
                <div class="apply_goups_btn_box">
                    <el-button
                        type="primary"
                        color="#0091FF"
                        class="apply_goups_btn"
                        @click="applyAddFriends"
                        >添加好友
                    </el-button>
                </div>
            </el-form-item>
        </el-form>
    </div>
</template>

<style lang="scss" scoped>
.addFriends_input {
    height: 40px;
}

:deep(.addFriends_input) > .el-input__wrapper {
    border-radius: 5px;
}

.apply_goups_btn_box {
    width: 100%;
    height: 50px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;

    .apply_goups_btn {
        width: 212px;
        height: 40px;
    }
}
</style>
