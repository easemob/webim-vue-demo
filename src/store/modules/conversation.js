import _ from 'lodash';
import { checkLastMsgIsHasMention } from '@/utils/handleSomeData/index';
import { getCurrentUserId, requireManager } from '@/IM';
import { CONVERSATION_TYPE } from '@/IM/constant';
import {
  buildConversationDndDurationParams,
  buildConversationPushQueryParams,
  buildConversationPushSettingParams,
} from '@/utils/conversationPushSettings';

//获取messageList数组中的最新一条消息
const getConversationTime = (conversation) =>
  Number(conversation?.lastMessage?.timestamp || conversation?.lastMessageAt || 0);

const chatManager = () => requireManager('chatManager');
const pushManager = () => requireManager('pushManager');

const sortConversationList = (conversationList) => {
  conversationList.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.isPinned && b.isPinned) {
      return Number(b.pinnedTimestamp || 0) - Number(a.pinnedTimestamp || 0);
    }
    return getConversationTime(b) - getConversationTime(a);
  });
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

      if (_index > -1) {
        const existing = list[_index];
        list[_index] = {
          ...existing,
          ...conversationItem,
          lastMessage: conversationItem.lastMessage,
          customField: {
            ...(existing.customField || {}),
            ...(conversationItem.customField || {}),
          },
          unreadCount: Number(conversationItem.unreadCount || 0),
        };
      } else {
        // 添加新会话到列表开头
        list.unshift({
          customField: {},
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
            conversationItem.unreadCount = 0;
          }
        });
    },
    CLEAR_ALL_CONVERSATION_UNREAD_COUNT: (state) => {
      [
        state.conversationListFromLocal,
        state.conversationListFromServer,
      ].forEach((list) => {
        list?.forEach((conversationItem) => {
          conversationItem.unreadCount = 0;
        });
      });
    },
    CLEAR_ALL_CONVERSATIONS: (state) => {
      state.conversationListFromLocal = [];
      state.conversationListFromServer = [];
      state.conversationListFromServerCursor = '';
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
          existingConversation.isPinned = pinnedItem.isPinned;
          existingConversation.pinnedTimestamp = pinnedItem.isPinned
            ? pinnedItem.pinnedTimestamp
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
    // System notifications retain the original SDK 5.0 event name and payload.
    createNewInform: ({ commit }, { eventName, payload }) => {
      commit('UPDATE_INFORM_LIST', {
        sdkEventName: eventName,
        sdkPayload: payload,
        receivedAt: Date.now(),
        untreated: 1,
        operationStatus: 0,
      });
    },
    //从本地加载会话列表数据
    getConversationListFromLocal: async ({ dispatch, commit }) => {
      try {
        const conversationList = chatManager().getConversationList();
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
        const allConversations = chatManager().getConversationList();

        commit('GET_CONVERSATION_LIST_FROM_SERVER', {
          isInit: isInit !== false,
          conversationListData: allConversations,
        });
        commit('SET_CONVERSATION_LIST_FROM_SERVER_PAGE_CURSOR', '');
        
        const userIds = _.chain(allConversations)
          .filter({ conversationType: CONVERSATION_TYPE.SINGLE })
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
        const conversations = chatManager().getConversationList({ isPinned: true });
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
        const conversations = chatManager().getConversationList(filter);
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
      const { conversationId, conversationType } = params;
      try {
        const conversation = chatManager()
          .getConversationList()
          .find(
            (item) =>
              item.conversationId === conversationId &&
              item.conversationType === conversationType,
        );
        if (!conversation) {
          console.warn('[Conversation] SDK 5.0 cache has no conversation snapshot', {
            conversationId,
            conversationType,
            currentUser: getCurrentUserId(),
            impact: 'non-blocking local conversation refresh skipped',
          });
          return;
        }
        commit('UPDATE_CONVERSATION_LIST', {
          ...conversation,
          customField: {
            mention: checkLastMsgIsHasMention(conversation.lastMessage),
          },
        });
      } catch (error) {
        console.error('[Conversation] getConversationList SDK 5.0 snapshot failed', {
          conversationId,
          conversationType,
          error,
        });
      }
    },
    //更新缓存中的会话列表，只读取 SDK 5.0 的会话快照。
    updateConversationWithServer: async ({ dispatch }, params) =>
      dispatch('updateConversationWithLocal', params),
    updateConversationList: async ({ dispatch }, params) => {
      return dispatch('updateConversationWithServer', params);
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
          conversationType: options.conversationType,
          currentUser: getCurrentUserId(),
          result,
        });
        return result;
      } catch (error) {
        console.error('获取单个会话推送通知设置失败', {
          conversationId: options.conversationId,
          conversationType: options.conversationType,
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
          conversationType: options.conversationType,
          remindType,
          currentUser: getCurrentUserId(),
          result,
        });
        return result;
      } catch (error) {
        console.error('设置单个会话推送通知方式失败', {
          conversationId: options.conversationId,
          conversationType: options.conversationType,
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
          conversationType: options.conversationType,
          durationMinutes,
          duration: options.rule.duration,
          currentUser: getCurrentUserId(),
          result,
        });
        return result;
      } catch (error) {
        console.error('设置单个会话免打扰时长失败', {
          conversationId: options.conversationId,
          conversationType: options.conversationType,
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
          conversationType: options.conversationType,
          currentUser: getCurrentUserId(),
          result,
        });
        return result;
      } catch (error) {
        console.error('清除单个会话推送通知方式失败', {
          conversationId: options.conversationId,
          conversationType: options.conversationType,
          currentUser: getCurrentUserId(),
          error,
        });
        throw error;
      }
    },
    //设置会话已读（发送会话已读回执。）
    clearConversationUnreadCount: async ({ state, commit }, params) => {
      if (!params || !params.conversationId || !params.conversationType) {
        console.error('clearConversationUnreadCount 参数错误:', params);
        return;
      }

      const { conversationId, conversationType } = params;

      try {
        await chatManager().clearConversationUnreadMessageCount({
          conversationId,
          conversationType,
        });
        commit('CLEAR_CONVERSATION_ITEM_UNREAD_COUNT', conversationId);
      } catch (error) {
        console.error('[Conversation] clearConversationUnreadCount failed', {
          conversationId,
          conversationType,
          error,
        });
      }
    },
    clearAllConversationUnreadMessageCount: async ({ commit }) => {
      try {
        await chatManager().clearAllConversationUnreadMessageCount();
        commit('CLEAR_ALL_CONVERSATION_UNREAD_COUNT');
        console.log('[Conversation] clearAllConversationUnreadMessageCount success', {
          currentUser: getCurrentUserId(),
        });
      } catch (error) {
        console.error('[Conversation] clearAllConversationUnreadMessageCount failed', {
          currentUser: getCurrentUserId(),
          error,
        });
        throw error;
      }
    },
    clearAllMessagesAndConversations: async ({ commit }) => {
      try {
        await chatManager().clearAllMessagesAndConversations();
        commit('CLEAR_ALL_CONVERSATIONS');
        commit('CLEAR_ALL_MESSAGES');
        console.log('[Conversation] clearAllMessagesAndConversations success', {
          currentUser: getCurrentUserId(),
        });
      } catch (error) {
        console.error('[Conversation] clearAllMessagesAndConversations failed', {
          currentUser: getCurrentUserId(),
          error,
        });
        throw error;
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
      // 仅群聊会话可调用 SDK 5.0 `Group.getDetail()`。聊天室应使用自己的公开 ChatRoom 详情 API，混用会触发 400：
      const groupConversationIds = _.chain(conversationList)
        .filter((item) => item.conversationType === CONVERSATION_TYPE.GROUP)
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
