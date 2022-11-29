import { EaseChatClient } from '@/IM/initwebsdk'
// import { useLocalStorage } from '@vueuse/core';
import { sortPinyinFriendItem, handlePresence } from '@/utils/handleSomeData'
import _ from 'lodash'
const Contacts = {
    state: {
    // friendList: useLocalStorage('friendList', {}),
        friendList: {},
        // groupList: useLocalStorage('groupList', {}),
        groupList: {},
        // sortedFriendList: useLocalStorage('sortedFriendList', {}),
        sortedFriendList: {},
        friendBlackList: [],
    },
    mutations: {
        SET_FRIEND_LIST: (state, payload) => {
            state.friendList = _.assign({}, payload)
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
        SET_SORDED_FRIEND_LIST: (state, payload) => {
            state.sortedFriendList = _.assign({}, payload)
        },
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
                        groupDetail: data,
                    }
                }
                console.log('>>>>>补充群详情', data)
            }
        },
        //示例优化方向--减少群组详情的调用，转为更新本地群组详情数据
        UPDATE_GROUP_INFOS: (state, payload) => {
            console.log('>>>>>>开始修改', payload)
            const { groupId, type, params } = payload
            //key(群id)，type（群详情对应要修改的字段）
            if (state.groupList[groupId] && state.groupList[groupId].groupDetail) {
                switch (type) {
                //修改群名
                case 'groupName':
                    {
                        console.log('>>>>>>进入群组名称修改')
                        state.groupList[groupId].groupDetail.name = params
                    }
                    break
                case 'groupDescription':
                    {
                        state.groupList[groupId].groupDetail.description = params
                    }
                    break
                case 'addAffiliationsCount':
                    {
                        state.groupList[groupId].groupDetail.affiliations_count =
                state.groupList[groupId].groupDetail.affiliations_count + 1
                    }
                    break
                case 'delAffiliationsCount':
                    {
                        state.groupList[groupId].groupDetail.affiliations_count =
                state.groupList[groupId].groupDetail.affiliations_count - 1
                    }
                    break
                default:
                    break
                }
            }
        },
        //示例优化方向--更改本地群组列表群名(或其他状态)
        UPDATE_GROUP_LIST: (state, payload) => {
            const { type, groupId, groupName } = payload
            if (type === 'updateGroupName') {
                console.log('>>>>>更新本地群组列表群名')
                state.groupList[groupId].groupname = groupName
            }
            if (type === 'deleteFromList') {
                console.log('>>>>>从本地群组列表中删除某个群')
                state.groupList[groupId] && delete state.groupList[groupId]
            }
        },
    },
    actions: {
    //获取好友列表
        fetchFriendList: async ({ dispatch, commit }) => {
            const friendListData = {}
            try {
                //获取好友列表
                const { data } = await EaseChatClient.getContacts()
                data.length > 0 &&
          data.map((item) => (friendListData[item] = { hxId: item }))
                //获取好友列表对应的用户属性
                const friendListWithInfos = await dispatch('getOtherUserInfo', data)
                //合并两对象
                const mergedFriendList = _.merge(friendListData, friendListWithInfos)
                //合并后的好友列表数据进行排序并单独提交处理
                const sortFriendList = sortPinyinFriendItem(mergedFriendList)
                commit('SET_SORDED_FRIEND_LIST', sortFriendList)
                commit('SET_FRIEND_LIST', mergedFriendList)
                //提交之后订阅好友状态
                dispatch('subFriendsPresence', data)
            } catch (error) {
                //异常一般为获取会话异常，直接提交好友列表
                commit('SET_FRIEND_LIST', friendListData)
                commit('SET_SORDED_FRIEND_LIST', sortFriendList)
                //提交之后订阅好友状态
                dispatch('subFriendsPresence', data)
            }
        },
        //获取黑名单列表
        fetchBlackList: async ({ dispatch, commit }, params) => {
            const { data } = await EaseChatClient.getBlocklist()
            data.length > 0 && commit('SET_BLACK_LIST', data)
        },
        //获取他人用户属性
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
                requestTask.push(EaseChatClient.fetchUserInfoById(userItem))
            )
                    const result = await Promise.all(requestTask)
                    const usersInfos = _.map(result, 'data')
                    usersInfos.length > 0 &&
            usersInfos.map(
                (item) => (usersInfosObj = Object.assign(usersInfosObj, item))
            )
                    resolve(usersInfosObj)
                } catch (error) {
                    reject(error)
                }
            })
        },
        //订阅好友的在线状态
        subFriendsPresence: async ({ commit }, users) => {
            const requestTask = []
            const usersArr = _.chunk([...users], 5) //分拆users 订阅好友状态一次不能超过100个
            try {
                usersArr.length > 0 &&
          usersArr.map((userItem) =>
              requestTask.push(
                  EaseChatClient.subscribePresence({
                      usernames: userItem,
                      expiry: 30 * 24 * 3600,
                  })
              )
          )
                const resultData = await Promise.all(requestTask)
                const usersPresenceList = _.flattenDeep(_.map(resultData, 'result')) //返回值是个二维数组，flattenDeep处理为一维数组
                const tobeCommitRes =
          usersPresenceList.length > 0 &&
          usersPresenceList.filter((p) => p.uid !== '')
                console.log('resultData', resultData)
                commit('SET_FRIEND_PRESENCE', tobeCommitRes)
            } catch (error) {
                console.log('>>>>>>订阅失败', error)
            }
        },
        //取消订阅
        unsubFriendsPresence: async ({ commit }, user) => {
            const option = {
                usernames: [...user],
            }
            EaseChatClient.unsubscribePresence(option).then((res) => {
                console.log('>>>>>>>成功取消订阅', res)
            })
        },
        //获取群组列表
        fetchGroupList: async ({ commit }, params) => {
            const res = await EaseChatClient.getJoinedGroups({
                // needAffiliations: true,
                // needRole: true,
                ...params,
            })
            const goupListData = _.keyBy(res.data, 'groupid')
            commit('SET_GROUP_LIST', { setType: 'init', data: goupListData })
            console.log('>>>>>触发了拉取群组列表更新')
        },
        //获取指定群详情
        getAssignGroupDetail: async ({ dispatch, commit }, goupsId) => {
            const options = {
                groupId: goupsId, // 群组id
            }
            const result = await EaseChatClient.getGroupInfo(options)
            // console.log('>>>>>>>群详情获取成功result', result);
            result.data &&
        commit('SET_GROUP_LIST', {
            setType: 'replenish',
            data: result.data[0],
        })
        },
    },
}

export default Contacts
