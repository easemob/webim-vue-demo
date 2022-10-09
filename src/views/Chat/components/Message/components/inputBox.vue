<script setup>
import { ref, toRefs, defineProps } from 'vue'
import { useStore } from 'vuex'
import { handleSDKErrorNotifi } from '@/utils/handleSomeData'
import { ElLoading, ElMessageBox } from 'element-plus'
import { onClickOutside } from '@vueuse/core'
import { emojis } from '@/constant'
import { messageType } from '@/constant'
import _ from 'lodash'
import EaseIM from '@/IM/initwebsdk'
/* 组件 */
import CollectAudio from './suit/audio.vue'
const store = useStore()
const props = defineProps({
    nowPickInfo: {
        type: Object,
        required: true,
        default: () => ({})
    }
})
const { ALL_MESSAGE_TYPE } = messageType
const { nowPickInfo } = toRefs(props)
//加载状态
const loadingBox = ref(null)

/* 文本消息相关 */
//emojis框展开
const isShowEmojisBox = ref(false)
const emojisBox = ref(null)
onClickOutside(emojisBox, () => { isShowEmojisBox.value = false })
const showEmojisBox = () => {
    console.log('>>>>>展开模态框')
    isShowEmojisBox.value = true
}
//发送文本内容
const textContent = ref('')
const sendTextMessage = _.debounce(async () => {
    if (textContent.value.match(/^\s*$/)) return
    const msgOptions = {
        id: nowPickInfo.value.id,
        chatType: nowPickInfo.value.chatType,
        msg: textContent.value,
    }
    try {
        await store.dispatch('sendShowTypeMessage', { msgType: ALL_MESSAGE_TYPE.TEXT, msgOptions })
        textContent.value = ''
    } catch (error) {
        console.log('>>>>>>>发送失败+++++++', error)
    }
}, 300)
//新增一个emoji
const addOneEmoji = (emoji) => {
    console.log('>>>>>>emoji', emoji)
    textContent.value = textContent.value + emoji

}

/* 图片消息相关 */
//选择图片
const uploadImgs = ref(null)
const chooseImages = () => {
    uploadImgs.value.click()
    console.log('uploadImgs')
}
//发送图片
const sendImagesMessage = async () => {
    //读取图片的宽高
    const imgFile = uploadImgs.value.files[0]
    const file = {
        data: imgFile,           // file 对象。
        filename: imgFile.name, //文件名称。
        filetype: imgFile.type, //文件类型。
    }
    console.log('imgFile', file)
    const url = window.URL || window.webkitURL
    const img = new Image()              //手动创建一个Image对象
    img.src = url.createObjectURL(imgFile)//创建Image的对象的url
    const msgOptions = {
        id: nowPickInfo.value.id,
        chatType: nowPickInfo.value.chatType,
        file: file,
        width: 0,
        height: 0
    }
    img.onload = async () => {
        const loadingInstance = ElLoading.service({ target: loadingBox.value, background: '#f7f7f7' })
        msgOptions.width = img.width
        msgOptions.height = img.height
        console.log('height:' + img.height + '----' + img.width)
        try {
            await store.dispatch('sendShowTypeMessage', { msgType: ALL_MESSAGE_TYPE.IMAGE, msgOptions: _.cloneDeep(msgOptions) })
            loadingInstance.close()
            uploadImgs.value.value = null
        } catch (error) {
            console.log('>>>>>发送失败', error)
            if (error.type && error?.data) {
                handleSDKErrorNotifi(error.type, error.data.error || 'none')
            } else {
                handleSDKErrorNotifi(0, 'none')
            }
            loadingInstance.close()
            uploadImgs.value.value = null
        }

    }


}
/* 文件消息相关 */
//选择文件
const uploadFiles = ref(null)
const chooseFiles = () => {
    uploadFiles.value.click()
}
//发送文件
const sendFilesMessages = async () => {
    const commonFile = uploadFiles.value.files[0]
    const file = {
        data: commonFile,           // file 对象。
        filename: commonFile.name, //文件名称。
        filetype: commonFile.type, //文件类型。
        size: commonFile.size
    }
    console.log('>>>>>调用发送文件', file)
    const msgOptions = {
        id: nowPickInfo.value.id,
        chatType: nowPickInfo.value.chatType,
        file: file,
    }
    const loadingInstance = ElLoading.service({ target: loadingBox.value, background: '#f7f7f7' })
    try {
        await store.dispatch('sendShowTypeMessage', { msgType: ALL_MESSAGE_TYPE.FILE, msgOptions: _.cloneDeep(msgOptions) })
        loadingInstance.close()
        uploadFiles.value.value = null
    } catch (error) {
        console.log('>>>>file error', error)
        if (error.type && error?.data) {
            handleSDKErrorNotifi(error.type, error.data.error || 'none')
        } else {
            handleSDKErrorNotifi(0, 'none')
        }

        uploadFiles.value.value = null
        loadingInstance.close()
    }

}
/* 语音消息相关 */
//展示录音对话框
const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
const isShowRecordBox = ref(false)
const recordBox = ref(null)
onClickOutside(recordBox, () => { isShowRecordBox.value = false })
const showRecordBox = () => {
    isShowRecordBox.value = true
}
const sendAudioMessages = async (audioData) => {
    const file = {
        url: EaseIM.utils.parseDownloadResponse(audioData.src),
        filename: '录音',
        filetype: '.amr',
        data: audioData.src
    }
    console.log('>>>>>audioData', audioData, file)
    const msgOptions = {
        id: nowPickInfo.value.id,
        chatType: nowPickInfo.value.chatType,
        file: file,
        length: audioData.length
    }
    try {
        await store.dispatch('sendShowTypeMessage', { msgType: ALL_MESSAGE_TYPE.AUDIO, msgOptions: _.cloneDeep(msgOptions) })
        isShowRecordBox.value = false
    } catch (error) {
        if (error.type && error?.data) {
            handleSDKErrorNotifi(error.type, error.data.error || 'none')
        } else {
            handleSDKErrorNotifi(0, 'none')
        }
        isShowRecordBox.value = false
    }

}
//清除屏幕
const clearScreen = () => {
    ElMessageBox.confirm('确认清空当前消息内容？',
        '消息清屏', {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning',
        }).then(() => {
        const key = nowPickInfo.value.id
        store.commit('CLEAR_SOMEONE_MESSAGE', key)
    }).catch(() => {
        return false
    })

}
//func 对应事件 icon class样式等
const all_func = [
    { 'className': 'icon-emoji', 'style': 'font-size:20px;margin-left: 20px;', 'title': '选择表情', 'methodName': showEmojisBox },
    { 'className': 'icon-tuku', 'style': 'font-size: 26px;', 'title': '发送图片', 'methodName': chooseImages },
    { 'className': 'icon-wenjian', 'style': 'font-size: 20px;', 'title': '发送文件', 'methodName': chooseFiles },
    { 'className': 'icon-01', 'style': 'font-size: 20px;', 'title': '发送语音', 'methodName': showRecordBox },
    { 'className': 'icon-lajitong', 'style': 'font-size: 23px;', 'title': '清屏', 'methodName': clearScreen },
]

defineExpose({
    textContent
})
</script>
<template>
    <div class="chat_func_box">
        <span v-for="iconItem in all_func" :class="['iconfont', iconItem.className]" :key="iconItem.className"
            :style="iconItem.style" :title="iconItem.title" @click.stop="iconItem.methodName"></span>
        <!-- 表情框 -->
        <el-scrollbar ref="emojisBox" v-if="isShowEmojisBox" class="emojis_box" tag="div">
            <span class="emoji" v-for="(emoji, index) in emojis" :key="index" @click="addOneEmoji(emoji)">{{ emoji
            }}</span>
        </el-scrollbar>
        <!-- 图片附件choose -->
        <input ref="uploadImgs" type="file" style="display:none" @change="sendImagesMessage" single accept="image/*">
        <!-- 文件附件choose -->
        <input ref="uploadFiles" type="file" style="display:none" @change="sendFilesMessages" single>
        <!-- 录音采集框 -->
        <el-card ref="recordBox" v-if="isShowRecordBox" class="record_box" shadow="always">
            <p v-if="!isHttps">由于浏览器限制,录音功能必须为https环境或者为localhost环境下使用！</p>
            <CollectAudio v-else @sendAudioMessages="sendAudioMessages" />
        </el-card>
        <!-- 附件上传加载容器 -->
        <div ref="loadingBox" class="loading_box"></div>
    </div>
    <textarea ref="editable" v-model="textContent" class="chat_content_editable" spellcheck="false"
        contenteditable="true" placeholder="请输入消息内容..." onkeydown="if (event.keyCode === 13) event.preventDefault();"
        @keyup.enter="sendTextMessage">
    </textarea>
    <el-button :class="[textContent === ''?'no_content_send_btn': 'chat_send_btn']" type="primary"
        @click="sendTextMessage">发送</el-button>
</template>

<style lang="scss" scoped>
.chat_func_box {
    position: relative;
    display: flex;
    align-items: center;
    height: 42px;
    width: 100%;
    background-color: #f7f7f7;
    border-top: 1px solid #E6E6E6;
    border-bottom: 1px solid #E6E6E6;


    .chat_func_icon {
        width: 25px;
        height: 25px;
    }

    .emojis_box {
        position: absolute;
        left: 15px;
        top: -180px;
        width: 330px;
        height: 150px;
        border-radius: 5px;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        background: #FFF;
        padding: 15px 5px;

        .emoji {
            display: inline-block;
            width: 25px;
            height: 25px;
            text-align: center;
            line-height: 25px;
            cursor: pointer;
            transition: all .3s ease;

            &:hover {
                transform: scale(1.2);
            }
        }
    }

    .loading_box {
        position: absolute;
        right: 5px;
        top: 0;
        width: 50px;
        height: 100%;
        font-size: 15px;
    }
}

/* loading svg大小调整 */
::v-deep .circular {
    margin-top: 8px;
    width: 25px;
    height: 25px;
}

.chat_content_editable {
    font-family: 'PingFang SC';
    width: 100%;
    box-sizing: border-box;
    min-height: 100px;
    border: none;
    background: none;
    letter-spacing: .5px;
    resize: none;
    padding: 10px 20px;
    font-size: 14px;
}

.no_content_send_btn {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 80px;
    opacity: .5;
}

.chat_send_btn {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 80px;
}

.iconfont {
    margin-right: 12px;
    transition: all .3s ease;
    cursor: pointer;

    &:hover {
        transform: scale(1.2);
        color: #1B83F9;
    }
}

.record_box {
    width: 250px;
    height: 180px;
}
</style>