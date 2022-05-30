<script setup>
import { ref, toRefs, onUnmounted, defineExpose, defineProps } from 'vue'
import CreateGroups from './createGroups.vue'
const props = defineProps({
    modalType: {
        type: String,
        default: 'createNewGroups'

    }
})
const { modalType } = toRefs(props)
const modalTitle = {
    'createNewGroups': '创建群组',
    'applyJoinGroups': '申请入群',
    'addNewFriend': '添加好友'
}
const dialogVisible = ref(false)
const closeDialogVisible = () => dialogVisible.value = false
defineExpose({
    dialogVisible
})

</script>
<template>

    <el-dialog v-model="dialogVisible" :title="modalTitle[modalType]" width="40%">

        <!-- <span>This is a message</span>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogVisible = false">Cancel</el-button>
                <el-button type="primary" @click="dialogVisible = false">Confirm</el-button>
            </span>
        </template> -->
        <CreateGroups @closeDialogVisible="closeDialogVisible" :dialogVisible="dialogVisible" />
    </el-dialog>
</template>
<style lang="scss" scoped>
</style>