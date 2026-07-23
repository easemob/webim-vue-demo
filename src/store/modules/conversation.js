import _ from 'lodash';
import {
  createInform,
  checkLastMsgIsHasMention,
  setMessageKey,
} from '@/utils/handleSomeData/index';
import messageStore from '@/store/modules/message';
import { getCurrentUserId, requireManager } from '@/IM';
import { INFORM_FROM } from '@/constant';
import { GROUP_OPERATION_TYPE, CHAT_TYPE } from '@/IM/constant';
import {
  buildConversationDndDurationParams,
  buildConversationPushQueryParams,
  buildConversationPushSettingParams,
} from '@/utils/conversationPushSettings';

//获取messageList数组中的最新一条消息
const getLatestMessageBodyFromMessageStore = (conversationId, chatType) => {
  // 生成正确的消息列表键
  const listKey = setMessageKey({ to: conversationId, chatType });
  const messageList = messageStore.state.messageList[listKey];
  if (messageList && messageList.length) {
    const latestMessage = messageList[messageList.length - 1];
    return latestMessage;
  }
  return null;
};

const getConversationTime = (conversation) =>
  Number(
    conversation?.lastMessage?.time ||
      conversation?.lastMessage?.timestamp ||
      conversation?.lastMessageAt ||
      0,
  );

const chatManager = () => requireManager('chatManager');
const pushManager = () => requireManager('pushManager');

const toDisplayConversation = (conversation) => {
  const lastMessage = conversation?.lastMessage
    ? {
        ...conversation.lastMessage,
        time:
          conversation.lastMessage.time ?? conversation.lastMessage.timestamp ?? 0,
      }
    : null;
  return {
    ...conversation,
    lastMessage,
    unReadCount: Number(conversation?.unreadCount ?? conversation?.unReadCount ?? 0),
    pinnedTime: conversation?.pinnedTimestamp ?? conversation?.pinnedTime ?? 0,
  };
};

const sortConversationList = (conversationList) => {
  conversationList.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.isPinned && b.isPinned) {
      return Number(b.pinnedTime || b.pinnedTimestamp || 0) -
        Number(a.pinnedTime || a.pinnedTimestamp || 0);
    }
    return getConversationTime(b) - getConversationTime(a);
  });
};

const getFirstValidValue = (values) =>
  values.find((value) => value !== undefined && value !== null && value !== '');

const normalizeGroupEventUserIds = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const getGroupEventDisplayName = (informContent, getters, fallbackText = '') => {
  const userId = getFirstValidValue([
    informContent?.from,
    informContent?.userId,
    informContent?.invitee,
    informContent?.applicant,
    ...normalizeGroupEventUserIds(informContent?.users),
    ...normalizeGroupEventUserIds(informContent?.members),
  ]);
  if (!userId) return fallbackText;
  return getters['UsersProfile/getDisplayName'](userId) || userId;
};

const Conversation = {
  state: {
    informDetail: [],
    conversationFromMethod: false, // 按文档推荐默认走服务端会话列表
    conversationListFromLocal: [],
    conversationListFromServer: [],
    conversationListFromServerPageSize: 50,
    conversationListFromServerCursor: '',
  },
  mutations: {
    //获取会话列表获取方式
    GET_CONVERSATION_LIST_FROM: (state) => {
      state.conversationFromMethod = false;
    },
    //清空系统通知
    CLEAR_INFORM_LIST: (state) => {
      state.informDetail = [];
    },
    //更新系统通知
    UPDATE_INFORM_LIST: (state, informBody) => {
      const toBeUpdateInform = _.assign([], state.informDetail);
      toBeUpdateInform.unshift(informBody);
      state.informDetail = toBeUpdateInform;
    },
    //获取会话列表
    GET_CONVERSATION_LIST_FROM_LOCAL: (state, payload) => {
      state.conversationListFromLocal = payload;
    },
    //更新本地缓存的会话列表数据
    UPDATE_CONVERSATION_LIST: (state, conversationItem) => {
      const list = state.conversationFromMethod
        ? state.conversationListFromLocal
        : state.conversationListFromServer;
      const _index = list.findIndex(
        (c) => c.conversationId === conversationItem.conversationId,
      );

      // 确保会话对象的lastMessage存在
      if (!conversationItem.lastMessage) {
        conversationItem.lastMessage = {};
      }

      if (_index > -1) {
        const existing = list[_index];
        list[_index] = {
          ...existing,
          ...conversationItem,
          lastMessage: conversationItem.lastMessage || existing.lastMessage,
          customField: {
            ...(existing.customField || {}),
            ...(conversationItem.customField || {}),
          },
          unReadCount: Number(conversationItem.unReadCount || 0),
        };
      } else {
        // 添加新会话到列表开头
        list.unshift({
          customField: {},
          unReadCount: 0,
          ...conversationItem,
        });
      }
      sortConversationList(list);
    },
    //删除某条会话
    DELETE_CONVERSATION_ITEM: (state, conversationId) => {
      const conversationList = state.conversationFromMethod
        ? state.conversationListFromLocal
        : state.conversationListFromServer;
      const _index = conversationList.findIndex(
        (v) => v.conversationId === conversationId,
      );
      if (_index > -1) {
        conversationList.splice(_index, 1);
      }
    },
    //清除会话未读状态
    CLEAR_CONVERSATION_ITEM_UNREAD_COUNT: (state, conversationId) => {
      const list = state.conversationFromMethod
        ? state.conversationListFromLocal
        : state.conversationListFromServer;
      list?.length &&
        list.forEach((conversationItem) => {
          if (conversationItem.conversationId === conversationId) {
            conversationItem.unReadCount = 0;
          }
        });
    },
    //清除会话@状态
    CLEAR_CONVERSATION_ITEM_MENTION_STATUS: (state, conversationId) => {
      state.conversationListFromLocal.map((conversationItem) => {
        if (conversationItem.conversationId === conversationId) {
          conversationItem.customField.mention = false;
        }
      });
    },
    //清除信息卡片未读
    CLEAR_UNTREATED_STATUS: (state, index) => {
      state.informDetail[index].untreated = 0;
    },
    //更改卡片消息的按钮状态
    UPDATE_INFORM_BTNSTATUS: (state, { index: index, btnStatus }) => {
      state.informDetail[index].operationStatus = btnStatus;
    },
    //设置服务端会话列表分页游标
    SET_CONVERSATION_LIST_FROM_SERVER_PAGE_CURSOR: (state, cursor) => {
      state.conversationListFromServerCursor = cursor;
    },
    //获取服务端会话列表数据
    GET_CONVERSATION_LIST_FROM_SERVER: (state, payload) => {
      const { isInit, conversationListData } = payload;
      //合并store中的会话列表数据 isInit为false时，去重后合并
      const conversationList = isInit
        ? conversationListData
        : _.uniqBy(
            [...conversationListData, ...state.conversationListFromServer],
            'conversationId',
          );
      // 按照置顶状态和最后消息时间排序，置顶会话优先，然后按时间倒序
      sortConversationList(conversationList);
      state.conversationListFromServer = conversationList;
    },
    //更新会话置顶状态
    UPDATE_CONVERSATION_PIN_STATUS: (state, pinnedConversations) => {
      state.conversationListFromServer.forEach((conversation) => {
        conversation.isPinned = false;
        conversation.pinnedTime = 0;
      });

      (pinnedConversations || []).forEach((pinnedItem) => {
        const existingConversation = state.conversationListFromServer.find(
          (c) => c.conversationId === pinnedItem.conversationId,
        );
        if (existingConversation) {
          existingConversation.isPinned = pinnedItem.isPinned ?? true;
          existingConversation.pinnedTime = existingConversation.isPinned
            ? pinnedItem.pinnedTime || Date.now()
            : 0;
        }
      });

      // 重新排序会话列表
      sortConversationList(state.conversationListFromServer);
    },
    UPDATE_CONVERSATION_MARK_STATUS: (state, payload) => {
      const { conversationId, mark, isMarked } = payload;
      const conversation = state.conversationListFromServer.find(
        (item) => item.conversationId === conversationId,
      );
      if (!conversation) return;
      const marks = Array.isArray(conversation.marks)
        ? [...conversation.marks]
        : [];
      if (isMarked && !marks.includes(mark)) {
        marks.push(mark);
      }
      conversation.marks = isMarked
        ? marks
        : marks.filter((item) => item !== mark);
    },
  },
  actions: {
    //添加新系统通知
    createNewInform: ({ dispatch, commit, getters }, params) => {
      const { fromType, informContent } = params;
      commit('UPDATE_INFORM_LIST', createInform(fromType, informContent));

      // 消息生成器函数
      const generateMessage = (type, config) => {
        const fromName = getGroupEventDisplayName(
          informContent,
          getters,
          '',
        );
        const memberName = getGroupEventDisplayName(
          informContent,
          getters,
          '成员',
        );
        const baseMsg = {
          id: Date.now() + '',
          chatType: type === 'friend' ? CHAT_TYPE.SINGLE : CHAT_TYPE.GROUP,
          from: informContent.from,
          to: type === 'friend' ? informContent.to : informContent.id,
          fromName,
          toName:
            type === 'friend'
              ? getters['UsersProfile/getDisplayName'](informContent.to)
              : getters['getGroupName'](informContent.id),
        };

        // 消息模板映射
        const templates = {
          friend: {
            unsubscribed: '你俩的友尽了，可重新发起好友申请',
            subscribed: '你们已成为你的好友,开始聊天吧',
          },
          group: {
            [GROUP_OPERATION_TYPE.CREATE]: `${baseMsg.fromName}创建了群组`,
            [GROUP_OPERATION_TYPE.MEMBER_PRESENCE]: `${memberName}加入了群组`,
            [GROUP_OPERATION_TYPE.MEMBERS_PRESENCE]: `${memberName}加入了群组`,
            [GROUP_OPERATION_TYPE.MEMBER_ABSENCE]: `${baseMsg.fromName}退出了群组`,
            [GROUP_OPERATION_TYPE.MEMBERS_ABSENCE]: `${baseMsg.fromName}移除了多个群成员`,
            [GROUP_OPERATION_TYPE.UPDATE_ANNOUNCEMENT]: `${baseMsg.fromName}更新了群组公告，去看看更新的什么吧~`,
            [GROUP_OPERATION_TYPE.DELETE_ANNOUNCEMENT]: `${baseMsg.fromName}删除了群组公告`,
            [GROUP_OPERATION_TYPE.SET_ADMIN]: `${baseMsg.fromName}设定${baseMsg.toName}为管理员~`,
            [GROUP_OPERATION_TYPE.REMOVE_ADMIN]: `${baseMsg.fromName}移除了${baseMsg.toName}的管理员身份~`,
            [GROUP_OPERATION_TYPE.CHANGE_OWNER]: `${baseMsg.fromName}转让了群组`,
            [GROUP_OPERATION_TYPE.INVITE_TO_JOIN]: `${baseMsg.fromName}邀请你加入群组`,
            [GROUP_OPERATION_TYPE.ACCEPT_INVITE]: `${getGroupEventDisplayName(informContent, getters, '成员')}接受了入群邀请`,
            [GROUP_OPERATION_TYPE.REJECT_INVITE]: `${getGroupEventDisplayName(informContent, getters, '成员')}拒绝了入群邀请`,
            [GROUP_OPERATION_TYPE.REQUEST_TO_JOIN]: `${baseMsg.fromName}申请加入群组`,
            [GROUP_OPERATION_TYPE.JOIN_PUBLIC_GROUP_DECLINED]: `${baseMsg.fromName}的入群申请被拒绝`,
            [GROUP_OPERATION_TYPE.MUTE_MEMBER]: `${
              baseMsg.fromName
            }禁言了${config.getTargetName()}~`,
            [GROUP_OPERATION_TYPE.UNMUTE_MEMBER]: `${
              baseMsg.fromName
            }取消了${config.getTargetName()}的禁言~`,
            [GROUP_OPERATION_TYPE.MUTE_ALL_MEMBERS]: `${baseMsg.fromName}开启了全员禁言`,
            [GROUP_OPERATION_TYPE.UNMUTE_ALL_MEMBERS]: `${baseMsg.fromName}关闭了全员禁言`,
            [GROUP_OPERATION_TYPE.ADD_USER_TO_ALLOWLIST]: `${baseMsg.fromName}添加了群白名单成员`,
            [GROUP_OPERATION_TYPE.REMOVE_ALLOWLIST_MEMBER]: `${baseMsg.fromName}移除了群白名单成员`,
            [GROUP_OPERATION_TYPE.UNBLOCK_MEMBER]: `${baseMsg.fromName}将成员移出了黑名单`,
            [GROUP_OPERATION_TYPE.REMOVE_MEMBER]: `${baseMsg.fromName}将你移出了群组${baseMsg.toName}~`,
            [GROUP_OPERATION_TYPE.DESTROY]: `${baseMsg.fromName}解散了该群~`,
            [GROUP_OPERATION_TYPE.UPDATE_INFO]: `${baseMsg.fromName}更新了群组详情~`,
            [GROUP_OPERATION_TYPE.DIRECT_JOINED]: `${baseMsg.fromName}直接将你加入了群组`,
            [GROUP_OPERATION_TYPE.MEMBER_ATTRIBUTES_UPDATE]: `${baseMsg.fromName}修改群内昵称为【${informContent?.attributes?.nickName}】`,
          },
        };

        return { ...baseMsg, msg: templates[type][config.operation] };
      };

      // 处理好友通知
      if (fromType === INFORM_FROM.FRIEND) {
        const operation = informContent.type;
        if (['unsubscribed', 'subscribed'].includes(operation)) {
          const config = {
            // 新增配置对象
            operation,
            getTargetName: () => informContent.to || '你', // 添加默认方法
          };
          dispatch(
            'createInformMessage',
            generateMessage('friend', config), // 传入完整配置
          );
        }
        return;
      }

      // 处理群组通知
      if (fromType === INFORM_FROM.GROUP) {
        const config = {
          operation: informContent.operation,
          getTargetName: () => informContent.to || '你',
        };
        if (Object.values(GROUP_OPERATION_TYPE).includes(config.operation)) {
          dispatch('createInformMessage', generateMessage('group', config));
        }
      }
    },
    //从本地加载会话列表数据
    getConversationListFromLocal: async ({ dispatch, commit }) => {
      try {
        const conversationList = chatManager()
          .getConversationList()
          .map(toDisplayConversation);
        sortConversationList(conversationList);
        commit('GET_CONVERSATION_LIST_FROM_LOCAL', conversationList);
        dispatch('callGroupDetailWithConversationId', conversationList);
        console.log('[Conversation] getConversationListFromLocal SDK 5.0 snapshot', {
          count: conversationList.length,
          currentUser: getCurrentUserId(),
        });
      } catch (error) {
        console.error('获取会话列表失败', error);
        throw error;
      }
    },
    //从服务端获取会话列表
    getConversationListFromServer: async ({ state, commit, dispatch }, params) => {
      const { isInit } = params || {};
      try {
        const allConversations = chatManager()
          .getConversationList()
          .map(toDisplayConversation);

        commit('GET_CONVERSATION_LIST_FROM_SERVER', {
          isInit: isInit !== false,
          conversationListData: allConversations,
        });
        commit('SET_CONVERSATION_LIST_FROM_SERVER_PAGE_CURSOR', '');
        
        const userIds = _.chain(allConversations)
          .filter({ conversationType: CHAT_TYPE.SINGLE })
          .map('conversationId')
          .value();
        dispatch('fetchContactsUserInfos', userIds);
        
        dispatch('callGroupDetailWithConversationId', allConversations);
      } catch (error) {
        console.error('获取会话列表失败', error);
      }
    },
    //获取服务端置顶会话列表
    getServerPinnedConversations: async ({ commit }, params) => {
      try {
        const conversations = chatManager()
          .getConversationList({ isPinned: true })
          .map(toDisplayConversation);
        commit('UPDATE_CONVERSATION_PIN_STATUS', conversations);
        return { conversations };
      } catch (error) {
        console.error('获取服务端置顶会话列表失败', error);
        throw error;
      }
    },
    //根据标记从服务端筛选会话列表
    getServerConversationsByFilter: async ({ commit }, params) => {
      const {
        filter,
      } = params || {};
      try {
        const conversations = chatManager()
          .getConversationList(filter)
          .map(toDisplayConversation);
        commit('GET_CONVERSATION_LIST_FROM_SERVER', {
          isInit: true,
          conversationListData: conversations,
        });
        commit('SET_CONVERSATION_LIST_FROM_SERVER_PAGE_CURSOR', '');
        return { conversations, cursor: '' };
      } catch (error) {
        console.error('根据标记获取服务端会话列表失败', error);
        throw error;
      }
    },
    //获取会话列表
    getConversationList: async ({ dispatch }, params) => {
      // 按文档推荐：登录后初始化只拉取一次服务端会话列表
      return dispatch('getConversationListFromServer', { isInit: true });
    },
    //更新Store中的会话列表（数据来源为本地会话插件）
    updateConversationWithLocal: async ({ commit }, params) => {
      const { conversationId, chatType } = params;
      try {
        const conversation = chatManager()
          .getConversationList()
          .find(
            (item) =>
              item.conversationId === conversationId &&
              item.conversationType === chatType,
          );
        if (!conversation) return;
        const displayConversation = toDisplayConversation(conversation);
        displayConversation.customField = {
          ...(displayConversation.customField || {}),
          mention: checkLastMsgIsHasMention(displayConversation.lastMessage),
        };
        commit('UPDATE_CONVERSATION_LIST', displayConversation);
      } catch (error) {
        console.error('[Conversation] getLocalConversation failed', {
          conversationId,
          chatType,
          error,
        });
      }
    },
    //更新Store中的会话列表（远端会话会在环信服务自动更新。）
    updateConversationWithServer: async ({ state, commit }, params) => {
      const { conversationId, chatType, incrementUnread = true } = params;

      //从messageStore中获取最新一条消息
      const latestMessage = getLatestMessageBodyFromMessageStore(
        conversationId,
        chatType,
      );

      if (!latestMessage) return;

      const conversationItem = state.conversationListFromServer.find(
        (c) => c.conversationId === conversationId,
      );
      const isUnreadMessage = latestMessage.from !== getCurrentUserId();

      //如果缓存中存在会话则直接更新
      if (conversationItem) {
        commit('UPDATE_CONVERSATION_LIST', {
          ...conversationItem,
          lastMessage: latestMessage,
          customField: {
            ...(conversationItem.customField || {}),
            mention:
              conversationItem.customField?.mention ||
              checkLastMsgIsHasMention(latestMessage),
          },
          unReadCount:
            Number(conversationItem.unReadCount || 0) +
            (isUnreadMessage && incrementUnread ? 1 : 0),
        });
      } //如果本地没有则手动创建一个同结构的会话数据
      else {
        const toBeUpdateConversationItem = {
          conversationId,
          conversationType: chatType,
          unReadCount: isUnreadMessage && incrementUnread ? 1 : 0,
          lastMessage: latestMessage,
          customField: {
            mention: checkLastMsgIsHasMention(latestMessage),
          },
        };
        commit('UPDATE_CONVERSATION_LIST', toBeUpdateConversationItem);
      }
    },
    //更新缓存中的会话列表
    updateConversationList: async ({ dispatch }, params) => {
      dispatch('updateConversationWithServer', params);
    },
    //删除会话列表（本地以及远端）
    removeLocalConversation: async ({ state, commit }, params) => {
      const { conversationId, conversationType } = params;
      const options = {
        conversationId,
        conversationType,
        deleteRoamingMessages: true,
      };
      try {
        await chatManager().deleteConversation(options);
        commit('DELETE_CONVERSATION_ITEM', conversationId);
        return true;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    getConversationPushSetting: async (context, conversation) => {
      const options = buildConversationPushQueryParams(conversation);
      try {
        const result = await pushManager().getConversationSilentMode(options);
        console.log('获取单个会话推送通知设置成功', {
          conversationId: options.conversationId,
          chatType: options.conversationType,
          currentUser: getCurrentUserId(),
          result,
        });
        return result;
      } catch (error) {
        console.error('获取单个会话推送通知设置失败', {
          conversationId: options.conversationId,
          chatType: options.conversationType,
          currentUser: getCurrentUserId(),
          error,
        });
        throw error;
      }
    },
    setConversationPushSetting: async (context, params) => {
      const { conversation, remindType } = params;
      const options = buildConversationPushSettingParams(conversation, remindType);
      try {
        const result = await pushManager().setConversationSilentMode(options);
        console.log('设置单个会话推送通知方式成功', {
          conversationId: options.conversationId,
          chatType: options.conversationType,
          remindType,
          currentUser: getCurrentUserId(),
          result,
        });
        return result;
      } catch (error) {
        console.error('设置单个会话推送通知方式失败', {
          conversationId: options.conversationId,
          chatType: options.conversationType,
          remindType,
          currentUser: getCurrentUserId(),
          error,
        });
        throw error;
      }
    },
    setConversationDndDuration: async (context, params) => {
      const { conversation, durationMinutes } = params;
      const options = buildConversationDndDurationParams(
        conversation,
        durationMinutes,
      );
      try {
        const result = await pushManager().setConversationSilentMode(options);
        console.log('设置单个会话免打扰时长成功', {
          conversationId: options.conversationId,
          chatType: options.conversationType,
          durationMinutes,
          duration: options.rule.duration,
          currentUser: getCurrentUserId(),
          result,
        });
        return result;
      } catch (error) {
        console.error('设置单个会话免打扰时长失败', {
          conversationId: options.conversationId,
          chatType: options.conversationType,
          durationMinutes,
          duration: options.rule.duration,
          currentUser: getCurrentUserId(),
          error,
        });
        throw error;
      }
    },
    clearConversationPushSetting: async (context, conversation) => {
      const options = buildConversationPushQueryParams(conversation);
      try {
        const result = await pushManager().clearConversationRemindType(options);
        console.log('清除单个会话推送通知方式成功', {
          conversationId: options.conversationId,
          chatType: options.conversationType,
          currentUser: getCurrentUserId(),
          result,
        });
        return result;
      } catch (error) {
        console.error('清除单个会话推送通知方式失败', {
          conversationId: options.conversationId,
          chatType: options.conversationType,
          currentUser: getCurrentUserId(),
          error,
        });
        throw error;
      }
    },
    //设置会话已读（发送会话已读回执。）
    clearConversationUnreadCount: async ({ state, commit }, params) => {
      if (!params || !params.conversationId || !params.chatType) {
        console.error('clearConversationUnreadCount 参数错误:', params);
        return;
      }

      const { conversationId, chatType } = params;
      if (![CHAT_TYPE.SINGLE, CHAT_TYPE.GROUP].includes(chatType)) {
        return;
      }

      try {
        await chatManager().clearConversationUnreadMessageCount({
          conversationId,
          conversationType: chatType,
        });
        commit('CLEAR_CONVERSATION_ITEM_UNREAD_COUNT', conversationId);
      } catch (error) {
        console.error('[Conversation] clearConversationUnreadCount failed', {
          conversationId,
          chatType,
          error,
        });
      }
    },
    //清除会话@提及状态
    clearConversationMention: async ({ state, commit }, params) => {
      const { conversationId, conversationType, customField } = params;
      customField.mention = false;
      commit('CLEAR_CONVERSATION_ITEM_MENTION_STATUS', conversationId);
    },
    //通过会话Id调用群组或聊天室详情用于会话列表数据展示
    callGroupDetailWithConversationId: async (
      { dispatch },
      conversationList,
    ) => {
      // 仅群聊会话可调用 getGroupInfo（/chatgroups）。聊天室应使用 getChatRoomDetails 等接口，混用会触发 400：
      // Illegal arguments: chatType is not required: group
      const groupConversationIds = _.chain(conversationList)
        .filter((item) => item.conversationType === CHAT_TYPE.GROUP)
        .map('conversationId')
        .value();
      try {
        if (groupConversationIds.length > 0) {
          //获取群组详情
          await dispatch('fetchGroupDetailFromServer', groupConversationIds);
        }
      } catch (error) {
        console.error('[Conversation] fetch group details for conversations failed', {
          groupConversationIds,
          error,
        });
      }
    },
  },
  getters: {
    conversationFromMethod: (state) => state.conversationFromMethod,
    conversationListFromLocal: (state) => state.conversationListFromLocal,
    conversationListFromServer: (state) => state.conversationListFromServer,
    conversationListFromServerCursor: (state) =>
      state.conversationListFromServerCursor,
  },
};
export default Conversation;
