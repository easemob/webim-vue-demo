import _ from 'lodash'
import { useLocalStorage } from '@vueuse/core'
import {
    createInform,
    checkLastMsgIsHasMention
} from '@/utils/handleSomeData/index'
import { EMClient } from '@/IM'
import { informType, messageType } from '@/constant'
const { INFORM_FROM } = informType
const { CHAT_TYPE } = messageType
const Conversation = {
    state: {
        informDetail: [],
        conversationListFromLocal: []
    },
    mutations: {
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
        //获取会话列表
        GET_CONVERSATION_LIST_FROM_LOCAL: (state, payload) => {
            state.conversationListFromLocal = payload
        },
        //更新本地缓存的会话列表数据
        UPDATE_CONVERSATION_LIST_FROM_LOCAL: (state, conversationItem) => {
            const _index = state.conversationListFromLocal.findIndex(
                (c) => c.conversationId === conversationItem.conversationId
            )
            if (_index > -1) {
                state.conversationListFromLocal.splice(_index, 1)
                state.conversationListFromLocal.unshift(conversationItem)
            } else {
                state.conversationListFromLocal.unshift(conversationItem)
            }
        },
        //删除某条会话
        DELETE_CONVERSATION_ITEM_FROM_LOCAL: (state, conversationId) => {
            const _index = state.conversationListFromLocal.findIndex(
                (v) => v.conversationId === conversationId
            )
            if (_index > -1) {
                state.conversationListFromLocal.splice(_index, 1)
            }
        },
        //清除会话未读状态
        CLEAR_CONVERSATION_ITEM_UNREAD_COUNT: (state, conversationId) => {
            state.conversationListFromLocal.forEach((conversationItem) => {
                if (conversationItem.conversationId === conversationId) {
                    conversationItem.unReadCount = 0
                }
            })
        },
        //清除会话@状态
        CLEAR_CONVERSATION_ITEM_MENTION_STATUS: (state, conversationId) => {
            state.conversationListFromLocal.map((conversationItem) => {
                if (conversationItem.conversationId === conversationId) {
                    conversationItem.customField.mention = false
                }
            })
        },
        //清除信息卡片未读
        CLEAR_UNTREATED_STATUS: (state, index) => {
            state.informDetail[index].untreated = 0
        },
        //更改卡片消息的按钮状态
        UPDATE_INFORM_BTNSTATUS: (state, { index: index, btnStatus }) => {
            state.informDetail[index].operationStatus = btnStatus
        }
    },
    actions: {
        //添加新系统通知
        createNewInform: ({ dispatch, commit }, params) => {
            const { fromType, informContent } = params

            const result = createInform(fromType, informContent)
            commit('UPDATE_INFORM_LIST', result)

            //部分事件需要调用接口更新本地信息或者增加消息内系统通知
            if (fromType === INFORM_FROM.FRIEND) {
                const informMsg = {
                    from: informContent.from,
                    to: informContent.to,
                    chatType: CHAT_TYPE.SINGLE
                }
                switch (informContent.type) {
                    case 'unsubscribed':
                        {
                            informMsg.msg = '你俩的友尽了，可重新发起好友申请'
                            dispatch('createInformMessage', informMsg)
                        }
                        break
                    case 'subscribed':
                        {
                            informMsg.msg = '你们已成为你的好友,开始聊天吧'
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
                    chatType: CHAT_TYPE.GROUP
                }
                switch (informContent.operation) {
                    case 'memberPresence': //入群通知
                        {
                            commit('UPDATE_GROUP_INFOS', {
                                groupId: informContent.id,
                                type: 'addAffiliationsCount'
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
                                type: 'delAffiliationsCount'
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
                                groupId: informContent.id
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
                                    pageSize: 500
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
                            setTimeout(() => {
                                dispatch('fetchGroupList', {
                                    pageNum: 1,
                                    pageSize: 500
                                })
                            }, 300)
                        }
                        break
                    case 'memberAttributesUpdate':
                        {
                            informMsg.msg = `${informContent.from}修改群内昵称为【${informContent?.attributes?.nickName}】`
                            dispatch('createInformMessage', informMsg)
                            commit('SET_GROUP_MEMBERS_INFO', {
                                groupId: informContent.id,
                                inGroupInfo: [
                                    {
                                        [informContent.from]: {
                                            nickName:
                                                informContent?.attributes
                                                    ?.nickName
                                        }
                                    }
                                ]
                            })
                        }
                        break
                    default:
                        break
                }
            }
            //memberPresence 群成员加入群组需要进行群组人数+1操作。
            // commit('UPDATE_GROUP_INFOS',{})
        },
        //从本地加载会话列表数据
        getConversationListFromLocal: async ({ commit }, params) => {
            try {
                const result = await EMClient.localCache.getLocalConversations()

                if (result.data.length) {
                    commit('GET_CONVERSATION_LIST_FROM_LOCAL', [...result.data])
                } else {
                    //默认只取50条远端数据数据，实际可自行加载更多。
                    const result = await EMClient.getServerConversations({
                        pageSize: 50,
                        cursor: ''
                    })
                    if (result.data?.conversations?.length) {
                        commit('GET_CONVERSATION_LIST_FROM_LOCAL', [
                            ...result.data.conversations
                        ])
                    }
                }
            } catch (error) {}
        },
        //更新会话列表
        updateLocalConversation: async ({ dispatch, commit }, params) => {
            const { conversationId, chatType } = params

            try {
                const result = await EMClient.localCache.getLocalConversation({
                    conversationId,
                    conversationType: chatType
                })

                const toBeUpdateConversationItem = { ...result?.data }
                //检查更新的lastmsg中是否包含提及
                const isMention = toBeUpdateConversationItem?.customField
                    ?.mention
                    ? true
                    : checkLastMsgIsHasMention(
                          toBeUpdateConversationItem.lastMessage
                      )
                const customField = (toBeUpdateConversationItem.customField && {
                    ...toBeUpdateConversationItem.customField,
                    mention: isMention
                }) || { mention: isMention }
                //设置会话级别提及状态clear
                await dispatch('setLocalConversationCustomAttributes', {
                    conversationId,
                    conversationType: chatType,
                    customField: customField
                })
                toBeUpdateConversationItem.customField = { ...customField }
                commit('UPDATE_CONVERSATION_LIST_FROM_LOCAL', {
                    ...toBeUpdateConversationItem
                })
            } catch (error) {}
        },
        //删除会话列表（本地以及远端）
        removeLocalConversation: async ({ dispatch, commit }, params) => {
            const { conversationId, conversationType } = params
            const options = {
                // 会话 ID：单聊为对方的用户 ID，群聊为群组 ID。
                channel: conversationId,
                // 会话类型：（默认） `singleChat`：单聊；`groupChat`：群聊。
                chatType: conversationType,
                // 删除会话时是否同时删除服务端漫游消息。
                deleteRoam: false
            }
            try {
                //会话列表删除时，需要先删除远端会话列表，再删除本地数据库，这样跨端获取会话列表才能同步。
                await EMClient.deleteConversation(options)
                //删除本地数据库数据
                await EMClient.localCache.removeLocalConversation({
                    conversationId,
                    conversationType
                })
                commit('DELETE_CONVERSATION_ITEM_FROM_LOCAL', conversationId)
            } catch (error) {}
        },
        //设置会话已读（发送会话已读回执。）
        clearConversationUnreadCount: async ({ dispatch, commit }, params) => {
            const { conversationId, chatType } = params

            const option = {
                chatType: chatType, // 会话类型，设置为单聊。
                type: 'channel', // 消息类型。
                to: conversationId // 接收消息对象的用户 ID。
            }
            try {
                //只有发送了会话已读回执远端服务器的会话未读数才会清空。
                const msg = EMClient.Message.create(option)
                const res = await EMClient.send(msg)

                //同步清空本地数据库未读数。
                await EMClient.localCache.clearConversationUnreadCount({
                    conversationId,
                    conversationType: chatType
                })
                //通知更新缓存中的会话未读数。
                commit('CLEAR_CONVERSATION_ITEM_UNREAD_COUNT', conversationId)
            } catch (error) {}
        },
        //清除会话@提及状态
        clearConversationMention: async ({ dispatch, commit }, params) => {
            const { conversationId, conversationType, customField } = params
            customField.mention = false
            try {
                await EMClient.localCache.setLocalConversationCustomField({
                    conversationId,
                    conversationType,
                    customField: { ...customField }
                })
                commit('CLEAR_CONVERSATION_ITEM_MENTION_STATUS', conversationId)
            } catch (error) {}
        },
        //设置本地会话自定义属性
        setLocalConversationCustomAttributes: async (
            { dispatch, commit },
            params
        ) => {
            const { conversationId, conversationType, customField } = params
            try {
                await EMClient.localCache.setLocalConversationCustomField({
                    conversationId,
                    conversationType,
                    customField: { ...customField }
                })
            } catch (error) {}
        }
    },
    getters: {
        conversationListFromLocal: (state) => state.conversationListFromLocal
    }
}
export default Conversation
