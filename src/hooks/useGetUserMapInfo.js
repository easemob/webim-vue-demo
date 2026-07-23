import { computed } from 'vue';
import { useStore } from 'vuex';
import defaultContactAvatar from '@/assets/images/avatar/theme2x.png';
import defaultGroupAvatar from '@/assets/images/avatar/jiaqun2x.png';
// 导入聊天室默认头像（可以使用和群组一样的头像）
import defaultChatroomAvatar from '@/assets/images/avatar/jiaqun2x.png';

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
  
  /* 聊天室相关依赖数据源 */
  // 模拟聊天室名称映射，实际应用中应该从服务器获取并缓存
  const chatroomNameMap = {
    'chatroom1': '技术交流群',
    'chatroom2': '产品讨论群',
    'chatroom3': '设计分享群',
    'chatroom4': '测试反馈群',
    'chatroom5': '运维支持群'
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
    // 优先获取群组设置的头像, 否则获取默认头像
    // 注意：groupInfo.custom可能是一个对象，不能直接作为头像URL使用
    return groupInfo?.avatarUrl || defaultGroupAvatar;
  };
  
  //获取聊天室名称
  const getChatroomNameByChatroomId = (chatroomId) => {
    // 实际应用中应该从服务器获取并缓存聊天室详情
    // 这里先使用模拟数据
    return chatroomNameMap[chatroomId] || chatroomId;
  };
  
  //获取聊天室头像
  const getChatroomAvatarByChatroomId = (chatroomId) => {
    // 实际应用中应该从服务器获取并缓存聊天室详情
    // 这里先使用默认头像
    return defaultChatroomAvatar;
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
    getChatroomNameByChatroomId,
    getChatroomAvatarByChatroomId,
    getUserDisplayNameById,
    getUserDisplayAvatarById,
  };
};

export default useGetUserMapInfo;
