<template>
    <div v-if="isShowQuoteMsgBox" class="message_quote_container">
        <span> {{ msgQuote.msgSender || '' }}：</span>
        <div class="quote_from_content">
            <template v-if="msgQuote.msgType === ALL_MESSAGE_TYPE.IMAGE">
                <el-image
                    v-show="quoteImageUrl.imageUrl"
                    style="width: 35px; height: 35px"
                    :src="quoteImageUrl.thumb || quoteImageUrl.imageUrl"
                    :preview-src-list="[quoteImageUrl.imageUrl]"
                />
                <p v-show="!quoteImageUrl">{{ msgQuote.msgPreview }}</p>
            </template>
            <template v-else>
                <p class="quote_text" :title="msgQuote.msg">
                    {{ msgQuote.msgPreview || '' }}
                </p>
            </template>
        </div>

        <div class="quote_close_icon" @click="clearQuoteContent">
            <svg
                viewBox="0 0 1024 1024"
                xmlns="http://www.w3.org/2000/svg"
                data-v-ea893728=""
            >
                <path
                    fill="currentColor"
                    d="m466.752 512-90.496-90.496a32 32 0 0 1 45.248-45.248L512 466.752l90.496-90.496a32 32 0 1 1 45.248 45.248L557.248 512l90.496 90.496a32 32 0 1 1-45.248 45.248L512 557.248l-90.496 90.496a32 32 0 0 1-45.248-45.248L466.752 512z"
                ></path>
                <path
                    fill="currentColor"
                    d="M512 896a384 384 0 1 0 0-768 384 384 0 0 0 0 768zm0 64a448 448 0 1 1 0-896 448 448 0 0 1 0 896z"
                ></path>
            </svg>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useStore } from 'vuex'
import messageType from '@/constant/messageType'
import useGetUserMapInfo from '@/hooks/useGetUserMapInfo'
const { getTheGroupNickNameById, getLoginNickNameById } = useGetUserMapInfo()
const { ALL_MESSAGE_TYPE, SESSION_MESSAGE_TYPE, CHAT_TYPE } = messageType
/* stores */
const store = useStore()
console.log(store.state)
const loginUserInfo = computed(() => {
    return store.state.loginUserInfo
})
//是否开启引用展示框
const isShowQuoteMsgBox = ref(false)
//引用消息必传参数
let msgQuote = reactive({
    msgID: '', //引用消息id
    msgPreview: '', //引用消息预览
    msgSender: '', //引用消息发送人
    msgType: '' //引用消息类型
})
//引用图片消息预览图片
const quoteImageUrl = reactive({
    thumb: '',
    imageUrl: ''
})
//提取原始消息内容至待发送的引用参数内
const extractMessageBodyValue = (sourceMsg) => {
    const { type, msg: msgContent, id: mid, from } = sourceMsg
    msgQuote.msgID = mid
    msgQuote.msgType = type
    if (from === loginUserInfo.value.hxId) {
        msgQuote.msgSender = getLoginNickNameById()
    } else {
        //判断消息引用来源是否为群组，如果是群组，则从群组中获取群组属性。
        const groupId =
            sourceMsg.chatType === CHAT_TYPE.GROUP ? sourceMsg.to : ''
        msgQuote.msgSender = getTheGroupNickNameById(groupId, from)
    }
    if (type === ALL_MESSAGE_TYPE.IMAGE) {
        quoteImageUrl.thumb = sourceMsg.thumb
        quoteImageUrl.imageUrl = sourceMsg.url
    }
    if (type === ALL_MESSAGE_TYPE.TEXT) {
        msgQuote.msgPreview = msgContent
    } else {
        msgQuote.msgPreview = SESSION_MESSAGE_TYPE[type]
    }
}
const setQuoteContent = (msg) => {
    msg && extractMessageBodyValue(msg)
    isShowQuoteMsgBox.value = true
}
//清除引用消息状态内容。
const clearQuoteContent = () => {
    msgQuote.msgID = ''
    msgQuote.msgPreview = ''
    msgQuote.msgType = ''
    msgQuote.msgSender = ''
    quoteImageUrl.imageUrl = ''
    quoteImageUrl.thumb = ''
    isShowQuoteMsgBox.value = false
}
defineExpose({
    isShowQuoteMsgBox,
    msgQuote,
    setQuoteContent,
    clearQuoteContent
})
</script>

<style lang="scss" scoped>
.message_quote_container {
    position: absolute;
    left: 15px;
    bottom: 10px;
    min-width: 20%;
    max-width: 45%;
    height: 20%;
    border-radius: 3px;
    background: #e7e7e690;
    color: #8e8e8e;
    padding: 5px;
    display: flex;
    flex-direction: row;
    align-items: center;
    font-size: 13px;
}
.quote_file_box {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
}
.quote_close_icon {
    position: absolute;
    top: 0;
    bottom: 0;
    right: -8%;
    margin: auto;
    width: 15px;
    height: 15px;
    cursor: pointer;
}
.quote_close_icon:hover {
    transform: scale(1.1);
}
.quote_text {
    width: 100%;
    word-break: break-all;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 17px;
}

.quote_file_icon {
    width: 15px;
    height: 15px;
}
</style>
