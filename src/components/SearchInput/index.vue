<script setup>
import { ref, toRaw, watch, defineProps, defineEmits } from 'vue'
import { EMClient } from '@/IM'
import { Search } from '@element-plus/icons-vue'
import { useLocalStorage } from '@vueuse/core'
import _ from 'lodash'
import { onClickOutside } from '@vueuse/core'
import { messageType } from '@/constant'
import dateFormater from '@/utils/dateFormater'
/* 单人头像 */
import defaultSingleAvatar from '@/assets/images/avatar/theme2x.png'
import defaultGroupAvatarUrl from '@/assets/images/avatar/jiaqun2x.png'
const { CHAT_TYPE } = messageType
const props = defineProps({
    searchType: {
        type: String,
        required: true
    },
    searchData: {
        type: Array,
        required: true
    }
})

const emit = defineEmits(['toChatMessage', 'toContacts'])
//搜索框value
const inputValue = ref('')
//控制搜索结果展示
const isShowResultContent = ref(false)
//搜索本地记录
const searchHistory = useLocalStorage(
    `EASEIM_${EMClient.user}_search_hisory`,
    []
)
//点击非搜索部分关闭页面
const searchBox = ref(null)
onClickOutside(searchBox, () => (isShowResultContent.value = false))
//筛选出来的搜索建议
const searchSuggest = ref({})
//搜索相匹配的值
const querySearch = () => {
    console.log('>>>>>>>>触发搜索')
    if (inputValue.value) {
        //搜索会话 conversation
        //todo 后续计划在会话数据结构中加keywords字段 通过keywords字段实现更多条件的搜索
        if (props.searchType === 'conversation') {
            const resObj = {}
            const resultList = _.filter(props.searchData, (o) =>
                o.conversationInfo.name.includes(inputValue.value)
            )
            resultList.length > 0 &&
                resultList.forEach((item) => {
                    if (resObj[item.conversationType]) {
                        resObj[item.conversationType].push(item)
                    } else {
                        resObj[item.conversationType] = []
                        resObj[item.conversationType].push(item)
                    }
                })
            searchSuggest.value = resObj
        }
        //搜索联系人 contacts
        if (props.searchType === 'contacts') {
            const resObj = {}
            const resultList = _.filter(
                props.searchData,
                (o) =>
                    (o.hxId && o.hxId.includes(inputValue.value)) ||
                    (o.nickname && o.nickname.includes(inputValue.value)) ||
                    (o.groupid && o.groupid.includes(inputValue.value)) ||
                    (o.groupname && o.groupname.includes(inputValue.value))
            )
            console.log('>>>>>>搜索给出结果', resultList)
            resultList.length > 0 &&
                resultList.forEach((item) => {
                    const key = item.hxId ? CHAT_TYPE.SINGLE : CHAT_TYPE.GROUP
                    if (resObj[key]) {
                        resObj[key].push(item)
                    } else {
                        resObj[key] = []
                        resObj[key].push(item)
                    }
                })
            searchSuggest.value = resObj
        }
    }
    //监听输入框为空字符串的时候置空搜索建议
    watch(inputValue, (newVal) => {
        if (newVal === '') searchSuggest.value = {}
    })
}
//点击历史记录通知对应类型的不同的组件跳转 例如 通知会话部分 通知联系人部分
const clickHistoryItem = (historyItem) => {
    console.log('>>>>>>>>>触发跳转', historyItem)
    if (props.searchType === 'conversation') {
        emitConversation(0, historyItem)
    }
    if (props.searchType === 'contacts') {
        console.log('.....')
    }
}
//选中则通知会话组件跳转
const emitConversation = (fromType, item) => {
    console.log('>>>>>>fromType,item', fromType, item)
    // fromType 0 为来自历史 1 为来自搜索
    if (fromType === 0) {
        searchHistory.value.length > 0 &&
            searchHistory.value.forEach((v, index) => {
                if (item.value === v.value) {
                    console.log(
                        '>> searchHistory.value[index]>>>',
                        searchHistory.value[index]
                    )
                    searchHistory.value.splice(index, 1)
                    searchHistory.value.unshift(item)
                }
            })
        emit('toChatMessage', item.value, item.chatType)
    }
    if (fromType === 1) {
        const searchItem = {
            label: item.conversationInfo.name,
            value: item.conversationKey,
            chatType: item.conversationType
        }
        const _rawSearchHistory = _.cloneDeep(toRaw(searchHistory.value))
        console.log('searchHistory', _rawSearchHistory)
        if (_rawSearchHistory.length === 0 || _rawSearchHistory === null) {
            console.log('>>>>>>_rawSearchHistory为空是新建一条')
            searchHistory.value.unshift(searchItem)
        }
        if (_rawSearchHistory.length > 0) {
            console.log('>>>>>>_rawSearchHistory不为空时开始筛选')
            const _index = _rawSearchHistory.findIndex((v) => {
                return v.value === item.conversationKey
            })
            if (_index === -1) {
                searchHistory.value.unshift(searchItem)
            } else {
                searchHistory.value.splice(_index, 1)
                searchHistory.value.unshift(searchItem)
            }
        }
        emit('toChatMessage', item.conversationKey, item.conversationType)
    }
    inputValue.value = ''
    searchSuggest.value = []
    isShowResultContent.value = false
}

//选中通知联系人跳转 联系人搜索暂不写入本地存储
const emitContacts = (item) => {
    console.log('>>>>>>联系人触发', item)
    if (item.hxId) {
        emit('toContacts', { id: item.hxId, chatType: CHAT_TYPE.SINGLE })
    }
    if (item.groupid) {
        emit('toContacts', { id: item.groupid, chatType: CHAT_TYPE.GROUP })
    }
}
</script>
<template>
    <div class="search_box" ref="searchBox">
        <div>
            <el-input
                v-model.trim="inputValue"
                placeholder="搜索"
                @focus="isShowResultContent = true"
                @clear="isShowResultContent = false"
                @input="querySearch"
                :prefix-icon="Search"
                clearable
            />
        </div>

        <div
            v-if="isShowResultContent"
            ref="resultContent"
            class="resultContent"
        >
            <div
                class="search_history"
                v-if="inputValue.length <= 0 && searchHistory"
            >
                <div class="title search_history_title">
                    <span>搜索历史</span>
                    <span
                        class="clear_search_history"
                        @click="searchHistory = null"
                        >清空</span
                    >
                </div>
                <ul class="search_history_item">
                    <template v-if="searchHistory.length > 0">
                        <li
                            v-for="(item, index) in searchHistory"
                            :key="item.label + index"
                            @click="clickHistoryItem(item)"
                        >
                            <span>{{
                                item.label ? item.label : item.value
                            }}</span>
                        </li>
                    </template>
                    <template v-else>
                        <el-empty description="暂无搜索记录..." />
                    </template>
                </ul>
            </div>
            <div v-if="searchType === 'conversation'">
                <div
                    v-for="(serchResult, SerchKey, index) in searchSuggest"
                    :key="index"
                >
                    <template v-if="SerchKey === CHAT_TYPE.SINGLE">
                        <div class="title">联系人</div>
                        <template
                            v-for="item in serchResult"
                            :key="item.fromInfo.fromId"
                        >
                            <div
                                class="search_result_item"
                                @click="emitConversation(1, item)"
                            >
                                <div class="item_body item_left">
                                    <div class="session_other_avatar">
                                        <el-avatar
                                            :size="34"
                                            :src="
                                                item.conversationInfo.avatarUrl
                                            "
                                        ></el-avatar>
                                    </div>
                                </div>
                                <div class="item_body item_main">
                                    <div class="name">
                                        {{ item.conversationInfo.name }}
                                    </div>
                                    <div class="last_msg_body">
                                        {{ item.fromInfo.fromId }}：{{
                                            item.latestMessage.msg
                                        }}
                                    </div>
                                </div>
                                <div class="item_body item_right">
                                    <span class="time">{{
                                        dateFormater(
                                            'MM/DD/HH:mm',
                                            item.latestSendTime
                                        )
                                    }}</span>
                                </div>
                            </div>
                        </template>
                    </template>
                    <template v-if="SerchKey === CHAT_TYPE.GROUP">
                        <div class="title">群组</div>
                        <template
                            v-for="item in serchResult"
                            :key="item.fromInfo.fromId"
                        >
                            <div
                                class="search_result_item"
                                @click="emitConversation(1, item)"
                            >
                                <div class="item_body item_left">
                                    <div class="session_other_avatar">
                                        <el-avatar
                                            :src="
                                                item.conversationInfo.avatarUrl
                                            "
                                        ></el-avatar>
                                    </div>
                                </div>
                                <div class="item_body item_main">
                                    <div class="name">
                                        {{ item.conversationInfo.name }}
                                    </div>
                                    <div class="last_msg_body">
                                        {{ item.fromInfo.fromId }}：{{
                                            item.latestMessage.msg
                                        }}
                                    </div>
                                </div>
                                <div class="item_body item_right">
                                    <span class="time">{{
                                        dateFormater(
                                            'MM/DD/HH:mm',
                                            item.latestSendTime
                                        )
                                    }}</span>
                                </div>
                            </div>
                        </template>
                    </template>
                </div>
            </div>
            <div v-if="searchType === 'contacts'">
                <div
                    v-for="(serchResult, SerchKey, index) in searchSuggest"
                    :key="index"
                >
                    <template v-if="SerchKey === CHAT_TYPE.SINGLE">
                        <div class="title">联系人</div>
                        <template
                            v-for="(item, index) in serchResult"
                            :key="index"
                        >
                            <div
                                class="search_result_item"
                                @click="emitContacts(item)"
                            >
                                <div class="item_body item_left">
                                    <div class="session_other_avatar">
                                        <el-avatar
                                            :src="
                                                item.hxId && item.avatarurl
                                                    ? item.avatarurl
                                                    : item.groupid
                                                    ? defaultGroupAvatarUrl
                                                    : defaultSingleAvatar
                                            "
                                        >
                                        </el-avatar>
                                    </div>
                                </div>
                                <div class="item_body item_main">
                                    <div class="name">
                                        {{
                                            item.nickname
                                                ? item.nickname
                                                : item.groupname
                                                ? item.groupname
                                                : item.hxId
                                        }}
                                    </div>
                                </div>
                            </div>
                        </template>
                    </template>
                    <template v-if="SerchKey === CHAT_TYPE.GROUP">
                        <div class="title">群组</div>
                        <template
                            v-for="(item, index) in serchResult"
                            :key="index"
                        >
                            <div
                                class="search_result_item"
                                @click="emitContacts(item)"
                            >
                                <div class="item_body item_left">
                                    <div class="session_other_avatar">
                                        <el-avatar
                                            :src="
                                                item.hxId && item.avatarurl
                                                    ? item.avatarurl
                                                    : item.groupid
                                                    ? defaultGroupAvatarUrl
                                                    : defaultSingleAvatar
                                            "
                                        >
                                        </el-avatar>
                                    </div>
                                </div>
                                <div class="item_body item_main">
                                    <div class="name">
                                        {{
                                            item.nickname
                                                ? item.nickname
                                                : item.groupname
                                                ? item.groupname
                                                : item.hxId
                                        }}
                                    </div>
                                </div>
                            </div>
                        </template>
                    </template>
                </div>
            </div>
            <el-empty
                v-if="inputValue.length > 0 && searchSuggest.length <= 0"
                :image-size="200"
                description="没有找到匹配结果"
            />
        </div>
    </div>
</template>
<style lang="scss" scoped>
::v-deep .el-input__wrapper {
    box-shadow: none;
}

.search_box {
    width: 100%;
    height: 60px;
    background: #f8f8f8;
    padding: 14px 20px;
    box-sizing: border-box;
}

.resultContent {
    position: absolute;
    top: 58px;
    left: 0;
    width: 100%;
    height: calc(100% - 60px);
    background-color: #ededed;
    z-index: 888;
    overflow-y: auto;

    .search_history {
        .search_history_item {
            width: 100%;
            font-family: 'PingFang SC';
            font-style: normal;
            font-weight: 400;
            font-size: 12px;
            line-height: 17px;
            letter-spacing: 0.669643px;
            color: #000000;

            li {
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: flex-start;
                padding: 0 15px;
                background: #fff;
                margin: 1px 0;
                height: 32px;
                transition: all 0.5s;
                cursor: pointer;

                &:hover {
                    background: #e5e5e5;
                }
            }
        }
    }

    .title {
        height: 32px;
        line-height: 32px;
        padding: 0 15px;
        background: #f2f2f2;
        font-weight: 400;
        font-size: 12px;
        letter-spacing: 0.342857px;
        color: #333333;
    }

    .search_history_title {
        display: flex;
        flex-direction: row;
        justify-content: space-between;

        .clear_search_history:hover {
            color: #00a0fb;
            cursor: pointer;
        }
    }

    .search_result_item {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        height: 66px;
        background: #fff;
        // padding: 0 14px;
        cursor: pointer;

        .item_left {
            padding: 0;
            margin-right: 11px;
            margin-left: 14px;
        }

        .item_main {
            // width: 25%;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: space-around;
            height: 40px;
            font-family: 'PingFang SC';
            font-style: normal;
            font-weight: 500;
            font-size: 14px;

            .name {
                max-width: 100px;
                height: 17px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .last_msg_body {
                max-width: 100px;
                height: 17px;
                font-family: 'PingFang SC';
                font-style: normal;
                font-weight: 400;
                font-size: 12px;
                line-height: 17px;
                letter-spacing: 0.3px;
                color: #a3a3a3;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }

        .time {
            position: absolute;
            right: 15px;
            top: 13px;
            font-family: 'PingFang SC';
            font-style: normal;
            font-weight: 400;
            font-size: 10px;
            line-height: 14px;
            letter-spacing: 0.25px;
            color: #a3a3a3;
        }
    }
}
</style>
