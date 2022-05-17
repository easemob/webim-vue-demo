import { useLocalStorage } from '@vueuse/core';
import conversation from '@/mock/conversation';
const Conversation = {
  state: {
    informConversationData: useLocalStorage('INFORM', []),
    conversationListData: useLocalStorage('conversationList', conversation),
  },
  mutations: {
    //更新已有会话
    UPDATE_CONVERSATION_LIST: (state, payload) => {
      console.log('payload', payload);
      state.conversationListData.push(payload);
    },
  },
  actions: {
    createNewConversation: ({ commit }, params) => {
      commit('UPDATE_CONVERSATION_LIST', params);
      console.log('>>>>>创建一条新会话', params);
    },
  },
  getters: {},
};
export default Conversation;
