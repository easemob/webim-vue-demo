<script setup>
import { ref, toRefs, toRaw, computed, onMounted } from 'vue'
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
const props = defineProps({
    groupModalTitle: {
        type: Object,
        default: () => ({ title: '', type: 0 })
    },
    groupDetail: {
        type: Object,
        required: true,
        default: () => ({})
    }
})
const { groupModalTitle, groupDetail } = toRefs(props)

/* 数据获取 */
//群组成员
const groupMembers = computed(() => {
    return store.state.Groups.groupsInfos[groupDetail.value.id].members;
})
//黑名单列表
//禁言列表



//取消邀请
const cancelCheck = (params) => {
    console.log(params)
    renderGroupMembers.value[params].isChecked = false;
}
/* 搜索逻辑 */
//创建用户搜索部分
let serachInputValue = ref('')
let isShowSearchContent = ref(false) //控制检索内容显隐
let searchResultList = ref([])
const searchUsers = () => {
    console.log('>>>>>serachInputValue.value ', serachInputValue.value === '')
    // if (serachInputValue.value) {
    //     isShowSearchContent.value = true
    //     let resultArr = _.filter(sortedFriendList.value, (v) => v.keywords.includes(serachInputValue.value))
    //     searchResultList.value = resultArr
    //     console.log('>>>>>>>执行搜索', resultArr)
    // } else {
    //     return isShowSearchContent.value = false
    // }

}


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
                            <el-icon class="checked_btn"
                                @click="searchResultList[index].isChecked = !searchResultList[index].isChecked">
                                <CircleCheckFilled v-if="item.isChecked" class="checked_icon" />
                                <span v-else class="unChecked_icon"></span>
                            </el-icon>
                        </div>
                        <el-divider style="margin:12px 0;" />
                    </div>

                </div>
            </div>
            <el-row style="height: 100%">

                <template v-if="groupModalTitle.type === 1">
                    <p>黑名单</p>
                </template>
                <template v-if="groupModalTitle.type === 2">
                    <p>禁言</p>
                </template>
            </el-row>
        </div>
        <div class="taboo_right">
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