<script setup>
import { reactive, ref, computed, toRefs, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useClipboard, usePermission } from '@vueuse/core'
import { ElMessage, ElMessageBox } from 'element-plus'
import { EaseChatClient } from '@/IM/initwebsdk'
import BenzAMRRecorder from 'benz-amr-recorder'
import fileSizeFormat from '@/utils/fileSizeFormat'
import dateFormat from '@/utils/dateFormater'
import { messageType } from '@/constant'
import { handleSDKErrorNotifi } from '@/utils/handleSomeData'
/* utils */
import paseLink from '@/utils/paseLink'
/* 默认头像 */
import defaultAvatar from '@/assets/images/avatar/theme2x.png'
import ReportMessage from '../suit/reportMessage.vue'
/* components */
import ModifyMessage from '../suit/modifyMessage.vue'
/* vuex store */
const store = useStore()
/* props */
const props = defineProps({
    messageData: {
        type: [Array, Object],
        default: () => []
    },
    nowPickInfo: {
        type: Object,
        default: () => ({}),
        required: true
    }
})
const { nowPickInfo } = toRefs(props)
/* emits */
const emit = defineEmits(['scrollMessageList', 'reEditMessage', 'messageQuote'])
const { messageData } = toRefs(props)
/* constant */
const { ALL_MESSAGE_TYPE, CUSTOM_TYPE, CHAT_TYPE, CHANGE_MESSAGE_BODAY_TYPE } =
    messageType
/* login hxId */
const loginUserId = EaseChatClient.user

/* computed-- 消息来源是否为自己 */
const isMyself = computed(() => {
    return (msgBody) => {
        return msgBody.from === loginUserId
    }
})
/* 文本中是否包含link */
const isLink = computed(() => {
    return (msg) => {
        return paseLink(msg).isLink
    }
})
/* 获取自己的用户信息 */
const loginUserInfo = computed(() => store.state.loginUserInfo)

/* 获取他人的用户信息 */
const otherUserInfo = computed(() => {
    return (otherId) => {
        const otherInfos = store.state.Contacts.friendList[otherId] || {
            avatarurl: defaultAvatar
        }
        return otherInfos
    }
})
//处理聊天对方昵称展示
const handleNickName = computed(() => {
    const { chatType, id } = nowPickInfo.value
    const friendList = store.state.Contacts.friendList
    const groupsInfos = store.state.Groups.groupsInfos
    return (hxId) => {
        if (chatType === CHAT_TYPE.SINGLE) {
            return friendList[hxId]?.nickname || hxId
        }
        if (chatType === CHAT_TYPE.GROUP) {
            const userInfoFromGroupNickname =
                groupsInfos[id]?.groupMemberInfo?.[hxId]?.nickName
            const friendUserInfoNickname = friendList[hxId]?.nickname
            return userInfoFromGroupNickname || friendUserInfoNickname || hxId
        }
    }
})
/* 处理时间显示间隔 */
const handleMsgTimeShow = computed(() => {
    const msgList = Array.from(messageData.value)
    return (time, index) => {
        if (index !== 0) {
            const lastTime = msgList[index - 1].time
            return time - lastTime > 50000
                ? dateFormat('MM/DD/HH:mm', time)
                : false
        } else {
            return dateFormat('MM/DD/HH:mm', time)
        }
    }
})
//音频播放状态
const audioPlayStatus = reactive({
    isPlaying: false, //是否在播放中
    playMsgId: '' //在播放的音频消息id,
})
//开始播放
const startplayAudio = (msgBody) => {
    const armRec = new BenzAMRRecorder()
    const src = msgBody.url
    audioPlayStatus.playMsgId = msgBody.id
    console.log('>>>>>开始播放音频', msgBody.url)
    //初始化音频源并调用播放
    armRec.initWithUrl(src).then(() => {
        if (!audioPlayStatus.isPlaying) {
            armRec.play()
        }
    })
    //播放开始监听
    armRec.onPlay(() => {
        audioPlayStatus.isPlaying = true
        audioPlayStatus.playMsgId = msgBody.id
    })
    //播放结束监听
    armRec.onStop(() => {
        audioPlayStatus.isPlaying = false
        audioPlayStatus.playMsgId = ''
    })
}

//复制文本
// const permissionRead = usePermission('clipboard-read') //请求剪切板读的权限
// const permissionWrite = usePermission('clipboard-write') //请求剪切板写的权限
const { copy, copied, isSupported } = useClipboard() //copy 复制方法 copied 是否已经复制 isSupported 是否支持剪切板
const copyTextMessages = (msg) => {
    copy(msg)
    if (copied) {
        ElMessage({
            type: 'success',
            message: '成功复制到剪切板',
            center: true
        })
        console.log('>>>>>成功复制')
    }
}
//引用消息
let clickQuoteMsgId = ref('')
const clickQuoteMessage = (msgQuote) => {
    const { msgID } = msgQuote
    nextTick(() => {
        const messageQuery = document.querySelectorAll('.messageList_box')
        const filterQuoteMsg =
            messageQuery.length &&
            Array.from(messageQuery).filter(
                (node) => msgID === node.dataset.mid
            )
        if (filterQuoteMsg.length) {
            filterQuoteMsg[0].scrollIntoView()
            clickQuoteMsgId.value = msgID
            setTimeout(() => {
                clickQuoteMsgId.value = ''
            }, 1000)
        } else {
            ElMessage({
                type: 'error',
                message: '无法定位到原消息',
                center: true
            })
        }
    })
}
//撤回消息
const recallMessage = async ({ id, to, chatType }) => {
    const options = {
        mid: id,
        to: to,
        chatType: chatType
    }
    try {
        await store.dispatch('recallMessage', options)
    } catch (error) {
        handleSDKErrorNotifi(error.type, error.message)
        console.log('>>>>>>撤回失败', error)
    }
}
//编辑消息

const modifyMessageRef = ref(null)
const showModifyMsgModal = (msgBody) => {
    nextTick(() => {
        modifyMessageRef.value.initModifyMessage(msgBody)
    })
}
//删除消息
const deleteMessage = async (msgBody) => {
    try {
        await ElMessageBox.confirm(
            '消息删除是从服务端删除，确认要删除吗？',
            '消息删除',
            {
                confirmButtonText: '确认',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )
        await store.dispatch('removeMessage', { ...msgBody })
        ElMessage({
            type: 'success',
            message: '消息已删除',
            center: true
        })
    } catch (error) {
        console.log('>>>>>取消', error)
        if (error !== 'cancel') {
            ElMessage({
                type: 'error',
                message: '删除失败',
                center: true
            })
        }
    }
}
// 消息举报
const reportMessage = ref(null)
//举报消息
const informOnMessage = (msgBody) => {
    console.log('>>>>调用举报')
    reportMessage.value.alertReportMsgModal(msgBody)
}
//父组件重新编辑方法
const reEdit = (msg) => emit('reEditMessage', msg)
//调用父组件引用消息
const onMsgQuote = (msg) => emit('messageQuote', msg)
</script>
<template>
    <div>
        <div
            class="messageList_box"
            v-for="(msgBody, index) in messageData"
            :key="msgBody.id"
            :data-mid="msgBody.id"
        >
            <!-- 普通消息气泡 -->
            <div
                v-if="
                    !msgBody.isRecall &&
                    msgBody.type !== ALL_MESSAGE_TYPE.INFORM
                "
                class="message_box_item"
                :style="{
                    flexDirection: isMyself(msgBody) ? 'row-reverse' : 'row'
                }"
            >
                <div class="message_item_time">
                    {{ handleMsgTimeShow(msgBody.time, index) || '' }}
                </div>
                <el-avatar
                    class="message_item_avator"
                    :src="
                        isMyself(msgBody)
                            ? loginUserInfo.avatarurl
                            : otherUserInfo(msgBody.from).avatarurl ||
                              defaultAvatar
                    "
                >
                </el-avatar>
                <!-- 普通消息内容 -->
                <div class="message_box_card">
                    <span
                        v-show="!isMyself(msgBody)"
                        class="message_box_nickname"
                        >{{ handleNickName(msgBody.from) }}</span
                    >
                    <el-dropdown
                        class="message_box_content"
                        :class="[
                            isMyself(msgBody)
                                ? 'message_box_content_mine'
                                : 'message_box_content_other',
                            clickQuoteMsgId === msgBody.id && 'quote_msg_avtive'
                        ]"
                        trigger="contextmenu"
                        placement="bottom-end"
                    >
                        <!-- 文本类型消息 -->
                        <p
                            style="padding: 10px; line-height: 20px"
                            v-if="msgBody.type === ALL_MESSAGE_TYPE.TEXT"
                        >
                            <template v-if="!isLink(msgBody.msg)">
                                {{ msgBody.msg }}
                                <!-- 已编辑 -->
                                <sup
                                    style="font-size: 7px; color: #707784"
                                    v-show="
                                        msgBody?.modifiedInfo?.operationCount
                                    "
                                    >（已编辑）</sup
                                >
                            </template>
                            <template v-else>
                                <span v-html="paseLink(msgBody.msg).msg"> </span
                            ></template>
                        </p>
                        <!-- 图片类型消息 -->
                        <!-- <div> -->
                        <el-image
                            v-if="msgBody.type === ALL_MESSAGE_TYPE.IMAGE"
                            style="border-radius: 5px"
                            :src="msgBody.thumb"
                            :preview-src-list="[msgBody.url]"
                            :initial-index="1"
                            fit="cover"
                        />
                        <!-- </div> -->
                        <!-- 语音类型消息 -->
                        <div
                            :class="[
                                'message_box_content_audio',
                                isMyself(msgBody)
                                    ? 'message_box_content_audio_mine'
                                    : 'message_box_content_audio_other'
                            ]"
                            v-if="msgBody.type === ALL_MESSAGE_TYPE.AUDIO"
                            @click="startplayAudio(msgBody)"
                            :style="`width:${msgBody.length * 10}px`"
                        >
                            <span class="audio_length_text">
                                {{ msgBody.length }}′′
                            </span>
                            <div
                                :class="[
                                    isMyself(msgBody)
                                        ? 'play_audio_icon_mine'
                                        : 'play_audio_icon_other',
                                    audioPlayStatus.playMsgId === msgBody.id &&
                                        'start_play_audio'
                                ]"
                                style="background-size: 100% 100%"
                            ></div>
                        </div>
                        <div v-if="msgBody.type === ALL_MESSAGE_TYPE.LOCAL">
                            <p style="padding: 10px">[暂不支持位置消息展示]</p>
                        </div>
                        <!-- 文件类型消息 -->
                        <div
                            v-if="msgBody.type === ALL_MESSAGE_TYPE.FILE"
                            class="message_box_content_file"
                        >
                            <div class="file_text_box">
                                <div class="file_name">
                                    {{ msgBody.filename }}
                                </div>
                                <div class="file_size">
                                    {{ fileSizeFormat(msgBody.file_length) }}
                                </div>
                                <a
                                    class="file_download"
                                    :href="msgBody.url"
                                    download
                                    >点击下载</a
                                >
                            </div>
                            <span class="iconfont icon-wenjian"></span>
                        </div>
                        <!-- 自定义类型消息 -->
                        <div
                            v-if="msgBody.type === ALL_MESSAGE_TYPE.CUSTOM"
                            class="message_box_content_custom"
                        >
                            <template
                                v-if="
                                    msgBody.customEvent &&
                                    CUSTOM_TYPE[msgBody.customEvent]
                                "
                            >
                                <div class="user_card">
                                    <div class="user_card_main">
                                        <!-- 头像 -->
                                        <el-avatar
                                            shape="circle"
                                            :size="50"
                                            :src="
                                                (msgBody.customExts &&
                                                    msgBody.customExts
                                                        .avatarurl) ||
                                                msgBody.customExts.avatar ||
                                                defaultAvatar
                                            "
                                            fit="cover"
                                        />
                                        <!-- 昵称 -->
                                        <span class="nickname">{{
                                            (msgBody.customExts &&
                                                msgBody.customExts.nickname) ||
                                            msgBody.customExts.uid
                                        }}</span>
                                    </div>
                                    <el-divider
                                        style="
                                            margin: 5px 0;
                                            border-top: 1px solid black;
                                        "
                                    />
                                    <p style="font-size: 8px">个人名片</p>
                                </div>
                            </template>
                        </div>
                        <!-- 右键点击弹起更多功能栏 -->
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item
                                    v-if="
                                        msgBody.type ===
                                            ALL_MESSAGE_TYPE.TEXT && isSupported
                                    "
                                    @click="copyTextMessages(msgBody.msg)"
                                >
                                    复制
                                </el-dropdown-item>
                                <el-dropdown-item
                                    v-if="isMyself(msgBody)"
                                    @click="recallMessage(msgBody)"
                                >
                                    撤回
                                </el-dropdown-item>
                                <el-dropdown-item
                                    v-if="
                                        msgBody.type ===
                                            ALL_MESSAGE_TYPE.TEXT &&
                                        isMyself(msgBody)
                                    "
                                    @click="showModifyMsgModal(msgBody)"
                                >
                                    编辑
                                </el-dropdown-item>
                                <el-dropdown-item @click="onMsgQuote(msgBody)">
                                    引用
                                </el-dropdown-item>
                                <el-dropdown-item
                                    @click="deleteMessage(msgBody)"
                                >
                                    删除
                                </el-dropdown-item>
                                <el-dropdown-item
                                    v-if="!isMyself(msgBody)"
                                    @click="informOnMessage(msgBody)"
                                >
                                    举报
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                    <!-- 引用消息展示框 -->
                    <div
                        class="message_quote_box"
                        v-if="msgBody?.ext?.msgQuote"
                        @click="clickQuoteMessage(msgBody.ext.msgQuote)"
                    >
                        <p>
                            {{ msgBody?.ext?.msgQuote?.msgSender }}：{{
                                msgBody?.ext?.msgQuote?.msgPreview
                            }}
                        </p>
                    </div>
                </div>
            </div>
            <!-- 撤回消息通知通知 -->
            <div v-if="msgBody.isRecall" class="recall_style">
                {{
                    isMyself(msgBody) ? '你' : `${msgBody.from}`
                }}撤回了一条消息<span
                    class="reEdit"
                    v-show="
                        isMyself(msgBody) &&
                        msgBody.type === ALL_MESSAGE_TYPE.TEXT
                    "
                    @click="reEdit(msgBody.msg)"
                    >重新编辑</span
                >
            </div>
            <!-- 灰色系统通知 -->
            <div
                v-if="msgBody.type === ALL_MESSAGE_TYPE.INFORM"
                class="inform_style"
            >
                <p>
                    {{ msgBody.msg }}
                </p>
            </div>
        </div>
        <ReportMessage ref="reportMessage" />
        <ModifyMessage ref="modifyMessageRef" />
    </div>
</template>

<style lang="scss" scoped>
@import './index.scss';
</style>
