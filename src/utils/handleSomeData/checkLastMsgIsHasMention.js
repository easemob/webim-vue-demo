import { getCurrentUserId } from '@/IM';
export default function (toDoUpdateMsg, toDoUpdateConversation) {
  if (!toDoUpdateMsg) return;
  const { ext, type, sender } = toDoUpdateMsg;
  const EM_AT_LIST = 'em_at_list';
  //当前要更新会话状态如果已为提及则不做处理仍返回true
  if (toDoUpdateConversation && toDoUpdateConversation?.isMention) return true;
  //如果要更新的消息消息包含扩展提及则返回true
  if (type === 'text') {
    if (!ext || !ext[EM_AT_LIST]) return false;
    if (
      ext[EM_AT_LIST].includes(getCurrentUserId()) ||
      (sender?.userId !== getCurrentUserId() && ext[EM_AT_LIST] === 'ALL')
    ) {
      return true;
    } else {
      return false;
    }
  }
}
