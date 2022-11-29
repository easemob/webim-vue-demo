import { ElMessage } from 'element-plus'
import { EaseChatClient } from '@/IM/initwebsdk'
const Groups = {
    state: {
        groupsInfos: {},
    },
    mutations: {
        SET_GORUPS_ADMINS: (state, payload) => {
            console.log('>>>>>开始赋值群组管理员', payload)
            const { groupId, admin } = payload
            if (state.groupsInfos[groupId]) {
                state.groupsInfos[groupId].admin = admin
            } else {
                state.groupsInfos[groupId] = {}
                state.groupsInfos[groupId].admin = admin
            }
        },
        SET_GOUPS_MEMBERS: (state, payload) => {
            const { groupId, members } = payload
            if (state.groupsInfos[groupId]) {
                state.groupsInfos[groupId].members = members
            } else {
                state.groupsInfos[groupId] = {}
                state.groupsInfos[groupId].members = members
            }
        },
        SET_GROUPS_BLIACK_LIST: (state, payload) => {
            const { groupId, blacklist } = payload
            if (state.groupsInfos[groupId]) {
                state.groupsInfos[groupId].blacklist = blacklist
            } else {
                state.groupsInfos[groupId] = {}
                state.groupsInfos[groupId].blacklist = blacklist
            }
        },
        SET_GOUPS_MUTE_LIST: (state, payload) => {
            const { groupId, mutelist } = payload
            if (state.groupsInfos[groupId]) {
                state.groupsInfos[groupId].mutelist = mutelist
            } else {
                state.groupsInfos[groupId] = {}
                state.groupsInfos[groupId].mutelist = mutelist
            }
        },
        SET_GOUPS_ANNOUN: (state, payload) => {
            const { groupId, announcement } = payload
            if (state.groupsInfos[groupId]) {
                state.groupsInfos[groupId].announcement = announcement
            } else {
                state.groupsInfos[groupId] = {}
                state.groupsInfos[groupId].announcement = announcement
            }
        },
    },
    actions: {
    //初始群信息需要多个请求
        fetchMultiGoupsInfos: async ({ dispatch }, groupid) => {
            dispatch('fetchGoupsAdmin', groupid)
            dispatch('fetchAnnounment', groupid)
            dispatch('fetchGoupsBlackList', groupid)
            dispatch('fetchGoupsMember', groupid)
            //普通群成员无权调用禁言列表
            dispatch('fetchGoupsMuteList', groupid)
        },
        //群管理员
        fetchGoupsAdmin: async ({ commit }, params) => {
            const { data } = await EaseChatClient.getGroupAdmin({ groupId: params })
            commit('SET_GORUPS_ADMINS', { groupId: params, admin: data })
        },
        //群组成员
        fetchGoupsMember: async ({ dispatch, commit }, params) => {
            console.log('>>>>>>>开始拉取群组成员', params)
            //暂时定死就获取1000个
            const pageNum = 1,
                pageSize = 1000
            const options = {
                pageNum: pageNum,
                pageSize: pageSize,
                groupId: params,
            }
            const { data } = await EaseChatClient.listGroupMembers(options)
            commit('SET_GOUPS_MEMBERS', { groupId: params, members: data })
        },
        //获取群公告
        fetchAnnounment: async ({ dispatch, commit }, params) => {
            const option = {
                groupId: params,
            }
            const { data } = await EaseChatClient.fetchGroupAnnouncement(option)
            commit('SET_GOUPS_ANNOUN', {
                groupId: params,
                announcement: data.announcement,
            })
        },
        //群黑名单
        fetchGoupsBlackList: async ({ dispatch, commit }, params) => {
            const { data } = await EaseChatClient.getGroupBlocklist({
                groupId: params,
            })
            commit('SET_GROUPS_BLIACK_LIST', { groupId: params, blacklist: data })
        },
        //群禁言列表
        fetchGoupsMuteList: async ({ dispatch, commit }, params) => {
            console.log('>>>>>>>成功触发拉取禁言列表', params)
            try {
                const { data } = await EaseChatClient.getGroupMuteList({
                    groupId: params,
                })
                commit('SET_GOUPS_MUTE_LIST', { groupId: params, mutelist: data })
            } catch (error) {
                console.log('>>>>禁言接口获取失败', error)
            }
        },
        // 修改群名或者群详情
        modifyGroupInfo: async ({ dispatch, commit }, params) => {
            const { groupid, modifyType, content } = params
            //0 是修改群名
            if (modifyType === 0) {
                const option = {
                    groupId: groupid,
                    groupName: content,
                }
                await EaseChatClient.modifyGroup(option)
                //更新本地缓存数据
                commit('UPDATE_GROUP_INFOS', {
                    groupId: groupid,
                    type: 'groupName',
                    params: content,
                })
                commit('UPDATE_GROUP_LIST', {
                    type: 'updateGroupName',
                    groupId: groupid,
                    groupName: content,
                })
            }
            //1 是修改群详情
            if (modifyType === 1) {
                const option = {
                    groupId: groupid,
                    description: content,
                }
                await EaseChatClient.modifyGroup(option)
                //更新本地缓存数据
                commit('UPDATE_GROUP_INFOS', {
                    groupId: groupid,
                    type: 'groupDescription',
                    params: content,
                })
            }
        },
        // 设置/修改群组公告
        modifyGroupAnnouncement: async ({ dispatch }, params) => {
            //SDK入参属性名是确定的此示例直接将属性名改为了SDK所识别的参数如果修改，具体请看文档。
            await EaseChatClient.updateGroupAnnouncement(params)
            dispatch('fetchAnnounment', params.groupId)
        },
        //邀请群成员
        inviteUserJoinTheGroup: async ({ dispatch }, params) => {
            //SDK入参属性名是确定的此示例直接将属性名改为了SDK所识别的参数如果修改，具体请看文档。
            const { users, groupId } = params
            try {
                await EaseChatClient.inviteUsersToGroup({ users, groupId })
                ElMessage({
                    message: '群组邀请成功送出~',
                    type: 'success',
                })
            } catch (error) {
                console.log('>>>>群组邀请失败', error)
                ElMessage({
                    message: '群组邀请失败，请稍后重试~',
                    type: 'error',
                })
            }
        },
        //移出群成员
        removeTheGroupMember: async ({ dispatch }, params) => {
            //SDK入参属性名是确定的此示例直接将属性名改为了SDK所识别的参数如果修改，具体请看文档。
            const { username, groupId } = params
            try {
                await EaseChatClient.removeGroupMember({ username, groupId })
                ElMessage({
                    message: `已将${username}移出群组!`,
                    type: 'success',
                })
                //通知更新群详情
                dispatch('getAssignGroupDetail', groupId)
                //更新群成员
                dispatch('fetchGoupsMember', groupId)
            } catch (error) {
                ElMessage({
                    message: '该群成员移出失败，请稍后重试！',
                    type: 'error',
                })
                console.log('<<>>>>>>>>移出失败', error)
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
                await EaseChatClient.blockGroupMembers({ groupId, usernames })
                ElMessage({
                    message: '黑名单添加成功~',
                    type: 'success',
                })
                //移出黑名单，还要调用拉取群组列表，原因为将群成员加入黑名单还会将其踢出群组。
                dispatch('fetchGoupsMember', groupId)
                //重新获取黑名单列表
                dispatch('fetchGoupsBlackList', groupId)
                //通知更新群详情
                dispatch('getAssignGroupDetail', groupId)
            } catch (error) {
                console.log('>>>>>error', error)
                ElMessage({
                    message: '黑名单添加失败，请稍后重试~',
                    type: 'error',
                })
            }
        },
        //从黑名单中移出
        removeTheMemberFromBlackList: async ({ dispatch }, params) => {
            const { groupId, usernames } = params
            try {
                await EaseChatClient.unblockGroupMembers({ groupId, usernames })
                ElMessage({
                    message: '黑名单移除成功~',
                    type: 'success',
                })
                //重新获取黑名单列表
                dispatch('fetchGoupsBlackList', groupId)
            } catch (error) {
                console.log('>>>>>>黑名单移除失败')
                ElMessage({
                    message: '黑名单移除失败，请稍后重试~',
                    type: 'error',
                })
            }
        },
        //添加用户到禁言列表
        addMemberToMuteList: async ({ dispatch }, params) => {
            console.log('>>>>>>调用了禁言操作', params)
            const { groupId, usernames } = params
            //todo 此处处理方式为并发请求多次，后续SDK将支持传入数组形式，实现禁言多人
            const requestTrack = []

            try {
                usernames.length > 0 &&
          usernames.map((userId) => {
              requestTrack.push = EaseChatClient.muteGroupMember({
                  groupId,
                  username: userId,
                  muteDuration: 886400000,
              })
          })
                await Promise.all(requestTrack)
                ElMessage({
                    message: '禁言成功~',
                    type: 'success',
                })
                setTimeout(() => {
                    dispatch('fetchGoupsMuteList', groupId)
                }, 800)
            } catch (error) {
                ElMessage({
                    message: '禁言失败，请稍后重试~',
                    type: 'error',
                })
            }

            // let option = {
            //   groupId: 'groupId',
            //   username: 'user',
            //   muteDuration: 886400000, // 禁言时长，单位为毫秒。
            // };
            // await EaseChatClient.muteGroupMember(option);
        },
        //从禁言列表中移出
        removeTheMemberFromMuteList: async ({ dispatch }, params) => {
            const { groupId, usernames } = params
            //todo 此处处理方式为并发请求多次，后续SDK将支持传入数组形式，实现移出禁言多人
            const requestTrack = []
            try {
                usernames.length > 0 &&
          usernames.map((userId) => {
              requestTrack.push = EaseChatClient.unmuteGroupMember({
                  groupId,
                  username: userId,
              })
          })
                await Promise.all(requestTrack)
                ElMessage({
                    message: '移除禁言成功~',
                    type: 'success',
                })
                setTimeout(() => {
                    dispatch('fetchGoupsMuteList', groupId)
                }, 800)
            } catch (error) {
                ElMessage({
                    message: '移除禁言失败，请稍后重试~',
                    type: 'error',
                })
            }
            console.log('>>>>>>调用了移出禁言操作', params)
        },
    },
    getters: {},
}

export default Groups
