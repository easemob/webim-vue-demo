<script setup>
import { ref, toRefs, toRaw, computed, onMounted, watch } from 'vue'
import {
    CircleClose,
    Search,
    CircleCheckFilled,
    Select
} from '@element-plus/icons-vue';
import { useSortFriendItem } from '@/hooks'
import store from '@/store'
import _ from 'lodash';
import EaseIM from '@/IM/initwebsdk';
import defaultAvatar from '@/assets/images/avatar/theme2x.png';
/* props */
const props = defineProps({
    groupDetail: {
        type: Object,
        required: true,
        default: () => ({})
    }
})
const { groupDetail } = toRefs(props)

/* 数据获取 */
//群组成员
const groupMembers = computed(() => {
    return store.state.Groups.groupsInfos[groupDetail.value.id].members;
})
//黑名单列表
//禁言列表


/* 群成员操作相关 */
let renderGroupMembers = ref(null);
let insideGroupMembers = ref([])
//选中要邀请的成员list
const checkedInviteMembers = computed(() => {
    let list = _.values(renderGroupMembers.value)
    let toBeInviteList = list.length > 0 && list.filter(m => m.isChecked)
    return toBeInviteList
})
//将原数据重新组建
const sortedFriendList = computed(() => {
    console.log('groupMembers.value', toRaw(groupMembers.value));
    const sourceData = _.cloneDeep(store.state.Contacts.friendList);
    console.log('sourceData', sourceData)
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
    console.log('>>>>>>监听到groupDetail的变化', newVal)
    renderGroupMembers.value = sortedFriendList.value;
    insideGroupMembers.value = groupMembers.value;
}, {
    immediate: true
})
//取消邀请
const cancelCheck = (params) => {
    console.log(params)
    renderGroupMembers.value[params].isChecked = false;
}
//移出群成员
const removeTheMember = (params) => {
    console.log('>>>>>>>>>移出该群成员', params)
    const { member } = params;
    let groupId = groupDetail.value && groupDetail.value.id
    store.dispatch('removeTheGroupMember', { username: member, groupId })
}
/* 完成操作 */
const saveHandleMembers = async (params) => {
    console.log('>>>>>>checkedInviteMembers')
    if (checkedInviteMembers.value && checkedInviteMembers.value.length) {
        let users = _.map(checkedInviteMembers.value, 'hxId')
        let groupId = groupDetail.value && groupDetail.value.id
        await store.dispatch('inviteUserJoinTheGroup', { users, groupId })

    }
    // resetHandleMembers()
}
/* 取消操作 */
const resetHandleMembers = (params) => {
    console.log('>>>>>触发重置')
    renderGroupMembers.value = null;
    insideGroupMembers.value = []

}
/* 搜索逻辑 */
//创建用户搜索部分
let serachInputValue = ref('')
let isShowSearchContent = ref(false) //控制检索内容显隐
let searchResultList = ref([])
const searchUsers = () => {
    console.log('>>>>>serachInputValue.value ', serachInputValue.value === '')
    if (serachInputValue.value) {
        isShowSearchContent.value = true
        let resultArr = _.filter(sortedFriendList.value, (v) => v.keywords.includes(serachInputValue.value))
        searchResultList.value = resultArr
        console.log('>>>>>>>执行搜索', resultArr)
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
                            <el-icon class="checked_btn">

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

                                    <el-icon class="checked_btn">
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
            <el-row class="group_members_handle_box" v-if="insideGroupMembers.length">
                <p class="title">群成员 {{ `${insideGroupMembers.length}/${groupDetail.maxusers || '500'}` }}</p>
                <el-col :span="24" class="now_exit_group_members">
                    <div v-for="(item, index) in insideGroupMembers" :key="item.member">
                        <div class="friend_user_list">
                            <div class="friend_user_list_left">
                                <el-avatar :src="defaultAvatar"></el-avatar>
                                <b class="friend_list_username">{{ item.member || item.owner + '【群主】' }}</b>
                            </div>
                            <el-icon class="checked_btn" @click="removeTheMember(item)">
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