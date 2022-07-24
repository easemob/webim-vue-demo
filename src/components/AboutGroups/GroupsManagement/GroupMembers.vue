<script setup>
import { ref, toRefs, toRaw, computed, watch } from 'vue'
import EaseIM from '@/IM/initwebsdk'
import {
    CircleClose,
    Search,
    CircleCheckFilled,
    Select
} from '@element-plus/icons-vue';
/* 拼音排序好友列表 */
import { useSortFriendItem } from '@/hooks'
/* store */
import store from '@/store'
import _ from 'lodash';

import defaultAvatar from '@/assets/images/avatar/theme2x.png';
/* props */
const props = defineProps({
    groupDetail: {
        type: Object,
        required: true,
        default: () => ({})
    },
    memberRole: {
        type: Boolean,
        required: true,
        default: false
    }
})
const { groupDetail } = toRefs(props)
/*
    * 此组件主要功能为邀请好友入群，
    * 以及简单的管理群成员（移出群成员）。
    * 中间涉及到一些权限判断，大量使用了 v-if 后续建议挪到计算属性中处理。
 **/
/* 当前登陆的id */
const loginUserId = computed(() => EaseIM.conn.user)
/* 数据获取 */
//群组成员
const groupMembers = computed(() => {
    return store.state.Groups.groupsInfos[groupDetail.value.id].members;
})

/* 群成员操作相关 */
const showGroupsMembersName = computed(() => {
    return (item) => {
        if (item.member) {
            return item.member === loginUserId.value ? '我' : item.member
        }
        if (item.owner) {
            return item.owner === loginUserId.value ? '我【群主】' : item.owner + '【群主】'
        }
    }
})

//待渲染的群成员
let renderGroupMembers = ref(null);
//选中要邀请的成员list
const checkedInviteMembers = computed(() => {
    let list = _.values(renderGroupMembers.value)
    let toBeInviteList = list.length > 0 && list.filter(m => m.isChecked)
    return toBeInviteList
})
//将原数据重新组建
const sortedFriendList = computed(() => {
    const sourceData = _.cloneDeep(store.state.Contacts.friendList);
    for (const key in sourceData) {
        if (Object.hasOwnProperty.call(sourceData, key)) {
            const v = sourceData[key];
            v.name = v.nickname ? v.nickname : v.hxId;
            v.isChecked = false;
            v.exitTheGroup = groupMembers.value && toRaw(groupMembers.value).some((m) => m.member === v.hxId);
            v.keywords = `${v.hxId && v.hxId}${v.nickname && v.nickname || ''}`
        }
    }
    renderGroupMembers.value = sourceData
    return sourceData
})
//监听到选择群id变化重新进行赋值
watch(() => groupDetail.value.id, (newVal) => {
    renderGroupMembers.value = sortedFriendList.value;
}, {
    immediate: true
})

//取消邀请
const cancelCheck = (params) => {
    renderGroupMembers.value[params].isChecked = false;
}
//移出群成员
const removeTheMember = async (params) => {
    const { member } = params;
    let groupId = groupDetail.value && groupDetail.value.id
    store.dispatch('removeTheGroupMember', { username: member, groupId })
}
/* 完成操作 */
const saveHandleMembers = async (params) => {
    if (checkedInviteMembers.value && checkedInviteMembers.value.length) {
        let users = _.map(checkedInviteMembers.value, 'hxId')
        let groupId = groupDetail.value && groupDetail.value.id
        await store.dispatch('inviteUserJoinTheGroup', { users, groupId })
    }
}

/* 搜索逻辑 */
//创建用户搜索部分
let serachInputValue = ref('')
let isShowSearchContent = ref(false) //控制检索内容显隐
let searchResultList = ref([])
const searchUsers = () => {
    if (serachInputValue.value) {
        isShowSearchContent.value = true
        let resultArr = _.filter(sortedFriendList.value, (v) => v.keywords.includes(serachInputValue.value))
        searchResultList.value = resultArr
    } else {
        return isShowSearchContent.value = false
    }

}

//抛出保存方法
defineExpose({ saveHandleMembers })
</script>
<template>

    <div class="taboo_box">
        <div class="taboo_left">
            <!-- 搜索栏 -->
            <div class="search_friend_box">
                <el-input style="height: 36px;" v-model="serachInputValue" placeholder="搜索" @input="searchUsers"
                    :prefix-icon="Search">
                </el-input>
                <div v-if="isShowSearchContent" class="search_friend_box_content">
                    <div v-for="(item, index) in searchResultList">
                        <div class="friend_user_list">
                            <div class="friend_user_list_left">
                                <el-avatar :src="defaultAvatar"></el-avatar>
                                <b class="friend_list_username">{{ item.name }}</b>
                            </div>
                            <!-- public 为true（公开群不容许群成员邀请他人入群。）memberRole（管理员群主公开私有都可以邀请他人入群）  -->
                            <el-icon v-if="!groupDetail.public || memberRole" class="checked_btn">
                                <template v-if="!item.exitTheGroup">
                                    <div
                                        @click="searchResultList[index].isChecked = !searchResultList[index].isChecked">
                                        <CircleCheckFilled v-if="item.isChecked" class="checked_icon" />
                                        <span v-else class="unChecked_icon"></span>
                                    </div>
                                </template>
                                <template v-if="item.exitTheGroup">
                                    <Select />
                                </template>
                            </el-icon>
                        </div>
                        <el-divider style="margin:12px 0;" />
                    </div>

                </div>
            </div>
            <el-row style="height: 100%;margin-top: 5px;" v-if="renderGroupMembers">
                <el-col :span="24" class="friend_user_list_box">
                    <div v-for="(sortedItem, key, index) in useSortFriendItem(renderGroupMembers) ">
                        <div class="title">{{ key === ' ' ? '#' : key.toUpperCase() }}</div>
                        <template v-for="(item, index) in sortedItem" :key="item.name + index">
                            <div>
                                <div class="friend_user_list">
                                    <div class="friend_user_list_left">
                                        <el-avatar :src="defaultAvatar"></el-avatar>
                                        <b class="friend_list_username">{{ item.name }}</b>
                                    </div>
                                    <!-- public 为true（公开群不容许群成员邀请他人入群。）memberRole（管理员群主公开私有都可以邀请他人入群）  -->
                                    <el-icon v-if="!groupDetail.public || memberRole" class="checked_btn">
                                        <template v-if="!item.exitTheGroup">
                                            <div @click="sortedItem[index].isChecked = !sortedItem[index].isChecked">
                                                <CircleCheckFilled v-if="item.isChecked" class="checked_icon" />
                                                <span v-else class="unChecked_icon"></span>
                                            </div>
                                        </template>
                                        <template v-if="item.exitTheGroup">
                                            <Select />
                                        </template>
                                    </el-icon>
                                </div>
                            </div>
                        </template>
                    </div>
                </el-col>

            </el-row>
        </div>
        <div class="taboo_right">
            <el-row class="group_members_handle_box" v-if="groupMembers.length">
                <p class="title">群成员 {{ `${groupMembers.length}/${groupDetail.maxusers || '500'}` }}</p>
                <el-col :span="24" class="now_exit_group_members">
                    <div v-for="(item, index) in groupMembers" :key="item.member">
                        <div class="friend_user_list">
                            <div class="friend_user_list_left">
                                <el-avatar :src="defaultAvatar"></el-avatar>
                                <b class="friend_list_username">{{ showGroupsMembersName(item) }}</b>
                            </div>
                            <el-icon v-if="memberRole" class="checked_btn" @click="removeTheMember(item)">
                                <CircleClose />
                            </el-icon>
                        </div>
                    </div>
                </el-col>
                <template v-if="checkedInviteMembers.length > 0">
                    <p class="title">邀请 {{ checkedInviteMembers.length }}</p>
                    <el-col :span="24" class="checked_invite_members">
                        <div v-for="(item, index) in checkedInviteMembers" :key="item.hxId">
                            <div class="friend_user_list">
                                <div class="friend_user_list_left">
                                    <el-avatar :src="defaultAvatar"></el-avatar>
                                    <b class="friend_list_username">{{ item.hxId }}</b>
                                </div>
                                <el-icon class="checked_btn" @click="cancelCheck(item.hxId)">
                                    <CircleClose />
                                </el-icon>
                            </div>
                        </div>
                    </el-col>
                </template>
            </el-row>


        </div>
    </div>
</template>


<style lang="scss" scoped>
// 禁言
.taboo_box {
    position: relative;
    display: flex;
}

.taboo_title {
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: -0.01px;
    color: #303133;
    margin-bottom: 26px;
}

.taboo_left {
    // flex: 5;
    text-align: center;
    width: 420px;
    max-height: 466px;
    min-height: 266px;
    overflow: hidden;
    border-right: 1px solid #DCDFE6;
    padding: 0 24px;

    .friend_user_list_box {
        height: calc(100% - 36px);
        width: 100%;
        overflow: auto;
        padding: 15px 0;
    }
}

.taboo_right {
    width: 420px;
    max-height: 466px;
    min-height: 266px;
    overflow: hidden;
    padding-left: 16px;


}

.group_members_handle_box {
    width: 100%;


    .now_exit_group_members {
        width: 100%;
        overflow-y: auto;
        max-height: 300px;
    }

    .checked_invite_members {
        width: 100%;
        max-height: 100px;
        overflow-y: auto;
        padding: 15px 0;
    }
}


.search_friend_box {
    position: relative;

    .search_friend_box_content {
        position: absolute;
        left: 0;
        top: 37px;
        width: 100%;
        height: 430px;
        overflow-y: auto;
        background: #FFF;
        z-index: 99;
    }
}

.title {
    text-align: left;
    height: 40px;
    width: 100%;
    line-height: 40px;
    color: #999;
}

.friend_user_list {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    height: 45px;

    .friend_user_list_left {
        display: flex;
        align-items: center;
        justify-content: center;

        .friend_list_username {
            margin-left: 10px;
            font-family: 'PingFang SC';
            font-style: normal;
            font-weight: 500;
            font-size: 14px;
            line-height: 20px;
            color: #333333;
        }
    }

    .checked_btn {
        width: 20px;
        height: 20px;
        cursor: pointer;

        .checked_icon {
            font-size: 20px;
            color: #0091FF;
        }

        .unChecked_icon {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #979797;
            border-radius: 50%;
        }

    }
}
</style>