<script setup>
import { ref, toRefs } from 'vue';
import GroupDesc from './GoupDesc.vue';
import GroupAnnoun from './GroupAnnoun.vue'
import GroupSomeList from './GroupSomeList.vue'
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
    }
})
const dialogVisible = ref(false);
const closeDialogVisible = () => dialogVisible.value = false
defineExpose({
    dialogVisible
})
const { modalType, groupModalTitle } = toRefs(props)

let diffModal = {
    'groupDesc': {
        'width': '480px',
        'title': '群详情',
        'components': GroupDesc
    },
    'announcements': {
        'width': '480px',
        'title': '群公告',
        'components': GroupAnnoun
    },
    'groupsomelist': {
        'width': '840px',
        'components': GroupSomeList
    }
}


</script>
<template>
    <el-dialog v-model="dialogVisible"
        :title="diffModal[modalType] && diffModal[modalType].title || groupModalTitle.title"
        :width="diffModal[modalType] && diffModal[modalType].width">
        <component :is="diffModal[modalType] && diffModal[modalType].components" :groupModalTitle="groupModalTitle">
        </component>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="dialogVisible = false">完成</el-button>
            </span>
        </template>
    </el-dialog>
</template>


<style lang="scss" scoped>
</style>