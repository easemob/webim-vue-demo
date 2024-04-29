import { EMClient } from '@/IM'
// import { useLocalStorage } from '@vueuse/core';
import { sortPinyinFriendItem, handlePresence } from '@/utils/handleSomeData'
import _ from 'lodash'
const Contacts = {
    state: {
        friendList: {}, //legacy
        groupList: {}, //legacy
        contactsWithRemarkMap: new Map(),
        contactsUserInfosMap: new Map(),
        contactsUsersPresenceMap: new Map(),
        friendBlackList: []
    },
    mutations: {
        SET_FRIEND_LIST: (state, payload) => {
            state.friendList = _.assign({}, payload)
        },
        SET_ADD_NEW_FRIEND: (state, payload) => {
            state.friendList = _.assign(state.friendList, payload)
        },
        SET_FRIEND_LIST_WITH_REMARK: (state, payload) => {
            const { friendList } = payload
            const toObj = _.keyBy(friendList, 'userId')
            const toMap = new Map(Object.entries(toObj))
            state.contactsWithRemarkMap = toMap
        },
        SET_FRIEND_LIST_USER_INFOS: (state, payload) => {
            const { userInfos } = payload
            const userInfosToMap = new Map(Object.entries(userInfos))

            if (state.contactsUserInfosMap.size === 0) {
                state.contactsUserInfosMap = userInfosToMap
            } else {
                state.contactsUserInfosMap = new Map([
                    ...state.contactsUserInfosMap,
                    ...userInfosToMap
                ])
            }
        },
        DELETE_CONTACTS_FROM_MAP: (state, payload) => {
            state.contactsWithRemarkMap.has(payload) &&
                state.contactsWithRemarkMap.delete(payload)
            state.contactsUserInfosMap.has(payload) &&
                state.contactsUserInfosMap.delete(payload)
        },
        SET_BLACK_LIST: (state, payload) => {
            state.friendBlackList = _.assign([], payload)
        },
        SET_FRIEND_PRESENCE: (state, status) => {
            const friendList = state.friendList
            status.length > 0 &&
                status.forEach((item) => {
                    const commonStatus = handlePresence(item)
                    if (friendList[commonStatus.uid]) {
                        friendList[commonStatus.uid].userStatus = commonStatus
                    }
                })
        },
        //legacy
        SET_GROUP_LIST: (state, payload) => {
            //init 为初始化获取 replenish 补充群列表（包括补充群详情）
            const { setType, data } = payload
            if (setType === 'init') {
                state.groupList = _.assign({}, data)
            }
            if (setType === 'replenish') {
                const { id, name, disabled } = data
                if (state.groupList[id]) {
                    state.groupList[id].groupDetail = data
                } else {
                    state.groupList[id] = {
                        groupid: id,
                        groupname: name,
                        disabled: disabled,
                        groupDetail: data
                    }
                }
            }
        },
        //示例优化方向--减少群组详情的调用，转为更新本地群组详情数据 //legacy
        UPDATE_GROUP_INFOS: (state, payload) => {
            const { groupId, type, params } = payload
            //key(群id)，type（群详情对应要修改的字段）
            if (
                state.groupList[groupId] &&
                state.groupList[groupId].groupDetail
            ) {
                switch (type) {
                    //修改群名
                    case 'groupName':
                        {
                            state.groupList[groupId].groupDetail.name = params
                        }
                        break
                    case 'groupDescription':
                        {
                            state.groupList[groupId].groupDetail.description =
                                params
                        }
                        break
                    case 'addAffiliationsCount':
                        {
                            state.groupList[
                                groupId
                            ].groupDetail.affiliations_count =
                                state.groupList[groupId].groupDetail
                                    .affiliations_count + 1
                        }
                        break
                    case 'delAffiliationsCount':
                        {
                            state.groupList[
                                groupId
                            ].groupDetail.affiliations_count =
                                state.groupList[groupId].groupDetail
                                    .affiliations_count - 1
                        }
                        break
                    default:
                        break
                }
            }
        },
        //示例优化方向--更改本地群组列表群名(或其他状态) //legacy
        UPDATE_GROUP_LIST: (state, payload) => {
            const { type, groupId, groupName } = payload
            if (type === 'updateGroupName') {
                state.groupList[groupId].groupname = groupName
            }
            if (type === 'deleteFromList') {
                state.groupList[groupId] && delete state.groupList[groupId]
            }
        }
    },
    actions: {
        //获取好友列表
        fetchAllFriendListFromServer: async ({ dispatch, commit }) => {
            const friendListData = {}
            try {
                //获取好友列表
                const { data } = await EMClient.getContacts()
                data.length > 0 &&
                    data.map((item) => (friendListData[item] = { hxId: item }))
                //获取好友列表对应的用户属性
                const friendListWithInfos = await dispatch(
                    'getOtherUserInfo',
                    data
                )
                //合并两对象
                const mergedFriendList = _.merge(
                    friendListData,
                    friendListWithInfos
                )
                commit('SET_FRIEND_LIST', mergedFriendList)
                //提交之后订阅好友状态
                dispatch('subFriendsPresence', data)
            } catch (error) {
                //异常一般为获取会话异常，直接提交好友列表
                commit('SET_FRIEND_LIST', friendListData)
                //提交之后订阅好友状态
                dispatch('subFriendsPresence', data)
            }
        },
        //获取全部好友列表（包含好友备注）
        fetchAllContactsListWithRemarkFromServer: async ({
            dispatch,
            commit
        }) => {
            try {
                //获取好友列表
                const { data } = await EMClient.getAllContacts()
                console.log('>>>>>获取全部好友列表', data)
                if (data?.length > 0) {
                    commit('SET_FRIEND_LIST_WITH_REMARK', {
                        friendList: { ...data }
                    })
                }
                const userIds = _.map(data, 'userId')
                dispatch('fetchContactsUserInfos', userIds)
            } catch (error) {
                console.error('好友列表获取失败', error)
            }
        },
        //新增联系人
        onAddedNewFriend: async ({ dispatch, commit }, params) => {
            const { from: userId } = params
            const friendData = {}
            friendData[userId] = { hxId: userId }
            try {
                const newfriendInfos = await dispatch('getOtherUserInfo', [
                    userId
                ])

                _.merge(friendData, newfriendInfos)
                commit('SET_ADD_NEW_FRIEND', friendData)
            } catch (error) {}
            //订阅新增联系人
            dispatch('subFriendsPresence', [userId])
        },
        //好友关系解除
        onDeleteFriend: async ({ dispatch, commit }, params) => {
            //取消订阅好友状态。
            const { from: userId } = params
            dispatch('unsubFriendsPresence', [userId])
            //从本地好友列表中删除此好友
            commit('DELETE_CONTACTS_FROM_MAP', userId)
        },
        //获取黑名单列表
        fetchBlackList: async ({ dispatch, commit }, params) => {
            try {
                const { data } = await EMClient.getBlocklist()
                commit('SET_BLACK_LIST', data)
            } catch (error) {
                console.error('获取黑名单列表失败', error)
            }
        },
        //获取他人用户属性 //legacy
        getOtherUserInfo: async ({ commit }, users) => {
            /**
             * @param {String|Array} users - 用户id
             */

            return new Promise(async (resolve, reject) => {
                let usersInfosObj = {}
                const requestTask = []
                const usersArr = _.chunk([...users], 99) //分拆users 用户属性获取一次不能超过100个
                try {
                    usersArr.length > 0 &&
                        usersArr.map((userItem) =>
                            requestTask.push(
                                EMClient.fetchUserInfoById(userItem)
                            )
                        )
                    const result = await Promise.all(requestTask)
                    const usersInfos = _.map(result, 'data')
                    usersInfos.length > 0 &&
                        usersInfos.map(
                            (item) =>
                                (usersInfosObj = Object.assign(
                                    usersInfosObj,
                                    item
                                ))
                        )
                    resolve(usersInfosObj)
                } catch (error) {
                    reject(error)
                }
            })
        },
        //获取联系人用户属性
        fetchContactsUserInfos: async ({ commit }, users) => {
            /**
             * @param {String|Array} users - 用户id
             */
            let usersInfosObj = {}
            const requestTask = []
            const usersArr = _.chunk([...users], 99) //分拆users 用户属性获取一次不能超过100个
            try {
                usersArr.length > 0 &&
                    usersArr.map((userItem) =>
                        requestTask.push(EMClient.fetchUserInfoById(userItem))
                    )
                const result = await Promise.all(requestTask)
                const usersInfos = _.map(result, 'data')
                usersInfos.length > 0 &&
                    usersInfos.map(
                        (item) =>
                            (usersInfosObj = Object.assign(usersInfosObj, item))
                    )

                commit('SET_FRIEND_LIST_USER_INFOS', {
                    userInfos: usersInfosObj
                })
            } catch (error) {
                console.error('>>>获取联系人用户属性失败', error)
            }
        },
        //订阅好友的在线状态
        subFriendsPresence: async ({ commit }, users) => {
            const requestTask = []
            const usersArr = _.chunk([...users], 100) //分拆users 订阅好友状态一次不能超过100个
            try {
                usersArr.length > 0 &&
                    usersArr.map((userItem) =>
                        requestTask.push(
                            EMClient.subscribePresence({
                                usernames: userItem,
                                expiry: 30 * 24 * 3600
                            })
                        )
                    )
                const resultData = await Promise.all(requestTask)
                const usersPresenceList = _.flattenDeep(
                    _.map(resultData, 'result')
                ) //返回值是个二维数组，flattenDeep处理为一维数组
                const tobeCommitRes =
                    usersPresenceList.length > 0 &&
                    usersPresenceList.filter((p) => p.uid !== '')

                commit('SET_FRIEND_PRESENCE', tobeCommitRes)
            } catch (error) {}
        },
        //取消订阅
        unsubFriendsPresence: async ({ commit }, user) => {
            const option = {
                usernames: [...user]
            }
            EMClient.unsubscribePresence(option).then((res) => {})
        },
        //获取群组列表 //legacy
        fetchGroupList: async ({ dispatch, commit }, params) => {
            const res = await EMClient.getJoinedGroups({
                // needAffiliations: true,
                // needRole: true,
                ...params
            })
            const goupListData = _.keyBy(res.data, 'groupid')
            const groupIdList = _.map(res.data, 'groupid')
            dispatch('fetchGroupDetailFromServer', groupIdList)
            commit('SET_GROUP_LIST', { setType: 'init', data: goupListData })
        },
        //获取指定群详情 //legacy
        getAssignGroupDetail: async ({ dispatch, commit }, goupsId) => {
            const options = {
                groupId: goupsId // 群组id
            }
            const result = await EMClient.getGroupInfo(options)
            //
            result.data &&
                commit('SET_GROUP_LIST', {
                    setType: 'replenish',
                    data: result.data[0]
                })
        }
    },
    getters: {
        //返回排序后的好友列表
        //legacy
        sortedFriendList: (state) => {
            console.log(state.friendList)
            return sortPinyinFriendItem(state.friendList)
        },
        //获取基础好友列表 //legacy
        getFriendList: (state) => {
            return state.friendList
        },
        getContactsUserInfosMap: (state) => {
            return state.contactsUserInfosMap
        },
        getContactsWithRemarkMap: (state) => {
            return state.contactsWithRemarkMap
        }
    }
}

export default Contacts
