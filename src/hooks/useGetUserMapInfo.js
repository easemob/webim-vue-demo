import { computed } from 'vue'
import { useStore } from 'vuex'

const useGetUserMapInfo = () => {
    const store = useStore()
    const getTheGroupNickNameById = (groupId, targetId) => {
        const userInfoFromGroupNickname = computed(() => {
            return store.state.Groups.groupsInfos[groupId]?.groupMemberInfo?.[
                targetId
            ]?.nickName
        })
        const friendUserInfoNickname = computed(() => {
            return store.state.Contacts.friendList?.[targetId]?.nickname
        })
        return (
            userInfoFromGroupNickname.value ||
            friendUserInfoNickname.value ||
            targetId
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
    return {
        getTheGroupNickNameById,
        getLoginNickNameById
    }
}
export default useGetUserMapInfo
