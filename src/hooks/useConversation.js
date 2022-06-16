/* 会话列表总装车间 */
import _ from 'lodash';
import store from '@/store';
import { messageType } from '@/constant';
import EaseIM from '@/IM/initwebsdk';

import defaultGroupAvatarUrl from '@/assets/images/avatar/jiaqun2x.png';
import defaultSingleAvatarUrl from '@/assets/images/avatar/theme2x.png';
import { useSetMessageKey } from '@/hooks';
const { SESSION_MESSAGE_TYPE, CHAT_TYPE } = messageType;

//当前登陆ID

export default function (corresMessage) {
  /*
   * 1、取到messageList更新后的最后一套消息
   * 2、取会话列表数据进行与当前的messageList进行比对查看messaList中的Key是否已经存在于已有的Conversation中。
   * 3、结合上一步，没有则在追加一个新会话，有则只更新lastmessage.
   */
  let updatedConversation = {};
  let lastMsgBody = corresMessage[corresMessage.length - 1];
  findIncludesConversation(lastMsgBody);
  //根据传入的消息进入会话列表进行查询
  function findIncludesConversation(msgBody) {
    const localConversationList = store.state.Conversation.conversationListData;
    const listKey = useSetMessageKey(msgBody);
    //不存在则创建
    if (!localConversationList[listKey]) {
      let newCoversation = buildConversationItem('create', msgBody);
      updatedConversation[listKey] = newCoversation;
    }
    //存在则更新
    else if (localConversationList && localConversationList[listKey]) {
      const theData = _.cloneDeep(
        store.state.Conversation.conversationListData[listKey]
      );
      let updatedCoversation = buildConversationItem(
        'update',
        msgBody,
        theData
      );

      updatedConversation[listKey] = updatedCoversation;
    }
  }
  //构建会话方法
  function buildConversationItem(operateType, msgBody, theData) {
    //type create构建 update更新
    /**
  * 
  * conversationType: "" 会话类型
  * conversationInfo: { 会话信息详情
      *  name: ,
      * avatarUrl:
    }, 
    fromInfo: {},消息来源id
    unreadMessageNum: 0, 未读数
    latestMessage: { 
      msg:"",
      type: "",
      ext: { },
    }, //最近一条消息消息体
    latestMessageId: "", 最近消息的消息mid
    latestSendTime:"", 最近一条消息的发送时间,
   */
    const loginUserId = EaseIM.conn.user;
    const listKey = useSetMessageKey(msgBody);
    const { chatType, from, ext, id, msg, time, to, type } = msgBody;
    if (operateType === 'create') {
      let state = {
        conversationType: chatType,
        conversationKey: listKey,
        conversationInfo: {
          name: '',
          avatarUrl:
            chatType === CHAT_TYPE.SINGLE
              ? defaultSingleAvatarUrl
              : defaultGroupAvatarUrl,
        },
        fromInfo: {
          fromId: from,
          fromName: '',
        },
        targetId: to,
        unreadMessageNum: from === loginUserId ? 0 : 1,
        latestMessage: {
          msg: SESSION_MESSAGE_TYPE[type] || msg,
          type: type,
          ext: { ...ext },
        },
        latestMessageId: id,
        latestSendTime: time,
      };
      if (chatType === CHAT_TYPE.GROUP) {
        let groupInfo = store.state.Contacts.groupList[to];
        groupInfo.groupname &&
          (state.conversationInfo.name = groupInfo.groupname);
      } else if (chatType === CHAT_TYPE.SINGLE) {
        //to字段 暂时选择展示为环信ID
        state.conversationInfo.name = to === loginUserId ? from : to;
      }
      return state;
    }
    if (operateType === 'update') {
      let updatedState = {
        fromInfo: {
          fromId: from,
          fromName: '',
        },
        latestMessage: {
          msg: SESSION_MESSAGE_TYPE[type] || msg,
          type: type,
          ext: { ...ext },
        },
        targetId: to,
        latestMessageId: id,
        latestSendTime: time,
        unreadMessageNum:
          from === loginUserId ? 0 : theData.unreadMessageNum + 1,
      };
      return _.assign(theData, updatedState);
    }
  }
  return updatedConversation;
}