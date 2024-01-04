<script setup>
import { ref, toRefs, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
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
const { memberRole, groupDetail } = toRefs(props)
const goupsInfos = computed(() => {
    return (
        groupDetail.value.id &&
        store.state.Groups.groupsInfos[groupDetail.value.id]
    )
})
const announcementRef = ref(null)
const isEdit = ref(false)
const announcmentValue = ref('')
const editAnnouncment = async (type, oldAnnouncment) => {
    if (type === 'edit') {
        isEdit.value = true
        nextTick(() => {
            announcementRef.value.focus()
        })
        announcmentValue.value = oldAnnouncment
    }
    if (type === 'save') {
        if (announcmentValue.value === oldAnnouncment)
            return (isEdit.value = false)

        const params = {
            groupId: groupDetail.value.id,
            announcement: announcmentValue.value
        }
        try {
            store.dispatch('modifyGroupAnnouncement', params)
            ElMessage({
                message: '群组详情修改成功~',
                type: 'success',
                center: true
            })
            isEdit.value = false
        } catch (error) {
            ElMessage({
                message: '群组详情修改失败，请稍后重试~',
                type: 'error',
                center: true
            })
            isEdit.value = false
        }
    }
}
onMounted(() => {
    nextTick(() => {
        editAnnouncment('edit', goupsInfos.value.announcement)
    })
})
</script>
<template>
    <div class="app_container">
        <!-- 群主及管理员可编辑 -->
        <template v-if="memberRole">
            <p
                v-if="!isEdit"
                @click="editAnnouncment('edit', goupsInfos.announcement)"
            >
                {{ goupsInfos.announcement || '暂无群公告~' }}
            </p>
            <el-input
                v-if="isEdit"
                ref="announcementRef"
                v-model="announcmentValue"
                maxlength="500"
                show-word-limit
                :autosize="{ minRows: 2, maxRows: 4 }"
                type="textarea"
                class="announcment_detail"
                placeholder="请输入群组公告~"
                resize="none"
                @blur="editAnnouncment('save', goupsInfos.announcement)"
            />
        </template>
        <!-- 仅供查看 -->
        <p v-else>{{ goupsInfos.announcement || '暂无群公告~' }}</p>
    </div>
</template>

<style lang="scss" scoped>
:deep(.el-textarea__inner) {
    border-radius: 5px;
}
</style>
