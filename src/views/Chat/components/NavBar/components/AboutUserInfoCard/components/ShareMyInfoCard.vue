<script setup>
import { ref, toRaw, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus';
import {
    CircleClose,
    Search,
    CircleCheckFilled
} from '@element-plus/icons-vue';
import { messageType } from '@/constant'
/* 拼音排序好友列表 */
import { sortPinyinFriendItem } from '@/utils/handleSomeData'
/* store */
import store from '@/store'
import _ from 'lodash';

import defaultAvatar from '@/assets/images/avatar/theme2x.png';
const { CHAT_TYPE, ALL_MESSAGE_TYPE } = messageType;
/* 登陆用户的用户属性 */
const loginUserInfo = computed(() => {
    return store.state.loginUserInfo
})
const dialogTableVisible = ref(false)

//待渲染的群成员
let renderFriend = ref(null);
let checkedTobeSendFriend = ref([])
//将原数据重新组建
const sortedFriendList = computed(() => {
    const sourceData = _.cloneDeep(store.state.Contacts.friendList);
    for (const key in sourceData) {
        if (Object.hasOwnProperty.call(sourceData, key)) {
            const v = sourceData[key];
            v.name = v.nickname ? v.nickname : v.hxId;
            v.isChecked = false;
            v.keywords = `${v.hxId && v.hxId}${v.nickname && v.nickname || ''}`
        }
    }
    return sourceData
})
//将选中的id添加如待发送数组
const handleAddFriendToSendList = (item) => {
    if (toRaw(checkedTobeSendFriend.value).length > 4) {
        ElMessage({
            type: 'warning',
            center: true,
            message: "超出单次最大可分享人数~"
        })
        return
    }
    if (item.isChecked && checkedTobeSendFriend.value.includes(item.hxId)) {
        checkedTobeSendFriend.value.map((m, idx) => { if (m === item.hxId) { checkedTobeSendFriend.value.splice(idx, 1) } })
        item.isChecked = false;
    } else {
        if (!checkedTobeSendFriend.value.includes(item.hxId)) checkedTobeSendFriend.value.push(item.hxId)
        item.isChecked = true;
    }
}
//从选中的列表中移出个别id
const delFriendFromCheckedList = (item, index) => {
    checkedTobeSendFriend.value.splice(index, 1)
    for (const key in renderFriend.value) {
        if (Object.hasOwnProperty.call(renderFriend.value, key)) {
            const m = renderFriend.value[key];
            if (m.hxId === item) return m.isChecked = false;
        }
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

//diglog打开的时候赋值初始renderFriend
const initData = () => {
    console.log('>>>>>>open')
    nextTick(() => {
        console.log('>>>>>>diglog打开重新赋值')
        renderFriend.value = _.cloneDeep(sortedFriendList.value)
    })

}
//关闭执行重置数据
const resetData = () => {
    renderFriend.value = null;
    checkedTobeSendFriend.value = []
    dialogTableVisible.value = false

}

/* 执行发送 */
const startSendMyUserCard = () => {
    console.log(checkedTobeSendFriend.value)
    let sendTask = []
    toRaw(checkedTobeSendFriend.value).length > 0 && toRaw(checkedTobeSendFriend.value).forEach(userId => {
        console.log('>>>>>>userId', userId)
        sendTask.push(userId)
        let infoParams = _.clone(loginUserInfo.value)
        //这一步是因为其他端统一用的avatar 作为头像路径的展示
        infoParams.avatar = infoParams.avatarurl
        console.log('infoParams', infoParams)
        let msgOptions = {
            id: userId,
            chatType: CHAT_TYPE.SINGLE,
            customEvent: 'userCard',
            customExts: {
                uid: loginUserInfo.value.hxId,
                ...loginUserInfo.value
            }
        }
        store.dispatch('sendShowTypeMessage', { msgType: ALL_MESSAGE_TYPE.CUSTOM, msgOptions })
    })
    Promise.all(sendTask)
    resetData()
}
defineExpose({
    dialogTableVisible
})
</script>
<template>
    <el-dialog v-model="dialogTableVisible" title="分享名片" @open="initData">
        <div class="taboo_box">
            <div class="taboo_left">
                <!-- 搜索栏 -->
                <div class="search_friend_box">
                    <el-input style="height: 36px;" v-model="serachInputValue" placeholder="搜索" @input="searchUsers"
                        :prefix-icon="Search">
                    </el-input>
                    <el-scrollbar v-if="isShowSearchContent" class="search_friend_box_content" tag="div">
                        <div v-for="(item, index) in searchResultList" :key="item.name">
                            <div class="friend_user_list">
                                <div class="friend_user_list_left">
                                    <el-avatar :src="defaultAvatar"></el-avatar>
                                    <b class="friend_list_username">{{`${item.name}(${item.hxId})` }}</b>
                                </div>
                                <el-icon class="checked_btn">
                                    <div @click="handleAddFriendToSendList(item)">
                                        <CircleCheckFilled v-if="item.isChecked" class="checked_icon" />
                                        <span v-else class="unChecked_icon"></span>
                                    </div>
                                </el-icon>
                            </div>
                            <el-divider style="margin:12px 0;" />
                        </div>
                    </el-scrollbar>
                </div>
                <el-row style="height: 100%;margin-top: 5px;" v-if="renderFriend">
                    <el-col :span="24" class="friend_user_list_box">
                        <el-scrollbar>
                            <div v-for="(sortedItem, key, index) in sortPinyinFriendItem(renderFriend) "
                                :key="sortedItem + index">
                                <div class="title">{{ key === ' ' ? '#' : key.toUpperCase() }}</div>
                                <template v-for="(item, index) in sortedItem" :key="item.name + index">
                                    <div>
                                        <div class="friend_user_list">
                                            <div class="friend_user_list_left">
                                                <el-avatar :src="defaultAvatar"></el-avatar>
                                                <b class="friend_list_username">{{ `${item.name}(${item.hxId})` }}</b>
                                            </div>
                                            <el-icon class="checked_btn">
                                                <div @click="handleAddFriendToSendList(item)">
                                                    <CircleCheckFilled v-if="item.isChecked" class="checked_icon" />
                                                    <span v-else class="unChecked_icon"></span>
                                                </div>
                                            </el-icon>
                                        </div>
                                    </div>
                                </template>
                            </div>

                        </el-scrollbar>
                    </el-col>

                </el-row>
            </div>
            <div class="taboo_right">
                <p>要发送给的人数：{{ checkedTobeSendFriend.length }}</p>
                <el-row style="height: 100%;margin-top: 5px;overflow: auto">
                    <el-col :span="24" class="friend_user_list_box">
                        <template v-if="checkedTobeSendFriend.length > 0">
                            <el-scrollbar>
                                <div v-for="(item, index) in checkedTobeSendFriend" :key="item">
                                    <div class="friend_user_list">
                                        <div class="friend_user_list_left">
                                            <el-avatar :src="defaultAvatar"></el-avatar>
                                            <b class="friend_list_username">{{ item }}</b>
                                        </div>
                                        <el-icon class="checked_btn" @click="delFriendFromCheckedList(item, index)">
                                            <CircleClose class="checked_icon" />
                                        </el-icon>
                                    </div>
                                </div>
                            </el-scrollbar>

                        </template>
                        <template v-else>
                            <el-empty :image-size="200" description="暂无要发送的好友~" />
                        </template>
                    </el-col>
                </el-row>
            </div>
        </div>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogTableVisible = false">取消</el-button>
                <el-button type="primary" @click="startSendMyUserCard">完成</el-button>
            </span>
        </template>
    </el-dialog>
</template>


<style lang="scss" scoped>
.taboo_box {
    position: relative;
    display: flex;
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
        // padding: 15px 15px;
    }
}

.taboo_right {
    width: 420px;
    max-height: 466px;
    min-height: 266px;
    overflow: hidden;
    padding-left: 16px;


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
        margin-right: 5px;
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
        padding: 0 10px;
    }
}

.title {
    text-align: left;
    height: 40px;
    width: 100%;
    line-height: 40px;
    color: #999;
}
</style>
