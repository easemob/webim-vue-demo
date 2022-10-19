<script setup>
import { ref, computed, toRefs } from 'vue';
import { useStore } from 'vuex'
/* store */
const store = useStore()
/* props */
const props = defineProps({
    groupId: {
        type: [Number, String],
        required: true,
        default: 0
    }
})
const { groupId } = toRefs(props)
/* emits */
const emits = defineEmits(['sendMulitInviteMsg'])
const dialogVisible = ref(false)
const members = computed(() => {
    return store.state.Groups.groupsInfos[groupId.value].members ?? []
})
/* 处理选中members */
const checkedCities = ref(['Beijing'])
const cities = ['Shanghai', 'Beijing', 'Guangzhou', 'Shenzhen']
const confirmInvite = () => {
    emits('sendMulitInviteMsg')
    dialogVisible.value = false
}

defineExpose({
    dialogVisible
})
</script>
<template>
    <el-dialog v-model="dialogVisible" title="邀请入会" width="50%">
        <el-checkbox-group v-model="checkedCities">
            <el-checkbox v-for="city in cities" :key="city" :label="city">{{
            city
            }}</el-checkbox>
        </el-checkbox-group>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="confirmInvite">邀请</el-button>
            </span>
        </template>
    </el-dialog>
</template>
<style lang="scss" scoped>

</style>