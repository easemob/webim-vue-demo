import _ from 'lodash';
import { useLocalStorage } from '@vueuse/core';
import {
  createConversation,
  sortConversation,
  createInform,
} from '@/utils/handleSomeData';
import Message from './message';
import EaseIM from '@/IM/initwebsdk';
import { informType } from '@/constant';
const { INFORM_FROM, INFORM_TYPE } = informType;
const Conversation = {
  state: {
    informDetail: [],
    conversationListData: {},
  },
  mutations: {
    //初始化会话列表的数据（根据登陆的id取其对应的会话数据）
    INIT_CONVERSATION_STATE: (state) => {
      const storageId = EaseIM.conn.user;
      state.informDetail = useLocalStorage(`EASEIM_${storageId}_INFORM`, []);
      state.conversationListData = useLocalStorage(
        `EASEIM_${storageId}_conversationList`,
        {}
      );
    },
    //清空系统通知
    CLEAR_INFORM_LIST: (state) => {
      state.informDetail = [];
    },
    //更新系统通知
    UPDATE_INFORM_LIST: (state, informBody) => {
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
      let sortedData = sortConversation(
        _.assign(_.cloneDeep(state.conversationListData), payload)
      );
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
    createNewInform: ({ dispatch, commit }, params) => {
      const { fromType, informContent } = params;
      console.log('>>>>>>>>>createNewInform', fromType, informContent);
      let result = createInform(fromType, informContent);
      commit('UPDATE_INFORM_LIST', result);
      //部分事件需要调用接口更新本地信息
      if (fromType === INFORM_FROM.FRIEND) {
        switch (informContent.type) {
          case 'other_person_agree':
            {
              //他人同意更新好友列表
              console.log('>>>>>【other_person_agree】通知更新好友列表');
              dispatch('fetchFriendList');
            }

            break;

          default:
            break;
        }
      }
      if (fromType === INFORM_FROM.GROUP) {
        switch (informContent.operation) {
          case 'memberPresence': //入群通知
            {
              commit('UPDATE_GROUP_INFOS', {
                groupId: informContent.id,
                type: 'addAffiliationsCount',
              });
              dispatch('fetchGoupsMember', informContent.id);
            }
            break;
          case 'memberAbsence': {
            //退群通知
            commit('UPDATE_GROUP_INFOS', {
              groupId: informContent.id,
              type: 'delAffiliationsCount',
            });
            dispatch('fetchGoupsMember', informContent.id);
          }
          default:
            break;
        }
      }
      //memberPresence 群成员加入群组需要进行群组人数+1操作。
      // commit('UPDATE_GROUP_INFOS',{})
    },

    //收集会话依赖数据
    gatherConversation: ({ commit }, key) => {
      let corresMessage = _.cloneDeep(Message.state.messageList.value[key]);
      let res = createConversation(corresMessage);
      commit('UPDATE_CONVERSATION_LIST', res);
    },
  },
};
export default Conversation;
