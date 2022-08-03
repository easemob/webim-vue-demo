<script setup>
import { reactive, toRefs, watch, defineProps, defineEmits } from 'vue'
import EaseIM from '@/IM/initwebsdk'
import { ElNotification } from 'element-plus'
// import { useSDKErrorNotifi } from '@/hooks'
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

const applyAddFriends = () => {
    //todo 此处没有判断是否已经成为好友，目前SDK没有判断是否以为好友的则返回失败的机制，后续可在申请加好友时加上判断。
    if (!applyAddFriendsForm.username) return ElNotification({
        title: '好友操作',
        message: '好友ID不可为空！',
        type: 'warning',
    })
    try {
        EaseIM.conn.addContact(applyAddFriendsForm.username, applyAddFriendsForm.applyFriendMessage);
        ElNotification({
            title: '好友操作',
            message: '好友申请已发送！',
            type: 'success',
        })
    } catch (error) {
        console.log('>>>>>添加失败', error)
    } finally {
        resetTheModalStatus()
    }

}
//监听关闭初始化form内容
watch(dialogVisible, (newVal) => {
    if (!newVal) {
        console.log('>>>>>监听到关闭', newVal)
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
            <el-form-item label="好友ID">
                <el-input class="addFriends_input" v-model.trim="applyAddFriendsForm.username" />
            </el-form-item>
            <el-form-item label="申请信息">
                <el-input class="addFriends_input" v-model="applyAddFriendsForm.applyFriendMessage" maxlength="300"
                    show-word-limit />
            </el-form-item>
            <el-form-item>
                <div class="apply_goups_btn_box">
                    <el-button type="primary" color="#0091FF" class="apply_goups_btn" @click="applyAddFriends">添加好友
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

::v-deep .addFriends_input>.el-input__wrapper {
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