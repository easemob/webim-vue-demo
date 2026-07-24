<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCurrentUserId, requireManager } from '@/IM';
import {
  getSdk5ErrorInfo,
  getSdk5ErrorMessage,
  isSdk5AuthenticationError,
} from '@/utils/sdk5ErrorInfo';

const route = useRoute();
const router = useRouter();
const store = useStore();

const activeTab = ref('members');
const loading = ref(false);
const chatRoomId = ref(route.query.chatRoomId);
const chatRoomManager = () => requireManager('chatRoomManager');
const chatRoom = () => chatRoomManager().getChatRoom(chatRoomId.value);

const members = ref([]);
const blocklist = ref([]);
const allowlist = ref([]);
const mutelist = ref([]);
const admins = ref([]);
const isMuteAll = ref(false);
const muteInput = ref('');
const muteDurationInput = ref('');
const isSelfInAllowlist = ref(false);
const selfMuteStatus = ref(null);
const selfMuteStatusError = ref(null);
const isSelfInMutelist = computed(() => selfMuteStatus.value?.muted === true);

const blocklistInput = ref('');
const allowlistInput = ref('');
const adminInput = ref('');

const isOwner = computed(() => {
  return chatRoomId.value && chatroomDetails.value?.owner?.userId === getCurrentUserId();
});

// 检查当前用户是否是聊天室管理员
const isAdmin = computed(() => {
  return (
    chatRoomId.value &&
    (admins.value.some((admin) => admin.userId === getCurrentUserId()) ||
      members.value.some(
        (member) =>
          member.user.userId === getCurrentUserId() && member.role === 'admin',
      ))
  );
});

// 检查当前用户是否有管理员权限（所有者或管理员）
const hasAdminPermission = computed(() => {
  return isOwner.value || isAdmin.value;
});

// 定义聊天室详情响应式变量
const chatroomDetails = ref({});

const checkLoginStatus = () => {
  if (!getCurrentUserId()) {
    router.push('/login');
    return false;
  }
  return true;
};

const getChatroomFriendlyErrorMessage = (error, fallback) => {
  const errorText = getSdk5ErrorMessage(error).toLowerCase();

  if (isSdk5AuthenticationError(error)) {
    return '认证失败，请重新登录';
  }

  if (
    errorText.includes('group_authorization') ||
    errorText.includes('authorization') ||
    errorText.includes('no permission') ||
    errorText.includes('permission')
  ) {
    return '权限不足：只有聊天室所有者或管理员可以执行该操作';
  }

  if (errorText.includes('user not found')) {
    return '用户不存在，请检查用户 ID 是否正确';
  }

  if (errorText.includes('not in group') || errorText.includes('not member')) {
    return '该用户不在当前聊天室中';
  }

  return fallback;
};

const logChatroomActionError = (action, error, params = {}) => {
  console.groupCollapsed(`[ChatroomActionError] ${action}`);
  console.error('原始错误：', error);
  console.log('方法入参：', params);
  console.log('错误详情：', {
    ...getSdk5ErrorInfo(error),
    stack: error?.stack,
  });
  console.groupEnd();
};

const hasChatroomActionSucceeded = (result, userId) => {
  return (
    Array.isArray(result?.succeeded) &&
    result.succeeded.some((item) => item.user?.userId === userId)
  );
};

const confirmChatroomActionSucceeded = (action, result, userId) => {
  if (hasChatroomActionSucceeded(result, userId)) return true;

  console.error(`[ChatroomActionError] ${action} 未被 SDK 确认`, {
    currentUser: getCurrentUserId(),
    chatRoomId: chatRoomId.value,
    userId,
    result,
  });
  ElMessage.error(`${action}失败：SDK 未确认目标用户操作成功`);
  return false;
};

const getChatroomDetails = async () => {
  if (!checkLoginStatus()) return;
  if (!chatRoomId.value) {
    ElMessage.error('聊天室ID不存在');
    return;
  }

  const GET_CHAT_ROOM_DETAILS_METHOD = 'getChatRoomDetails';
  const chatRoomDetailParams = { chatRoomId: chatRoomId.value };
  loading.value = true;
  try {
    console.log(
      `开始获取聊天室详情:`,
      `\n调用方法: ${GET_CHAT_ROOM_DETAILS_METHOD}`,
      `\n方法入参:`,
      chatRoomDetailParams,
      `\n当前用户:`,
      getCurrentUserId(),
      `\n聊天室ID:`,
      chatRoomId.value,
    );
    const res = await chatRoom().getInfo();
    console.log(
      `获取聊天室详情成功:`,
      `\n事件：聊天室详情查询`,
      `\n返回值:`,
      res,
    );

    chatroomDetails.value = res;
    isMuteAll.value = Boolean(chatroomDetails.value?.isMuted);
  } catch (error) {
    console.error(
      `获取聊天室详情失败:`,
      `\n调用方法: ${GET_CHAT_ROOM_DETAILS_METHOD}`,
      `\n方法入参:`,
      chatRoomDetailParams,
      `\n错误详情:`,
      error,
    );
    if (isSdk5AuthenticationError(error)) {
      ElMessage.error('认证失败，请重新登录');
    } else {
      ElMessage.error('获取聊天室详情失败');
    }
  } finally {
    loading.value = false;
  }
};

const getAllChatRoomMembers = async () => {
  const allMembers = [];
  let cursor = '';

  do {
    const res = await chatRoom().getMembers({
      cursor,
      pageSize: 50,
    });
    allMembers.push(...res.items);
    if (res.hasMore && !res.cursor) {
      throw new Error('SDK 5.0 ChatRoom.getMembers returned hasMore without cursor');
    }
    cursor = res.hasMore ? res.cursor : '';
  } while (cursor);

  return allMembers;
};
//获取聊天室成员
const getChatRoomMembers = async () => {
  if (!checkLoginStatus()) return;

  if (!chatRoomId.value) {
    console.error('chatRoomId 不存在:', chatRoomId.value);
    return;
  }
  const GET_CHAT_ROOM_MEMBERS_METHOD = 'getChatRoomMembers';
  loading.value = true;
  try {
    console.log(
      `开始获取聊天室成员:`,
      `\n调用方法: ${GET_CHAT_ROOM_MEMBERS_METHOD}`,
      `\n方法入参:`,
      {
        chatRoomId: chatRoomId.value,
        cursor: '',
        pageSize: 50,
      },
      `\n目标聊天室ID:`,
      chatRoomId.value,
      `\n当前用户:`,
      getCurrentUserId(),
    );
    const allMembers = await getAllChatRoomMembers();
    console.log(
      `获取聊天室成员成功:`,
      `\n调用方法: ${GET_CHAT_ROOM_MEMBERS_METHOD}`,
      `\n聊天室ID:`,
      chatRoomId.value,
      `\n处理后的成员数据:`,
      allMembers,
    );

    members.value = allMembers;
    store.commit('SET_CHATROOM_MEMBERS', {
      chatRoomId: chatRoomId.value,
      members: allMembers,
    });

    ElMessage.success('获取聊天室成员成功');
    console.log(
      `聊天室成员列表处理完成:`,
      `\n调用方法: ${GET_CHAT_ROOM_MEMBERS_METHOD}`,
      `\n处理后的成员列表:`,
      members.value,
      `\n成员总数:`,
      members.value.length,
    );
  } catch (error) {
    ElMessage.error('获取聊天室成员失败');
    console.error(
      `获取聊天室成员失败:`,
      `\n调用方法: ${GET_CHAT_ROOM_MEMBERS_METHOD}`,
      `\n目标聊天室ID:`,
      chatRoomId.value,
      `\n当前用户:`,
      getCurrentUserId(),
      `\n错误码:`,
      error.code,
      `\n错误消息:`,
      getSdk5ErrorMessage(error),
      `\n完整错误信息:`,
      error,
    );
    if (isSdk5AuthenticationError(error)) {
      ElMessage.error('认证失败，请重新登录');
    } else {
      ElMessage.error('获取聊天室成员失败');
    }
  } finally {
    loading.value = false;
  }
};

const checkSelfInAllowlist = async () => {
  if (!checkLoginStatus() || !chatRoomId.value) return;

  try {
    const isInAllowlist = await chatRoom().checkIfInAllowList();
    isSelfInAllowlist.value = isInAllowlist;
  } catch (error) {
    console.error('检查自己是否在聊天室白名单失败', error);
    isSelfInAllowlist.value = false;
  }
};

const checkSelfInMutelist = async () => {
  if (!checkLoginStatus() || !chatRoomId.value) return;

  try {
    const muteStatus = await chatRoom().checkIfInMuteList();
    selfMuteStatus.value = muteStatus;
    selfMuteStatusError.value = null;
    console.log('[SDK 5.0 ChatRoom] checkIfInMuteList success', {
      chatRoomId: chatRoomId.value,
      currentUser: getCurrentUserId(),
      muteStatus,
    });
  } catch (error) {
    selfMuteStatus.value = null;
    selfMuteStatusError.value = error;
    console.error('[SDK 5.0 ChatRoom] checkIfInMuteList failed', {
      chatRoomId: chatRoomId.value,
      currentUser: getCurrentUserId(),
      error,
    });
  }
};

const getChatRoomBlocklist = async () => {
  if (!checkLoginStatus()) return;
  if (!chatRoomId.value) return;
  if (!hasAdminPermission.value) {
    blocklist.value = [];
    return;
  }
  const GET_CHAT_ROOM_BLOCKLIST_METHOD = 'getChatRoomBlocklist';
  const targetRoomId = chatRoomId.value;
  // 定义获取黑名单的参数
  const blocklistParams = { chatRoomId: chatRoomId.value };
  loading.value = true;
  try {
    console.log(
      `开始获取聊天室黑名单:`,
      `\n调用方法: ${GET_CHAT_ROOM_BLOCKLIST_METHOD}`,
      `\n目标聊天室ID:`,
      targetRoomId,
      `\n当前操作用户:`,
      getCurrentUserId(),
    );
    const res = await chatRoom().getBlocklist();
    console.log(
      `获取聊天室黑名单成功:`,
      `\n调用方法: ${GET_CHAT_ROOM_BLOCKLIST_METHOD}`,
      `\n方法入参:`,
      blocklistParams,
      `\n原始返回数据:`,
      res,
    );
    blocklist.value = res;
    console.log('SDK 5.0 原始黑名单列表:', blocklist.value);
  } catch (error) {
    console.error(
      `获取聊天室黑名单失败`,
      `\n调用方法: ${GET_CHAT_ROOM_BLOCKLIST_METHOD}`,
      `\n目标聊天室ID:`,
      targetRoomId,
      `\n当前用户:`,
      getCurrentUserId(),
      `\n错误码:`,
      error.code,
      `\n错误消息:`,
      getSdk5ErrorMessage(error),
      `\n完整错误信息:`,
      error,
    );
    if (isSdk5AuthenticationError(error)) {
      ElMessage.error('认证失败，请重新登录');
    } else {
      ElMessage.error('获取聊天室黑名单失败');
    }
    blocklist.value = [];
  } finally {
    loading.value = false;
  }
};

const getChatRoomAllowlist = async () => {
  if (!checkLoginStatus()) return;
  if (!chatRoomId.value) return;

  if (!hasAdminPermission.value) {
    allowlist.value = [];
    await checkSelfInAllowlist();
    return;
  }

  loading.value = true;
  try {
    console.log('开始获取聊天室白名单，chatRoomId:', chatRoomId.value);
    const res = await chatRoom().getAllowlist();
    console.log('获取聊天室白名单成功 - 原始数据:', res);

    allowlist.value = res;
    console.log('SDK 5.0 原始白名单列表:', allowlist.value);
  } catch (error) {
    console.error('获取聊天室白名单失败', error);
    if (isSdk5AuthenticationError(error)) {
      ElMessage.error('认证失败，请重新登录');
    } else {
      ElMessage.error('获取聊天室白名单失败');
    }
    allowlist.value = [];
  } finally {
    loading.value = false;
  }
};

const getChatRoomMutelist = async () => {
  if (!checkLoginStatus()) return;
  if (!chatRoomId.value) return;

  if (!hasAdminPermission.value) {
    mutelist.value = [];
    await checkSelfInMutelist();
    return;
  }

  loading.value = true;
  try {
    console.log('开始获取聊天室禁言列表，chatRoomId:', chatRoomId.value);
    const res = await chatRoom().getMuteList();
    console.log('获取聊天室禁言列表成功 - 原始数据:', res);

    mutelist.value = res;

    console.log('SDK 5.0 原始禁言列表:', mutelist.value);
  } catch (error) {
    if (isSdk5AuthenticationError(error)) {
      ElMessage.error('认证失败，请重新登录');
    } else {
      ElMessage.error('获取聊天室禁言列表失败');
    }
    mutelist.value = [];
  } finally {
    loading.value = false;
  }
};

const getChatRoomAdmin = async () => {
  if (!checkLoginStatus()) return;
  if (!chatRoomId.value) return;
  loading.value = true;
  try {
    console.log('开始获取聊天室管理员，chatRoomId:', chatRoomId.value);
    const res = await chatRoom().getAdminList();
    console.log('获取聊天室管理员成功 - 原始数据:', res);
    admins.value = res;
    console.log('处理后的管理员列表:', admins.value);
  } catch (error) {
    console.error('获取聊天室管理员失败', error);
    if (isSdk5AuthenticationError(error)) {
      ElMessage.error('认证失败，请重新登录');
    } else {
      ElMessage.error('获取聊天室管理员失败');
    }
  } finally {
    loading.value = false;
  }
};

const handleTabChange = (tab) => {
  switch (tab) {
    case 'members':
      getChatRoomMembers();
      break;
    case 'blocklist':
      getChatRoomBlocklist();
      break;
    case 'allowlist':
      getChatRoomAllowlist();
      break;
    case 'mutelist':
      getChatRoomMutelist();
      break;
    case 'admins':
      getChatRoomAdmin();
      break;
  }
};

const addToBlocklist = async (username) => {
  if (!checkLoginStatus()) return;
  if (!hasAdminPermission.value) {
    ElMessage.error('只有聊天室所有者或管理员才能执行该操作');
    return;
  }

  if (!username || !username.trim()) {
    ElMessage.warning('请输入用户ID');
    return;
  }
  if (!chatRoomId.value) {
    ElMessage.error('聊天室ID不存在');
    return;
  }
  const trimmedUsername = username.trim();
  const blockParams = {
    chatRoomId: chatRoomId.value,
    userIds: [trimmedUsername],
  };
  console.log('添加到黑名单 - chatRoomId:', chatRoomId.value, 'userIds:', [
    trimmedUsername,
  ]);
  try {
    const result = await chatRoom().blockMembers({ userIds: blockParams.userIds });
    if (!confirmChatroomActionSucceeded('添加到黑名单', result, trimmedUsername)) {
      return;
    }
    ElMessage.success('添加到黑名单成功');
    blocklistInput.value = '';
    await getChatRoomBlocklist();
  } catch (error) {
    logChatroomActionError('添加到黑名单失败', error, blockParams);
    ElMessage.error(getChatroomFriendlyErrorMessage(error, '添加到黑名单失败'));
  }
};

const removeFromBlocklist = async (username) => {
  if (!checkLoginStatus()) return;
  if (!hasAdminPermission.value) {
    ElMessage.error('只有聊天室所有者或管理员才能执行该操作');
    return;
  }
  const UNBLOCK_CHAT_ROOM_MEMBERS_METHOD = 'unblockChatRoomMembers';
  const targetRoomId = chatRoomId.value;
  const unblockParams = {
    chatRoomId: targetRoomId,
    userIds: [username],
  };
  try {
    const result = await chatRoom().unblockMembers({ userIds: unblockParams.userIds });
    if (!confirmChatroomActionSucceeded('从黑名单移除', result, username)) {
      return;
    }
    console.log(
      `从黑名单移除成员成功:`,
      `\n调用方法: ${UNBLOCK_CHAT_ROOM_MEMBERS_METHOD}`,
      `\n方法入参:`,
      unblockParams,
      `\n接口返回结果:`,
      result,
      `\n已移除黑名单的成员:`,
      username,
      `\n操作聊天室ID:`,
      targetRoomId,
      `\n后续操作: 重新获取聊天室黑名单列表`,
    );
    ElMessage.success('从黑名单移除成功');
    await getChatRoomBlocklist();
  } catch (error) {
    logChatroomActionError('从黑名单移除失败', error, unblockParams);
    ElMessage.error(getChatroomFriendlyErrorMessage(error, '从黑名单移除失败'));
  }
};

const addToAllowlist = async (username) => {
  if (!checkLoginStatus()) return;
  if (!hasAdminPermission.value) {
    ElMessage.error('只有聊天室所有者或管理员才能执行该操作');
    return;
  }

  if (!username || !username.trim()) {
    ElMessage.warning('请输入用户ID');
    return;
  }
  if (!chatRoomId.value) {
    ElMessage.error('聊天室ID不存在');
    return;
  }
  const trimmedUsername = username.trim();
  const allowlistParams = {
    chatRoomId: chatRoomId.value,
    userIds: [trimmedUsername],
  };
  console.log('添加到白名单 - chatRoomId:', chatRoomId.value, 'userIds:', [
    trimmedUsername,
  ]);
  try {
    const result = await chatRoom().addUsersToAllowlist({ userIds: allowlistParams.userIds });
    if (!confirmChatroomActionSucceeded('添加到白名单', result, trimmedUsername)) {
      return;
    }
    ElMessage.success('添加到白名单成功');
    allowlistInput.value = '';
    await getChatRoomAllowlist();
  } catch (error) {
    logChatroomActionError('添加到白名单失败', error, allowlistParams);
    ElMessage.error(getChatroomFriendlyErrorMessage(error, '添加到白名单失败'));
  }
};

const removeFromAllowlist = async (username) => {
  if (!checkLoginStatus()) return;
  if (!hasAdminPermission.value) {
    ElMessage.error('只有聊天室所有者或管理员才能执行该操作');
    return;
  }
  const removeAllowlistParams = {
    chatRoomId: chatRoomId.value,
    userIds: [username],
  };

  try {
    const result = await chatRoom().removeUsersFromAllowlist({ userIds: removeAllowlistParams.userIds });
    if (!confirmChatroomActionSucceeded('从白名单移除', result, username)) {
      return;
    }
    ElMessage.success('从白名单移除成功');
    await getChatRoomAllowlist();
  } catch (error) {
    logChatroomActionError('从白名单移除失败', error, removeAllowlistParams);
    ElMessage.error(getChatroomFriendlyErrorMessage(error, '从白名单移除失败'));
  }
};

const getMuteDuration = () => {
  const rawValue = String(muteDurationInput.value || '').trim();
  if (!rawValue) {
    ElMessage.warning('请输入禁言时长，单位为秒');
    return null;
  }

  const duration = Number(rawValue);
  if (!Number.isFinite(duration) || duration <= 0) {
    ElMessage.warning('禁言时长请输入大于 0 的数字，单位为秒');
    return null;
  }

  return duration;
};

const formatMuteExpire = (expire) => {
  if (expire === -1) {
    return '永久';
  }

  const expireTime = Number(expire);
  if (!Number.isFinite(expireTime) || expireTime <= 0) {
    return '-';
  }

  const remainingMs = expireTime - Date.now();
  if (remainingMs <= 0) {
    return '已到期';
  }

  if (remainingMs < 1000) {
    return `${remainingMs}ms`;
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}秒`;
  }

  const totalMinutes = Math.ceil(totalSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes}分钟`;
  }

  const totalHours = Math.ceil(totalMinutes / 60);
  if (totalHours < 24) {
    return `${totalHours}小时`;
  }

  const totalDays = Math.ceil(totalHours / 24);
  return `${totalDays}天`;
};

const muteMember = async (username, duration) => {
  if (!checkLoginStatus()) return;
  if (!hasAdminPermission.value) {
    ElMessage.error('只有聊天室所有者或管理员才能执行该操作');
    return;
  }

  if (!username || !username.trim()) {
    ElMessage.warning('请输入用户ID');
    return;
  }
  const trimmedUsername = username.trim();
  const muteParams = {
    chatRoomId: chatRoomId.value,
    userIds: [trimmedUsername],
    duration,
  };
  try {
    await chatRoom().muteMembers({
      userIds: muteParams.userIds,
      duration: muteParams.duration,
    });
    ElMessage.success('禁言成功');
    muteInput.value = '';
    muteDurationInput.value = '';
    getChatRoomMutelist();
  } catch (error) {
    logChatroomActionError('禁言失败', error, muteParams);
    ElMessage.error(getChatroomFriendlyErrorMessage(error, '禁言失败'));
  }
};

const handleMuteMember = () => {
  const duration = getMuteDuration();
  if (duration == null) return;
  muteMember(muteInput.value, duration);
};

const unmuteMember = async (username) => {
  if (!hasAdminPermission.value) {
    ElMessage.error('只有聊天室所有者或管理员才能执行该操作');
    return;
  }
  const unmuteParams = {
    chatRoomId: chatRoomId.value,
    userIds: [username],
  };
  try {
    await chatRoom().unmuteMembers({ userIds: unmuteParams.userIds });
    ElMessage.success('解除禁言成功');
    getChatRoomMutelist();
  } catch (error) {
    logChatroomActionError('解除禁言失败', error, unmuteParams);
    ElMessage.error(getChatroomFriendlyErrorMessage(error, '解除禁言失败'));
  }
};

const muteAllMembers = async () => {
  if (!hasAdminPermission.value) {
    ElMessage.error('只有聊天室所有者或管理员才能执行全员禁言操作');
    return;
  }

  try {
    const muteAllParams = { chatRoomId: chatRoomId.value };
    await chatRoom().muteAllMembers();
    isMuteAll.value = true;
    ElMessage.success('全员禁言成功');

    // 刷新成员、管理员、白名单，确保全员禁言展示符合服务端实际权限
    await Promise.all([
      getChatRoomMembers(),
      getChatRoomAdmin(),
      getChatRoomAllowlist(),
    ]);
    getChatRoomMutelist();
  } catch (error) {
    logChatroomActionError('全员禁言失败', error, {
      chatRoomId: chatRoomId.value,
    });
    ElMessage.error(getChatroomFriendlyErrorMessage(error, '全员禁言失败'));
  }
};

const unmuteAllMembers = async () => {
  if (!hasAdminPermission.value) {
    ElMessage.error('只有聊天室所有者或管理员才能执行取消全员禁言操作');
    return;
  }

  try {
    const unmuteAllParams = { chatRoomId: chatRoomId.value };
    await chatRoom().unmuteAllMembers();
    isMuteAll.value = false;
    ElMessage.success('取消全员禁言成功');
    getChatRoomMutelist();
  } catch (error) {
    logChatroomActionError('取消全员禁言失败', error, {
      chatRoomId: chatRoomId.value,
    });
    ElMessage.error(getChatroomFriendlyErrorMessage(error, '取消全员禁言失败'));
  }
};

const setAdmin = async (username) => {
  if (!isOwner.value) {
    ElMessage.error('只有聊天室所有者才能设置管理员');
    return;
  }
  if (!username || !username.trim()) {
    ElMessage.warning('请输入用户ID');
    return;
  }
  if (!chatRoomId.value) {
    ElMessage.error('聊天室ID不存在');
    return;
  }
  const trimmedUsername = username.trim();

  try {
    const res = await chatRoom().getInfo();
    const owner = res?.owner?.userId;
    console.log('聊天室所有者:', owner);

    if (trimmedUsername === owner) {
      ElMessage.warning('该用户是聊天室所有者，无需设置为管理员');
      adminInput.value = '';
      return;
    }
  } catch (error) {
    console.error('获取聊天室详情失败', error);
  }

  console.log(
    '设置管理员 - chatRoomId:',
    chatRoomId.value,
    'username:',
    trimmedUsername,
  );
  const setAdminParams = {
    chatRoomId: chatRoomId.value,
    userId: trimmedUsername,
  };
  try {
    await chatRoom().addAdmin({ userId: setAdminParams.userId });
    ElMessage.success('设置管理员成功');
    adminInput.value = '';
    // 更新管理员列表和成员列表中的角色信息
    await getChatRoomAdmin();
    await getChatRoomMembers();
  } catch (error) {
    logChatroomActionError('设置管理员失败', error, setAdminParams);
    ElMessage.error(getChatroomFriendlyErrorMessage(error, '设置管理员失败'));
  }
};

const removeAdmin = async (username) => {
  if (!isOwner.value) {
    ElMessage.error('只有聊天室所有者才能移除管理员');
    return;
  }
  const removeAdminParams = {
    chatRoomId: chatRoomId.value,
    userId: username,
  };
  try {
    await chatRoom().removeAdmin({ userId: removeAdminParams.userId });
    ElMessage.success('移除管理员成功');
    // 更新管理员列表和成员列表中的角色信息
    await getChatRoomAdmin();
    await getChatRoomMembers();
  } catch (error) {
    logChatroomActionError('移除管理员失败', error, removeAdminParams);
    ElMessage.error(getChatroomFriendlyErrorMessage(error, '移除管理员失败'));
  }
};

const removeMember = async (username) => {
  // 检查当前用户是否有管理员权限
  if (!hasAdminPermission.value) {
    ElMessage.error('只有聊天室所有者或管理员才能执行该操作');
    return;
  }

  try {
    await ElMessageBox.confirm(`确定要将 ${username} 移出聊天室吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    const REMOVE_CHAT_ROOM_MEMBER_METHOD = 'removeChatRoomMember';
    const removeMemberParams = {
      chatRoomId: chatRoomId.value,
      userIds: [username],
    };
    const res = await chatRoom().removeMembers({ userIds: removeMemberParams.userIds });
    console.log(
      `移出聊天室成员成功:`,
      `\n调用方法: ${REMOVE_CHAT_ROOM_MEMBER_METHOD}`,
      `\n方法入参:`,
      removeMemberParams,
      `\n接口返回结果:`,
      res,
      `\n已移出成员:`,
      username,
      `\n操作聊天室ID:`,
      chatRoomId.value,
      `\n操作执行用户:`,
      getCurrentUserId(),
      `\n后续操作: 重新获取聊天室成员列表`,
    );
    ElMessage.success('移出聊天室成功');
    getChatRoomMembers();
  } catch (error) {
    if (error !== 'cancel') {
      const REMOVE_CHAT_ROOM_MEMBER_METHOD = 'removeChatRoomMember';
      const removeMemberParams = {
        chatRoomId: chatRoomId.value,
        userIds: [username],
      };
      logChatroomActionError(
        `移出聊天室成员失败:${REMOVE_CHAT_ROOM_MEMBER_METHOD}`,
        error,
        removeMemberParams,
      );

      // 根据错误类型提供更友好的提示
      ElMessage.error(getChatroomFriendlyErrorMessage(error, '移出聊天室失败'));
    }
  }
};

let chatroomEventHandler;

const registerChatroomMemberManagementHandler = () => {
  if (chatroomEventHandler) {
    chatRoomManager().removeEventHandler('CHATROOM_MEMBER_MANAGEMENT');
  }

  chatroomEventHandler = chatRoomManager().addEventHandler(
    'CHATROOM_MEMBER_MANAGEMENT',
    {
      onAllMemberMuteStateChanged: (payload) => {
        if (payload.chatRoomId !== String(chatRoomId.value || '')) return;
        isMuteAll.value = payload.isMuted;
        getChatRoomMutelist();
      },
      onAdminAdded: (payload) => {
        if (payload.chatRoomId !== String(chatRoomId.value || '')) return;
        getChatRoomAdmin();
        getChatRoomMembers();
      },
      onAdminRemoved: (payload) => {
        if (payload.chatRoomId !== String(chatRoomId.value || '')) return;
        getChatRoomAdmin();
        getChatRoomMembers();
      },
      onMuteListAdded: (payload) => {
        if (payload.chatRoomId !== String(chatRoomId.value || '')) return;
        getChatRoomMutelist();
      },
      onMuteListRemoved: (payload) => {
        if (payload.chatRoomId !== String(chatRoomId.value || '')) return;
        getChatRoomMutelist();
      },
      onAllowListAdded: (payload) => {
        if (payload.chatRoomId !== String(chatRoomId.value || '')) return;
        getChatRoomAllowlist();
      },
      onAllowListRemoved: (payload) => {
        if (payload.chatRoomId !== String(chatRoomId.value || '')) return;
        getChatRoomAllowlist();
      },
      onMembersExited: (payload) => {
        if (payload.chatRoomId !== String(chatRoomId.value || '')) return;
        getChatRoomBlocklist();
        getChatRoomMembers();
      },
    },
  );
};

onMounted(() => {
  Promise.all([
    getChatRoomMembers(),
    getChatRoomAdmin(),
    getChatroomDetails(),
    getChatRoomAllowlist(),
  ]).then(() => {
    if (activeTab.value === 'mutelist') {
      return getChatRoomMutelist();
    }
  });
  registerChatroomMemberManagementHandler();
});

onUnmounted(() => {
  if (chatroomEventHandler) {
    chatRoomManager().removeEventHandler('CHATROOM_MEMBER_MANAGEMENT');
  }
});

watch(
  () => route.query.chatRoomId,
  (newRoomId, oldRoomId) => {
    if (newRoomId && newRoomId !== oldRoomId) {
      chatRoomId.value = newRoomId;
      Promise.all([
        getChatRoomMembers(),
        getChatRoomAdmin(),
        getChatroomDetails(),
        getChatRoomAllowlist(),
      ]).then(() => {
        if (activeTab.value === 'mutelist') {
          return getChatRoomMutelist();
        }
      });
      registerChatroomMemberManagementHandler();
    }
  },
);

</script>

<template>
  <div class="chatroom_member_management">
    <el-page-header @back="() => router.back()" title="返回聊天室详情">
      <template #content>
        <span class="text-large font-600 mr-3"> 聊天室成员管理 </span>
      </template>
    </el-page-header>

    <el-card class="management_card" v-loading="loading">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="成员列表" name="members">
          <el-table :data="members" stripe>
            <el-table-column prop="user.userId" label="用户ID" width="200" />
            <el-table-column prop="role" label="角色" width="150">
              <template #default="{ row }">
                <el-tag v-if="row.role === 'owner'" type="danger"
                  >所有者</el-tag
                >
                <el-tag v-else-if="row.role === 'admin'" type="warning"
                  >管理员</el-tag
                >
                <el-tag v-else type="info">成员</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作">
              <template #default="{ row }">
                <el-button
                  v-if="hasAdminPermission && row.role === 'member' && row.user.userId !== getCurrentUserId()"
                  type="danger"
                  size="small"
                  @click="removeMember(row.user.userId)"
                >
                  移出聊天室
                </el-button>
                <el-button
                  v-if="isOwner && row.role === 'member'"
                  type="primary"
                  size="small"
                  @click="setAdmin(row.user.userId)"
                >
                  设为管理员
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="黑名单" name="blocklist">
          <div class="toolbar">
            <el-input
              v-model="blocklistInput"
              placeholder="请输入用户ID"
              style="width: 200px; margin-right: 10px"
              clearable
              :disabled="!hasAdminPermission"
            />
            <el-button type="primary" @click="addToBlocklist(blocklistInput)" :disabled="!hasAdminPermission"
              >添加到黑名单</el-button
            >
          </div>
          <el-alert
            v-if="!hasAdminPermission"
            title="仅聊天室所有者和管理员可查看和管理黑名单"
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          />
          <el-table :data="blocklist" stripe>
            <el-table-column prop="user.userId" label="用户ID" />
            <el-table-column label="操作">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  @click="removeFromBlocklist(row.user.userId)"
                >
                  移出黑名单
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="白名单" name="allowlist">
          <div class="toolbar">
            <el-input
              v-model="allowlistInput"
              placeholder="请输入用户ID"
              style="width: 200px; margin-right: 10px"
              clearable
              :disabled="!hasAdminPermission"
            />
            <el-button type="primary" @click="addToAllowlist(allowlistInput)" :disabled="!hasAdminPermission"
              >添加到白名单</el-button
            >
          </div>
          <el-alert
            v-if="!hasAdminPermission"
            :title="isSelfInAllowlist ? '当前账号在聊天室白名单中' : '当前账号不在聊天室白名单中'"
            :type="isSelfInAllowlist ? 'success' : 'info'"
            :closable="false"
            style="margin-bottom: 20px"
          />
          <el-table :data="allowlist" stripe>
            <el-table-column prop="user.userId" label="用户ID" />
            <el-table-column label="操作">
              <template #default="{ row }">
                <el-button
                  type="danger"
                  size="small"
                  @click="removeFromAllowlist(row.user.userId)"
                >
                  移出白名单
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="禁言列表" name="mutelist">
          <div class="toolbar">
            <el-input
              v-model="muteInput"
              placeholder="请输入用户ID"
              style="width: 200px; margin-right: 10px"
              clearable
              :disabled="!hasAdminPermission"
            />
            <el-input
              v-model="muteDurationInput"
              placeholder="禁言时长秒数（必填）"
              style="width: 220px; margin-right: 10px"
              clearable
              :disabled="!hasAdminPermission"
            />
            <el-button type="primary" @click="handleMuteMember" :disabled="!hasAdminPermission"
              >禁言用户</el-button
            >
            <el-button
              type="warning"
              @click="muteAllMembers"
              :disabled="!hasAdminPermission"
            >
              全员禁言
            </el-button>
            <el-button
              type="success"
              @click="unmuteAllMembers"
              :disabled="!hasAdminPermission"
            >
              取消全员禁言
            </el-button>
          </div>

          <el-alert
            v-if="!hasAdminPermission && selfMuteStatusError"
            title="当前账号聊天室禁言状态查询失败"
            type="error"
            :closable="false"
            style="margin-bottom: 20px"
          >
            {{ getSdk5ErrorMessage(selfMuteStatusError, 'SDK 真实错误') }}
          </el-alert>

          <el-alert
            v-else-if="!hasAdminPermission && selfMuteStatus"
            :title="
              isSelfInMutelist
                ? `当前账号在聊天室禁言列表中（到期：${formatMuteExpire(selfMuteStatus.muteExpireAt)}）`
                : '当前账号不在聊天室禁言列表中'
            "
            :type="isSelfInMutelist ? 'warning' : 'info'"
            :closable="false"
            style="margin-bottom: 20px"
          >
            SDK 5.0 `checkIfInMuteList()` 返回：muted={{
              String(selfMuteStatus.muted)
            }}，muteExpireAt={{ selfMuteStatus.muteExpireAt ?? '-' }}。
          </el-alert>

          <el-alert
            v-else-if="!hasAdminPermission"
            title="当前账号聊天室禁言状态未查询"
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          >
            当前账号禁言状态仅以 SDK 5.0 `checkIfInMuteList()` 的真实返回为准。
          </el-alert>

          <el-alert
            v-if="isMuteAll"
            title="当前已开启全员禁言"
            type="warning"
            :closable="false"
            style="margin-bottom: 20px"
          >
            全员禁言状态下，除白名单成员外，其他成员均不能发言。
            禁言列表仅显示被单独禁言的用户，全员禁言不会自动将所有用户添加到禁言列表中。
          </el-alert>

          <el-alert
            v-else-if="hasAdminPermission && mutelist.length === 0"
            title="当前没有被单独禁言的用户"
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          >
            禁言列表仅显示被单独禁言的用户。要禁止所有用户发言，请使用"全员禁言"功能。
          </el-alert>

          <el-table v-if="hasAdminPermission" :data="mutelist" stripe>
            <el-table-column prop="user.userId" label="用户ID" />
            <el-table-column prop="muteExpire" label="禁言到期时间">
              <template #default="{ row }">
                {{ formatMuteExpire(row.muteExpire) }}
              </template>
            </el-table-column>
            <el-table-column label="操作">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  @click="unmuteMember(row.user.userId)"
                  :disabled="!hasAdminPermission"
                >
                  解除禁言
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="管理员" name="admins">
          <div class="toolbar">
            <el-input
              v-model="adminInput"
              placeholder="请输入用户ID"
              style="width: 200px; margin-right: 10px"
              clearable
              :disabled="!isOwner"
            />
            <el-button type="primary" @click="setAdmin(adminInput)" :disabled="!isOwner"
              >添加管理员</el-button
            >
          </div>
          <el-alert
            v-if="!isOwner"
            title="仅聊天室所有者可添加或移除管理员"
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          />
          <el-table :data="admins" stripe>
            <el-table-column prop="userId" label="用户ID" />
            <el-table-column label="操作">
              <template #default="{ row }">
                <el-button
                  type="danger"
                  size="small"
                  @click="removeAdmin(row.userId)"
                  :disabled="!isOwner"
                >
                  移除管理员
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.chatroom_member_management {
  padding: 20px;
  height: 100%;
  overflow-y: auto;

  .management_card {
    margin-top: 20px;
    min-height: 400px;

    .toolbar {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
    }

    :deep(.el-table) {
      min-height: 300px;
    }
  }
}

/* 将所有输入框改为长方形 */
:deep(.el-input__inner),
:deep(.el-input--textarea .el-textarea__inner) {
  border-radius: 0 !important;
}
</style>
