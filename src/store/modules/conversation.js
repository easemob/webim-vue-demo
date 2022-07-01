import _ from 'lodash';
import { useLocalStorage } from '@vueuse/core';
import { useConversation, useSortConversation, useInform } from '@/hooks';
import Message from './message';
const Conversation = {
  state: {
    informDetail: useLocalStorage('INFORM', []),
    conversationListData: useLocalStorage('conversationList', {}),
  },
  mutations: {
    //更新系统通知
    UPDATE_INFOEM_LIST: (state, informBody) => {
      const toBeUpdateInform = _.assign([], state.informDetail);
      let _index = toBeUpdateInform.findIndex(
        (v) => v.from === informBody.from
      );
      if (_index === -1) {
        toBeUpdateInform.unshift(informBody);
      } else {
        toBeUpdateInform.splice(_index, 1);
        toBeUpdateInform.unshift(informBody);
      }
      state.informDetail = toBeUpdateInform;
    },
    //更新已有会话
    UPDATE_CONVERSATION_LIST: (state, payload) => {
      console.log('>>>>>>>开始更新会话', payload);
      let sortedData = useSortConversation(
        _.assign(_.cloneDeep(state.conversationListData), payload)
      );
      console.log('?????????sortedData', sortedData);
      state.conversationListData = sortedData;
    },
    //删除某条会话
    DELETE_ONE_CONVERSATION: (state, key) => {
      if (state.conversationListData[key]) {
        delete state.conversationListData[key];
      }
    },
    //清除会话未读状态
    CLEAR_UNREAD_NUM: (state, key) => {
      state.conversationListData[key].unreadMessageNum = 0;
    },
    //清除信息卡片未读
    CLEAR_UNTREATED_STATUS: (state, index) => {
      console.log('>>>>>执行清除卡片未读', index);
      state.informDetail[index].untreated = 0;
    },
    //更改卡片消息的按钮状态
    UPDATE_INFORM_BTNSTATUS: (state, { index: index, status }) => {
      state.informDetail[index].operationStatus = status;
    },
  },
  actions: {
    //添加新系统通知
    createNewInform: ({ commit }, params) => {
      const { fromType, informContent } = params;
      let result = useInform(fromType, informContent);
      commit('UPDATE_INFOEM_LIST', result);
    },

    //收集会话依赖数据
    gatherConversation: ({ commit }, key) => {
      let corresMessage = _.cloneDeep(Message.state.messageList.value[key]);
      let res = useConversation(corresMessage);
      commit('UPDATE_CONVERSATION_LIST', res);
    },
  },
};
export default Conversation;
