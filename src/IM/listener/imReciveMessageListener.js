import { EaseChatClient } from '../initwebsdk'
import { messageType } from '@/constant'
import { setMessageKey } from '@/utils/handleSomeData'
import store from '@/store'
export const imReviceMessageListener = () => {
    const { CHANGE_MESSAGE_BODAY_TYPE } = messageType
    //接收的消息往store中push
    const pushNewMessage = (message) => {
        store.dispatch('createNewMessage', message)
    }
    //收到他人的撤回指令
    const otherRecallMessage = (message) => {
        console.log('>>>>>收到他人撤回', message)
        const { from, to, mid } = message
        //单对单的撤回to必然为登陆的用户id，群组发起撤回to必然为群组id 所以key可以这样来区分群组或者单人。
        const key = to === EaseChatClient.user ? from : to
        console.log('>>>>>收到他人撤回', key)
        store.commit('CHANGE_MESSAGE_BODAY', {
            type: CHANGE_MESSAGE_BODAY_TYPE.RECALL,
            key,
            mid
        })
        store.dispatch('gatherConversation', key)
    }
    //收到消息修改指令
    const otherModifyMessage = (message) => {
        const { from, to, id: mid } = message
        //单对单的撤回to必然为登陆的用户id，群组发起撤回to必然为群组id 所以key可以这样来区分群组或者单人。
        if (!to) return
        const key = to === EaseChatClient.user ? from : to
        store.commit('CHANGE_MESSAGE_BODAY', {
            type: CHANGE_MESSAGE_BODAY_TYPE.MODIFY,
            key,
            mid,
            message
        })
        store.dispatch('gatherConversation', key)
    }
    const mountReviceMessageEventListener = () => {
        /* message 相关监听 */
        EaseChatClient.addEventHandler('messageListen', {
            onTextMessage: function (message) {
                console.log('>>>>>>>App mesage', message)
                console.log('setMessageKey', setMessageKey(message))
                pushNewMessage(message)
            }, // 收到文本消息。
            onEmojiMessage: function (message) {
                pushNewMessage(message)
            }, // 收到表情消息。
            onImageMessage: function (message) {
                pushNewMessage(message)
            }, // 收到图片消息。
            onCmdMessage: function (message) {
                console.log('>>>>>收到命令消息', message)
            }, // 收到命令消息。
            onAudioMessage: function (message) {
                pushNewMessage(message)
            }, // 收到音频消息。
            onLocationMessage: function (message) {
                pushNewMessage(message)
            }, // 收到位置消息。
            onFileMessage: function (message) {
                pushNewMessage(message)
            }, // 收到文件消息。
            onCustomMessage: function (message) {
                pushNewMessage(message)
            }, // 收到自定义消息。
            onVideoMessage: function (message) {
                pushNewMessage(message)
            }, // 收到视频消息。
            onRecallMessage: function (message) {
                otherRecallMessage(message)
            }, // 收到消息撤回回执。
            onModifiedMessage: function (message) {
                console.log('>>>>>收到修改消息', message)
                otherModifyMessage(message)
            }
        })
    }
    return {
        mountReviceMessageEventListener,
        pushNewMessage,
        otherModifyMessage,
        otherRecallMessage
    }
}
