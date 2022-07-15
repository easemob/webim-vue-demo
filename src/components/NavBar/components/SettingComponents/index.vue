<script setup>
import { ref, toRefs, defineExpose, defineProps } from 'vue'
import CreateGroups from './createGroups.vue'
import ApplyJoinGroups from './applyJoinGroups'
import AddFriends from './addFriends.vue'
const props = defineProps({
    modalType: {
        type: String,
        default: 'createNewGroups'

    }
})
const { modalType } = toRefs(props)
//Title展示
const modalTitle = {
    'createNewGroups': '创建群组',
    'applyJoinGroups': '申请入群',
    'addNewFriend': '添加好友'
}
//匹配不同的modalType展示对应的组件
const showComponent = {
    'createNewGroups': CreateGroups,
    'applyJoinGroups': ApplyJoinGroups,
    'addNewFriend': AddFriends
}
//modal显隐
const dialogVisible = ref(false)
//手动控制dialog关闭
const closeDialogVisible = () => dialogVisible.value = false
defineExpose({
    dialogVisible
})

</script>
<template>
    <el-dialog v-model="dialogVisible" :title="modalTitle[modalType]" width="500px">
        <!-- 动态组件 -->
        <component :is="showComponent[modalType]" @closeDialogVisible="closeDialogVisible"
            :dialogVisible="dialogVisible">
        </component>
    </el-dialog>
</template>
<style lang="scss" scoped>
</style>