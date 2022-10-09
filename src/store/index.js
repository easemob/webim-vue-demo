import { createStore } from 'vuex'
import EaseIM from '@/IM/initwebsdk'
import Conversation from './modules/conversation'
import Contacts from './modules/contacts'
import Message from './modules/message'
import Groups from './modules/goups'
export default createStore({
    state: {
        loginState: false,
        networkStatus: true,
        isShowWarningTips: true,
        loginUserInfo: {
            hxId: '',
            nickname: '',
            avatarurl:
        'https://download-sdk.oss-cn-beijing.aliyuncs.com/downloads/IMDemo/avatar/Image5.png',
        },
        loginUserOnlineStatus: '',
    },
    getters: {
        loginUserInfo: (state) => state.loginUserInfo,
        loginUserOnlineStatus: (state) => state.loginUserOnlineStatus,
    },
    mutations: {
        CLOSE_WARNING_TIPS: (state) => (state.isShowWarningTips = false),
        CHANGE_LOGIN_STATUS: (state, status) => {
            state.loginState = status
        },
        CHANGE_NETWORK_STATUS: (state, status) => {
            state.networkStatus = status
        },

        SET_LOGIN_USER_INFO: (state, infos) => {
            state.loginUserInfo = Object.assign(state.loginUserInfo, infos)
        },
        SET_LOGIN_USER_ONLINE_STATUS: (state, payload) => {
            console.log('payload', payload)
            state.loginUserOnlineStatus = payload
        },
    },
    actions: {
    //获取登陆用户的用户属性
        getMyUserInfo: async ({ commit }, userId) => {
            const { data } = await EaseIM.conn.fetchUserInfoById(userId)
            data[userId].hxId = userId
            commit('SET_LOGIN_USER_INFO', data[userId])
        },
        //修改登陆用户的用户属性
        updateMyUserInfo: async ({ commit }, params) => {
            const { data } = await EaseIM.conn.updateUserInfo({ ...params })
            console.log('>>>>>>修改成功', data)
            commit('SET_LOGIN_USER_INFO', data)
        },
        //处理在线状态订阅变更（包含他人的用户状态）
        handlePresenceChanges: ({ commit }, status) => {
            const { userId, ext: statusType } = status || {}
            if (userId === EaseIM.conn.user) {
                commit(
                    'SET_LOGIN_USER_ONLINE_STATUS',
                    statusType ? statusType : 'Unset'
                )
            } else {
                console.log('>>>>>>不是自己的状态')

                commit('SET_FRIEND_PRESENCE', [{ ...status }])
            }
        },
    },
    modules: {
        Conversation,
        Contacts,
        Message,
        Groups,
    },
})
