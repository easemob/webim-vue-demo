<script setup>
import { ref, toRaw, toRefs, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
/* IMSDK */
import { EMClient } from '@/IM'
/* components */
import GroupsManagement from '../GroupsManagement'
/* icons */
import { ArrowRight, Edit, View } from '@element-plus/icons-vue'
import store from '@/store'
/* porps */
const props = defineProps({
    groupDetail: { type: Object, required: true, default: () => ({}) },
    nowGroupId: {
        type: String,
        required: true,
        default: ''
    }
})
/* emits */
const emits = defineEmits(['handleDrawer'])
/*
 * groupDetail（群详情接口返回的数据）
 * 主要包含群名称，群主id，群组desc，群组人数，群组禁言状态是否容许邀请...。
 **/
const { nowGroupId } = toRefs(props)

const groupDetail = computed(() => {
    return (
        store.state.Contacts.groupList[nowGroupId.value] &&
        store.state.Contacts.groupList[nowGroupId.value].groupDetail
    )
})

/* 群组展示相关核心数据获取 */
const goupsInfos = computed(() => {
    return (
        groupDetail.value.id &&
        store.state.Groups.groupsInfos[groupDetail.value.id]
    )
})
//权限判断（黑名单以及禁言列表的获取，只有群主管理员）
const memberRole = computed(() => {
    let allGroupAdmin = []
    //群主
    const owner = groupDetail.value && groupDetail.value.owner
    //管理员列表
    const groupAdmin = (goupsInfos.value && toRaw(goupsInfos.value.admin)) || []
    //登陆人id
    const loginUser = EMClient.user
    //合并两者名单
    allGroupAdmin = [...groupAdmin, owner]
    //判断是否在权限名单内
    return allGroupAdmin.includes(loginUser)
})
/* 群组管理 */
const groupmanagement = ref(null)
const modalType = ref('')
const groupModalTitle = ref({ title: '', type: 0 })
//弹出群管理相关modal框
const alertManagementModal = (type, groupType) => {
    const titleType = {
        1: '黑名单',
        2: '禁言'
    }
    modalType.value = type
    groupmanagement.value.dialogVisible = true

    if (groupType !== undefined) {
        groupModalTitle.value.title = titleType[groupType]
        groupModalTitle.value.type = groupType
    }
}
//修改群组名称
const editGroupNameInput = ref(null)
const isEdit = ref(false)
const groupName = ref('')
const editGroupName = async (type, oldGroupName) => {
    if (type === 'save') {
        if (groupName.value === oldGroupName) return (isEdit.value = false)
        const params = {
            groupid: groupDetail.value.id,
            modifyType: 0,
            content: groupName.value
        }

        try {
            await store.dispatch('modifyGroupInfo', params)
            ElMessage({
                message: '群组名称修改成功~',
                type: 'success',
                center: true
            })
            isEdit.value = false
        } catch (error) {
            ElMessage({
                message: '群组名称修改失败~',
                type: 'error',
                center: true
            })
            isEdit.value = false
        }
    }
    if (type === 'edit') {
        isEdit.value = true

        nextTick(() => {
            editGroupNameInput.value.focus()
            groupName.value = oldGroupName
        })
    }
}
//修改我的群组昵称
const editMyGroupNickNameInput = ref(null)
const isEditMyGroupNickname = ref(false)
const myGroupNickname = ref('')
const editMyGroupNickName = async (type, oldMyGroupNickname) => {
    if (type === 'save') {
        if (myGroupNickname.value === oldMyGroupNickname)
            return (isEditMyGroupNickname.value = false)
        const params = {
            groupId: nowGroupId.value,
            nickName: myGroupNickname.value
        }

        try {
            await store.dispatch('setInTheGroupInfo', params)
            ElMessage({
                message: '本群昵称修改成功~',
                type: 'success',
                center: true
            })
        } catch (error) {
            ElMessage({
                message: '本群昵称修改失败~',
                type: 'error',
                center: true
            })
        } finally {
            isEditMyGroupNickname.value = false
        }
    }
    if (type === 'edit') {
        isEditMyGroupNickname.value = true

        nextTick(() => {
            editMyGroupNickNameInput.value.focus()
            myGroupNickname.value = oldMyGroupNickname
        })
    }
}
const inTheGroupNickname = computed(() => {
    const loginUser = EMClient.user
    const myNickname =
        store.state.Groups.groupsInfos[nowGroupId.value]?.groupMemberInfo[
            loginUser
        ]?.nickName
    return myNickname
})
//退出、解散群组
const quitThisGroup = async () => {
    if (!groupDetail.value.id) return
    const groupId = groupDetail.value.id
    try {
        await ElMessageBox.confirm(
            '将要从本群退出，确认要退出此群吗？',
            '群组提示',
            {
                confirmButtonText: '确认',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )
        await store.dispatch('leaveIntheGroup', { groupId })
        emits('handleDrawer')
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage({
                message: '退出群组失败~',
                type: 'error',
                center: true
            })
        }
    }
}
const dissolveThisGroup = async () => {
    if (!groupDetail.value.id) return
    const groupId = groupDetail.value.id
    try {
        await ElMessageBox.confirm(
            '将要将本群解散，确认要解散此群吗？',
            '群组提示',
            {
                confirmButtonText: '确认',
                cancelButtonText: '取消',
                type: 'error'
            }
        )
        await store.dispatch('destroyInTheGroup', { groupId })
        emits('handleDrawer')
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage({
                message: '解散群组失败~',
                type: 'error',
                center: true
            })
        }
    }
}
</script>
<template>
    <div class="app_container" v-if="groupDetail">
        <!-- 群名称 -->
        <div class="group_func_card group_name">
            <div class="title">
                群名称
                <el-icon
                    class="icon"
                    v-if="memberRole"
                    @click="editGroupName('edit', groupDetail.name)"
                >
                    <Edit />
                </el-icon>
            </div>
            <div class="content">
                <div v-if="!isEdit">{{ groupDetail.name || '' }}</div>
                <el-input
                    v-else
                    class="group_name_input"
                    ref="editGroupNameInput"
                    v-model="groupName"
                    size="small"
                    maxlength="15"
                    show-word-limit
                    @blur="editGroupName('save', groupDetail.name)"
                >
                </el-input>
            </div>
        </div>
        <el-divider style="margin: 0" />
        <!-- 群描述 -->
        <div class="group_func_card group_description">
            <div class="title">
                群描述
                <el-icon
                    class="icon"
                    v-if="memberRole"
                    @click="alertManagementModal('groupDesc')"
                >
                    <Edit />
                </el-icon>
            </div>
            <div class="content">
                {{ groupDetail.description || '暂无群描述~' }}
            </div>
        </div>
        <el-divider style="margin: 0" />
        <!-- 本地群组昵称 -->
        <div class="group_func_card group_name">
            <div class="title">
                我在本群的昵称
                <el-icon
                    class="icon"
                    @click="editMyGroupNickName('edit', inTheGroupNickname)"
                >
                    <Edit />
                </el-icon>
            </div>
            <div class="content">
                <div v-if="!isEditMyGroupNickname">
                    {{ inTheGroupNickname || '暂未设置该群昵称' }}
                </div>
                <el-input
                    v-else
                    class="group_name_input"
                    ref="editMyGroupNickNameInput"
                    v-model="myGroupNickname"
                    size="small"
                    maxlength="15"
                    show-word-limit
                    @blur="editMyGroupNickName('save', inTheGroupNickname)"
                />
            </div>
        </div>
        <el-divider style="margin: 0" />
        <!-- 群公告 -->
        <div v-if="goupsInfos" class="group_func_card group_announcements">
            <div class="title">
                群公告
                <el-icon
                    class="icon"
                    @click="alertManagementModal('announcements')"
                >
                    <Edit v-if="memberRole" />
                    <View v-else />
                </el-icon>
            </div>
            <div class="content" title="查看更多">
                {{ goupsInfos.announcement || '暂无群公告~' }}
            </div>
        </div>
        <el-divider style="margin: 0" />
        <!-- 群成员 -->
        <div class="group_list_card group_member">
            <div class="label">群成员</div>
            <div class="main">
                <div class="member_count">
                    {{
                        `${groupDetail.affiliations_count || '0'}/${
                            groupDetail.maxusers || '500'
                        }`
                    }}
                </div>
                <div
                    class="more_list"
                    @click="alertManagementModal('groupmembers')"
                >
                    <ArrowRight />
                </div>
            </div>
        </div>
        <el-divider style="margin: 0" />
        <template v-if="memberRole">
            <!-- 黑名单 -->
            <div
                class="group_list_card group_blacklist"
                v-if="goupsInfos.blacklist"
            >
                <div class="label">黑名单</div>
                <div class="main">
                    <div class="member_count">
                        {{ goupsInfos.blacklist.length || '暂无' }}
                    </div>
                    <div
                        class="more_list"
                        @click="alertManagementModal('groupsomelist', 1)"
                    >
                        <ArrowRight />
                    </div>
                </div>
            </div>
            <el-divider style="margin: 0" />
            <!-- 禁言名单 -->
            <div
                class="group_list_card group_mutelist"
                v-if="goupsInfos.mutelist"
            >
                <div class="label">禁言名单</div>
                <div class="main">
                    <div class="member_count">
                        {{ goupsInfos.mutelist.length || '暂无' }}
                    </div>
                    <div
                        class="more_list"
                        @click="alertManagementModal('groupsomelist', 2)"
                    >
                        <ArrowRight />
                    </div>
                </div>
            </div>
            <el-divider style="margin: 0" />
        </template>
        <!-- 群组操作按钮 -->
        <div class="group_list_handle_box">
            <template v-if="groupDetail.owner === EMClient.user">
                <el-button
                    type="danger"
                    class="group_list_card_btn"
                    plain
                    @click="dissolveThisGroup"
                    >解散群组</el-button
                >
            </template>
            <template v-else>
                <el-button
                    type="danger"
                    class="group_list_card_btn"
                    plain
                    @click="quitThisGroup"
                    >退出群组</el-button
                >
            </template>
        </div>

        <GroupsManagement
            ref="groupmanagement"
            :modalType="modalType"
            :groupModalTitle="groupModalTitle"
            :memberRole="memberRole"
            :groupDetail="groupDetail"
        />
    </div>
</template>
<style lang="scss" scoped>
@import './index.scss';
</style>
