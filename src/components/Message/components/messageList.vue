<script setup>
import { reactive, computed, toRefs } from 'vue';
import EaseIM from '@/IM/initwebsdk'
import BenzAMRRecorder from 'benz-amr-recorder'
import fileSizeFormat from '@/utils/fileSizeFormat'
import dateFormat from '@/utils/dateFormat'
import { messageType } from '@/constant'
/* 默认头像 */
import defaultAvatar from '@/assets/images/avatar/theme2x.png'
import myAvatar from '@/assets/images/loginIcon.png'

/* props */
const props = defineProps({
    messageData: {
        type: Array,
        default: () => [],
    },

});
/* emits */
const emit = defineEmits(['scrollMessageList'])
const { messageData } = toRefs(props);
/* constant */
const { ALL_MESSAGE_TYPE } = messageType
/* login hxId */
const loginUserId = EaseIM.conn.user;

/* computed-- 消息来源是否为自己 */
const isMyself = computed(() => {
    return (msgBody) => {
        return (msgBody.from === loginUserId)
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

</script>
<template>

    <div class="messageList_box" v-for="(msgBody, index) in messageData" :key="msgBody.id">
        <div class="message_box_item" :style="{ flexDirection: (isMyself(msgBody) ? 'row-reverse' : 'row') }">
            <div class="message_item_time">{{ dateFormat('MM/DD/HH:mm', msgBody.time) }}</div>
            <el-avatar class="message_item_avator" :src="isMyself(msgBody) ? myAvatar : defaultAvatar">
            </el-avatar>
            <div class="message_box_content"
                :class="[isMyself(msgBody) ? 'message_box_content_mine' : 'message_box_content_other']">
                <!-- 文本类型消息 -->
                <p style="padding: 10px" v-if="msgBody.type === ALL_MESSAGE_TYPE.TEXT">
                    {{ msgBody.msg }}
                </p>
                <!-- 图片类型消息 -->
                <div v-if="msgBody.type === ALL_MESSAGE_TYPE.IMAGE">
                    <el-image :src="msgBody.thumb" :preview-src-list="[msgBody.url]" :initial-index="1" fit="cover" />
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
            </div>
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
                        background: url('../../../assets/images/playAudio/msg_recv_audio02@3x.png') no-repeat;

                        background-size: 100% 100%;
                    }

                    50% {
                        background: url('../../../assets/images/playAudio/msg_recv_audio01@3x.png') no-repeat;

                        background-size: 100% 100%;
                    }

                    100% {
                        background: url('../../../assets/images/playAudio/msg_recv_audio@3x.png') no-repeat;
                        background-size: 100% 100%;
                    }
                }

                .play_audio_icon_other {
                    width: 30px;
                    height: 30px;
                    background: url('../../../assets/images/playAudio/msg_recv_audio@3x.png') no-repeat;
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
                        background: url('../../../assets/images/playAudio/msg_send_audio02@3x.png') no-repeat;

                        background-size: 100% 100%;
                    }

                    50% {
                        background: url('../../../assets/images/playAudio/msg_send_audio01@3x.png') no-repeat;

                        background-size: 100% 100%;
                    }

                    100% {
                        background: url('../../../assets/images/playAudio/msg_send_audio@3x.png') no-repeat;
                        background-size: 100% 100%;
                    }
                }

                .play_audio_icon_mine {
                    width: 30px;
                    height: 30px;
                    background-size: 100% 100%;
                    background: url('../../../assets/images/playAudio/msg_send_audio@3x.png') no-repeat;
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


}
</style>
