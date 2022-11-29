<script setup>
import { ref } from 'vue'
import BenzAMRRecorder from 'benz-amr-recorder'
import { ElNotification } from 'element-plus'
const voice = ref({
    interval: null, // 录音定时器
    type: 0, // 0未录音 1录音中 2录音完毕 3回放录音
    length: 0, // 录音长度
    src: null // 录音资源
})
const amrRec = ref(null)
const timer = ref({
    interval: null,
    tim: 60
}) //倒计时
const showCountDown = ref(false)
const benginTimer = () => {
    showCountDown.value = false
    timer.value.interval = setInterval(() => {
        if (timer.value.tim === 0) {
            clearInterval(timer.value.interval)
            clearInterval(voice.value.interval)
            // 自动发送
            recordOver()
            return
        }
        else if (false) {
            // 弹层关闭 清空倒计时
            timer.value.tim = 60
            return
        } else {
            timer.value.tim--
        }
        if (timer.value.tim < 11) {
            showCountDown.value = true
        }
    }, 1000)
}

const startRecord = () => {
    if (voice.value.type === 0) {
        amrRec.value = new BenzAMRRecorder()
        console.log(amrRec)
        amrRec.value
            .initWithRecord()
            .then(() => {
                amrRec.value.startRecord() //开始录音
                voice.value.type = 1
                benginTimer()
                //开启录音时长定时器
                voice.value.interval = setInterval(() => {
                    voice.value.length++
                }, 1000)
            })
            .catch(e => {
                console.log(e)
                voice.value.type = 0
                ElNotification({
                    title: '',
                    message: '录音失败，请检查相关权限和设备',
                    type: 'error',
                })
                //   $Toast("录音失败，请检查相关权限和设备");
            })
    }
}
const emit = defineEmits(['sendAudioMessages'])
const recordOver = () => {
    amrRec.value
        .finishRecord()
        .then(() => {
            if (voice.value.length <= 1) {
                clearInterval(timer.value.interval)
                clearInterval(voice.value.interval)
                initVocie()
                // 放弃录音
                amrRec.value.cancelRecord()
                ElNotification({
                    title: '',
                    message: '录音时间较短',
                    type: 'warning',
                })
            } else {
                voice.value.length = Math.ceil(amrRec.value.getDuration())
                // 获取音频文件
                voice.value.src = amrRec.value.getBlob()
                emit('sendAudioMessages', {
                    src: voice.value.src,
                    length: voice.value.length > 60 ? 60 : voice.value.length //一般计时器开始时间都较为提前一秒 减去误差值
                })

                clearInterval(timer.value.interval)
                clearInterval(voice.value.interval)
                initVocie()
            }
        })
        .catch(() => {
            ElNotification({
                title: '',
                message: '录音失败，请检查相关权限',
                type: 'error',
            })
        })
}
const initVocie = () => {
    voice.value.interval = null
    voice.value.length = 0
    voice.value.type = 0
    timer.value.tim = 60
    showCountDown.value = false
    timer.value.interval = null
}
// const filterRecordVoicTime = (len) => {
//     let min = Math.floor(len / 60),
//         sec = len % 60;
//     ("1:30");
//     return min + ":" + (sec < 10 ? "0" + sec : sec);
// }
// const cancelRecord = (e) => {
//     amrRec.value.cancelRecord();
//     clearInterval(timer.value.interval);
//     clearInterval(voice.value.interval);
//     initVocie();
//     ElNotification({
//         title: '',
//         message: '取消录音',
//         type: 'success',
//     });
// }
const closeDialog = () => {
    console.log('关闭子组件的定时器')
    clearInterval(timer.value.interval)
    clearInterval(voice.value.interval)
    initVocie()
}
defineExpose({ closeDialog })


</script>
<template>
    <div>
        <div class="collect_box">
            <div v-show="!voice.type" class="start">
                <span class="title">单击开始录音，最长可录制60秒</span>
                <svg @click="startRecord()" width="58" height="58" viewBox="0 0 58 58" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M29 57.2363C44.6152 57.2363 57.3887 44.4629 57.3887 28.8477C57.3887 13.2324 44.6152 0.458984 29 0.458984C13.3848 0.458984 0.611328 13.2324 0.611328 28.8477C0.611328 44.4629 13.3848 57.2363 29 57.2363ZM29 55.8008C14.1465 55.8008 2.04688 43.7012 2.04688 28.8477C2.04688 13.9648 14.1465 1.89453 29 1.89453C43.8828 1.89453 55.9531 13.9648 55.9531 28.8477C55.9531 43.7012 43.8828 55.8008 29 55.8008ZM29 34.5312C31.9883 34.5312 33.8926 32.2168 33.8926 29.1699V16.1621C33.8926 13.1152 31.9883 10.8008 29 10.8008C26.0117 10.8008 24.1074 13.1152 24.1074 16.1621V29.1699C24.1074 32.2168 26.0117 34.5312 29 34.5312ZM22.1445 46.9531H35.8848C36.2949 46.9531 36.6172 46.6309 36.6172 46.2207C36.6172 45.8105 36.2656 45.4883 35.8848 45.4883H29.7324V40.0098C35.5332 39.6875 39.6055 35.4688 39.6055 29.9316V27.0312C39.6055 26.6211 39.2832 26.2988 38.873 26.2988C38.4922 26.2988 38.1406 26.6211 38.1406 27.0312V29.9316C38.1406 35.2344 34.7422 38.5742 29 38.5742C23.2578 38.5742 19.918 35.2344 19.918 29.9316V27.0312C19.918 26.6211 19.5664 26.2988 19.1855 26.2988C18.7754 26.2988 18.4238 26.6211 18.4238 27.0312V29.9316C18.4238 35.4688 22.4668 39.6875 28.2676 40.0098V45.4883H22.1445C21.7344 45.4883 21.4121 45.8105 21.4121 46.2207C21.4121 46.6309 21.7344 46.9531 22.1445 46.9531Z"
                        fill="#04D0A4" />
                </svg>
                <span>{{ timer.tim }}″</span>
            </div>
            <div @click="recordOver()" v-show="voice.type && !showCountDown" class="send">
                <span class="title">再次单击发送，点空白处取消</span>
                <svg width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M29 57.2363C44.6152 57.2363 57.3887 44.4629 57.3887 28.8477C57.3887 13.2324 44.6152 0.458984 29 0.458984C13.3848 0.458984 0.611328 13.2324 0.611328 28.8477C0.611328 44.4629 13.3848 57.2363 29 57.2363ZM29 55.8008C14.1465 55.8008 2.04688 43.7012 2.04688 28.8477C2.04688 13.9648 14.1465 1.89453 29 1.89453C43.8828 1.89453 55.9531 13.9648 55.9531 28.8477C55.9531 43.7012 43.8828 55.8008 29 55.8008ZM20.8848 39.2773H37.1152C38.5508 39.2773 39.4297 38.3691 39.4297 36.9629V20.7324C39.4297 19.2969 38.5508 18.418 37.1152 18.418H20.8848C19.4785 18.418 18.5703 19.2969 18.5703 20.7324V36.9629C18.5703 38.3691 19.4785 39.2773 20.8848 39.2773Z"
                        fill="#7F7F7F" />
                </svg>
                <span>{{ `${voice.length}″` }}</span>
            </div>
            <div v-show="showCountDown" class="send">
                <span class="title">{{ timer.tim }}秒后自动发送</span>
                <svg width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M29 57.2363C44.6152 57.2363 57.3887 44.4629 57.3887 28.8477C57.3887 13.2324 44.6152 0.458984 29 0.458984C13.3848 0.458984 0.611328 13.2324 0.611328 28.8477C0.611328 44.4629 13.3848 57.2363 29 57.2363ZM29 55.8008C14.1465 55.8008 2.04688 43.7012 2.04688 28.8477C2.04688 13.9648 14.1465 1.89453 29 1.89453C43.8828 1.89453 55.9531 13.9648 55.9531 28.8477C55.9531 43.7012 43.8828 55.8008 29 55.8008ZM20.8848 39.2773H37.1152C38.5508 39.2773 39.4297 38.3691 39.4297 36.9629V20.7324C39.4297 19.2969 38.5508 18.418 37.1152 18.418H20.8848C19.4785 18.418 18.5703 19.2969 18.5703 20.7324V36.9629C18.5703 38.3691 19.4785 39.2773 20.8848 39.2773Z"
                        fill="#FF4D4F" />
                </svg>
                <span>{{ `${voice.length}″` }}</span>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.collect_box {
    display: flex;
    flex-direction: column;
    align-items: space-around;

    .start,
    .send {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;

        span {
            margin-bottom: 22px;
        }

        svg {
            margin-bottom: 15px;
        }
    }
    .title{
        margin-top: 10px;
        font-size: 14px;
    }
}

.collect_box>h3 {
    user-select: none;
    margin-bottom: .03rem;
}

.recordTime {
    margin: .09rem 0;
}

.collect_btn {
    user-select: none;
    display: flex;
    justify-content: center;
    align-items: center;
    width: .8rem;
    height: .8rem;
    border: .03rem solid #474747;
    border-radius: 50%;

}

.collect_btn>img {
    pointer-events: none;
    /* 禁止长按图片保存 */
    width: .6rem;
    height: .6rem;
}

.reacordingStyle {
    width: .5rem;
    height: .5rem;
    background: red;
    border-radius: 50%;
}
</style>
