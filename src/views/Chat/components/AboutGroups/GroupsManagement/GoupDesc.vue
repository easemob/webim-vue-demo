<script setup>
import { ref, toRefs, nextTick } from "vue"
import { ElMessage } from 'element-plus';
import store from '@/store'
const props = defineProps({
    memberRole: {
        type: Boolean,
        required: true,
        default: false
    },
    groupDetail: {
        type: Object,
        required: true,
        default: () => ({})
    }
})
const { groupDetail } = toRefs(props)
const introduceRef = ref(null)
const isEdit = ref(false)
let groupDescValue = ref('');
const editGroupsDesc = async (type, oldGroupDesc) => {
    if (type === 'edit') {
        isEdit.value = true
        nextTick(() => {
            introduceRef.value.focus()
        })
        groupDescValue.value = oldGroupDesc
    }
    if (type === 'save') {
        if (groupDescValue.value === oldGroupDesc) return isEdit.value = false
        let params = {
            groupid: groupDetail.value.id,
            modifyType: 1,
            content: groupDescValue.value
        }
        try {
            console.log('>>>>>保存编辑')
            await store.dispatch('modifyGroupInfo', params)
            ElMessage({
                message: '群组详情修改成功~',
                type: 'success',
                center: true,
            })
            isEdit.value = false
        } catch (error) {
            ElMessage({
                message: '群组详情修改失败~',
                type: 'error',
                center: true,
            })
            isEdit.value = false
        }

    }
}

</script>
<template>
    <div class="app_container">
        <p class="group_desc" v-if="!isEdit" @click="editGroupsDesc('edit', groupDetail.description)">
            {{ groupDetail.description || '暂无群描述' }}
        </p>
        <el-input v-if="isEdit" v-model="groupDescValue" ref="introduceRef" maxlength="50" show-word-limit
            :autosize="{ minRows: 2, maxRows: 4 }" type="textarea" class="notice_detail" placeholder="请输入群组详情~"
            resize="none" @blur="editGroupsDesc('save', groupDetail.description)" />
    </div>
</template>
<style lang="scss" scoped>
.notice_detail {
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 20px;
    color: #606266;
    width: 440px;
}

.group_desc {
    cursor: pointer;
}

::v-deep .el-textarea__inner {
    border-radius: 5px;
}
</style>