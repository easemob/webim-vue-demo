import { checkTagEmits, ElMessage } from 'element-plus'
import { EMClient } from '@/IM'

const Groups = {
    state: {
        groupsInfos: {},
        joinedGroup: {
            pagingParams: {
                pageNum: 0,
                pageSize: 20
            },
            joinedGroupList: [],
            joinedGroupListTotal: 0
        },
        groupDetails: new Map(), //key:groupId value:groupDetail
        groupMembers: new Map() //key:groupId value:groupMemberList
    },
    mutations: {
        SET_JOINED_GROUP: (state, payload) => {
            const { total, entities: joinedGroupList } = payload
            state.joinedGroup.pagingParams.pageNum++
            state.joinedGroup.joinedGroupListTotal = total
            state.joinedGroup.joinedGroupList = [
                ...state.joinedGroup.joinedGroupList,
                ...joinedGroupList
            ]
        },
        SET_GROUP_DETAILS: (state, payload) => {
            const { groupDetailsList } = payload
            groupDetailsList.length > 0 &&
                groupDetailsList.forEach((groupDetail) => {
                    state.groupDetails.set(groupDetail.id, groupDetail)
                })
        },
        SET_GORUPS_ADMINS: (state, payload) => {
            const { groupId, admin } = payload
            if (!state.groupsInfos[groupId]) {
                state.groupsInfos[groupId] = {}
            }
            state.groupsInfos[groupId].admin = admin
        },
        SET_GOUPS_MEMBERS: (state, payload) => {
            const { groupId, members } = payload
            state.groupMembers.set(groupId, [...members])
            //同步更新群组列表里面的群人数
            if (state.joinedGroup.joinedGroupList.length) {
                state.joinedGroup.joinedGroupList.map((groupItem) => {
                    if (groupItem.groupId === groupId) {
                        groupItem.affiliationsCount = members.length
                    }
                })
            }
        },
        SET_GROUPS_BLIACK_LIST: (state, payload) => {
            const { groupId, blacklist } = payload
            if (!state.groupDetails.has(groupId)) {
                state.groupDetails.set(groupId, { blacklist })
            }
            state.groupDetails.get(groupId).blacklist = blacklist
        },
        SET_GOUPS_MUTE_LIST: (state, payload) => {
            const { groupId, mutelist } = payload
            if (!state.groupDetails.has(groupId)) {
                state.groupDetails.set(groupId, { mutelist })
            }
            state.groupDetails.get(groupId).mutelist = mutelist
        },
        SET_GOUPS_ANNOUN: (state, payload) => {
            const { groupId, announcement } = payload
            if (!state.groupDetails.has(groupId)) {
                state.groupDetails.set(groupId, { announcement: announcement })
            }
            state.groupDetails.get(groupId).announcement = announcement
        },
        //设置用户在群组中的群组属性
        SET_GROUP_MEMBERS_INFO: (state, payload) => {
            const { groupId, inGroupInfo } = payload
            let groupMemberInfo = {}
            inGroupInfo.length > 0 &&
                inGroupInfo.map(
                    (item) =>
                        (groupMemberInfo = Object.assign(groupMemberInfo, item))
                )
            if (!state.groupsInfos[groupId]) {
                state.groupsInfos[groupId] = {}
            }
            state.groupsInfos[groupId].groupMemberInfo = _.assign(
                state.groupsInfos[groupId].groupMemberInfo,
                groupMemberInfo
            )
        },
        //更新本地缓存群组信息
        UPDATE_CACHE_GROUP_INFO: (state, payload) => {
            const { groupId, type, params } = payload
            console.log('>>>>>执行更新', payload)
            //更新群组列表内数据
            if (type === 'groupName') {
                state.joinedGroup.joinedGroupList.length > 0 &&
                    state.joinedGroup.joinedGroupList.map((groupItem) => {
                        if (groupItem.groupId === groupId) {
                            groupItem.groupName = params
                        }
                    })
                state.groupDetails.get(groupId).name = params
            }
            //更新群组详情内的数据
            if (type === 'groupDescription') {
                state.joinedGroup.joinedGroupList.length > 0 &&
                    state.joinedGroup.joinedGroupList.map((groupItem) => {
                        if (groupItem.groupId === groupId) {
                            groupItem.description = params
                        }
                    })
                state.groupDetails.get(groupId).description = params
            }
        }
    },
    actions: {
        //从服务端获取加入的群组列表
        fetchJoinedGroupListFromServer: async ({ state, commit }) => {
            const {
                pagingParams: { pageNum, pageSize }
            } = state.joinedGroup
            try {
                const { total, entities } = await EMClient.getJoinedGroups({
                    pageNum: pageNum,
                    pageSize: pageSize,
                    needAffiliations: true,
                    needRole: true
                })
                if (entities?.length === 0) return
                commit('SET_JOINED_GROUP', { total, entities })
            } catch (error) {
                console.error('加入的群组列表获取失败', error)
            }
        },
        //从服务端获取群组详情
        fetchGroupDetailFromServer: async ({ commit }, groupIds = []) => {
            if (groupIds.length === 0) throw new Error('群组id不能为空')
            let groupDetails = []
            async function fetchDetailsForGroupIds(groupIdArray) {
                try {
                    const result = await EMClient.getGroupInfo({
                        groupId: groupIdArray
                    })
                    groupDetails = groupDetails.concat(result.data)
                    commit('SET_GROUP_DETAILS', {
                        groupDetailsList: groupDetails
                    })
                } catch (error) {
                    console.error('>>>群详情获取失败', error)
                    if (error?.data) {
                        const { error_description } = JSON.parse(error.data)
                        if (
                            error_description.includes(
                                'do not find this group:'
                            )
                        ) {
                            // 使用正则表达式截取不存在的群组ID
                            const groupIdMatch =
                                error_description.match(/group:(\d+)/)
                            if (groupIdMatch) {
                                const nonExistentGroupId = groupIdMatch[1]
                                // 从groupIds数组中去除不存在的群组ID
                                _.pull(groupIdArray, nonExistentGroupId)
                                // 重新发起请求
                                await fetchDetailsForGroupIds(groupIdArray)
                            }
                        } else {
                            // 如果是其他类型的错误，可以在这里处理
                            console.error('发生未知错误:', error)
                        }
                    }
                }
            }

            if (groupIds.length > 1) {
                const groupIdsArr = _.chunk([...groupIds], 20)
                for (const groupIdsChunk of groupIdsArr) {
                    await fetchDetailsForGroupIds(groupIdsChunk)
                }
            } else {
                await fetchDetailsForGroupIds(groupIds)
            }
        },
        //群管理员
        fetchGoupsAdmin: async ({ commit }, params) => {
            const { data } = await EMClient.getGroupAdmin({
                groupId: params
            })
            commit('SET_GORUPS_ADMINS', { groupId: params, admin: data })
        },
        //获取群组成员
        fetchGoupsMemberFromServer: async ({ commit }, groupId) => {
            //此接口支持分页，如果群组成员大于1000人，需要分页获取。
            const options = {
                pageNum: 1,
                pageSize: 1000,
                groupId: groupId
            }
            try {
                const { data } = await EMClient.listGroupMembers(options)
                commit('SET_GOUPS_MEMBERS', { groupId: groupId, members: data })
            } catch (error) {
                console.error('>>>>>群组成员获取失败', error)
            }
        },
        //获取群成员对应的群组属性
        fetchGroupMemberAttributes: async ({ dispatch, commit }, params) => {
            const { groupId, members } = params
            const membersList = _.chunk(members, 10)
            const requestTrack = []
            membersList.forEach((list) => {
                const goupMemberList = _.flatten(_.map(list, _.values))

                requestTrack.push(
                    EMClient.getGroupMembersAttributes({
                        groupId: groupId,
                        userIds: goupMemberList
                    })
                )
            })
            try {
                const res = await Promise.all(requestTrack)
                const groupUsersInfo = _.map(res, 'data')

                commit('SET_GROUP_MEMBERS_INFO', {
                    groupId: groupId,
                    inGroupInfo: groupUsersInfo
                })
            } catch (error) {}
        },
        //设置登录用户在某群的群组属性
        setInTheGroupInfo: async ({ commit }, params) => {
            const { groupId, nickName } = params
            try {
                await EMClient.setGroupMemberAttributes({
                    groupId: groupId,
                    userId: EMClient.user,
                    memberAttributes: {
                        nickName
                    }
                })
                commit('SET_GROUP_MEMBERS_INFO', {
                    groupId: groupId,
                    inGroupInfo: [{ [EMClient.user]: { nickName } }]
                })
            } catch (error) {
                console.error(error)
            }
        },
        //获取群公告
        fetchAnnounmentFromServer: async ({ dispatch, commit }, groupId) => {
            const option = {
                groupId: groupId
            }
            try {
                const { data } = await EMClient.fetchGroupAnnouncement(option)
                commit('SET_GOUPS_ANNOUN', {
                    groupId: groupId,
                    announcement: data.announcement
                })
            } catch (error) {
                console.error('>>>>>群组公告获取失败', error)
            }
        },
        //群黑名单
        fetchGoupsBlackListFromServer: async ({ commit }, groupId) => {
            try {
                const { data } = await EMClient.getGroupBlocklist({
                    groupId: groupId
                })
                commit('SET_GROUPS_BLIACK_LIST', {
                    groupId: groupId,
                    blacklist: data
                })
            } catch (error) {
                console.error(error)
            }
        },
        //群禁言列表
        fetchGoupsMuteListFromServer: async ({ dispatch, commit }, params) => {
            try {
                const { data } = await EMClient.getGroupMuteList({
                    groupId: params
                })
                commit('SET_GOUPS_MUTE_LIST', {
                    groupId: params,
                    mutelist: data
                })
            } catch (error) {
                console.error(error)
            }
        },
        // 修改群名或者群描述
        modifyGroupInfo: async ({ dispatch, commit }, params) => {
            const { groupId, modifyType, content } = params
            //0 是修改群名
            if (modifyType === 0) {
                const option = {
                    groupId: groupId,
                    groupName: content
                }
                await EMClient.modifyGroup(option)
                //更新本地缓存数据
                commit('UPDATE_CACHE_GROUP_INFO', {
                    groupId: groupId,
                    type: 'groupName',
                    params: content
                })
            }
            //1 是修改群详情
            if (modifyType === 1) {
                const option = {
                    groupId: groupId,
                    description: content
                }
                await EMClient.modifyGroup(option)
                //更新本地缓存数据
                commit('UPDATE_CACHE_GROUP_INFO', {
                    groupId: groupId,
                    type: 'groupDescription',
                    params: content
                })
            }
        },
        // 设置/修改群组公告
        modifyGroupAnnouncement: async ({ dispatch }, params) => {
            //SDK入参属性名是确定的此示例直接将属性名改为了SDK所识别的参数如果修改，具体请看文档。
            const { groupId, announcement } = params
            try {
                await EMClient.updateGroupAnnouncement({ ...params })
                dispatch('fetchAnnounmentFromServer', groupId)
            } catch (error) {
                console.error('群公告修改失败', error)
            }
        },
        //邀请群成员
        inviteUserJoinTheGroup: async ({ dispatch }, params) => {
            //SDK入参属性名是确定的此示例直接将属性名改为了SDK所识别的参数如果修改，具体请看文档。
            const { users, groupId } = params
            try {
                await EMClient.inviteUsersToGroup({ users, groupId })
                ElMessage({
                    message: '群组邀请成功送出~',
                    type: 'success'
                })
            } catch (error) {
                ElMessage({
                    message: '群组邀请失败，请稍后重试~',
                    type: 'error'
                })
            }
        },
        //移出群成员
        removeTheGroupMember: async ({ dispatch }, params) => {
            //SDK入参属性名是确定的此示例直接将属性名改为了SDK所识别的参数如果修改，具体请看文档。
            const { username, groupId } = params
            try {
                await EMClient.removeGroupMember({ username, groupId })
                ElMessage({
                    message: `已将${username}移出群组!`,
                    type: 'success'
                })
                //通知更新群详情
                dispatch('getAssignGroupDetail', groupId)
                //更新群成员
                dispatch('fetchGoupsMemberFromServer', groupId)
            } catch (error) {
                ElMessage({
                    message: '该群成员移出失败，请稍后重试！',
                    type: 'error'
                })
            }
        },
        //添加用户到黑名单
        addMemberToBlackList: async ({ dispatch }, params) => {
            const { groupId, usernames } = params
            try {
                //SDK入参属性名是确定的此示例直接将属性名改为了SDK所识别的参数如果修改，具体请看文档。
                //   let option = {
                //     groupId: "groupId",
                //     usernames: ["user1", "user2"]
                // };
                await EMClient.blockGroupMembers({ groupId, usernames })
                ElMessage({
                    message: '黑名单添加成功~',
                    type: 'success'
                })
                //重新获取黑名单列表
                dispatch('fetchGoupsBlackListFromServer', groupId)
                //重新获取成员列表
                dispatch('fetchGoupsMemberFromServer', groupId)
            } catch (error) {
                ElMessage({
                    message: '黑名单添加失败，请稍后重试~',
                    type: 'error'
                })
            }
        },
        //从黑名单中移出
        removeTheMemberFromBlackList: async ({ dispatch }, params) => {
            const { groupId, usernames } = params
            try {
                await EMClient.unblockGroupMembers({ groupId, usernames })
                ElMessage({
                    message: '黑名单移除成功~',
                    type: 'success'
                })
                //重新获取黑名单列表
                dispatch('fetchGoupsBlackListFromServer', groupId)
            } catch (error) {
                console.log('error', error)
                ElMessage({
                    message: '黑名单移除失败，请稍后重试~',
                    type: 'error'
                })
            }
        },
        //添加用户到禁言列表
        addMemberToMuteList: async ({ dispatch }, params) => {
            const { groupId, username } = params

            try {
                await EMClient.muteGroupMember({
                    groupId,
                    username: username,
                    muteDuration: 886400000
                })
                ElMessage({
                    message: '禁言成功~',
                    type: 'success'
                })
                setTimeout(() => {
                    dispatch('fetchGoupsMuteListFromServer', groupId)
                }, 800)
            } catch (error) {
                console.log('>>>>>error', error)
                ElMessage({
                    message: '禁言失败，请稍后重试~',
                    type: 'error'
                })
            }

            // let option = {
            //   groupId: 'groupId',
            //   username: 'user',
            //   muteDuration: 886400000, // 禁言时长，单位为毫秒。
            // };
            // await EMClient.muteGroupMember(option);
        },
        //从禁言列表中移出
        removeTheMemberFromMuteList: async ({ dispatch }, params) => {
            const { groupId, username } = params
            try {
                await EMClient.unmuteGroupMember({
                    groupId,
                    username: username
                })
                ElMessage({
                    message: '移除禁言成功~',
                    type: 'success'
                })
                setTimeout(() => {
                    dispatch('fetchGoupsMuteListFromServer', groupId)
                }, 800)
            } catch (error) {
                console.log('>>>>>error', error)
                ElMessage({
                    message: '移除禁言失败，请稍后重试~',
                    type: 'error'
                })
            }
        },
        //退出群组
        leaveIntheGroup: async ({ commit }, params) => {
            if (!params.groupId) return
            const { groupId } = params
            return new Promise((resolve, reject) => {
                EMClient.leaveGroup({
                    groupId: groupId
                })
                    .then((res) => {
                        commit('UPDATE_GROUP_LIST', {
                            type: 'deleteFromList',
                            groupId: groupId
                        })
                        resolve(res)
                    })
                    .catch((err) => {
                        reject(err)
                    })
            })
        },
        //解散群组
        destroyInTheGroup: async ({ commit }, params) => {
            if (!params.groupId) return
            const { groupId } = params
            return new Promise((resolve, reject) => {
                const option = {
                    groupId: groupId
                }
                EMClient.destroyGroup(option)
                    .then((res) => {
                        resolve(res)
                        commit('UPDATE_GROUP_LIST', {
                            type: 'deleteFromList',
                            groupId: groupId
                        })
                    })
                    .catch((err) => {
                        reject(err)
                    })
            })
        }
    },
    getters: {
        getGroupDetailMap: (state) => state.groupDetails,
        getGroupMembersMap: (state) => state.groupMembers,
        getJoinedGroupList: (state) => state.joinedGroup.joinedGroupList,
        getJoinedGroupTotal: (state) => state.joinedGroup.joinedGroupListTotal
    }
}

export default Groups
