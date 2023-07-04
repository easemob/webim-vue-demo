import { useStore } from 'vuex'

const useGetGroupUserMapInfo = () => {
    const store = useStore()
    const getTheGroupNickNameById = (groupId, targetId) => {
        const userInfoFromGroupNickname =
            store.state.Groups.groupsInfos[groupId]?.groupMemberInfo?.[targetId]
                ?.nickName
        const friendUserInfoNickname =
            store.state.Contacts.friendList?.[targetId]?.nickname
        return userInfoFromGroupNickname || friendUserInfoNickname || targetId
    }
    return {
        getTheGroupNickNameById
    }
}
export default useGetGroupUserMapInfo
