<script setup>
import { ref, toRefs, computed, defineProps } from 'vue'
import { useStore } from 'vuex'
import { handleSDKErrorNotifi } from '@/utils/handleSomeData'
import { ElLoading, ElMessageBox } from 'element-plus'
import { onClickOutside } from '@vueuse/core'
import { emojis } from '@/constant'
import { messageType } from '@/constant'
import _ from 'lodash'
import { EaseChatSDK, EaseChatClient } from '@/IM/initwebsdk'
/* 组件 */
import CollectAudio from '../suit/audio.vue'
import PreviewSendImg from '../suit/previewSendImg.vue'
import MsgQuote from '../suit/msgQuote.vue'
import { useGetUserMapInfo } from '@/hooks'
//vue at
import VueAt from 'vue-at/dist/vue-at-textarea' // for textarea
//EaseCallKit Invite
import { useManageChannel } from '@/components/EaseCallKit/hooks'
//inviteMembers modal
import InviteCallMembers from '@/components/InviteCallMembers'
const store = useStore()
const props = defineProps({
    nowPickInfo: {
        type: Object,
        required: true,
        default: () => ({})
    }
})
const { ALL_MESSAGE_TYPE, CHAT_TYPE, MENTION_ALL } = messageType
const { nowPickInfo } = toRefs(props)
//附件类上传加载状态
const loadingBox = ref(null)
/** /
 * 文本消息相关
 * 包含 @、emoji、引用功能
 */

const { getTheGroupNickNameById } = useGetUserMapInfo()
//AT 逻辑
const atMembersList = computed(() => {
    let members = [{ text: MENTION_ALL.TEXT, value: MENTION_ALL.VALUE }]
    const groupId = nowPickInfo.value?.id
    //TODO text部分应为获取群组成员的自定义属性，待后续增加可设置自定在群组当中的自定义属性。
    if (groupId) {
        const sourceMembers =
            store.state.Groups.groupsInfos[groupId]?.members || []
        sourceMembers.length &&
            sourceMembers.forEach((item) => {
                if (
                    item.owner !== EaseChatClient.user &&
                    item.member !== EaseChatClient.user
                ) {
                    members.push({
                        text: getTheGroupNickNameById(
                            groupId,
                            item.owner || item.member
                        ),
                        value: item.owner || item.member
                    })
                }
            })
    }
    return members
})
console.log(atMembersList.value)
const isAtAll = ref(false)
const atMembers = ref([])
//输入框插入@事件
const onInsert = (target) => {
    // if (!) return false
    console.log('onInset', target)
    if (_.map(atMembers.value, 'value').includes(target.value)) return false
    if (target.value === MENTION_ALL.VALUE) {
        return (isAtAll.value = true)
    } else {
        atMembers.value.push({ ...target })
    }
}
//校验消息内容中是否包含要@的成员
const checkAtMembers = (text) => {
    if (!text) {
        return false
    }
    //判断是否文本中是否有@ALL，没有则直接设置为false
    const patternAtAll = new RegExp(`@${MENTION_ALL.TEXT}`)
    console.log('patternAtAll', patternAtAll)
    if (isAtAll.value && !patternAtAll.test(text)) {
        isAtAll.value = false
    }
    if (atMembers.value.length !== 0) {
        //循环AT成员数组通过匹配文本内容判断是否存在已经移除@成员
        _.map(atMembers.value, 'text').forEach((item, index) => {
            console.log('atMembers item', item, index)
            const pattern = new RegExp(`@${item}`)
            const result = pattern.test(text)
            if (!result) {
                console.log('文本中不满足条件')
                //不包含则从@列表中移除该成员
                atMembers.value.splice(index, 1)
                console.log('>>>>>已删除', atMembers.value)
            }
        })
    }
}
//emojis框展开
const isShowEmojisBox = ref(false)
const emojisBox = ref(null)
onClickOutside(emojisBox, () => {
    isShowEmojisBox.value = false
})
const showEmojisBox = () => {
    console.log('>>>>>展开模态框')
    isShowEmojisBox.value = true
}
//新增一个emoji
const addOneEmoji = (emoji) => {
    console.log('>>>>>>emoji', emoji)
    textContent.value = textContent.value + emoji
}
//消息引用
const messageQuoteRef = ref(null)
const handleQuoteMessage = (msgBody) => {
    messageQuoteRef.value && messageQuoteRef.value.setQuoteContent(msgBody)
}
//监听键盘按下事件，如果为enter键则发送文本内容,shift+enter则换行。
const onTextInputKeyDown = (event) => {
    if (event.keyCode === 13 && !event.shiftKey) {
        event.preventDefault()
        // 执行发送操作
        sendTextMessage()
    } else if (event.keyCode === 13 && event.shiftKey) {
        // 换行操作
        insertNewLine()
    }
}
//换行操作
const insertNewLine = () => (textContent.value += '\n')
//发送文本内容
const textContent = ref('')
const sendTextMessage = _.debounce(async () => {
    //如果输入框全部为空格同样拒绝发送
    if (textContent.value.match(/^\s*$/)) return
    console.log('atMembers.value', atMembers.value)
    checkAtMembers(textContent.value)
    const msgOptions = {
        id: nowPickInfo.value.id,
        chatType: nowPickInfo.value.chatType,
        msg: textContent.value,
        ext: {
            em_at_list: isAtAll.value
                ? MENTION_ALL.VALUE
                : _.map(atMembers.value, 'value')
        }
    }
    //关闭引用框
    if (messageQuoteRef.value?.isShowQuoteMsgBox) {
        msgOptions.ext.msgQuote = Object.assign(
            {},
            messageQuoteRef.value.msgQuote
        )
    }
    textContent.value = ''
    messageQuoteRef.value?.clearQuoteContent()
    try {
        console.log('msgOptions', msgOptions)
        await store.dispatch('sendShowTypeMessage', {
            msgType: ALL_MESSAGE_TYPE.TEXT,
            msgOptions
        })
    } catch (error) {
        handleSDKErrorNotifi(error.type, error.message)
        console.log('>>>>>>>发送失败+++++++', error)
    } finally {
        isAtAll.value = false
        atMembers.value = []
    }
}, 50)

/* 图片消息相关 */
//选择图片
const uploadImgs = ref(null)
const chooseImages = () => {
    uploadImgs.value.click()
    console.log('uploadImgs')
}
//发送图片
const sendImagesMessage = async (type, fileObj) => {
    const file = {
        data: null, // file 对象。
        filename: '', //文件名称。
        filetype: '' //文件类型。
    }
    const url = window.URL || window.webkitURL
    const img = new Image() //手动创建一个Image对象
    const msgOptions = {
        id: nowPickInfo.value.id,
        chatType: nowPickInfo.value.chatType,
        file: file,
        width: 0,
        height: 0
    }
    if (type === 'common') {
        //读取图片的宽高
        const imgFile = uploadImgs.value.files[0]
        file.data = imgFile
        file.filename = imgFile.name
        file.filetype = imgFile.type
        console.log('imgFile', file)
        img.src = url.createObjectURL(imgFile) //创建Image的对象的url
        img.onload = async () => {
            const loadingInstance = ElLoading.service({
                target: loadingBox.value,
                background: '#f7f7f7'
            })
            msgOptions.width = img.width
            msgOptions.height = img.height
            console.log('height:' + img.height + '----' + img.width)
            try {
                await store.dispatch('sendShowTypeMessage', {
                    msgType: ALL_MESSAGE_TYPE.IMAGE,
                    msgOptions: _.cloneDeep(msgOptions)
                })
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
    } else if (type === 'other') {
        console.log('fileObjfileObjfileObj', fileObj)
        const imgFile = fileObj
        file.data = imgFile
        file.filename = imgFile.name
        file.filetype = imgFile.type
        console.log('imgFile', file)
        img.src = url.createObjectURL(imgFile) //创建Image的对象的url
        img.onload = async () => {
            const loadingInstance = ElLoading.service({
                target: loadingBox.value,
                background: '#f7f7f7'
            })
            msgOptions.width = img.width
            msgOptions.height = img.height
            console.log('height:' + img.height + '----' + img.width)
            try {
                await store.dispatch('sendShowTypeMessage', {
                    msgType: ALL_MESSAGE_TYPE.IMAGE,
                    msgOptions: _.cloneDeep(msgOptions)
                })
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
}
//贴图发送
const previewSendImg = ref(null)
const onPasteImage = (event) => {
    console.log('>>>>>>监听粘贴事件', event)
    const data = event.clipboardData || window.clipboardData
    //获取图片内容
    const imgContent = data.items[0].getAsFile()
    //判断是不是图片，最好通过文件类型判断
    const isImg = (imgContent && 1) || -1
    const reader = new FileReader()
    if (isImg >= 0) {
        //将文件读取为 DataURL
        reader.readAsDataURL(imgContent)
    }
    //文件读取完成时触发
    reader.onload = (event) => {
        //获取base64流
        const base64_str = event.target.result
        const imgInfo = {
            imgFile: imgContent,
            tempFilePath: base64_str
        }
        previewSendImg.value.showPreviewImgModal({ ...imgInfo })
        console.log('>>>>>获取到粘贴到的文本', imgInfo)
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
        data: commonFile, // file 对象。
        filename: commonFile.name, //文件名称。
        filetype: commonFile.type, //文件类型。
        size: commonFile.size
    }
    console.log('>>>>>调用发送文件', file)
    const msgOptions = {
        id: nowPickInfo.value.id,
        chatType: nowPickInfo.value.chatType,
        file: file
    }
    const loadingInstance = ElLoading.service({
        target: loadingBox.value,
        background: '#f7f7f7'
    })
    try {
        await store.dispatch('sendShowTypeMessage', {
            msgType: ALL_MESSAGE_TYPE.FILE,
            msgOptions: _.cloneDeep(msgOptions)
        })
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
const isHttps =
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost'
const isShowRecordBox = ref(false)
const recordBox = ref(null)
onClickOutside(recordBox, () => {
    isShowRecordBox.value = false
})
const showRecordBox = () => {
    isShowRecordBox.value = true
}
const sendAudioMessages = async (audioData) => {
    const file = {
        url: EaseChatSDK.utils.parseDownloadResponse(audioData.src),
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
        await store.dispatch('sendShowTypeMessage', {
            msgType: ALL_MESSAGE_TYPE.AUDIO,
            msgOptions: _.cloneDeep(msgOptions)
        })
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
/*清除屏幕*/
const clearScreen = () => {
    ElMessageBox.confirm('确认清空当前消息内容？', '消息清屏', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
    })
        .then(() => {
            const key = nowPickInfo.value.id
            store.commit('CLEAR_SOMEONE_MESSAGE', key)
        })
        .catch(() => {
            return false
        })
}
//func 对应事件 icon class样式等
const all_func = [
    {
        className: 'icon-emoji',
        style: 'font-size:20px;margin-left: 20px;',
        title: '选择表情',
        methodName: showEmojisBox
    },
    {
        className: 'icon-tuku',
        style: 'font-size: 26px;',
        title: '发送图片',
        methodName: chooseImages
    },
    {
        className: 'icon-wenjian',
        style: 'font-size: 20px;',
        title: '发送文件',
        methodName: chooseFiles
    },
    {
        className: 'icon-01',
        style: 'font-size: 20px;',
        title: '发送语音',
        methodName: showRecordBox
    },
    {
        className: 'icon-lajitong',
        style: 'font-size: 23px;',
        title: '清屏',
        methodName: clearScreen
    }
]

/* About EaseCallKit */
const { CALL_TYPES, sendInviteMessage } = useManageChannel()
//处理发起的音视频呼叫类型
const handleInviteCall = (handleType) => {
    const toId = nowPickInfo.value.id
    //语音类型
    if (handleType === 'voice') {
        const callType = CALL_TYPES.SINGLE_VOICE
        sendInviteMessage(toId, callType)
        //发送邀请信息后创建一条本地系统通知类消息上屏展示
        const params = {
            from: EaseChatClient.user,
            to: toId,
            chatType: CHAT_TYPE.SINGLE,
            msg: `邀请【${toId}】进行语音通话`
        }
        store.dispatch('createInformMessage', params)
    }
    if (handleType === 'video') {
        if (nowPickInfo.value?.chatType === CHAT_TYPE.SINGLE) {
            const callType = CALL_TYPES.SINGLE_VIDEO
            sendInviteMessage(toId, callType)
            //发送邀请信息后创建一条本地系统通知类消息上屏展示
            const params = {
                from: EaseChatClient.user,
                to: toId,
                chatType: CHAT_TYPE.SINGLE,
                msg: `邀请【${toId}】进行视频通话`
            }
            store.dispatch('createInformMessage', params)
        } else if (nowPickInfo.value?.chatType === CHAT_TYPE.GROUP) {
            //群组则弹出多人模态框
            showInviteCallMembersModal()
        }
    }
}
const inviteCallMembersComp = ref(null)
//调起多人邀请组件
const showInviteCallMembersModal = () => {
    console.log('>>>>>>>邀请多人modal弹出')
    const groupId = nowPickInfo.value.id
    if (groupId) {
        inviteCallMembersComp.value.alertDialog(groupId)
    } else {
        console.warn('请传入groupId')
    }
}
//发送多人场景邀请信息的方法
const sendMulitInviteMsg = (targetIMId) => {
    console.log('>>>>>要发送的用户列表', targetIMId)
    const callType = CALL_TYPES.MULTI_VIDEO
    const groupId = nowPickInfo.value.id
    sendInviteMessage(targetIMId, callType, groupId)
    const params = {
        from: EaseChatClient.user,
        to: groupId,
        chatType: CHAT_TYPE.GROUP,
        msg: '已发起多人音视频通话'
    }
    store.dispatch('createInformMessage', params)
}

defineExpose({
    textContent,
    handleQuoteMessage
})
</script>
<template>
    <div class="chat_func_box">
        <span
            v-for="iconItem in all_func"
            :class="['iconfont', iconItem.className]"
            :key="iconItem.className"
            :style="iconItem.style"
            :title="iconItem.title"
            @click.stop="iconItem.methodName"
        ></span>
        <!-- EaseCallKit 音视频邀请icon【不需要可移除】 -->
        <!-- 群组没有语音发起 -->
        <template v-if="isHttps">
            <span
                class="iconfont icon-31dianhua"
                style="font-size: 20px"
                title="语音通话"
                v-show="nowPickInfo.chatType === CHAT_TYPE.SINGLE"
                @click="handleInviteCall('voice')"
            ></span>
            <span
                class="iconfont icon-video"
                style="font-size: 20px"
                title="视频通话"
                @click="handleInviteCall('video')"
            ></span>
        </template>

        <!-- 表情框 -->
        <el-scrollbar
            ref="emojisBox"
            v-if="isShowEmojisBox"
            class="emojis_box"
            tag="div"
        >
            <span
                class="emoji"
                v-for="(emoji, index) in emojis"
                :key="index"
                @click="addOneEmoji(emoji)"
                >{{ emoji }}</span
            >
        </el-scrollbar>
        <!-- 图片附件choose -->
        <input
            ref="uploadImgs"
            type="file"
            style="display: none"
            @change="sendImagesMessage('common')"
            single
            accept="image/*"
        />
        <!-- 文件附件choose -->
        <input
            ref="uploadFiles"
            type="file"
            style="display: none"
            @change="sendFilesMessages"
            single
        />
        <!-- 录音采集框 -->
        <el-card
            ref="recordBox"
            v-if="isShowRecordBox"
            class="record_box"
            shadow="always"
        >
            <p v-if="!isHttps">
                由于浏览器限制,录音功能必须为https环境或者为localhost环境下使用！
            </p>
            <CollectAudio v-else @sendAudioMessages="sendAudioMessages" />
        </el-card>
        <!-- 附件上传加载容器 -->
        <div ref="loadingBox" class="loading_box"></div>
    </div>
    <template v-if="nowPickInfo.chatType === CHAT_TYPE.SINGLE">
        <textarea
            ref="editable"
            v-model="textContent"
            class="chat_content_editable"
            spellcheck="false"
            contenteditable="true"
            placeholder="请输入消息内容..."
            @keydown="onTextInputKeyDown"
            @paste="onPasteImage"
        >
        </textarea>
    </template>
    <template v-else-if="nowPickInfo.chatType === CHAT_TYPE.GROUP">
        <vue-at :members="atMembersList" name-key="text" @insert="onInsert">
            <textarea
                ref="editable"
                v-model="textContent"
                class="chat_content_editable"
                spellcheck="false"
                contenteditable="true"
                placeholder="请输入消息内容..."
                @keydown="onTextInputKeyDown"
                @paste="onPasteImage"
            >
            </textarea>
        </vue-at>
    </template>

    <el-button
        :class="[textContent === '' ? 'no_content_send_btn' : 'chat_send_btn']"
        type="primary"
        @click="sendTextMessage"
        >发送</el-button
    >
    <InviteCallMembers
        ref="inviteCallMembersComp"
        @sendMulitInviteMsg="sendMulitInviteMsg"
    />
    <PreviewSendImg
        ref="previewSendImg"
        @sendImagesMessage="sendImagesMessage"
    />
    <MsgQuote ref="messageQuoteRef" />
</template>

<style lang="scss" scoped>
@import './index.scss';
</style>
