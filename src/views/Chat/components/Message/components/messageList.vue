<script setup>
import { reactive, computed, toRefs } from 'vue';
import { useStore } from 'vuex'
import { useClipboard, usePermission } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import EaseIM from '@/IM/initwebsdk'
import BenzAMRRecorder from 'benz-amr-recorder'
import fileSizeFormat from '@/utils/fileSizeFormat'
import dateFormat from '@/utils/dateFormater'
import { messageType } from '@/constant'
/* 默认头像 */
import defaultAvatar from '@/assets/images/avatar/theme2x.png'

/* vuex store */
const store = useStore()
/* props */
const props = defineProps({
    messageData: {
        type: [Array, Object],
        default: () => [],
    },
    nowPickInfo: {
        type: Object,
        default: () => ({})
    }

});
/* emits */
const emit = defineEmits(['scrollMessageList', 'reEditMessage'])
const { messageData } = toRefs(props);
/* constant */
const { ALL_MESSAGE_TYPE, CUSTOM_TYPE } = messageType
/* login hxId */
const loginUserId = EaseIM.conn.user;

/* computed-- 消息来源是否为自己 */
const isMyself = computed(() => {
    return (msgBody) => {
        return (msgBody.from === loginUserId)
    }
})
/* 获取自己的用户信息 */
const loginUserInfo = computed(() => store.state.loginUserInfo)

/* 获取他人的用户信息 */
const otherUserInfo = computed(() => {
    return (otherId) => {
        let otherInfos = store.state.Contacts.friendList[otherId] || { avatarurl: defaultAvatar }
        return otherInfos
    }
}
)

/* 处理时间显示间隔 */

const handleMsgTimeShow = computed(() => {
    return (time, index) => {
        const msgList = Array.from(messageData.value)
        if (index !== 0) {
            let lastTime = msgList[index - 1].time;
            if (time - lastTime > 50000) {
                return dateFormat('MM/DD/HH:mm', time)
            } else {
                return false
            }
        } else {
            return dateFormat('MM/DD/HH:mm', time)
        }



        return time
    }
})
//音频播放状态
const audioPlayStatus = reactive({
    isPlaying: false,//是否在播放中
    playIndex: -1, //在播放的音频消息下标
})
//开始播放
const startplayAudio = (msgBody, index) => {
    let armRec = new BenzAMRRecorder();
    let src = msgBody.url;
    audioPlayStatus.playIndex = index
    console.log('>>>>>开始播放音频', msgBody.url)
    //初始化音频源并调用播放
    armRec.initWithUrl(src).then(() => {
        if (!audioPlayStatus.isPlaying) {
            armRec.play()
        }
    })
    //播放开始监听
    armRec.onPlay(() => {
        audioPlayStatus.isPlaying = true;
        audioPlayStatus.playIndex = index;
    })
    //播放结束监听
    armRec.onStop(() => {
        audioPlayStatus.isPlaying = false;
        audioPlayStatus.playIndex = -1;
    })
}


//复制文本
const permissionRead = usePermission('clipboard-read') //请求剪切板读的权限
const permissionWrite = usePermission('clipboard-write') //请求剪切板写的权限
const { copy, copied, isSupported } = useClipboard() //copy 复制方法 copied 是否已经复制 isSupported 是否支持剪切板
const copyTextMessages = (msg) => {
    copy(msg)
    if (copied) {
        ElMessage({
            message: '成功复制到剪切板',
            center: true,
        })
        console.log('>>>>>成功复制');
    }
}
//撤回消息
const recallMessage = async ({ id, to, chatType }) => {
    let options = {
        mid: id,
        to: to,
        chatType: chatType
    }
    try {
        await store.dispatch('recallMessage', options)
    } catch (error) {
        //todo error提示待添加
        console.log('>>>>>>撤回失败', error);
    }

}
//删除消息（非从服务器删除）
const deleteMessage = ({ from, to, id: mid }) => {
    let key = to === EaseIM.conn.user ? from : to
    store.commit('CHANGE_MESSAGE_BODAY', { type: 'deleteMsg', key, mid })
}
//父组件重新编辑方法
const reEdit = (msg) => emit('reEditMessage', msg)

</script>
<template>
    <div class="messageList_box" v-for="(msgBody, index) in messageData" :key="msgBody.id">
        <div v-if="!msgBody.isRecall && msgBody.type !== ALL_MESSAGE_TYPE.INFORM" class="message_box_item"
            :style="{ flexDirection: (isMyself(msgBody) ? 'row-reverse' : 'row') }">
            <div class="message_item_time">{{ handleMsgTimeShow(msgBody.time, index) || '' }}</div>
            <el-avatar class="message_item_avator"
                :src="isMyself(msgBody) ? loginUserInfo.avatarurl : otherUserInfo(msgBody.from).avatarurl || defaultAvatar">
            </el-avatar>
            <el-tooltip trigger="contextmenu">
                <template #content>
                    <span v-if="msgBody.type === ALL_MESSAGE_TYPE.TEXT && isSupported">
                        <span style="cursor: pointer" @click.stop="copyTextMessages(msgBody.msg)">复制</span>
                        <el-divider direction="vertical" />
                    </span>
                    <span v-if="isMyself(msgBody)">
                        <span style="cursor: pointer" @click="recallMessage(msgBody)">撤回</span>
                        <el-divider direction="vertical" />
                    </span>
                    <span style="cursor: pointer" @click="deleteMessage(msgBody)">删除</span>
                </template>
                <div class="message_box_content"
                    :class="[isMyself(msgBody) ? 'message_box_content_mine' : 'message_box_content_other']">
                    <!-- 文本类型消息 -->
                    <p style="padding: 10px" v-if="msgBody.type === ALL_MESSAGE_TYPE.TEXT">
                        {{ msgBody.msg }}
                    </p>
                    <!-- 图片类型消息 -->
                    <div v-if="msgBody.type === ALL_MESSAGE_TYPE.IMAGE">
                        <el-image :src="msgBody.thumb" :preview-src-list="[msgBody.url]" :initial-index="1"
                            fit="cover" />
                    </div>
                    <!-- 语音类型消息 -->
                    <div :class="['message_box_content_audio', isMyself(msgBody) ? 'message_box_content_audio_mine' : 'message_box_content_audio_other']"
                        v-if="msgBody.type === ALL_MESSAGE_TYPE.AUDIO" @click="startplayAudio(msgBody, index)"
                        :style="`width:${msgBody.length * 10}px`">
                        <span class="audio_length_text">
                            {{ msgBody.length }}′′
                        </span>
                        <div :class="[isMyself(msgBody) ? 'play_audio_icon_mine' : 'play_audio_icon_other', audioPlayStatus.playIndex === index && 'start_play_audio']"
                            style=" background-size: 100% 100%;">
                        </div>
                    </div>
                    <div v-if="msgBody.type === ALL_MESSAGE_TYPE.LOCAL">
                        <p style="padding: 10px">[暂不支持位置消息展示]</p>
                    </div>
                    <!-- 文件类型消息 -->
                    <div v-if="msgBody.type === ALL_MESSAGE_TYPE.FILE" class="message_box_content_file">
                        <div class="file_text_box">
                            <div class="file_name">{{ msgBody.filename }}</div>
                            <div class="file_size">{{ fileSizeFormat(msgBody.file_length) }}</div>
                            <a class="file_download" :href="msgBody.url" download>点击下载</a>
                        </div>
                        <span class="iconfont icon-wenjian"></span>
                    </div>
                    <!-- 自定义类型消息 -->
                    <div v-if="msgBody.type === ALL_MESSAGE_TYPE.CUSTOM" class="message_box_content_custom">
                        <template v-if="msgBody.customEvent && CUSTOM_TYPE[msgBody.customEvent]">
                            <div class="user_card">
                                <div class="user_card_main">
                                    <!-- 头像 -->
                                    <el-avatar shape="circle" :size="50"
                                        :src="msgBody.customExts && msgBody.customExts.avatarurl || msgBody.customExts.avatar || defaultAvatar"
                                        fit="cover" />
                                    <!-- 昵称 -->
                                    <span class="nickname">{{ msgBody.customExts && msgBody.customExts.nickname ||
                                            msgBody.customExts.uid
                                    }}</span>
                                </div>
                                <el-divider style="margin:5px 0;  border-top:1px solid black;" />
                                <p style="font-size: 8px;">个人名片</p>
                            </div>
                        </template>
                    </div>
                </div>

            </el-tooltip>
        </div>
        <div v-if="msgBody.isRecall" class="recall_style">{{ isMyself(msgBody) ? "你" : `${msgBody.from}` }}撤回了一条消息<span
                class="reEdit" v-show="isMyself(msgBody) && msgBody.type === ALL_MESSAGE_TYPE.TEXT"
                @click="reEdit(msgBody.msg)">重新编辑</span></div>
        <div v-if="msgBody.type === ALL_MESSAGE_TYPE.INFORM" class="inform_style">
            <p>
                {{ msgBody.msg }}
            </p>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.messageList_box {
    width: 100%;

    .message_box_item {
        position: relative;
        display: flex;
        margin: 32px auto;
        font-weight: 400;
        font-size: 14px;
        line-height: 20px;
        letter-spacing: 0.4px;
        color: #333333;

        .message_item_time {
            position: absolute;
            top: -25px;
            left: 0;
            right: 0;
            margin: auto;
            width: 74px;
            height: 20px;
            color: #ADADAD;
            font-weight: 400;
            font-size: 10px;
            line-height: 20px;

        }

        .message_item_avator {
            width: 38px;
            height: 38px;

        }

        .message_box_content {
            display: flex;
            align-items: center;
            max-width: 50%;
            min-height: 34px;
            margin: 0 6px;
            word-break: break-all;

            /* 通用音频播放样式 */
            .message_box_content_audio {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                max-width: 250px;
                min-width: 80px;
                font-size: 12px;

                .audio_length_text {
                    font-family: 'Avenir';
                    font-style: normal;
                    font-weight: 400;
                    font-size: 12px;
                }
            }

            /* 对方音频播放样式 */
            .message_box_content_audio_other {
                flex-direction: row;

                @keyframes other_play_icon {
                    0% {
                        background: url('@/assets/images/playAudio/msg_recv_audio02@3x.png') no-repeat;

                        background-size: 100% 100%;
                    }

                    50% {
                        background: url('@/assets/images/playAudio/msg_recv_audio01@3x.png') no-repeat;

                        background-size: 100% 100%;
                    }

                    100% {
                        background: url('@/assets/images/playAudio/msg_recv_audio@3x.png') no-repeat;
                        background-size: 100% 100%;
                    }
                }

                .play_audio_icon_other {
                    width: 30px;
                    height: 30px;
                    background: url('@/assets/images/playAudio/msg_recv_audio@3x.png') no-repeat;
                    margin-right: 10px;
                }

                .start_play_audio {
                    animation: other_play_icon 2s;
                    animation-iteration-count: infinite;
                }
            }

            /* 己方音频播放样式 */
            .message_box_content_audio_mine {
                flex-direction: row-reverse;

                @keyframes mine_play_icon {
                    0% {
                        background: url('@/assets/images/playAudio/msg_send_audio02@3x.png') no-repeat;

                        background-size: 100% 100%;
                    }

                    50% {
                        background: url('@/assets/images/playAudio/msg_send_audio01@3x.png') no-repeat;

                        background-size: 100% 100%;
                    }

                    100% {
                        background: url('@/assets/images/playAudio/msg_send_audio@3x.png') no-repeat;
                        background-size: 100% 100%;
                    }
                }

                .play_audio_icon_mine {
                    width: 30px;
                    height: 30px;
                    background-size: 100% 100%;
                    background: url('@/assets/images/playAudio/msg_send_audio@3x.png') no-repeat;
                    margin-left: 10px;
                }

                .start_play_audio {
                    animation: mine_play_icon 2s;
                    animation-iteration-count: infinite;
                }
            }

            /* 文件消息样式 */
            .message_box_content_file {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                width: 200px;
                min-height: 60px;
                max-height: 120px;
                padding: 10px;

                .file_text_box {
                    width: 75%;
                    height: 80%;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-around;

                    .file_name {
                        width: 120px;
                        white-space: wrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        font-size: 15px;
                        font-weight: bold;
                    }

                    .file_size {
                        font-size: 13px;
                    }

                    .file_download {
                        width: 100%;
                        color: #333333;
                        font-size: 13px;
                        cursor: pointer;
                        transition: all .3s ease;

                        &:hover {
                            transform: scale(0.9);
                        }
                    }
                }

                .icon-wenjian {
                    font-size: 50px;
                    color: #8d8a8a;
                }
            }

            /* 自定义消息 */
            .message_box_content_custom {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                width: 200px;
                min-height: 60px;
                max-height: 120px;
                padding: 10px;
                overflow: hidden;

                .user_card_main {
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                    color: #333333;
                    font-size: 17px;

                    .nickname {
                        display: inline-block;
                        // width: 100%;
                        margin-left: 10px;
                        height: 35px;
                        line-height: 35px;
                    }
                }
            }

            /* 个人名片 */
        }

        .message_box_content_other {
            background: #FFF;
            border-radius: 8px 8px 8px 0px;
        }

        .message_box_content_mine {
            background: #C1E3FC;
            border-radius: 8px 0px 8px 8px;
        }

    }

    /* 撤回或者系统通知类消息 */
    .recall_style,
    .inform_style {
        height: 60px;
        text-align: center;
        color: #aaaaaa;
        font-size: 10px;
        margin: 5px 0;

        .reEdit {
            color: #3E91FA;
            margin-left: 3px;
            cursor: pointer;
        }
    }

}
</style>
