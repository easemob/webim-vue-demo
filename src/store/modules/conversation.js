import _ from 'lodash';
import { useLocalStorage } from '@vueuse/core';
import { useConversation, useSortConversation } from '@/hooks';
import Message from './message';
const Conversation = {
  state: {
    informConversationData: useLocalStorage('INFORM', []),
    conversationListData: useLocalStorage('conversationList', {}),
  },
  mutations: {
    //更新已有会话
    UPDATE_CONVERSATION_LIST: (state, payload) => {
      console.log('>>>>>>>开始更新会话', payload);
      let sortedData = useSortConversation(
        _.assign(_.cloneDeep(state.conversationListData), payload)
      );
      state.conversationListData = sortedData;
      // console.log('>>>>>>待更新的数据', toBeUpdateData);
      // state.conversationListData = _.assign(
      //   _.cloneDeep(state.conversationListData),
      //   payload
      // );
    },
    //清除会话未读状态
    CLEAR_UNREAD_NUM: (state, key) => {
      console.log('>>>>>>执行清除未读', key);
      state.conversationListData[key].unreadMessageNum = 0;
    },
  },
  actions: {
    //收集会话依赖数据
    gatherConversation: ({ commit }, key) => {
      let corresMessage = _.cloneDeep(Message.state.messageList.value[key]);
      let res = useConversation(corresMessage);
      commit('UPDATE_CONVERSATION_LIST', res);
    },
  },
};
export default Conversation;
