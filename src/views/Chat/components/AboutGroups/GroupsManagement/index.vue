<script setup>
import { ref, toRefs } from 'vue'
import GroupDesc from './GoupDesc.vue'
import GroupAnnoun from './GroupAnnoun.vue'
import GroupSomeList from './GroupSomeList.vue'
import GroupMembers from './GroupMembers.vue'
const props = defineProps({
    modalType: {
        type: String,
        required: true,
        default: 'groupDesc'
    },
    groupModalTitle: {
        type: Object,
        required: true,
        default: () => ({ title: '', type: 0 })
    },
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
const dialogVisible = ref(false)
defineExpose({
    dialogVisible
})
const { modalType, groupModalTitle } = toRefs(props)

const diffModal = {
    'groupDesc': {
        'width': '480px',
        'title': '群描述',
        'components': GroupDesc
    },
    'announcements': {
        'width': '480px',
        'title': '群公告',
        'components': GroupAnnoun
    },
    'groupmembers': {
        'width': '840px',
        'title': '群成员',
        'components': GroupMembers
    },
    'groupsomelist': {
        'width': '840px',
        'components': GroupSomeList
    },

}

//完成事件
const groupModalComp = ref(null)
const save = () => {
    console.log('>>>>>调用了保存', groupModalComp.value)
    if (groupModalComp.value && groupModalComp.value.saveHandleMembers) {
        groupModalComp.value.saveHandleMembers()
    }
    dialogVisible.value = false
}
</script>
<template>
    <el-dialog v-model="dialogVisible" :destroy-on-close="true"
        :title="diffModal[modalType] && diffModal[modalType].title || groupModalTitle.title"
        :width="diffModal[modalType] && diffModal[modalType].width">
        <component ref="groupModalComp" :is="diffModal[modalType] && diffModal[modalType].components"
            :groupModalTitle="groupModalTitle" :memberRole="memberRole" :groupDetail="groupDetail" @save="save">
        </component>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="save">完成</el-button>
            </span>
        </template>
    </el-dialog>
</template>


<style lang="scss" scoped>
::v-deep .el-dialog>.el-dialog__body {
    padding: 0;
}
</style>