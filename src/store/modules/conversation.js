import _ from 'lodash'
import { useLocalStorage } from '@vueuse/core'
import {
    createConversation,
    sortConversation,
    createInform,
} from '@/utils/handleSomeData'
import Message from './message'
import { EaseChatClient } from '@/IM/initwebsdk'
import { informType, messageType } from '@/constant'
const { INFORM_FROM } = informType
const { CHAT_TYPE } = messageType
const Conversation = {
    state: {
        informDetail: [],
        conversationListData: {},
    },
    mutations: {
    //初始化会话列表的数据（根据登陆的id取其对应的会话数据）
        INIT_CONVERSATION_STATE: (state) => {
            const storageId = EaseChatClient.user
            state.informDetail = useLocalStorage(`EASEIM_${storageId}_INFORM`, [])
            state.conversationListData = useLocalStorage(
                `EASEIM_${storageId}_conversationList`,
                {}
            )
        },
        //清空系统通知
        CLEAR_INFORM_LIST: (state) => {
            state.informDetail = []
        },
        //更新系统通知
        UPDATE_INFORM_LIST: (state, informBody) => {
            const toBeUpdateInform = _.assign([], state.informDetail)
            // let _index = toBeUpdateInform.findIndex(
            //   (v) => v.from === informBody.from
            // );
            // if (_index === -1) {
            //   toBeUpdateInform.unshift(informBody);
            // } else {
            //   toBeUpdateInform.splice(_index, 1);
            //   toBeUpdateInform.unshift(informBody);
            // }
            toBeUpdateInform.unshift(informBody)
            state.informDetail = toBeUpdateInform
        },
        //更新已有会话
        UPDATE_CONVERSATION_LIST: (state, payload) => {
            console.log('>>>>>>>开始更新会话', payload)
            const sortedData = sortConversation(
                _.assign(_.cloneDeep(state.conversationListData), payload)
            )
            state.conversationListData = sortedData
        },
        //删除某条会话
        DELETE_ONE_CONVERSATION: (state, key) => {
            console.log('>>>>>>>执行删除会话操作', key)
            const toUpdateConversation = _.assign({}, state.conversationListData)
            if (toUpdateConversation[key]) {
                delete toUpdateConversation[key]
            }
            console.log('删除后toUpdateConversation', toUpdateConversation)
            state.conversationListData = _.assign({}, toUpdateConversation)
        },
        //清除会话未读状态
        CLEAR_UNREAD_NUM: (state, key) => {
            state.conversationListData[key].unreadMessageNum = 0
        },
        //清除信息卡片未读
        CLEAR_UNTREATED_STATUS: (state, index) => {
            console.log('>>>>>执行清除卡片未读', index)
            state.informDetail[index].untreated = 0
        },
        //更改卡片消息的按钮状态
        UPDATE_INFORM_BTNSTATUS: (state, { index: index, btnStatus }) => {
            console.log('>>>>触发了按钮更新状态', index, btnStatus)
            state.informDetail[index].operationStatus = btnStatus
        },
    },
    actions: {
    //添加新系统通知
        createNewInform: ({ dispatch, commit }, params) => {
            const { fromType, informContent } = params
            console.log('>>>>>>>>>createNewInform', fromType, informContent)
            const result = createInform(fromType, informContent)
            commit('UPDATE_INFORM_LIST', result)

            //部分事件需要调用接口更新本地信息或者增加消息内系统通知
            if (fromType === INFORM_FROM.FRIEND) {
                const informMsg = {
                    from: informContent.from,
                    to: informContent.to,
                    chatType: CHAT_TYPE.SINGLE,
                }
                switch (informContent.type) {
                case 'other_person_agree':
                    {
                        //他人同意更新好友列表
                        console.log('>>>>>【other_person_agree】通知更新好友列表')
                        dispatch('fetchFriendList')
                    }

                    break
                case 'unsubscribed':
                    {
                        informMsg.msg = '你俩的友尽了，可重新发起好友申请'
                        dispatch('createInformMessage', informMsg)
                    }
                    break
                case 'subscribed':
                    {
                        informMsg.msg = '已成为你的好友,开始聊天吧'
                        dispatch('createInformMessage', informMsg)
                    }
                    break
                default:
                    break
                }
            }
            if (fromType === INFORM_FROM.GROUP) {
                const informMsg = {
                    from: informContent.from,
                    to: informContent.id,
                    chatType: CHAT_TYPE.GROUP,
                }
                switch (informContent.operation) {
                case 'memberPresence': //入群通知
                    {
                        commit('UPDATE_GROUP_INFOS', {
                            groupId: informContent.id,
                            type: 'addAffiliationsCount',
                        })
                        dispatch('fetchGoupsMember', informContent.id)
                        informMsg.msg = `${informContent.from}加入了群组`
                        dispatch('createInformMessage', informMsg)
                    }
                    break
                case 'memberAbsence':
                    {
                        //退群通知
                        commit('UPDATE_GROUP_INFOS', {
                            groupId: informContent.id,
                            type: 'delAffiliationsCount',
                        })
                        dispatch('fetchGoupsMember', informContent.id)
                        informMsg.msg = `${informContent.from}退出了群组`
                        dispatch('createInformMessage', informMsg)
                    }
                    break
                case 'updateAnnouncement':
                    {
                        //更新群公告
                        dispatch('fetchAnnounment', informContent.id)
                        informMsg.msg = `${informContent.from}更新了群组公告，去看看更新的什么吧~`
                        dispatch('createInformMessage', informMsg)
                    }
                    break
                case 'setAdmin':
                    {
                        dispatch('fetchGoupsAdmin', informContent.id)
                        informMsg.msg = `${informContent.from}设定${informContent.to}为管理员~`
                        dispatch('createInformMessage', informMsg)
                    }
                    break
                case 'removeAdmin':
                    {
                        dispatch('fetchGoupsAdmin', informContent.id)
                        informMsg.msg = `${informContent.from}移除了${informContent.to}的管理员身份~`
                        dispatch('createInformMessage', informMsg)
                    }
                    break
                case 'muteMember':
                    {
                        informMsg.msg = `${informContent.from}禁言了${
                            informContent.to ? informContent.to : '你'
                        }~`
                        dispatch('createInformMessage', informMsg)
                    }
                    break
                case 'unmuteMember':
                    {
                        informMsg.msg = `${informContent.from}取消了${
                            informContent.to ? informContent.to : '你'
                        }的禁言~`
                        dispatch('createInformMessage', informMsg)
                    }
                    break
                case 'removeMember':
                    {
                        informMsg.msg = `${informContent.from}将你移出了群组${informContent.id}~`
                        dispatch('createInformMessage', informMsg)
                        //执行删除会话
                        commit('DELETE_ONE_CONVERSATION', informContent.id)
                        //从群组列表中移除
                        commit('UPDATE_GROUP_LIST', {
                            type: 'deleteFromList',
                            groupId: informContent.id,
                        })
                    }
                    break
                case 'destroy':
                    {
                        informMsg.msg = `${informContent.from}解散了该群~`
                        dispatch('createInformMessage', informMsg)
                        setTimeout(() => {
                            dispatch('fetchGroupList', {
                                pageNum: 1,
                                pageSize: 500,
                            })
                        }, 300)
                    }
                    break
                case 'updateInfo':
                    {
                        informMsg.msg = `${informContent.from}更新了群组详情~`
                        dispatch('createInformMessage', informMsg)
                        dispatch('getAssignGroupDetail', informContent.id)
                    }
                    break
                case 'acceptRequest':
                    {
                        console.log('>>>>>>>收到了群组同意加入事件')
                        setTimeout(() => {
                            dispatch('fetchGroupList', {
                                pageNum: 1,
                                pageSize: 500,
                            })
                        }, 300)
                    }
                    break
                default:
                    break
                }
            }
            //memberPresence 群成员加入群组需要进行群组人数+1操作。
            // commit('UPDATE_GROUP_INFOS',{})
        },

        //收集会话依赖数据
        gatherConversation: ({ commit }, key) => {
            const corresMessage = _.cloneDeep(Message.state.messageList[key])
            const res = createConversation(corresMessage)
            commit('UPDATE_CONVERSATION_LIST', res)
        },
    },
}
export default Conversation
