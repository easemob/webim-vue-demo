import { computed } from 'vue'
import { useStore } from 'vuex'
import defaultAvatar from '@/assets/images/avatar/theme2x.png'
const useGetUserMapInfo = () => {
    const store = useStore()
    /* 联系人相关依赖源数据 */
    const getContactsWithRemarkMap = computed(() => {
        return store.getters.getContactsWithRemarkMap
    })

    const getContactsUserInfosMap = computed(() => {
        return store.getters.getContactsUserInfosMap
    })
    /* 群组相关依赖数据源 */
    //获取加入的群组列表
    const getJoinedGroupList = computed(() => store.getters.getJoinedGroupList)
    //获取群组详情（展示群组名称等信息）
    const groupDetailMap = computed(() => store.getters.getGroupDetailMap)
    //TODO 待改动群组昵称获取方式
    const getTheGroupNickNameById = (groupId, targetId) => {
        const userInfoFromGroupNickname = computed(() => {
            return store.state.Groups.groupsInfos[groupId]?.groupMemberInfo?.[
                targetId
            ]?.nickName
        })
        return (
            userInfoFromGroupNickname.value || getContactsNickNameById(targetId)
        )
    }
    //获取群组名
    const getGroupNameByGroupId = (groupId) => {
        const groupInfo = groupDetailMap.value.get(groupId)
        const findJoinedGroup = getJoinedGroupList.value.find(
            (groupItem) => groupItem.groupId === groupId
        )
        return groupInfo?.groupName || findJoinedGroup?.groupName || groupId
    }
    const getLoginNickNameById = () => {
        const loginUserInfoNickname = computed(() => {
            return (
                store.state.loginUserInfo.nickname ||
                store.state.loginUserInfo.nickname.hxId
            )
        })
        return loginUserInfoNickname.value
    }
    const getContactsNickNameById = (targetId) => {
        //优先展示好友备注
        if (
            getContactsWithRemarkMap.value.has(targetId) &&
            getContactsWithRemarkMap.value.get(targetId).remark
        ) {
            return getContactsWithRemarkMap.value.get(targetId).remark
        } else if (
            getContactsUserInfosMap.value.has(targetId) &&
            getContactsUserInfosMap.value.get(targetId).nickname
        ) {
            return getContactsUserInfosMap.value.get(targetId).nickname
        } else {
            return targetId
        }
    }
    const getContactsAvatarById = (targetId) => {
        if (
            getContactsUserInfosMap.value.has(targetId) &&
            getContactsUserInfosMap.value.get(targetId).avatarurl
        ) {
            return getContactsUserInfosMap.value.get(targetId).avatarurl
        } else {
            return defaultAvatar
        }
    }
    return {
        getTheGroupNickNameById,
        getGroupNameByGroupId,
        getLoginNickNameById,
        getContactsNickNameById,
        getContactsAvatarById
    }
}
export default useGetUserMapInfo
