import { computed } from 'vue';
import { useStore } from 'vuex';
import defaultAvatar from '@/assets/images/avatar/theme2x.png';
const useGetUserMapInfo = () => {
  const store = useStore();
  /* 联系人相关依赖源数据 */
  const getContactsWithRemarkMap = () => store.getters.getContactsWithRemarkMap;
  const getContactsUserInfosMap = () => store.getters.getContactsUserInfosMap;
  /* 群组相关依赖数据源 */
  //获取加入的群组列表
  const getJoinedGroupList = computed(() => store.getters.getJoinedGroupList);
  //获取群组详情（展示群组名称等信息）
  const groupDetailMap = computed(() => store.getters.getGroupDetailMap);
  const getUserInfo = (targetId) => {
    return {
      remark: getContactsWithRemarkMap().get(targetId)?.remark,
      nickname: getContactsUserInfosMap().get(targetId)?.nickname,
      avatar: getContactsUserInfosMap().get(targetId)?.avatarurl,
    };
  };
  //TODO 待改动群组昵称获取方式
  const getTheGroupNickNameById = (groupId, targetId) => {
    const nickName =
      store.state.Groups.groupsInfos[groupId]?.groupMemberInfo?.[targetId]
        ?.nickName;
    return nickName?.trim() || getContactsNickNameById(targetId);
  };
  //获取群组名
  const getGroupNameByGroupId = (groupId) => {
    const groupInfo = groupDetailMap.value.get(groupId);
    const findJoinedGroup = getJoinedGroupList.value.find(
      (groupItem) => groupItem.groupId === groupId,
    );
    return groupInfo?.groupName || findJoinedGroup?.groupName || groupId;
  };
  const getLoginNickNameById = () => {
    const { nickname, hxId } = store.state.loginUserInfo;
    // 优先获取用户设置的昵称, 否则获取环信ID
    return nickname || hxId;
  };
  //userInfo 为外层传入的用户信息，在本Demo中，发送消息时会将用户信息以“ease_chat_uikit_user_info”形式传入ext中，
  // 然后在消息接收页面中会将ext中的用户信息取出并传入getContactsNickNameById中，
  // 这样做的目的是为了在消息接收页面中可以获取到用户的昵称和头像，从而在消息接收页面中显示用户的昵称和头像。
  const getContactsNickNameById = (targetId, userInfo = {}) => {
    const { remark, nickname } = getUserInfo(targetId);
    // 优先获取备注名, 否则获取用户设置的昵称, 再次尝试获取消息体内携带的昵称，否则获取环信ID
    return remark || nickname || userInfo?.nickname || targetId;
  };
  const getContactsAvatarById = (targetId, userInfo = {}) => {
    const { avatar } = getUserInfo(targetId);
    // 优先获取用户设置的头像, 再次尝试获取消息体内携带的头像，否则获取默认头像
    return avatar || userInfo?.avatarURL || defaultAvatar;
  };
  return {
    getTheGroupNickNameById,
    getGroupNameByGroupId,
    getLoginNickNameById,
    getContactsNickNameById,
    getContactsAvatarById,
  };
};
export default useGetUserMapInfo;
