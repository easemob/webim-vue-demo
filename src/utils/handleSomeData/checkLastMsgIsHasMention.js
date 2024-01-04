import { messageType } from '@/constant'
import { EMClient } from '@/IM'
const { SESSION_MESSAGE_TYPE, CHAT_TYPE, ALL_MESSAGE_TYPE, CUSTOM_TYPE } =
    messageType
export default function (toDoUpdateMsg, toDoUpdateConversation) {
    const { ext, type, from } = toDoUpdateMsg
    const EM_AT_LIST = 'em_at_list'
    //当前要更新会话状态如果已为提及则不做处理仍返回true
    if (toDoUpdateConversation && toDoUpdateConversation?.isMention) return true
    //如果要更新的消息消息包含扩展提及则返回true
    if (type === ALL_MESSAGE_TYPE.TEXT) {
        if (!ext || !ext[EM_AT_LIST]) return false
        if (
            ext[EM_AT_LIST].includes(EMClient.user) ||
            (from !== EMClient.user && ext[EM_AT_LIST] === 'ALL')
        ) {
            return true
        } else {
            return false
        }
    }
}
