<script setup>
import { ref, toRefs, toRaw, computed, onMounted } from 'vue'
import {
    CircleClose,
    Search,
    Star,
    CircleCheckFilled,
} from '@element-plus/icons-vue';
import getArrDifference from '@/utils/getArrdifference'
import store from '@/store'
import _ from 'lodash';
import dateFormater from '@/utils/dateFormat'
import defaultAvatar from '@/assets/images/avatar/theme2x.png';
const props = defineProps({
    groupModalTitle: {
        type: Object,
        default: () => ({ title: '', type: 0 }) //type 1 黑名单 type 2 禁言
    },
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
const { groupModalTitle, groupDetail, memberRole } = toRefs(props)

/* 数据获取 */
//群组成员
const groupMembers = computed(() => {
    return store.state.Groups.groupsInfos[groupDetail.value.id].members;
})
//黑名单列表
const blackMemberList = computed(() => {
    return store.state.Groups.groupsInfos[groupDetail.value.id].blacklist;
})
console.log('blackMemberList>>>>', blackMemberList.value);
//禁言列表
const muteMemberList = computed(() => {
    return store.state.Groups.groupsInfos[groupDetail.value.id].mutelist;
})
console.log('muteMemberList>>>', muteMemberList.value)

/* 黑名单相关逻辑 */
//群组列表
const renderBlackMembers = ref(null)
const insideTheBlackList = ref([])
const sortedMembersList = computed(() => {
    const sourceData = _.cloneDeep(groupMembers.value);
    for (const key in sourceData) {
        if (Object.hasOwnProperty.call(sourceData, key)) {
            const v = sourceData[key];
            // v.exitTheGroup = groupMembers.value && toRaw(groupMembers.value).some((m) => m.member === v.hxId);
            v.keywords = v.owner ? v.owner : v.member
            v.isChecked = false;
        }
    }
    return sourceData
})
//操作群成员在黑名单中的状态变更
const handleMembersToBlack = (item) => {
    console.log('>>>>>>添加引入黑名单', item)
    if (item.isChecked && insideTheBlackList.value.includes(item.member)) {
        insideTheBlackList.value.map((m, idx) => { if (m === item.member) { insideTheBlackList.value.splice(idx, 1) } })
        item.isChecked = false;
    } else {
        if (!insideTheBlackList.value.includes(item.member)) insideTheBlackList.value.push(item.member)
        item.isChecked = true;
    }
}
//从黑名单列表中删除
const deleteMembersFromBlack = (memberId, index) => {
    insideTheBlackList.value.splice(index, 1)
    renderBlackMembers.value.map(m => { if (m.member === memberId) m.isChecked = false; return })
}
//调用SDK方法改变黑名单列表
const handleBlackFromSDK = (difArr) => {
    const groupId = groupDetail.value.id;
    //待提交给SDK添加的数组
    let toBeAddList = []
    //待提交给SDK移除 的数组
    let toBeRemoveList = []
    //遍历difArr如果再原黑名单中存在则说明需要移出，如果不存在说明需要添加
    difArr.forEach(member => {
        if (blackMemberList.value.includes(member)) {
            toBeRemoveList.push(member)
        } else {
            toBeAddList.push(member)
        }
    });
    if (toBeAddList.length > 0) {
        store.dispatch('addMemberToBlackList', { groupId, usernames: toBeAddList })
    }
    if (toBeRemoveList.length > 0) {
        store.dispatch('removeTheMemberFromBlackList', { groupId, usernames: toBeRemoveList })
    }
    return

}
//调用SDK方法移出黑名单

/* 禁言部分功能 */
//群组列表
const renderMuteMembers = ref(null);
const insideTheMuteList = ref([]);
const sortedMuteMembersList = computed(() => {
    const sourceData = _.cloneDeep(groupMembers.value);
    for (const key in sourceData) {
        if (Object.hasOwnProperty.call(sourceData, key)) {
            const v = sourceData[key];
            // v.exitTheGroup = groupMembers.value && toRaw(groupMembers.value).some((m) => m.member === v.hxId);
            v.keywords = v.owner ? v.owner : v.member
            v.isChecked = false;
        }
    }
    return sourceData
})
//操作群成员在禁言列表中的状态变更
const handleMembersToMute = (item) => {
    let memberList = []
    insideTheMuteList.value.map(m => memberList.push(m.user))
    console.log('>>>>>>添加引入禁言列表', item)
    if (item.isChecked && memberList.includes(item.member)) {
        insideTheMuteList.value.map((m, idx) => { if (m.user === item.member) { insideTheMuteList.value.splice(idx, 1) } })
        item.isChecked = false;
    } else {
        if (!memberList.includes(item.member)) {
            insideTheMuteList.value.push({ user: item.member, expire: 0 })
        }
        item.isChecked = true;
    }
}
//从禁言列表中删除
const deleteMembersFromMute = (item, index) => {
    insideTheMuteList.value.splice(index, 1)
    renderMuteMembers.value.map(m => { if (m.member === item.user) m.isChecked = false; return })
}
//调用SDK方法改变禁言列表
const handleMuteFromSDK = (difArr, oldMuteList) => {
    const groupId = groupDetail.value.id;
    //待提交给SDK添加的数组
    let toBeAddList = []
    //待提交给SDK移除 的数组
    let toBeRemoveList = []
    //遍历difArr如果再原黑名单中存在则说明需要移出，如果不存在说明需要添加
    difArr.forEach(member => {
        if (oldMuteList.includes(member)) {
            toBeRemoveList.push(member)
        } else {
            toBeAddList.push(member)
        }
    });
    if (toBeAddList.length > 0) {
        console.log('>>>>>>添加禁言', toBeAddList)
        store.dispatch('addMemberToMuteList', { groupId, usernames: toBeAddList })
    }
    if (toBeRemoveList.length > 0) {
        console.log('>>>>>移出禁言', toBeRemoveList)
        store.dispatch('removeTheMemberFromMuteList', { groupId, usernames: toBeRemoveList })
    }
    return

}


/* 黑名单以及禁言共用逻辑部分 */
onMounted(() => {
    console.log('>>>>>组件渲染')
    //黑名单初始化数据
    if (groupModalTitle.value.type === 1) {
        renderBlackMembers.value = sortedMembersList.value
        insideTheBlackList.value = toRaw(_.cloneDeep(blackMemberList.value))
    }
    //禁言初始化数据
    if (groupModalTitle.value.type === 2) {
        renderMuteMembers.value = sortedMuteMembersList.value
        insideTheMuteList.value = toRaw(_.cloneDeep(muteMemberList.value))
    }
})

/* 搜索逻辑 */
//创建用户搜索部分
let serachInputValue = ref('')
let isShowSearchContent = ref(false) //控制检索内容显隐
let searchResultList = ref([])
const searchUsers = () => {
    if (serachInputValue.value) {
        isShowSearchContent.value = true
        if (groupModalTitle.value.type === 1) {
            let resultArr = _.filter(sortedMembersList.value, (v) => v.keywords.includes(serachInputValue.value))
            return searchResultList.value = resultArr
        }
        if (groupModalTitle.value.type === 2) {
            let resultArr = _.filter(sortedMuteMembersList.value, (v) => v.keywords.includes(serachInputValue.value))
            return searchResultList.value = resultArr
        }
    } else {
        return isShowSearchContent.value = false
    }

}

//保存修改
/* 完成操作 */
const saveHandleMembers = async () => {
    if (groupModalTitle.value.type === 1) {
        //返回比对后的数组
        let difArr = getArrDifference(insideTheBlackList.value, blackMemberList.value)
        //无差异会返回空数组
        if (difArr.length <= 0) return
        //有差异开始执行
        return handleBlackFromSDK(difArr)
    }
    if (groupModalTitle.value.type === 2) {
        let checkMuteList = []
        let oldMuteList = []
        insideTheMuteList.value.map(m => checkMuteList.push(m.user))
        muteMemberList.value.map(m => oldMuteList.push(m.user))
        console.log('checkMuteList', checkMuteList, 'oldMuteList', oldMuteList)
        let difArr = getArrDifference(checkMuteList, oldMuteList)
        console.log('>>>>>>待提交', difArr)
        return handleMuteFromSDK(difArr, oldMuteList)
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
                    <div v-for="(item, index) in searchResultList" :key="item + index">
                        <!-- item.owner 代表是群主 列表中不展示群主只展示群成员 -->
                        <template v-if="!item.owner">
                            <div class="friend_user_list">
                                <div class="friend_user_list_left">
                                    <el-avatar :src="defaultAvatar"></el-avatar>
                                    <b class="friend_list_username">{{ item.member }}</b>
                                </div>
                                <template v-if="memberRole">
                                    <el-icon class="checked_btn"
                                        @click="searchResultList[index].isChecked = !searchResultList[index].isChecked">
                                        <CircleCheckFilled v-if="item.isChecked" class="checked_icon" />
                                        <span v-else class="unChecked_icon"></span>
                                    </el-icon>
                                </template>
                            </div>
                            <el-divider style="margin:12px 0;" />
                        </template>
                    </div>

                </div>
            </div>
            <div style="text-align: left; margin-top: 5px;">
                <el-icon>
                    <Star />
                </el-icon>
                <b>
                    群成员
                </b>
            </div>
            <!-- 黑名单群成员邀请列表 -->
            <template v-if="groupModalTitle.type === 1">
                <el-row style="height: 100%;margin-top: 5px;" v-if="renderBlackMembers">
                    <el-col :span="24" class="friend_user_list_box">
                        <div v-for="(item, index) in renderBlackMembers" :key="item.member">
                            <template v-if="!item.owner">
                                <div class="friend_user_list">
                                    <div class="friend_user_list_left">
                                        <el-avatar :src="defaultAvatar"></el-avatar>
                                        <b class="friend_list_username">{{ item.member }}</b>
                                    </div>
                                    <!-- 群主管理员级别才可操作邀请加入群组 -->
                                    <template v-if="memberRole">
                                        <el-icon class="checked_btn" @click="handleMembersToBlack(item)">
                                            <CircleCheckFilled v-if="item.isChecked" class="checked_icon" />
                                            <span v-else class="unChecked_icon"></span>
                                        </el-icon>
                                    </template>

                                </div>
                                <el-divider style="margin:12px 0;" />
                            </template>
                        </div>
                    </el-col>
                </el-row>
            </template>
            <!-- 禁言群成员邀请列表 -->
            <template v-if="groupModalTitle.type === 2">
                <el-row style="height: 100%;margin-top: 5px;" v-if="renderMuteMembers">
                    <el-col :span="24" class="friend_user_list_box">
                        <div v-for="(item, index) in renderMuteMembers" :key="item.member">
                            <template v-if="!item.owner">
                                <div class="friend_user_list">
                                    <div class="friend_user_list_left">
                                        <el-avatar :src="defaultAvatar"></el-avatar>
                                        <b class="friend_list_username">{{ item.member }}</b>
                                    </div>
                                    <!-- 群主管理员级别才可操作邀请加入群组 -->
                                    <template v-if="memberRole">
                                        <el-icon class="checked_btn" @click="handleMembersToMute(item)">
                                            <CircleCheckFilled v-if="item.isChecked" class="checked_icon" />
                                            <span v-else class="unChecked_icon"></span>
                                        </el-icon>
                                    </template>

                                </div>
                                <el-divider style="margin:12px 0;" />
                            </template>
                        </div>
                    </el-col>
                </el-row>
            </template>
        </div>
        <div class="taboo_right">
            <template v-if="groupModalTitle.type === 1">
                <p>加入黑名单成员：{{ insideTheBlackList.length }}</p>
                <el-row style="height: 100%;margin-top: 5px;overflow: auto">
                    <el-col :span="24" class="friend_user_list_box">
                        <template v-if="insideTheBlackList.length > 0">
                            <div v-for="(item, index) in insideTheBlackList" :key="item">
                                <div class="friend_user_list">
                                    <div class="friend_user_list_left">
                                        <el-avatar :src="defaultAvatar"></el-avatar>
                                        <b class="friend_list_username">{{ item }}</b>
                                    </div>
                                    <el-icon class="checked_btn" @click="deleteMembersFromBlack(item, index)">
                                        <CircleClose class="checked_icon" />
                                    </el-icon>
                                </div>
                                <el-divider style="margin:12px 0;" />
                            </div>
                        </template>
                        <template v-else>
                            <el-empty :image-size="200" description="暂无黑名单成员~" />
                        </template>
                    </el-col>
                </el-row>
            </template>
            <template v-if="groupModalTitle.type === 2">
                <p>加入禁言列表成员：{{ insideTheMuteList.length }}</p>
                <el-row style="height: 100%;margin-top: 5px;overflow: auto">
                    <el-col :span="24" class="friend_user_list_box">
                        <template v-if="insideTheMuteList.length > 0">
                            <div v-for="(item, index) in insideTheMuteList" :key="item">
                                <div class="friend_user_list">
                                    <div class="friend_user_list_left">
                                        <el-avatar :src="defaultAvatar"></el-avatar>
                                        <b class="friend_list_username">{{ item.user }}</b>
                                        <sup v-if="item.expire" style="font: size 7px;">【失效时间：{{
                                                dateFormater('MM-DD-HH:mm', item.expire)
                                        }}】</sup>
                                    </div>
                                    <el-icon class="checked_btn" @click="deleteMembersFromMute(item, index)">
                                        <CircleClose class="checked_icon" />
                                    </el-icon>
                                </div>
                                <el-divider style="margin:12px 0;" />
                            </div>
                        </template>
                        <template v-else>
                            <el-empty :image-size="200" description="暂无禁言成员~" />
                        </template>
                    </el-col>
                </el-row>
            </template>
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

    .group_members_handle_box {
        // height: 100%;
    }
}

.search_friend_box {
    position: relative;

    .search_friend_box_content {
        position: absolute;
        left: 0;
        top: 36px;
        width: 100%;
        height: 430px;
        overflow-y: auto;
        background: #FFF;
        z-index: 99;
    }
}

.now_exit_group_members {
    width: 100%;
    overflow-y: auto;
}

.checked_invite_members {
    width: 100%;
    max-height: 100px;
    overflow-y: auto;
    padding: 15px 0;
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