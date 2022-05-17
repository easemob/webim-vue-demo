export default {
  pfh: {
    conversationType: 'singleChat', //会话类型
    conversationInfo: {
      name: '张三',
    }, //会话信息
    unreadMessageNum: 10, //未读数
    latestMessage: {
      msg: '你好',
      type: 'txt',
      ext: {},
    }, //最近一条消息消息体
    latestMessageId: '1010108667451672692', //最近消息的消息mid
    latestSendTime: 1652274260558, //最近一条消息的发送时间,
    isStick: true, //是否置顶,
  },
  pfh2: {
    conversationType: 'groupChat', //会话类型
    conversationInfo: {
      name: '张三测试群',
    }, //会话信息
    unreadMessageNum: 23, //未读数
    latestMessage: {
      msg: '你好',
      type: 'txt',
      ext: {},
    }, //最近一条消息消息体
    latestMessageId: '这是一条群消息', //最近消息的消息mid
    latestSendTime: 1652274260558, //最近一条消息的发送时间,
    isStick: false, //是否置顶,
  },
  pfh3: {
    conversationType: 'singleChat', //会话类型
    conversationInfo: {
      name: '张三测试二群',
    }, //会话信息
    unreadMessageNum: 55, //未读数
    latestMessage: {
      msg: '你好',
      type: 'txt',
      ext: {},
    }, //最近一条消息消息体
    latestMessageId: '1010108667451672692', //最近消息的消息mid
    latestSendTime: 1652274260558, //最近一条消息的发送时间,
    isStick: true, //是否置顶,
  },
};
