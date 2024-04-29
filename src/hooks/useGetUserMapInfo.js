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
        getLoginNickNameById,
        getContactsNickNameById,
        getContactsAvatarById
    }
}
export default useGetUserMapInfo
