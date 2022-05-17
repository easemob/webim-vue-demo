//处理msg与Conversation的转换
import { reactive, toRefs } from 'vue';

export default function (message) {
  console.log('>>>>>msgData', message);
  //头像路径
  const defaultGroupAvatarUrl = require('@/assets/images/avatar/jiaqun2x.png');
  const defaultSingleAvatarUrl = require('@/assets/images/avatar/theme2x.png');
  let state = reactive({
    conversationType: message.chatType, //会话类型
    conversationInfo: {
      name: '张三测试群',
      avatarUrl: '',
    }, //会话信息
    fromId: message.from,
    unreadMessageNum: 23, //未读数
    latestMessage: {
      msg: '你好',
      type: 'txt',
      ext: {},
    }, //最近一条消息消息体
    latestMessageId: message.id, //最近消息的消息mid
    latestSendTime: message.time, //最近一条消息的发送时间,
  });

  return {
    ...toRefs(state),
  };
}
