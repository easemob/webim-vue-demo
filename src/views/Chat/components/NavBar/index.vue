<script setup>
import { ref, computed, watch } from 'vue'
/* vuex */
import { useStore } from 'vuex'
/* router */
import router from '@/router'
/* route */
import { useRoute } from 'vue-router'
/* lodash */
import _ from 'lodash'
/* icon */
import { Plus, Message } from '@element-plus/icons-vue'
/* 组件 */
import MiniInfoCard from './components/AboutUserInfoCard/MiniInfoCard.vue'
import UserOnlineStatusCard from './components/UserOnlineStatusCard.vue'
import ApplyComponents from './components/ApplyComponents'
import Logout from './components/Logout.vue'
import EditUserInfoCard from './components/AboutUserInfoCard/EditUserInfoCard.vue'
import PersonalsettingCard from './components/PersonalsettingCard'
/* constants */
import { onLineStatus } from '@/constant'
/* vueUse */
import { onClickOutside } from '@vueuse/core'
const route = useRoute()
const store = useStore()
/* 取用户头像 */
const loginUserAvatar = computed(() => {
    return store.getters.loginUserInfo.avatarurl
})

/* 用户在线状态--样式展示逻辑 */
const loginUserOnlineStatusIcon = computed(() => {
    const loginUserOnlineStatus = store.state.loginUserOnlineStatus
    if (loginUserOnlineStatus === 'Unset' || loginUserOnlineStatus === '') {
        return ''
    } else {
        return (
            (onLineStatus[loginUserOnlineStatus] &&
                onLineStatus[loginUserOnlineStatus].style) ||
            ''
        )
    }
})

/* tabbar icon 路由跳转 */
const skipRouterName = ref('conversation')
const highligthConversation = require('@/assets/images/tabbar/highlightconversation.png')
const grayConversation = require('@/assets/images/tabbar/grayconversation.png')
const highligthContacts = require('@/assets/images/tabbar/higtlightcontacts.png')
const grayContacts = require('@/assets/images/tabbar/graycontacts.png')
const changeSkipRouterName = (routerName) => {
    router.push(`/chat/${routerName}`)
}
watch(
    () => route.path,
    (newPath) => {
        if (newPath.includes('/chat/conversation')) {
            skipRouterName.value = 'conversation'
        }
        if (newPath.includes('/chat/contacts')) {
            skipRouterName.value = 'contacts'
        }
    }
)
/* 取会话以及系统消息未读数控制会话icon badge显隐 */
const conversationUnreadCount = computed(() => {
    const informCount =
        _.sumBy(store.state.Conversation.informDetail, 'untreated') || 0
    const commonConversationCount = _.sumBy(
        _.values(store.state.Conversation.conversationListFromLocal),
        'unReadCount'
    )
    return { informCount, commonConversationCount }
})
/* 用户信息卡片显隐 */
const isShowUserInfoCard = ref(false)
const changeUserInfoCard = ref(null)
onClickOutside(changeUserInfoCard, () => (isShowUserInfoCard.value = false))

/* 新建功能部分 */
const settingComp = ref(null)
const settingPopover = ref(null)
const modalType = ref('')
const isShowPopover = ref(false)
//新建功能相关icon
const createGroupIcon = require('@/assets/images/tabbar/1461654066965_.pic.jpg')
const applyJoinGroupIcon = require('@/assets/images/tabbar/1471654067125_.pic.jpg')
const applyAddFriendIcon = require('@/assets/images/tabbar/1481654067168_.pic.jpg')
onClickOutside(settingPopover, () => (isShowPopover.value = false))
const showInputModal = (type) => {
    modalType.value = type
    settingComp.value.dialogVisible = true
}

/* 更多操作部分more_settings */
const edituserinfo = ref(null)
const personalsetting = ref(null)
const logout = ref(null)
//打开意见反馈发送邮箱页
const toSendFeedback = () => window.open('mailto:yunying@easemob.com')
</script>

<template>
    <!-- 头像 -->
    <div class="chat_avatar">
        <el-avatar :src="loginUserAvatar" @click="isShowUserInfoCard = true">
        </el-avatar>
        <el-popover
            popper-class="user_status_popover"
            :width="10"
            trigger="click"
            placement="right-start"
            :show-arrow="false"
        >
            <template #reference>
                <div
                    class="online_status"
                    :style="loginUserOnlineStatusIcon"
                ></div>
            </template>
            <!-- 用户在线状态切换卡片 -->
            <UserOnlineStatusCard />
        </el-popover>
    </div>
    <!-- 用户个人信息卡片 -->
    <MiniInfoCard ref="changeUserInfoCard" v-show="isShowUserInfoCard" />
    <!-- 去往会话 -->
    <div
        class="chat_converation chat_icon_box"
        @click="changeSkipRouterName('conversation')"
    >
        <div class="img_box">
            <img
                :src="
                    skipRouterName === 'conversation'
                        ? highligthConversation
                        : grayConversation
                "
                alt=""
            />
            <span
                v-if="
                    conversationUnreadCount.informCount ||
                    conversationUnreadCount.commonConversationCount
                "
                class="badge"
            ></span>
        </div>
    </div>
    <!-- 去往联系人 -->
    <div
        class="chat_contacts chat_icon_box"
        @click="changeSkipRouterName('contacts')"
    >
        <img
            class="chat_contacts_icon"
            :src="
                skipRouterName === 'contacts' ? highligthContacts : grayContacts
            "
            alt=""
        />
    </div>
    <!-- 新建添加部分 -->
    <div class="chat_settings">
        <el-popover
            popper-class="setting_popover"
            ref="settingPopover"
            v-model:visible="isShowPopover"
            placement="right-end"
            trigger="click"
        >
            <template #reference>
                <el-icon @click="isShowPopover = true">
                    <Plus />
                </el-icon>
            </template>
            <template #default>
                <div class="setting_fun_list">
                    <div
                        class="func_item"
                        @click="showInputModal('addNewFriend')"
                    >
                        <span class="settting_fun_icon">
                            <img :src="applyAddFriendIcon" alt="" />
                        </span>
                        <span class="setting_fun_text">添加好友</span>
                    </div>
                    <div
                        class="func_item"
                        @click="showInputModal('createNewGroups')"
                    >
                        <span class="settting_fun_icon">
                            <img :src="createGroupIcon" alt="" />
                        </span>
                        <span class="setting_fun_text">创建群组</span>
                    </div>
                    <div
                        class="func_item"
                        @click="showInputModal('applyJoinGroups')"
                    >
                        <span class="settting_fun_icon">
                            <img :src="applyJoinGroupIcon" alt="" />
                        </span>
                        <span class="setting_fun_text apply_groups">
                            申请入群
                        </span>
                    </div>
                </div>
            </template>
        </el-popover>
    </div>
    <!-- 更多设置 -->
    <div class="more_settings">
        <el-popover
            popper-class="setting_popover"
            placement="right-end"
            :width="150"
            trigger="click"
        >
            <template #reference>
                <div class="more_settings_icon">
                    <svg
                        width="27"
                        height="20"
                        viewBox="0 0 27 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M7.91406 3.19434H25.2559C25.5436 3.19434 25.7848 3.09701 25.9795 2.90234C26.1826 2.70768 26.2842 2.46647 26.2842 2.17871C26.2842 1.89095 26.1826 1.64974 25.9795 1.45508C25.7848 1.25195 25.5436 1.15039 25.2559 1.15039H7.91406C7.6263 1.15039 7.38086 1.25195 7.17773 1.45508C6.98307 1.64974 6.88574 1.89095 6.88574 2.17871C6.88574 2.46647 6.98307 2.70768 7.17773 2.90234C7.38086 3.09701 7.6263 3.19434 7.91406 3.19434ZM7.91406 10.875H25.2559C25.5436 10.875 25.7848 10.7777 25.9795 10.583C26.1826 10.3799 26.2842 10.1344 26.2842 9.84668C26.2842 9.55892 26.1826 9.31771 25.9795 9.12305C25.7848 8.92839 25.5436 8.83105 25.2559 8.83105H7.91406C7.6263 8.83105 7.38086 8.92839 7.17773 9.12305C6.98307 9.31771 6.88574 9.55892 6.88574 9.84668C6.88574 10.1344 6.98307 10.3799 7.17773 10.583C7.38086 10.7777 7.6263 10.875 7.91406 10.875ZM7.91406 18.543H25.2559C25.5436 18.543 25.7848 18.4456 25.9795 18.251C26.1826 18.0563 26.2842 17.8151 26.2842 17.5273C26.2842 17.2396 26.1826 16.9984 25.9795 16.8037C25.7848 16.6006 25.5436 16.499 25.2559 16.499H7.91406C7.6263 16.499 7.38086 16.6006 7.17773 16.8037C6.98307 16.9984 6.88574 17.2396 6.88574 17.5273C6.88574 17.8151 6.98307 18.0563 7.17773 18.251C7.38086 18.4456 7.6263 18.543 7.91406 18.543ZM2.30273 3.76562C2.74284 3.76562 3.11947 3.61328 3.43262 3.30859C3.74577 2.99544 3.90234 2.61882 3.90234 2.17871C3.90234 1.73014 3.74577 1.35352 3.43262 1.04883C3.11947 0.735677 2.74284 0.579102 2.30273 0.579102C1.86263 0.579102 1.486 0.735677 1.17285 1.04883C0.859701 1.35352 0.703125 1.73014 0.703125 2.17871C0.703125 2.61882 0.859701 2.99544 1.17285 3.30859C1.486 3.61328 1.86263 3.76562 2.30273 3.76562ZM2.30273 11.4463C2.74284 11.4463 3.11947 11.2897 3.43262 10.9766C3.74577 10.6634 3.90234 10.2868 3.90234 9.84668C3.90234 9.40658 3.74577 9.02995 3.43262 8.7168C3.11947 8.40365 2.74284 8.24707 2.30273 8.24707C1.86263 8.24707 1.486 8.40365 1.17285 8.7168C0.859701 9.02995 0.703125 9.40658 0.703125 9.84668C0.703125 10.2868 0.859701 10.6634 1.17285 10.9766C1.486 11.2897 1.86263 11.4463 2.30273 11.4463ZM2.30273 19.127C2.74284 19.127 3.11947 18.9704 3.43262 18.6572C3.74577 18.3441 3.90234 17.9674 3.90234 17.5273C3.90234 17.0788 3.74577 16.7021 3.43262 16.3975C3.11947 16.0843 2.74284 15.9277 2.30273 15.9277C1.86263 15.9277 1.486 16.0843 1.17285 16.3975C0.859701 16.7021 0.703125 17.0788 0.703125 17.5273C0.703125 17.9674 0.859701 18.3441 1.17285 18.6572C1.486 18.9704 1.86263 19.127 2.30273 19.127Z"
                            fill="#8E8E8E"
                        />
                    </svg>
                </div>
            </template>
            <template #default>
                <div class="setting_fun_list">
                    <!-- 用户信息查看编辑 -->
                    <div
                        class="func_item"
                        @click="edituserinfo.dialogVisible = true"
                    >
                        <span class="settting_fun_icon">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <mask
                                    id="mask0_358_22978"
                                    style="mask-type: alpha"
                                    maskUnits="userSpaceOnUse"
                                    x="1"
                                    y="13"
                                    width="18"
                                    height="7"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        clip-rule="evenodd"
                                        d="M1.66693 13.9138H18.2035V19.1663H1.66693V13.9138Z"
                                        fill="white"
                                    />
                                </mask>
                                <g mask="url(#mask0_358_22978)">
                                    <path
                                        fill-rule="evenodd"
                                        clip-rule="evenodd"
                                        d="M3.9029 15.1638C3.395 15.1638 2.98272 15.5563 2.98272 16.038V17.0422C2.98272 17.5247 3.395 17.9163 3.9029 17.9163H15.9669C16.4748 17.9163 16.888 17.5247 16.888 17.0422V16.038C16.888 15.5563 16.4748 15.1638 15.9669 15.1638H3.9029ZM15.9669 19.1663H3.9029C2.66956 19.1663 1.66693 18.2138 1.66693 17.0422V16.038C1.66693 14.8672 2.66956 13.9138 3.9029 13.9138H15.9669C17.2003 13.9138 18.2038 14.8672 18.2038 16.038V17.0422C18.2038 18.2138 17.2003 19.1663 15.9669 19.1663V19.1663Z"
                                        fill="#333333"
                                    />
                                </g>
                                <path
                                    fill-rule="evenodd"
                                    clip-rule="evenodd"
                                    d="M17.247 11.5199H13.5864C13.4466 11.5199 13.3334 11.3991 13.3334 11.2499C13.3334 11.1008 13.4466 10.9799 13.5864 10.9799H17.247C17.3868 10.9799 17.5 11.1008 17.5 11.2499C17.5 11.3991 17.3868 11.5199 17.247 11.5199"
                                    fill="#333333"
                                />
                                <path
                                    fill-rule="evenodd"
                                    clip-rule="evenodd"
                                    d="M13.6838 11.0833C13.6128 11.0833 13.5552 11.1483 13.5552 11.2283C13.5552 11.3091 13.6128 11.3741 13.6838 11.3741H17.1496C17.2206 11.3741 17.2783 11.3091 17.2783 11.2283C17.2783 11.1483 17.2206 11.0833 17.1496 11.0833H13.6838ZM17.1496 11.6233H13.6838C13.4901 11.6233 13.3334 11.4466 13.3334 11.2283C13.3334 11.0108 13.4901 10.8333 13.6838 10.8333H17.1496C17.3433 10.8333 17.5 11.0108 17.5 11.2283C17.5 11.4466 17.3433 11.6233 17.1496 11.6233V11.6233Z"
                                    fill="#333333"
                                />
                                <mask
                                    id="mask1_358_22978"
                                    style="mask-type: alpha"
                                    maskUnits="userSpaceOnUse"
                                    x="1"
                                    y="1"
                                    width="13"
                                    height="13"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        clip-rule="evenodd"
                                        d="M1.66669 1.54346H13.109V13.2855H1.66669V1.54346Z"
                                        fill="white"
                                    />
                                </mask>
                                <g mask="url(#mask1_358_22978)">
                                    <path
                                        fill-rule="evenodd"
                                        clip-rule="evenodd"
                                        d="M7.38784 2.87655C4.97553 2.87655 3.01284 4.9121 3.01284 7.41432C3.01284 9.91655 4.97553 11.9521 7.38784 11.9521C9.80015 11.9521 11.7628 9.91655 11.7628 7.41432C11.7628 4.9121 9.80015 2.87655 7.38784 2.87655M7.38784 13.2854C4.23335 13.2854 1.66669 10.6517 1.66669 7.41432C1.66669 4.17699 4.23335 1.54321 7.38784 1.54321C10.5432 1.54321 13.109 4.17699 13.109 7.41432C13.109 10.6517 10.5432 13.2854 7.38784 13.2854"
                                        fill="#333333"
                                    />
                                </g>
                            </svg>
                        </span>
                        <span class="setting_fun_text">用户信息</span>
                    </div>
                    <!-- 个性化设置 -->
                    <div
                        class="func_item"
                        @click="personalsetting.dialogVisible = true"
                    >
                        <span class="settting_fun_icon">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 1024 1024"
                                xmlns="http://www.w3.org/2000/svg"
                                data-v-2e07656f=""
                            >
                                <path
                                    fill="currentColor"
                                    d="M600.704 64a32 32 0 0 1 30.464 22.208l35.2 109.376c14.784 7.232 28.928 15.36 42.432 24.512l112.384-24.192a32 32 0 0 1 34.432 15.36L944.32 364.8a32 32 0 0 1-4.032 37.504l-77.12 85.12a357.12 357.12 0 0 1 0 49.024l77.12 85.248a32 32 0 0 1 4.032 37.504l-88.704 153.6a32 32 0 0 1-34.432 15.296L708.8 803.904c-13.44 9.088-27.648 17.28-42.368 24.512l-35.264 109.376A32 32 0 0 1 600.704 960H423.296a32 32 0 0 1-30.464-22.208L357.696 828.48a351.616 351.616 0 0 1-42.56-24.64l-112.32 24.256a32 32 0 0 1-34.432-15.36L79.68 659.2a32 32 0 0 1 4.032-37.504l77.12-85.248a357.12 357.12 0 0 1 0-48.896l-77.12-85.248A32 32 0 0 1 79.68 364.8l88.704-153.6a32 32 0 0 1 34.432-15.296l112.32 24.256c13.568-9.152 27.776-17.408 42.56-24.64l35.2-109.312A32 32 0 0 1 423.232 64H600.64zm-23.424 64H446.72l-36.352 113.088-24.512 11.968a294.113 294.113 0 0 0-34.816 20.096l-22.656 15.36-116.224-25.088-65.28 113.152 79.68 88.192-1.92 27.136a293.12 293.12 0 0 0 0 40.192l1.92 27.136-79.808 88.192 65.344 113.152 116.224-25.024 22.656 15.296a294.113 294.113 0 0 0 34.816 20.096l24.512 11.968L446.72 896h130.688l36.48-113.152 24.448-11.904a288.282 288.282 0 0 0 34.752-20.096l22.592-15.296 116.288 25.024 65.28-113.152-79.744-88.192 1.92-27.136a293.12 293.12 0 0 0 0-40.256l-1.92-27.136 79.808-88.128-65.344-113.152-116.288 24.96-22.592-15.232a287.616 287.616 0 0 0-34.752-20.096l-24.448-11.904L577.344 128zM512 320a192 192 0 1 1 0 384 192 192 0 0 1 0-384zm0 64a128 128 0 1 0 0 256 128 128 0 0 0 0-256z"
                                ></path>
                            </svg>
                        </span>
                        <span class="setting_fun_text">系统设置</span>
                    </div>
                    <!-- 意见反馈 -->
                    <div class="func_item" @click="toSendFeedback">
                        <span class="settting_fun_icon">
                            <el-icon>
                                <Message />
                            </el-icon>
                        </span>
                        <span class="setting_fun_text">意见反馈</span>
                    </div>
                    <!-- 退出登陆 -->
                    <div class="func_item" @click="logout.dialogVisible = true">
                        <span class="settting_fun_icon">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M6.02125 4.18042C3.90653 5.49657 2.5 7.84403 2.5 10.5156C2.5 14.6507 5.85404 18 9.99496 18C14.1359 18 17.4899 14.6507 17.4899 10.5156C17.4899 7.85386 16.0932 5.51621 13.9982 4.19024"
                                    stroke="#333333"
                                    stroke-width="1.4"
                                    stroke-miterlimit="10"
                                    stroke-linecap="round"
                                />
                                <path
                                    d="M10.054 2V8.87542"
                                    stroke="#333333"
                                    stroke-width="1.4"
                                    stroke-miterlimit="10"
                                    stroke-linecap="round"
                                />
                            </svg>
                        </span>
                        <span class="setting_fun_text">退出登录</span>
                    </div>
                </div>
            </template>
        </el-popover>
    </div>
    <div class="components">
        <!-- 群组新建 申请入群 添加好友模块 -->
        <ApplyComponents ref="settingComp" :modalType="modalType" />
        <!-- 个人配置 -->
        <PersonalsettingCard ref="personalsetting" />
        <!-- 用户属性编辑 -->
        <EditUserInfoCard ref="edituserinfo" />
        <!-- 退出登陆模块 -->
        <Logout ref="logout" />
    </div>
</template>

<style lang="scss" scoped>
.chat_avatar {
    margin-top: 43px;
    position: relative;
    width: 44px;
    height: 44px;
    transition: all 0.3s;

    &:hover {
        transform: scale(1.3);
    }

    span {
        display: inline-block;
        width: 100%;
        height: 100%;
    }

    .online_status {
        position: absolute;
        right: 2px;
        bottom: 2px;
        display: inline-block;
        width: 6px;
        height: 6px;
        border: 2px solid #fff;
        background: #fff;
        border-radius: 50%;
        transition: all 0.3s;
        cursor: pointer;

        &:hover {
            transform: scale(1.2);
        }
    }
}

.chat_icon_box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 67px;
    text-align: center;
    line-height: 67px;
    margin: 4px 0;
}

.chat_converation {
    .img_box {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;

        img {
            display: inline-block;
            width: 27px;
            height: 27px;
            transition: all 0.5s;

            &:hover {
                transform: scale(1.3);
            }
        }

        .badge {
            position: absolute;
            right: 0;
            top: 8px;
            display: inline-block;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: red;
        }
    }
}

.chat_contacts {
    img {
        display: inline-block;
        width: 27px;
        height: 27px;
        transition: all 0.5s;

        &:hover {
            transform: scale(1.3);
        }
    }
}

.chat_settings {
    position: absolute;
    bottom: 92px;
    font-size: 30px;
    color: #8e8e8e;
    cursor: pointer;
    transition: all 0.5s;

    &:hover {
        color: #1b83f9;
        transform: scale(1.3);
    }

    .chat_setting_item {
        width: 100%;
        height: 30px;
    }
}

.more_settings {
    position: absolute;
    bottom: 46px;
    color: #8e8e8e;
    cursor: pointer;
    transition: all 0.5s;

    &:hover {
        transform: scale(1.3);
    }
}

.setting_fun_list {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .func_item {
        display: flex;
        flex-direction: row;
        align-items: center;
        // justify-content: space-around;
        width: 101px;
        height: 40px;
        border-radius: 3px;

        &:hover {
            background-color: #f2f2f2;
        }

        .settting_fun_icon {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 5px;

            img {
                width: 20px;
                height: 20px;
            }
        }

        .setting_fun_text {
            display: inline-block;
            text-align: center;
            margin-left: 12px;
            height: 20px;
            width: 58px;
            font-weight: 400;
            font-size: 14px;
            line-height: 20px;
            letter-spacing: 0.4px;
            color: #333333;
            cursor: pointer;
        }

        .apply_groups {
            display: flex;
            flex-direction: column;
        }
    }
}

.settting_fun_icon {
    font-size: 20px;
}

.line {
    display: inline-block;
    width: 69px;
    height: 1px;
    border: 1px solid rgba(0, 0, 0, 0.0462467);
}

.components {
    :deep(.edit_userinfo_diglog) {
        border-radius: 4px;
        overflow: hidden;
    }

    :deep(.setting_func_diglog) > .el-dialog__body {
        padding: 28px 24px 24px 24px;
    }

    :deep(.setting_func_diglog) > .el-dialog__header {
        background: #f2f2f2;
        margin: 0;
    }

    :deep(.edit_userinfo_diglog) > .el-dialog__header {
        padding: 0;
        margin-right: 0px;
    }

    :deep(.edit_userinfo_diglog) > .el-dialog__body {
        padding: 0;
        border-radius: 4px;
    }

    :deep(.login_diglog) > .el-dialog__header {
        background: #f2f2f2;
        margin: 0;
    }

    :deep(.personal_setting_card) > .el-dialog__header {
        background: #f2f2f2;
        margin: 0;
    }
}
</style>
