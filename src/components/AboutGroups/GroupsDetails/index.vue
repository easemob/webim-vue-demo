<script setup>
import { ref, toRaw, toRefs, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus';
/* IMSDK */
import EaseIM from '@/IM/initwebsdk';
/* components */
import GroupsManagement from '../GroupsManagement'
/* icons */
import { ArrowRight, Edit } from '@element-plus/icons-vue';
import store from '@/store';
/* porps */
const props = defineProps({
    groupDetail: { type: Object, required: true, default: () => ({}) }
})
const { groupDetail } = toRefs(props)
/* 群组展示相关核心数据获取 */
const goupsInfos = computed(() => {
    return groupDetail.value.id && store.state.Groups.groupsInfos[groupDetail.value.id]
})
//权限判断（禁言列表的获取只有群主管理员）
const memberRole = computed(() => {
    //群主
    const owner = groupDetail.value && groupDetail.value.owner;
    //管理员列表
    let admin = toRaw(goupsInfos.value.admin);
    //登陆人id
    let loginUser = EaseIM.conn.user;
    //合并两者名单
    admin = [...admin, owner]
    //判断是否在权限名单内
    return admin.includes(loginUser)
})
/* 群组管理 */
const groupmanagement = ref(null);
let modalType = ref('')
let groupModalTitle = ref({ title: '', type: 0 })
//弹出群管理相关modal框
const alertManagementModal = (type, groupType) => {
    let titleType = {
        0: '群组成员',
        1: '黑名单',
        2: '禁言'
    }
    modalType.value = type
    groupmanagement.value.dialogVisible = true
    console.log('groupType', groupType);
    if (groupType !== undefined) {
        groupModalTitle.value.title = titleType[groupType]
        groupModalTitle.value.type = groupType
    }

}
//修改群组名称
const editGroupNameInput = ref(null)
let isEdit = ref(false)
let groupName = ref('')
const editGroupName = async (oldGroupName) => {
    if (isEdit.value) {
        let params = {
            groupid: groupDetail.value.id,
            modifyType: 0,
            content: groupName.value
        }
        console.log('>>>>>保存编辑')
        await store.dispatch('modifyGroupInfo', params)
        ElMessage({
            message: '群组名称修改成功~',
            type: 'success',
            center: true,
        })
        isEdit.value = false

    } else {
        isEdit.value = true
        console.log('>>>>>>oldGroupName', oldGroupName)
        nextTick(() => {
            editGroupNameInput.value.focus()
            groupName.value = oldGroupName;
        })
        console.log('>>>>开始编辑')
    }
}
</script>
<template>
    <div class="app_container" v-if="groupDetail">
        <!-- 群名称 -->
        <div class="group_func_card group_name">
            <div class="title">群名称</div>
            <div class="content">
                <div v-if="!isEdit">{{ groupDetail.name }}</div>
                <el-input v-else ref="editGroupNameInput" v-model="groupName" size="small"></el-input>
                <el-icon class="icon" v-if="memberRole" @click=editGroupName(groupDetail.name)>
                    <Edit />
                </el-icon>
            </div>
        </div>
        <el-divider style="margin: 0;" />
        <!-- 群描述 -->
        <div class="group_func_card group_description">
            <div class="title">群描述</div>
            <div class="content">
                <span>{{ groupDetail.description }}</span>
                <el-icon class="icon" v-if="memberRole" @click="alertManagementModal('groupDesc')">
                    <Edit />
                </el-icon>
            </div>
        </div>
        <el-divider style="margin: 0;" />
        <!-- 群公告 -->
        <div class="group_announcements">
            <div class="title">群公告</div>
            <div class="content" v-text-overflow title="查看更多" @click="alertManagementModal('announcements')">
                {{ goupsInfos.announcement ? goupsInfos.announcement : '暂无群公告~' }}
            </div>
        </div>
        <el-divider style="margin: 0;" />
        <!-- 群成员 -->
        <div class="group_list_card group_member">
            <div class="label">群成员</div>
            <div class="main">
                <div class="member_count">
                    {{ `${groupDetail.affiliations_count}/${groupDetail.maxusers}` }}</div>
                <div class="more_list" @click="alertManagementModal('groupsomelist', 0)">
                    <ArrowRight />
                </div>
            </div>
        </div>
        <el-divider style="margin: 0;" />
        <!-- 黑名单 -->
        <div class="group_list_card group_blacklist" v-if="goupsInfos.blacklist">
            <div class="label">黑名单</div>
            <div class="main">
                <div class="member_count">{{ goupsInfos.blacklist.length > 0 ? goupsInfos.blacklist.length : '暂无' }}
                </div>
                <div class="more_list" @click="alertManagementModal('groupsomelist', 1)">
                    <ArrowRight />
                </div>
            </div>
        </div>
        <el-divider style="margin: 0;" />
        <!-- 禁言名单 -->
        <div class="group_list_card group_mutelist" v-if="goupsInfos.mutelist">
            <div class="label">禁言名单</div>
            <div class="main">
                <div class="member_count">{{ goupsInfos.mutelist.length > 0 ? goupsInfos.mutelist.length : '暂无' }}</div>
                <div class="more_list" @click="alertManagementModal('groupsomelist', 2)">
                    <ArrowRight />
                </div>
            </div>
        </div>
        <GroupsManagement ref="groupmanagement" :modalType="modalType" :groupModalTitle="groupModalTitle" />
    </div>
</template>
<style lang="scss" scoped>
.app_container {
    height: 100%;
    overflow: auto;

    .group_func_card {
        padding: 15px;
        min-height: 72px;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: space-around;

        .title {
            font-family: 'PingFang SC';
            font-style: normal;
            font-weight: 500;
            font-size: 12px;
            line-height: 18px;
        }

        .content {
            font-family: 'PingFang SC';
            font-style: normal;
            font-weight: 400;
            font-size: 12px;
            line-height: 18px;
            display: flex;
            flex-direction: row;
            align-items: center;
            color: #A3A3A3;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
        }
    }

    .group_announcements {
        padding: 15px;
        height: 127px;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: space-around;

        .title {
            font-family: 'PingFang SC';
            font-style: normal;
            font-weight: 500;
            font-size: 12px;
            line-height: 18px;
        }

        .content {
            font-family: 'PingFang SC';
            font-style: normal;
            font-weight: 400;
            font-size: 12px;
            line-height: 18px;
            /* or 150% */
            text-align: justify;
            color: #A3A3A3;
            height: 72px;
            overflow: hidden;
            cursor: pointer;
        }
    }

    .group_list_card {
        padding: 15px;
        height: 52px;
        box-sizing: border-box;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;

        .label {
            font-family: 'PingFang SC';
            font-style: normal;
            font-weight: 500;
            font-size: 12px;
        }

        .main {
            height: 100%;
            width: 80px;
            display: flex;
            flex-direction: row;
            justify-content: flex-end;
            align-items: center;
            margin: 0 5px;

            .member_count {
                min-width: 17px;
                height: 20px;
                background: #F9F9F9;
                border-radius: 108px;
                font-family: 'PingFang SC';
                font-style: normal;
                font-weight: 500;
                font-size: 7px;
                line-height: 11px;
                color: #A3A3A3;
                padding: 5px 8px;
                box-sizing: border-box;
            }

            .more_list {
                >svg {
                    width: 18.49px;
                    height: 10.84px;
                }

            }
        }

    }
}

::v-deep .el-dialog__header {
    background: #F2F2F2;
    margin: 0;
}
</style>