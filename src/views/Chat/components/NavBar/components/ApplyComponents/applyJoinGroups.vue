<script setup>
import { reactive, toRefs, watch, defineProps, defineEmits } from 'vue'
import EaseIM from '@/IM/initwebsdk'
import { ElNotification, ElMessage } from 'element-plus'
import { handleSDKErrorNotifi } from '@/utils/handleSomeData'
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
//判断是否为公开群
const getTheGroupIsPublic = async (groupId) => {
    console.log('groupId', groupId);
    try {
        let res = await EaseIM.conn.getGroupInfo({ groupId: groupId + '' })
        console.log('>>>>获取成功', res);
        return Promise.resolve(res)
    } catch (error) {
        console.log('>>>>>>>获取群组信息失败');
    }

}
const joinGroups = async () => {
    if (!applyJoinGroupsForm.groupId) return ElNotification({
        title: '申请入群',
        message: '群组ID不可为空',
        type: 'warning',
    })
    //如果获取到期群组详情中的public为false代表为私有群（私有群不可主动申请加入）
    let res = await getTheGroupIsPublic(applyJoinGroupsForm.groupId)
    console.log('res', res);
    if (res && res?.data && res.data[0]?.public === false) return ElNotification({
        title: '申请入群',
        message: '该群为私有群不可主动申请！',
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
        const { type, data } = error
        if (error.data) {
            if (JSON.parse(data).error_description.includes('blacklist')) {
                handleSDKErrorNotifi(type, 'blacklist')
            } else if (JSON.parse(data).error_description.includes('already')) {
                handleSDKErrorNotifi(type, 'already')
            } else {
                handleSDKErrorNotifi(type, JSON.parse(data).error_description)
            }
        } else {
            console.log(error)
            handleSDKErrorNotifi(null, '未知错误！')
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
            <el-form-item label="群组ID" style="margin-bottom: 20px">
                <el-input class="applyJoinGoups_input" style="height:40px"
                    v-model.number="applyJoinGroupsForm.groupId" />
            </el-form-item>
            <el-form-item label="验证信息" style="margin-bottom: 28px">
                <el-input class="applyJoinGoups_input" style="height:40px"
                    v-model="applyJoinGroupsForm.applyJoinMessage" maxlength="150" show-word-limit />
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

.applyJoinGoups_input {
    height: 40px;
}

::v-deep .applyJoinGoups_input>.el-input__wrapper {
    border-radius: 5px;
}
</style>