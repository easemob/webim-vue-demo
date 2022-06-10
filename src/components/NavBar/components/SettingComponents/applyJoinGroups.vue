<script setup>
import { reactive, toRefs, watch, defineProps, defineEmits } from 'vue'
import EaseIM from '@/IM/initwebsdk'
import { ElNotification } from 'element-plus'
import { useSDKErrorNotifi } from '@/hooks'
const props = defineProps({
    dialogVisible: {
        type: Boolean,
        default: false
    }
})
const { dialogVisible } = toRefs(props)
const emit = defineEmits(['closeDialogVisible'])
const applyJoinGroupsForm = reactive({
    groupId: '',
    applyJoinMessage: ''
})

const joinGroups = async () => {
    if (!applyJoinGroupsForm.groupId) return ElNotification({
        title: '群组操作',
        message: '群组ID不可为空',
        type: 'warning',
    })
    let options = {
        groupId: applyJoinGroupsForm.groupId + '',         // 群组ID
        message: applyJoinGroupsForm.applyJoinMessage       // 请求信息
    };
    try {
        await EaseIM.conn.joinGroup(options)
        ElNotification({
            title: '群组操作',
            message: '群申请已发送！',
            type: 'success',
        })
    } catch (error) {
        if (error.data) {
            const { type, data } = error
            useSDKErrorNotifi(type, JSON.parse(data).error)
        } else {
            console.log(error)
            useSDKErrorNotifi(null, '未知错误！')
        }
    } finally {
        resetTheModalStatus()
        console.log('>>>>执行重置表单')
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
    applyJoinGroupsForm.groupId = ''
    applyJoinGroupsForm.applyJoinMessage = ''
    emit('closeDialogVisible')
}
</script>
<template>
    <div class="app_container">
        <el-form label-position="top" label-width="100px">
            <el-form-item label="群组ID">
                <el-input style="height:40px" v-model.number="applyJoinGroupsForm.groupId" />
            </el-form-item>
            <el-form-item label="验证信息">
                <el-input style="height:40px" v-model="applyJoinGroupsForm.applyJoinMessage" maxlength="300"
                    show-word-limit />
            </el-form-item>
            <el-form-item>
                <div class="apply_goups_btn_box">
                    <el-button type="primary" color="#0091FF" class="apply_goups_btn" @click="joinGroups">申请加入
                    </el-button>
                </div>
            </el-form-item>
        </el-form>

    </div>
</template>
<style lang="scss" scoped>
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