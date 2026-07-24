<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCurrentUserId, requireManager } from '@/IM';
import { CONVERSATION_TYPE } from '@/IM/constant';
import { DEFAULT_EASEMOB_REST_URL } from '@/IM/config';
import { logChatroomActionResult } from '@/utils/chatroomActionLog';
import {
  getSdk5ErrorInfo,
  getSdk5ErrorMessage,
  isSdk5AuthenticationError,
} from '@/utils/sdk5ErrorInfo';

const route = useRoute();
const router = useRouter();
const store = useStore();

const chatroomDetails = ref({});
const loading = ref(false);
const admins = ref([]);
const isCurrentUserJoined = ref(false);
const membershipLoading = ref(false);
const chatRoomManager = () => requireManager('chatRoomManager');
const chatRoom = () => chatRoomManager().getChatRoom(route.query.chatRoomId);
const isOwner = computed(() => {
  return chatroomDetails.value.owner?.userId === getCurrentUserId();
});
const isAdmin = computed(() =>
  admins.value.some((admin) => admin.userId === getCurrentUserId()),
);
const canUseJoinedChatroomActions = computed(() => isCurrentUserJoined.value);
const hasAnnouncementPermission = computed(() => isOwner.value || isAdmin.value);
const hasChatroomInfoPermission = computed(() => isOwner.value || isAdmin.value);

const checkLoginStatus = () => {
  if (!getCurrentUserId()) {
    router.push('/login');
    return false;
  }
  return true;
};

const normalizeChatroomId = (id) => {
  if (id == null || id === '') return '';
  return String(id);
};

const refreshCurrentUserChatroomMembership = (detail) => {
  membershipLoading.value = true;
  try {
    isCurrentUserJoined.value = detail?.permissionType != null && detail.permissionType !== 'none';
    console.log('[ChatroomDetails] current user membership read from SDK 5.0 detail', {
      chatRoomId: normalizeChatroomId(route.query.chatRoomId),
      currentUser: getCurrentUserId(),
      permissionType: detail?.permissionType,
      isCurrentUserJoined: isCurrentUserJoined.value,
    });
    return isCurrentUserJoined.value;
  } finally {
    membershipLoading.value = false;
  }
};

const showJoinedOnlyTip = () => {
  ElMessage.warning('请先加入该聊天室后再使用此功能');
};
//获取聊天室详情
const getChatroomDetails = async () => {
  if (!checkLoginStatus()) return;

  const chatRoomId = route.query.chatRoomId;
  if (!chatRoomId) {
    ElMessage.error('聊天室ID不存在');
    return;
  }
  const GET_CHAT_ROOM_DETAILS_METHOD = 'getChatRoomDetails';
  const chatRoomDetailParams = { chatRoomId };
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
      chatRoomId,
    );
    const res = await chatRoomManager().getChatRoom(chatRoomId).getInfo();
    console.log(
      `获取聊天室详情成功:`,
      `\n调用方法: ${GET_CHAT_ROOM_DETAILS_METHOD}`,
      `\n方法入参:`,
      chatRoomDetailParams,
      `\n完整返回值:`,
      res,
    );
    // 检查返回数据结构，可能是数组中的第一个元素
    chatroomDetails.value = res;

    try {
      refreshCurrentUserChatroomMembership(res);
      if (canUseJoinedChatroomActions.value) {
        await getChatRoomAdmin();
        await getChatRoomAnnouncement();
        await getChatRoomAttributes();
      } else {
        admins.value = [];
        announcement.value = '';
        attributes.value = {};
        console.info('[ChatroomDetails] 未加入聊天室，跳过成员态接口查询', {
          chatRoomId,
          currentUser: getCurrentUserId(),
        });
      }
    } catch (error) {
      console.error('获取聊天室成员状态或属性失败，已保留服务端错误:', error);
      ElMessage.error(getSdk5ErrorMessage(error, '获取聊天室成员状态或属性失败'));
    }
  } catch (error) {
    ElMessage.error('获取聊天室详情失败');
    console.error(
      `获取聊天室详情失败:`,
      `\n调用方法: ${GET_CHAT_ROOM_DETAILS_METHOD}`,
      `\n方法入参:`,
      chatRoomDetailParams,
      `\n聊天室ID:`,
      chatRoomId,
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

const refreshChatroomDetails = async () => {
  if (!checkLoginStatus()) return;

  const chatRoomId = route.query.chatRoomId;
  if (!chatRoomId) {
    ElMessage.error('聊天室ID不存在');
    return;
  }
  const REFRESH_CHAT_ROOM_DETAILS_METHOD = 'ChatRoom.refresh';
  const chatRoomDetailParams = { chatRoomId };
  loading.value = true;
  try {
    console.log('[SDK 5.0 ChatRoom] refresh start', {
      method: REFRESH_CHAT_ROOM_DETAILS_METHOD,
      params: chatRoomDetailParams,
      currentUser: getCurrentUserId(),
    });
    const res = await chatRoom().refresh();
    console.log('[SDK 5.0 ChatRoom] refresh success', {
      method: REFRESH_CHAT_ROOM_DETAILS_METHOD,
      params: chatRoomDetailParams,
      result: res,
    });
    chatroomDetails.value = res;
    refreshCurrentUserChatroomMembership(res);
    if (canUseJoinedChatroomActions.value) {
      await getChatRoomAdmin();
      await getChatRoomAnnouncement();
      await getChatRoomAttributes();
    } else {
      admins.value = [];
      announcement.value = '';
      attributes.value = {};
      console.info('[ChatroomDetails] 未加入聊天室，跳过成员态接口查询', {
        chatRoomId,
        currentUser: getCurrentUserId(),
      });
    }
    return res;
  } catch (error) {
    console.error('[SDK 5.0 ChatRoom] refresh failed', {
      method: REFRESH_CHAT_ROOM_DETAILS_METHOD,
      params: chatRoomDetailParams,
      currentUser: getCurrentUserId(),
      error,
    });
    ElMessage.error(getSdk5ErrorMessage(error, '刷新聊天室详情失败'));
    throw error;
  } finally {
    loading.value = false;
  }
};
//退出聊天室
const leaveChatroom = async () => {
  if (!checkLoginStatus()) return;
  if (!canUseJoinedChatroomActions.value) {
    showJoinedOnlyTip();
    return;
  }
  const LEAVE_CHAT_ROOM_METHOD = 'leaveChatRoom';
  const targetChatRoomId = route.query.chatRoomId;
  const leaveChatRoomParams = { chatRoomId: targetChatRoomId };
  try {
    console.log(
      `开始执行退出聊天室操作:`,
      `\n调用方法: ${LEAVE_CHAT_ROOM_METHOD}`,
      `\n目标聊天室ID:`,
      targetChatRoomId,
      `\n当前操作用户:`,
      getCurrentUserId(),
    );
    await ElMessageBox.confirm('确定要退出该聊天室吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    const res = await chatRoomManager().getChatRoom(targetChatRoomId).leaveChatRoom();
    logChatroomActionResult(
      'ChatroomDetails',
      LEAVE_CHAT_ROOM_METHOD,
      leaveChatRoomParams,
      res,
      {
        currentUserId: getCurrentUserId(),
      },
    );
    store.commit('SET_JOINED_CHATROOM_STATUS', {
      chatRoomId: targetChatRoomId,
      joined: false,
    });
    console.log(
      `退出聊天室成功:`,
      `\n调用方法: ${LEAVE_CHAT_ROOM_METHOD}`,
      `\n方法入参:`,
      leaveChatRoomParams,
      `\n接口返回结果:`,
      res,
      `\n已退出聊天室ID:`,
      targetChatRoomId,
      `\n跳转页面: /chat/chatroom`,
    );
    ElMessage.success('退出聊天室成功');
    router.push('/chat/chatroom');
  } catch (error) {
    if (error !== 'cancel') {
      console.error(
        `退出聊天室失败:`,
        `\n调用方法: ${LEAVE_CHAT_ROOM_METHOD}`,
        `\n方法入参:`,
        leaveChatRoomParams,
        `\n目标聊天室ID:`,
        targetChatRoomId,
        `\n当前用户:`,
        getCurrentUserId(),
        `\n错误码:`,
        error.code,
        `\n错误消息:`,
        error.message,
        `\n完整错误信息:`,
        error,
      );
      ElMessage.error('退出聊天室失败');
      console.error('退出聊天室失败', error);
      if (isSdk5AuthenticationError(error)) {
        ElMessage.error('认证失败，请重新登录');
      } else {
        ElMessage.error('退出聊天室失败');
      }
    }
  }
};
//解散聊天室
const destroyChatroom = async () => {
  if (!checkLoginStatus()) return;
  const DESTROY_CHAT_ROOM_METHOD = 'destroyChatRoom';
  const chatRoomId = route.query.chatRoomId;
  const destroyChatRoomParams = { chatRoomId };
  try {
    console.log(
      `开始执行解散聊天室操作:`,
      `\n目标聊天室ID:`,
      chatRoomId,
      `\n当前操作用户:`,
      getCurrentUserId(),
    );
    await ElMessageBox.confirm(
      '确定要解散该聊天室吗？此操作不可恢复！',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
    console.log(
      `用户确认解散聊天室，开始调用接口:`,
      `\n调用方法: ${DESTROY_CHAT_ROOM_METHOD}`,
      `\n方法入参:`,
      destroyChatRoomParams,
      `\n聊天室ID:`,
      chatRoomId,
    );
    throw new Error('SDK 5.0 current package does not expose destroyChatRoom; no fallback is configured.');
  } catch (error) {
    ElMessage.error('解散聊天室失败');
    console.error(
      `解散聊天室失败:`,
      `\n调用方法: ${DESTROY_CHAT_ROOM_METHOD}`,
      `\n方法入参:`,
      destroyChatRoomParams,
      `\n聊天室ID:`,
      chatRoomId,
      `\n错误详情:`,
      error,
    );
    if (error !== 'cancel') {
      console.error('解散聊天室失败', error);
      if (isSdk5AuthenticationError(error)) {
        ElMessage.error('认证失败，请重新登录');
      } else {
        ElMessage.error('解散聊天室失败');
      }
    }
  }
};

const showEditDialog = ref(false);
const editForm = ref({
  name: '',
  description: '',
  maxMembers: 200,
});

const openEditDialog = () => {
  editForm.value = {
    name: chatroomDetails.value.name || '',
    description: chatroomDetails.value.description || '',
    maxMembers: chatroomDetails.value.maxMembers || 200,
  };
  showEditDialog.value = true;
};

const modifyChatRoom = async () => {
  if (!checkLoginStatus()) return;
  if (!hasChatroomInfoPermission.value) {
    ElMessage.error('只有聊天室所有者或管理员可以修改聊天室信息');
    return;
  }

  try {
    await chatRoom().updateInfo(editForm.value);
    ElMessage.success('修改聊天室信息成功');
    showEditDialog.value = false;
    await refreshChatroomDetails();
  } catch (error) {
    console.error('修改聊天室信息失败', error);
    if (isSdk5AuthenticationError(error)) {
      ElMessage.error('认证失败，请重新登录');
    } else {
      ElMessage.error(getSdk5ErrorMessage(error, '修改聊天室信息失败'));
    }
  }
};

const announcement = ref('');
const showAnnouncementDialog = ref(false);
const announcementForm = ref({
  announcement: '',
});

const getChatRoomAnnouncement = async () => {
  if (!checkLoginStatus()) return;

  try {
    const res = await chatRoom().getAnnouncement();
    console.log('获取聊天室公告成功:', res);
    announcement.value = res.announcement || '';
  } catch (error) {
    console.error('获取聊天室公告失败', error);
    if (isSdk5AuthenticationError(error)) {
      ElMessage.error('认证失败，请重新登录');
    }
  }
};

const openAnnouncementDialog = () => {
  announcementForm.value.announcement = announcement.value;
  showAnnouncementDialog.value = true;
};

const updateChatRoomAnnouncement = async () => {
  if (!checkLoginStatus()) return;
  if (!hasAnnouncementPermission.value) {
    ElMessage.error('只有聊天室所有者或管理员可以更新聊天室公告');
    return;
  }

  try {
    await chatRoom().updateAnnouncement({
      announcement: announcementForm.value.announcement,
    });
    ElMessage.success('更新聊天室公告成功');
    showAnnouncementDialog.value = false;
    getChatRoomAnnouncement();
  } catch (error) {
    console.error('更新聊天室公告失败', error);
    if (isSdk5AuthenticationError(error)) {
      ElMessage.error('认证失败，请重新登录');
    } else {
      ElMessage.error(getSdk5ErrorMessage(error, '更新聊天室公告失败'));
    }
  }
};

const getChatRoomAdmin = async () => {
  if (!checkLoginStatus()) return;
  if (!route.query.chatRoomId) return;
  try {
    const res = await chatRoom().getAdminList();
    admins.value = res;
  } catch (error) {
    console.error('获取聊天室管理员失败', error);
  }
};

const attributes = ref({});
const DEFAULT_ATTRIBUTE_KEY = 'demoKey';
const DEFAULT_ATTRIBUTE_VALUE = 'demoValue';
const DEFAULT_BATCH_ATTRIBUTES = JSON.stringify(
  {
    demoKey1: 'demoValue1',
    demoKey2: 'demoValue2',
  },
  null,
  2,
);
const showAttributeDialog = ref(false);
const attributeForm = ref({
  attributeKey: DEFAULT_ATTRIBUTE_KEY,
  attributeValue: DEFAULT_ATTRIBUTE_VALUE,
  autoDelete: true,
  isForced: false,
});
const showBatchAttributeDialog = ref(false);
const batchAttributeForm = ref({
  attributes: DEFAULT_BATCH_ATTRIBUTES,
  autoDelete: true,
  isForced: false,
});

const normalizeErrorLog = (error) => ({
  name: error?.name,
  ...getSdk5ErrorInfo(error),
  stack: error?.stack,
  rawError: error,
});

const confirmChatRoomAttributeMutation = (action, result, expectedKeys) => {
  const appliedKeys = Array.isArray(result?.appliedKeys)
    ? result.appliedKeys
    : [];
  const missingKeys = expectedKeys.filter((key) => !appliedKeys.includes(key));

  if (missingKeys.length === 0) return true;

  console.error(`[ChatroomAttributeError] ${action} 未被 SDK 确认`, {
    chatRoomId: route.query.chatRoomId,
    currentUser: getCurrentUserId(),
    expectedKeys,
    appliedKeys,
    failedKeys: result?.failedKeys,
    result,
  });
  ElMessage.error(`${action}失败：SDK 未确认属性 ${missingKeys.join('、')}`);
  return false;
};

const normalizeChatRoomAttributesInput = (attributes) => {
  if (
    !attributes ||
    typeof attributes !== 'object' ||
    Array.isArray(attributes)
  ) {
    throw new Error('属性必须是 JSON 对象，例如 {"key1":"value1"}');
  }

  return Object.entries(attributes).reduce((result, [key, value]) => {
    const attributeKey = String(key).trim();
    if (!attributeKey) {
      throw new Error('属性键不能为空');
    }
    if (value == null) {
      throw new Error(`属性 ${attributeKey} 的值不能为空`);
    }
    result[attributeKey] =
      typeof value === 'string' ? value : JSON.stringify(value);
    return result;
  }, {});
};

const getChatRoomAttributes = async () => {
  if (!checkLoginStatus()) return;

  const chatRoomId = route.query.chatRoomId;
  if (!chatRoomId) {
    console.error('聊天室ID不存在，无法获取自定义属性');
    return;
  }

  try {
    const requestParams = { chatRoomId };

    const res = await chatRoom().getAttributes();
    console.log('获取聊天室自定义属性成功:', res);
    attributes.value = res.attributes;
    return res;
  } catch (error) {
    console.error('获取聊天室自定义属性失败:', error);

    if (isSdk5AuthenticationError(error)) {
      ElMessage.error('认证失败，请重新登录');
    } else if (getSdk5ErrorMessage(error).includes('CORS') || getSdk5ErrorMessage(error).includes('Access-Control-Allow-Origin')) {
      // 处理CORS错误
      console.error('CORS错误: 浏览器阻止了跨域请求，请检查服务器的CORS配置');
    }

    throw error;
  }
};

const openAttributeDialog = () => {
  if (!canUseJoinedChatroomActions.value) {
    showJoinedOnlyTip();
    return;
  }
  attributeForm.value = {
    attributeKey: DEFAULT_ATTRIBUTE_KEY,
    attributeValue: DEFAULT_ATTRIBUTE_VALUE,
    autoDelete: true,
    isForced: false,
  };
  showAttributeDialog.value = true;
};

const setChatRoomAttribute = async () => {
  if (!checkLoginStatus()) return;
  if (!canUseJoinedChatroomActions.value) {
    showJoinedOnlyTip();
    return;
  }

  if (
    !attributeForm.value.attributeKey ||
    !attributeForm.value.attributeKey.trim()
  ) {
    ElMessage.warning('请输入属性键');
    return;
  }

  try {
    const params = {
      chatRoomId: route.query.chatRoomId,
      attributeKey: attributeForm.value.attributeKey.trim(),
      attributeValue: String(attributeForm.value.attributeValue),
      autoDelete: attributeForm.value.autoDelete,
      isForced: attributeForm.value.isForced,
    };
    const res = await chatRoom().setAttributes({ attributes: { [params.attributeKey]: params.attributeValue }, autoDelete: params.autoDelete, isForced: params.isForced });
    console.log(
      `设置聊天室属性成功:`,
      `\n事件：设置单个聊天室属性`,
      `\n方法入参:`,
      params,
      `\n返回值:`,
      res,
    );
    if (!confirmChatRoomAttributeMutation('设置聊天室属性', res, [params.attributeKey])) {
      return;
    }
    ElMessage.success('设置聊天室属性成功');
    showAttributeDialog.value = false;
    getChatRoomAttributes();
  } catch (error) {
    console.error('设置聊天室属性失败', normalizeErrorLog(error));
    if (isSdk5AuthenticationError(error)) {
      ElMessage.error('认证失败，请重新登录');
    } else {
      ElMessage.error(getSdk5ErrorMessage(error, '设置聊天室属性失败'));
    }
  }
};

const openBatchAttributeDialog = () => {
  if (!canUseJoinedChatroomActions.value) {
    showJoinedOnlyTip();
    return;
  }
  batchAttributeForm.value = {
    attributes: DEFAULT_BATCH_ATTRIBUTES,
    autoDelete: true,
    isForced: false,
  };
  showBatchAttributeDialog.value = true;
};

const setChatRoomAttributes = async () => {
  if (!checkLoginStatus()) return;
  if (!canUseJoinedChatroomActions.value) {
    showJoinedOnlyTip();
    return;
  }

  if (
    !batchAttributeForm.value.attributes ||
    !batchAttributeForm.value.attributes.trim()
  ) {
    ElMessage.warning('请输入属性');
    return;
  }

  try {
    const parsedAttributes = JSON.parse(batchAttributeForm.value.attributes);
    const attributesObj = normalizeChatRoomAttributesInput(parsedAttributes);
    if (Object.keys(attributesObj).length === 0) {
      ElMessage.warning('请至少输入一个属性');
      return;
    }

    const params = {
      chatRoomId: route.query.chatRoomId,
      attributes: attributesObj,
      autoDelete: batchAttributeForm.value.autoDelete,
      isForced: batchAttributeForm.value.isForced,
    };
    const res = await chatRoom().setAttributes({
      attributes: params.attributes,
      autoDelete: params.autoDelete,
      isForced: params.isForced,
    });
    console.log(
      `批量设置聊天室属性成功:`,
      `\n事件：批量设置聊天室属性`,
      `\n方法入参:`,
      params,
      `\n返回值:`,
      res,
    );
    if (!confirmChatRoomAttributeMutation('批量设置聊天室属性', res, Object.keys(attributesObj))) {
      return;
    }
    ElMessage.success('批量设置聊天室属性成功');
    showBatchAttributeDialog.value = false;
    getChatRoomAttributes();
  } catch (error) {
    console.error('批量设置聊天室属性失败', normalizeErrorLog(error));
    if (isSdk5AuthenticationError(error)) {
      ElMessage.error('认证失败，请重新登录');
    } else if (error instanceof SyntaxError) {
      ElMessage.error('属性格式错误，请输入有效的JSON格式');
    } else {
      ElMessage.error(getSdk5ErrorMessage(error, '批量设置聊天室属性失败'));
    }
  }
};

const removeChatRoomAttribute = async (key) => {
  if (!checkLoginStatus()) return;
  if (!canUseJoinedChatroomActions.value) {
    showJoinedOnlyTip();
    return;
  }

  try {
    await ElMessageBox.confirm(`确定要删除属性 "${key}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    const params = {
      chatRoomId: route.query.chatRoomId,
      attributeKey: key,
      isForced: false,
    };
    const res = await chatRoom().removeAttributes({ keys: [params.attributeKey], isForced: params.isForced });
    console.log(
      `删除聊天室属性成功:`,
      `\n事件：删除聊天室属性`,
      `\n方法入参:`,
      params,
      `\n返回值:`,
      res,
    );
    if (!confirmChatRoomAttributeMutation('删除聊天室属性', res, [params.attributeKey])) {
      return;
    }
    ElMessage.success('删除聊天室属性成功');
    getChatRoomAttributes();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除聊天室属性失败', normalizeErrorLog(error));
      if (isSdk5AuthenticationError(error)) {
        ElMessage.error('认证失败，请重新登录');
      } else if (getSdk5ErrorMessage(error).includes('not part of you') || getSdk5ErrorMessage(error).includes('permission')) {
        ElMessage.error('没有权限删除该属性');
      } else {
        ElMessage.error(getSdk5ErrorMessage(error, '删除聊天室属性失败'));
      }
    }
  }
};

const removeChatRoomAttributes = async () => {
  if (!checkLoginStatus()) return;
  if (!canUseJoinedChatroomActions.value) {
    showJoinedOnlyTip();
    return;
  }
  const attributeKeys = Object.keys(attributes.value || {});
  if (attributeKeys.length === 0) {
    ElMessage.warning('当前没有可删除的聊天室属性');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要批量删除 ${attributeKeys.length} 个聊天室属性吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
    const params = {
      chatRoomId: route.query.chatRoomId,
      attributeKeys,
      isForced: false,
    };
    const res = await chatRoom().removeAttributes({ keys: params.attributeKeys, isForced: params.isForced });
    console.log(
      `批量删除聊天室属性成功:`,
      `\n事件：批量删除聊天室属性`,
      `\n方法入参:`,
      params,
      `\n返回值:`,
      res,
    );
    if (!confirmChatRoomAttributeMutation('批量删除聊天室属性', res, params.attributeKeys)) {
      return;
    }
    ElMessage.success('批量删除聊天室属性成功');
    getChatRoomAttributes();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除聊天室属性失败', normalizeErrorLog(error));
      if (isSdk5AuthenticationError(error)) {
        ElMessage.error('认证失败，请重新登录');
      } else if (
        getSdk5ErrorMessage(error).includes('not part of you') ||
        getSdk5ErrorMessage(error).includes('permission')
      ) {
        ElMessage.error('没有权限删除这些属性');
      } else {
        ElMessage.error(getSdk5ErrorMessage(error, '批量删除聊天室属性失败'));
      }
    }
  }
};

const registerChatroomDetailEventHandler = () => {
  chatRoomManager().removeEventHandler('CHATROOM_DETAILS');
  chatRoomManager().addEventHandler(
    'CHATROOM_DETAILS',
    {
      onChatRoomInfoChanged: getChatroomDetails,
      onAdminAdded: getChatRoomAdmin,
      onAdminRemoved: getChatRoomAdmin,
      onAnnouncementChanged: getChatRoomAnnouncement,
      onAttributesUpdate: getChatRoomAttributes,
      onAttributesRemoved: getChatRoomAttributes,
      onChatRoomDestroyed: () => {
        ElMessage.warning('当前聊天室已被解散');
        router.push('/chat/chatroom');
      },
    },
  );
};

onMounted(() => {
  getChatroomDetails();
  registerChatroomDetailEventHandler();
});

onUnmounted(() => {
  chatRoomManager().removeEventHandler('CHATROOM_DETAILS');
});

watch(
  () => route.fullPath,
  () => {
    if (route.query.chatRoomId) {
      getChatroomDetails();
      registerChatroomDetailEventHandler();
    }
  },
);

</script>

<template>
  <div class="chatroom_details_container">
    <el-page-header @back="() => router.back()" title="返回聊天室列表">
      <template #content>
        <span class="text-large font-600 mr-3"> 聊天室详情 </span>
      </template>
    </el-page-header>

    <el-card v-loading="loading" class="details_card">
      <template #header>
        <div class="card_header">
          <span>聊天室信息</span>
        </div>
      </template>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="聊天室ID">
          {{ chatroomDetails.chatRoomId }}
        </el-descriptions-item>
        <el-descriptions-item label="聊天室名称">
          {{ chatroomDetails.name }}
        </el-descriptions-item>
        <el-descriptions-item label="聊天室描述">
          {{ chatroomDetails.description || '暂无描述' }}
        </el-descriptions-item>
        <el-descriptions-item label="聊天室公告">
          {{ announcement || '暂无公告' }}
        </el-descriptions-item>
        <el-descriptions-item label="所有者">
          {{ chatroomDetails.owner?.userId || '未知' }}
        </el-descriptions-item>
        <el-descriptions-item label="最大成员数">
          {{ chatroomDetails.maxMembers ?? '--' }}
        </el-descriptions-item>
        <el-descriptions-item label="当前成员数">
          {{ chatroomDetails.memberCount ?? 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ chatroomDetails.createdAt || '未知' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-alert
        v-if="!canUseJoinedChatroomActions"
        class="joined_only_alert"
        title="当前用户未加入该聊天室，仅展示基础详情；进入、成员管理和自定义属性操作需先加入聊天室。"
        type="warning"
        :closable="false"
        show-icon
      />

      <div class="action_buttons">
        <el-button
          type="primary"
          :disabled="!canUseJoinedChatroomActions"
          @click="
            () =>
              router.push({
                path: '/chat/chatroom/message',
                query: {
                  conversationId: route.query.chatRoomId,
                  conversationType: CONVERSATION_TYPE.CHATROOM,
                },
              })
          "
        >
          进入聊天室
        </el-button>
        <el-button
          type="success"
          :disabled="!canUseJoinedChatroomActions"
          @click="
            () =>
              router.push({
                path: '/chat/chatroom/member-management',
                query: { chatRoomId: route.query.chatRoomId },
              })
          "
        >
          成员管理
        </el-button>
        <el-button type="primary" plain @click="refreshChatroomDetails">
          刷新聊天室详情
        </el-button>
        <el-button v-if="hasChatroomInfoPermission" @click="openEditDialog">
          修改聊天室信息
        </el-button>
        <el-button v-if="hasAnnouncementPermission" @click="openAnnouncementDialog">
          更新公告
        </el-button>
        <el-button
          :disabled="!canUseJoinedChatroomActions"
          @click="openAttributeDialog"
        >
          添加自定义属性
        </el-button>
        <el-button
          :disabled="!canUseJoinedChatroomActions"
          @click="openBatchAttributeDialog"
        >
          批量添加属性
        </el-button>
        <el-button :disabled="!canUseJoinedChatroomActions" @click="leaveChatroom">
          退出聊天室
        </el-button>
        <el-button v-if="isOwner" type="danger" @click="destroyChatroom">
          解散聊天室
        </el-button>
      </div>
    </el-card>

    <el-card v-if="Object.keys(attributes).length > 0" class="attributes_card">
      <template #header>
        <div class="card_header">
          <span>自定义属性</span>
          <el-button type="danger" size="small" @click="removeChatRoomAttributes">
            批量删除属性
          </el-button>
        </div>
      </template>

      <el-table
        :data="
          Object.entries(attributes).map(([key, value]) => ({ key, value }))
        "
        border
      >
        <el-table-column prop="key" label="属性键" width="200" />
        <el-table-column prop="value" label="属性值" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              @click="removeChatRoomAttribute(row.key)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showEditDialog" title="修改聊天室信息" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="聊天室名称">
          <el-input
            v-model="editForm.name"
            placeholder="请输入聊天室名称"
          />
        </el-form-item>
        <el-form-item label="聊天室描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            placeholder="请输入聊天室描述"
          />
        </el-form-item>
        <el-form-item label="最大成员数">
          <el-input-number v-model="editForm.maxMembers" :min="1" :max="5000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="modifyChatRoom">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showAnnouncementDialog"
      title="更新聊天室公告"
      width="500px"
    >
      <el-form :model="announcementForm" label-width="100px">
        <el-form-item label="公告内容">
          <el-input
            v-model="announcementForm.announcement"
            type="textarea"
            :rows="4"
            placeholder="请输入公告内容（最多512个字符）"
            maxlength="512"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAnnouncementDialog = false">取消</el-button>
          <el-button type="primary" @click="updateChatRoomAnnouncement"
            >确定</el-button
          >
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showAttributeDialog"
      title="添加自定义属性"
      width="500px"
    >
      <el-form :model="attributeForm" label-width="150px">
        <el-form-item label="属性键">
          <el-input
            v-model="attributeForm.attributeKey"
            placeholder="请输入属性键"
          />
        </el-form-item>
        <el-form-item label="属性值">
          <el-input
            v-model="attributeForm.attributeValue"
            placeholder="请输入属性值"
          />
        </el-form-item>
        <el-form-item label="退出时删除">
          <el-switch v-model="attributeForm.autoDelete" />
        </el-form-item>
        <el-form-item label="强制设置">
          <el-switch v-model="attributeForm.isForced" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAttributeDialog = false">取消</el-button>
          <el-button type="primary" @click="setChatRoomAttribute"
            >确定</el-button
          >
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showBatchAttributeDialog"
      title="批量添加自定义属性"
      width="600px"
    >
      <el-form :model="batchAttributeForm" label-width="150px">
        <el-form-item label="属性（JSON格式）">
          <el-input
            v-model="batchAttributeForm.attributes"
            type="textarea"
            :rows="6"
            placeholder='请输入属性，例如：{"key1":"value1","key2":"value2"}'
            class="square-textarea"
          />
        </el-form-item>
        <el-form-item label="退出时删除">
          <el-switch v-model="batchAttributeForm.autoDelete" />
        </el-form-item>
        <el-form-item label="强制设置">
          <el-switch v-model="batchAttributeForm.isForced" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showBatchAttributeDialog = false">取消</el-button>
          <el-button type="primary" @click="setChatRoomAttributes"
            >确定</el-button
          >
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.chatroom_details_container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;

  .details_card,
  .attributes_card {
    margin-top: 20px;

    .card_header {
      font-weight: 600;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .action_buttons {
      margin-top: 20px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .chatroom_dnd_row {
      margin-top: 16px;
      padding: 12px 0;
      border-bottom: 1px solid #ebeef5;
    }

    .joined_only_alert {
      margin-top: 16px;
    }
  }
}

/* 将所有输入框改为长方形 - 使用更具体的选择器 */
.chatroom_details_container :deep(.el-input__inner),
.chatroom_details_container :deep(.el-input--textarea .el-textarea__inner) {
  border-radius: 0 !important;
  box-sizing: border-box;
}

/* 确保批量添加自定义属性对话框中的textarea为长方形 - 最具体的选择器 */
.chatroom_details_container
  :deep(
    .el-dialog[title='批量添加自定义属性']
      .el-form-item
      .el-input.el-input--textarea
      .el-textarea__inner
  ) {
  border-radius: 0 !important;
  box-sizing: border-box;
  outline: none;
}

/* 直接针对square-textarea类的样式 - 最高优先级 */
.chatroom_details_container
  :deep(.el-input.square-textarea.el-input--textarea .el-textarea__inner) {
  border-radius: 0 !important;
  box-sizing: border-box;
  outline: none;
}

/* 最直接的选择器，确保覆盖所有其他样式 */
.chatroom_details_container :deep(textarea) {
  border-radius: 0 !important;
  box-sizing: border-box;
  outline: none;
}
</style>

/* 非scoped样式，确保全局覆盖 */
<style lang="scss">
/* 直接针对批量添加自定义属性对话框的textarea */
.el-dialog[title='批量添加自定义属性']
  .el-form-item
  .el-input.el-input--textarea
  .el-textarea__inner {
  border-radius: 0 !important;
  box-sizing: border-box;
  outline: none;
}

/* 全局覆盖所有Element Plus的textarea样式 */
.el-textarea__inner {
  border-radius: 0 !important;
  box-sizing: border-box;
  outline: none;
}
</style>
