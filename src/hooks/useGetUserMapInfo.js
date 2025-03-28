import { computed } from 'vue';
import { useStore } from 'vuex';
import defaultContactAvatar from '@/assets/images/avatar/theme2x.png';
import defaultGroupAvatar from '@/assets/images/avatar/jiaqun2x.png';
const useGetUserMapInfo = () => {
  const store = useStore();
  /* UsersProfile */
  //用户昵称
  const getUsersProfileDisplayName = (targetId) =>
    store.getters['UsersProfile/getDisplayName'](targetId);
  //用户群内昵称（前提是该用户有在群内设置群属性）
  const getUsersProfileGroupDisplayName = (targetId, groupId) =>
    store.getters['UsersProfile/getGroupDisplayName'](groupId, targetId);
  //用户头像
  const getUsersProfileAvatarUrl = (targetId) =>
    store.getters['UsersProfile/getAvatarUrl'](targetId);
  /* 群组相关依赖数据源 */
  //获取加入的群组列表
  const getJoinedGroupList = computed(() => store.getters.getJoinedGroupList);
  //获取群组详情（展示群组名称等信息）
  const groupDetailMap = computed(() => store.getters.getGroupDetailMap);
  //获取群组名
  const getGroupNameByGroupId = (groupId) => {
    return store.getters['getGroupName'](groupId);
  };
  const getLoginNickNameById = () => {
    const { nickname, hxId } = store.state.loginUserInfo;
    // 优先获取用户设置的昵称, 否则获取环信ID
    return nickname || hxId;
  };
  //获取联系人昵称
  //联系人昵称（联系人昵称仅展示remark 或者 该用户属性内昵称字段，不展示从消息内取出的昵称）
  const getContactsNickNameById = (targetId) => {
    return store.getters['UsersProfile/getContactsDisplayNickName'](targetId);
  };
  //获取联系人头像
  //联系人头像（联系人头像仅展示该用户属性内头像字段，或展示默认头像，不展示从消息内取出的头像）
  const getContactsAvatarById = (targetId) => {
    return store.getters['UsersProfile/getContactsDisplayAvatarUrl'](targetId);
  };
  //获取群组头像
  const getGroupAvatarByGroupId = (groupId) => {
    const groupInfo = groupDetailMap.value.get(groupId) ?? {};
    // 优先获取群组设置的头像, 再次尝试获取自定义字段内携带的头像，否则获取默认头像
    return groupInfo?.avatar || groupInfo?.custom || defaultGroupAvatar;
  };
  const getUserDisplayNameById = (targetId, groupId) => {
    if (groupId) {
      return getUsersProfileGroupDisplayName(groupId, targetId);
    }
    return getUsersProfileDisplayName(targetId);
  };
  const getUserDisplayAvatarById = (targetId) => {
    return getUsersProfileAvatarUrl(targetId);
  };
  return {
    getGroupNameByGroupId,
    getLoginNickNameById,
    getContactsNickNameById,
    getContactsAvatarById,
    getGroupAvatarByGroupId,
    getUserDisplayNameById,
    getUserDisplayAvatarById,
  };
};
export default useGetUserMapInfo;
