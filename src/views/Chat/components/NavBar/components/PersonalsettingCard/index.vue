<script setup>
import { ref, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { usePlayRing, useSetEMLogConfig } from '@/hooks';
import { RefreshRight } from '@element-plus/icons-vue';
import store from '@/store';
import { USER_INFO_ATTRIBUTES } from '@/store/modules/usersProfile';
import { getCurrentImEnvironmentInfo } from '@/utils/currentImEnvironment';

const dialogVisible = ref(false);
const { isOpenPlayRing } = usePlayRing();
const { isOpenedEMLog, donwLoadEMLog } = useSetEMLogConfig();
const presencePageNum = ref(1);
const presencePageSize = 50;
const loadingSubscribedPresence = ref(false);
const loadingBlackList = ref(false);
const userInfoExtendedLoading = ref('');
const userInfoQueryUserIdsInput = ref('');
const userInfoQueryAttributes = ref(['nickname', 'avatarUrl']);
const userInfoSubscriptionUserIdsInput = ref('');
const userInfoUpdateAttribute = ref('nickname');
const userInfoUpdateValueInput = ref('');
const userInfoUpdateValueType = ref('string');
const sdkDiagnosticsLoading = ref('');
const chatClientRenewTokenInput = ref('');
const pushDeviceIdInput = ref('');
const pushDeviceTokenInput = ref('');
const pushNotifierNameInput = ref('');
const pushGlobalRemindType = ref('ALL');
const pushLanguageInput = ref('zh-Hans');
const pushConversationListInput = ref('');
const pushRemindTypePageSize = ref(20);
const pushRemindTypeCursor = ref('');
const currentEnvironmentInfo = computed(() => getCurrentImEnvironmentInfo());
const subscribedPresenceList = computed(
  () => store.getters.getSubscribedPresenceList,
);
const friendBlackList = computed(() => store.state.Contacts.friendBlackList || []);
const userInfoEventLogs = computed(
  () => store.state.UsersProfile.userInfoEventLogs,
);
const userInfoAttributeQueryResult = computed(
  () => store.state.UsersProfile.userInfoAttributeQueryResult,
);
const subscribedUsersInfo = computed(
  () => store.state.UsersProfile.subscribedUsersInfo,
);
const userInfoOperationResult = computed(
  () => store.state.UsersProfile.userInfoOperationResult,
);
const userInfoOperationError = computed(
  () => store.state.UsersProfile.userInfoOperationError,
);
const sdkDiagnosticsResult = computed(
  () => store.state.SdkDiagnostics.sdkDiagnosticsResult,
);
const sdkDiagnosticsError = computed(
  () => store.state.SdkDiagnostics.sdkDiagnosticsError,
);
const sdkDiagnosticsRawResult = computed(() => ({
  lastOperation: sdkDiagnosticsResult.value,
  lastError: sdkDiagnosticsError.value,
}));

const parseUserIds = (value) =>
  value
    .split(/[\s,，;；]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const userInfoQueryUserIds = computed(() =>
  parseUserIds(userInfoQueryUserIdsInput.value),
);
const userInfoSubscriptionUserIds = computed(() =>
  parseUserIds(userInfoSubscriptionUserIdsInput.value),
);
const normalizedUserInfoAttributeValue = computed(() => {
  if (userInfoUpdateValueType.value === 'number') {
    return Number(userInfoUpdateValueInput.value);
  }
  if (userInfoUpdateValueType.value === 'boolean') {
    return userInfoUpdateValueInput.value === 'true';
  }
  return userInfoUpdateValueInput.value;
});
const rawUserInfoResult = computed(() => ({
  lastOperation: userInfoOperationResult.value,
  attributeQueryResult: userInfoAttributeQueryResult.value,
  subscribedUsersInfo: subscribedUsersInfo.value,
  eventLogs: userInfoEventLogs.value,
}));

const formatRawValue = (value) => {
  const seen = new WeakSet();
  return JSON.stringify(
    value,
    (key, item) => {
      if (/token|authorization/i.test(key) && typeof item === 'string') {
        return {
          redacted: true,
          length: item.length,
        };
      }
      if (typeof item === 'function') {
        return `[Function ${item.name || 'anonymous'}]`;
      }
      if (item && typeof item === 'object') {
        if (seen.has(item)) {
          return '[Circular]';
        }
        seen.add(item);
      }
      if (item instanceof Error) {
        return {
          name: item.name,
          message: item.message,
          statusCode: item.statusCode,
          code: item.code,
        };
      }
      return item;
    },
    2,
  );
};

const refreshSubscribedPresenceList = async () => {
  loadingSubscribedPresence.value = true;
  try {
    await store.dispatch('fetchSubscribedPresenceList', {
      pageNum: presencePageNum.value,
      pageSize: presencePageSize,
    });
  } catch (error) {
    console.error('[PersonalsettingCard] fetchSubscribedPresenceList failed', error);
    ElMessage.error(error?.message || '在线状态订阅列表刷新失败');
  } finally {
    loadingSubscribedPresence.value = false;
  }
};

const refreshBlackList = async () => {
  loadingBlackList.value = true;
  try {
    await store.dispatch('fetchBlackList');
  } finally {
    loadingBlackList.value = false;
  }
};

const showUserInfoError = (error) => {
  ElMessage({
    type: 'error',
    message: error?.message || String(error),
  });
};

const runUserInfoAction = async (loadingKey, action, successMessage) => {
  userInfoExtendedLoading.value = loadingKey;
  try {
    await action();
    ElMessage({
      type: 'success',
      message: successMessage,
    });
  } catch (error) {
    showUserInfoError(error);
  } finally {
    userInfoExtendedLoading.value = '';
  }
};

const showSdkDiagnosticsError = (error) => {
  ElMessage({
    type: 'error',
    message: error?.message || String(error),
  });
};

const runSdkDiagnosticsAction = async (loadingKey, action, successMessage) => {
  sdkDiagnosticsLoading.value = loadingKey;
  try {
    await action();
    ElMessage({
      type: 'success',
      message: successMessage,
    });
  } catch (error) {
    showSdkDiagnosticsError(error);
  } finally {
    sdkDiagnosticsLoading.value = '';
  }
};

const parsePushConversationList = (value) => {
  const list = value
    .split(/[\n,，;；]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [conversationId, conversationType] = item
        .split(':')
        .map((segment) => segment.trim());
      return {
        conversationId,
        conversationType,
      };
    });
  const invalid = list.find(
    (item) =>
      !item.conversationId ||
      !['singleChat', 'groupChat'].includes(item.conversationType),
  );
  if (invalid) {
    throw new Error('会话格式必须为 conversationId:singleChat 或 conversationId:groupChat');
  }
  return list;
};

const readChatClientRuntimeSnapshot = async () => {
  await runSdkDiagnosticsAction(
    'clientSnapshot',
    () => store.dispatch('SdkDiagnostics/readChatClientRuntimeSnapshot'),
    'ChatClient 运行诊断读取完成',
  );
};

const renewChatClientToken = async () => {
  if (!chatClientRenewTokenInput.value) {
    ElMessage.warning('请输入新的 SDK 5.0 Token');
    return;
  }
  await runSdkDiagnosticsAction(
    'renewToken',
    () =>
      store.dispatch('SdkDiagnostics/renewChatClientToken', {
        token: chatClientRenewTokenInput.value,
      }),
    'Token 续期调用完成',
  );
};

const uploadPushToken = async () => {
  if (
    !pushDeviceIdInput.value ||
    !pushDeviceTokenInput.value ||
    !pushNotifierNameInput.value
  ) {
    ElMessage.warning('请输入 deviceId、deviceToken 和 notifierName');
    return;
  }
  await runSdkDiagnosticsAction(
    'uploadPushToken',
    () =>
      store.dispatch('SdkDiagnostics/uploadPushToken', {
        deviceId: pushDeviceIdInput.value,
        deviceToken: pushDeviceTokenInput.value,
        notifierName: pushNotifierNameInput.value,
      }),
    'Push Token 上传调用完成',
  );
};

const setGlobalSilentMode = async () => {
  await runSdkDiagnosticsAction(
    'setGlobalSilentMode',
    () =>
      store.dispatch('SdkDiagnostics/setGlobalSilentMode', {
        rule: {
          mode: 'REMIND_TYPE',
          remindType: pushGlobalRemindType.value,
        },
      }),
    '全局免打扰设置调用完成',
  );
};

const getGlobalSilentMode = async () => {
  await runSdkDiagnosticsAction(
    'getGlobalSilentMode',
    () => store.dispatch('SdkDiagnostics/getGlobalSilentMode'),
    '全局免打扰查询完成',
  );
};

const getConversationSilentModes = async () => {
  let conversationList = [];
  try {
    conversationList = parsePushConversationList(pushConversationListInput.value);
  } catch (error) {
    ElMessage.warning(error.message);
    return;
  }
  if (!conversationList.length) {
    ElMessage.warning('请输入要查询的单聊或群聊会话');
    return;
  }
  await runSdkDiagnosticsAction(
    'getConversationSilentModes',
    () =>
      store.dispatch('SdkDiagnostics/getConversationSilentModes', {
        conversationList,
      }),
    '批量会话免打扰查询完成',
  );
};

const setPushLanguage = async () => {
  if (!pushLanguageInput.value) {
    ElMessage.warning('请输入推送语言');
    return;
  }
  await runSdkDiagnosticsAction(
    'setPushLanguage',
    () =>
      store.dispatch('SdkDiagnostics/setPushLanguage', {
        language: pushLanguageInput.value,
      }),
    '推送语言设置调用完成',
  );
};

const getPushLanguage = async () => {
  await runSdkDiagnosticsAction(
    'getPushLanguage',
    () => store.dispatch('SdkDiagnostics/getPushLanguage'),
    '推送语言查询完成',
  );
};

const getConversationListByRemindType = async () => {
  const pageSize = Number(pushRemindTypePageSize.value);
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    ElMessage.warning('pageSize 必须是正整数');
    return;
  }
  await runSdkDiagnosticsAction(
    'getConversationListByRemindType',
    () =>
      store.dispatch('SdkDiagnostics/getConversationListByRemindType', {
        pageSize,
        cursor: pushRemindTypeCursor.value || undefined,
      }),
    '按提醒类型分页查询会话完成',
  );
};

const registerUserInfoEventHandler = async () => {
  try {
    await store.dispatch('UsersProfile/registerUserInfoEventHandler');
  } catch (error) {
    console.error('[UserInfoManager UI] register event handler failed', {
      error,
    });
    showUserInfoError(error);
  }
};

const removeUserInfoEventHandler = async () => {
  try {
    await store.dispatch('UsersProfile/removeUserInfoEventHandler');
  } catch (error) {
    console.error('[UserInfoManager UI] remove event handler failed', {
      error,
    });
  }
};

const fetchUserInfoByAttribute = async () => {
  if (!userInfoQueryUserIds.value.length) {
    ElMessage.warning('请输入要查询的用户 ID');
    return;
  }
  if (!userInfoQueryAttributes.value.length) {
    ElMessage.warning('请选择要查询的 SDK 5.0 用户资料属性');
    return;
  }
  await runUserInfoAction(
    'query',
    () =>
      store.dispatch('UsersProfile/fetchUserInfoByAttribute', {
        userIds: userInfoQueryUserIds.value,
        attributes: userInfoQueryAttributes.value,
      }),
    '用户资料查询完成',
  );
};

const subscribeUsersInfo = async () => {
  if (!userInfoSubscriptionUserIds.value.length) {
    ElMessage.warning('请输入要订阅的用户 ID');
    return;
  }
  await runUserInfoAction(
    'subscribe',
    () =>
      store.dispatch('UsersProfile/subscribeUsersInfo', {
        userIds: userInfoSubscriptionUserIds.value,
      }),
    '用户资料订阅完成',
  );
};

const unsubscribeUsersInfo = async () => {
  if (!userInfoSubscriptionUserIds.value.length) {
    ElMessage.warning('请输入要取消订阅的用户 ID');
    return;
  }
  await runUserInfoAction(
    'unsubscribe',
    () =>
      store.dispatch('UsersProfile/unsubscribeUsersInfo', {
        userIds: userInfoSubscriptionUserIds.value,
      }),
    '用户资料取消订阅完成',
  );
};

const fetchSubscribedUsersInfo = async () => {
  await runUserInfoAction(
    'subscribedUsers',
    () => store.dispatch('UsersProfile/fetchSubscribedUsersInfo'),
    '已订阅用户查询完成',
  );
};

const updateOwnInfoByAttribute = async () => {
  if (!userInfoUpdateAttribute.value) {
    ElMessage.warning('请选择要更新的 SDK 5.0 用户资料属性');
    return;
  }
  if (
    userInfoUpdateValueType.value === 'number' &&
    !Number.isFinite(normalizedUserInfoAttributeValue.value)
  ) {
    ElMessage.warning('number 类型请输入有效数字');
    return;
  }
  if (
    userInfoUpdateValueType.value === 'boolean' &&
    !['true', 'false'].includes(userInfoUpdateValueInput.value)
  ) {
    ElMessage.warning('boolean 类型请输入 true 或 false');
    return;
  }
  await runUserInfoAction(
    'updateAttribute',
    () =>
      store.dispatch('UsersProfile/updateOwnInfoByAttribute', {
        attribute: userInfoUpdateAttribute.value,
        value: normalizedUserInfoAttributeValue.value,
      }),
    '当前用户资料单属性更新完成',
  );
};

watch(dialogVisible, (visible) => {
  if (visible) {
    registerUserInfoEventHandler();
    refreshSubscribedPresenceList();
    refreshBlackList();
    fetchSubscribedUsersInfo();
  } else {
    removeUserInfoEventHandler();
  }
});
defineExpose({
  dialogVisible,
});
</script>

<template>
  <el-dialog
    custom-class="personal_setting_card"
    v-model="dialogVisible"
    width="560px"
    title="个人设置"
    :show-close="true"
    :destroy-on-close="true"
  >
    <div class="setting_main">
      <div class="setting_main_item">
        <el-tooltip
          class="item"
          effect="dark"
          content="开启后可在收到消息时，播放消息提示音。"
          placement="top"
        >
          <span>新消息提示音</span>
        </el-tooltip>

        <el-switch
          v-model="isOpenPlayRing"
          active-text="开启"
          inactive-text="关闭"
        />
      </div>
      <div class="setting_main_item">
        <el-tooltip
          class="item"
          effect="dark"
          content="开启SDK日志后，会在控制台输出SDK日志,并可下载SDK缓存日志。"
          placement="top"
        >
          <span>开启SDK日志</span></el-tooltip
        >
        <el-switch
          v-model="isOpenedEMLog"
          active-text="开启"
          inactive-text="关闭"
        />
      </div>
      <div class="setting_main_item" v-if="isOpenedEMLog">
        <el-button
          class="download_log"
          type="primary"
          plain
          @click="donwLoadEMLog"
          >下载SDK缓存日志</el-button
        >
      </div>
      <div class="setting_main_item">
        <el-tooltip
          class="item"
          effect="dark"
          content="当前按文档推荐使用服务端会话列表初始化，并通过消息回调更新缓存。"
          placement="top"
        >
          <span>会话列表来源</span>
        </el-tooltip>
        <span>服务端获取</span>
      </div>
      <div class="environment_section">
        <div class="presence_section_header">
          <span>当前运行环境</span>
        </div>
        <div class="environment_info_list">
          <div class="environment_info_item">
            <span>环境</span>
            <span>{{ currentEnvironmentInfo.label }}</span>
          </div>
          <div class="environment_info_item">
            <span>AppKey</span>
            <span>{{ currentEnvironmentInfo.appKey }}</span>
          </div>
          <div class="environment_info_item">
            <span>REST</span>
            <span>{{ currentEnvironmentInfo.apiUrl }}</span>
          </div>
          <div class="environment_info_item">
            <span>Socket</span>
            <span>{{ currentEnvironmentInfo.socketUrl }}</span>
          </div>
          <div class="environment_info_item">
            <span>私有化</span>
            <span>{{ currentEnvironmentInfo.isPrivate ? '是' : '否' }}</span>
          </div>
        </div>
      </div>
      <div class="sdk_diagnostics_section">
        <div class="presence_section_header">
          <span>ChatClient 运行诊断</span>
          <el-button
            link
            type="primary"
            :icon="RefreshRight"
            :loading="sdkDiagnosticsLoading === 'clientSnapshot'"
            @click="readChatClientRuntimeSnapshot"
          >
            读取
          </el-button>
        </div>
        <div class="user_info_hint">
          调用 SDK 5.0 ChatClient 公开诊断 API；token 明文不写入日志。
        </div>
        <div class="user_info_control">
          <div class="user_info_control_title">Token 续期</div>
          <el-input
            v-model="chatClientRenewTokenInput"
            type="password"
            show-password
            placeholder="输入新的 SDK 5.0 Token"
            clearable
            size="small"
          />
          <el-button
            type="primary"
            size="small"
            :loading="sdkDiagnosticsLoading === 'renewToken'"
            @click="renewChatClientToken"
          >
            调用 renewToken(token)
          </el-button>
        </div>
      </div>
      <div class="sdk_diagnostics_section">
        <div class="presence_section_header">
          <span>Push 扩展能力</span>
        </div>
        <div class="user_info_hint">
          所有按钮均调用 SDK 5.0 PushManager 公开 API，Push Token
          必须由用户输入，不生成假 token。
        </div>
        <div class="user_info_control">
          <div class="user_info_control_title">上传 Push Token</div>
          <el-input
            v-model="pushDeviceIdInput"
            placeholder="deviceId"
            clearable
            size="small"
          />
          <el-input
            v-model="pushDeviceTokenInput"
            type="password"
            show-password
            placeholder="deviceToken"
            clearable
            size="small"
          />
          <el-input
            v-model="pushNotifierNameInput"
            placeholder="notifierName，例如 FCM"
            clearable
            size="small"
          />
          <el-button
            type="primary"
            size="small"
            :loading="sdkDiagnosticsLoading === 'uploadPushToken'"
            @click="uploadPushToken"
          >
            上传
          </el-button>
        </div>
        <div class="user_info_control">
          <div class="user_info_control_title">全局免打扰</div>
          <el-radio-group v-model="pushGlobalRemindType" size="small">
            <el-radio value="ALL">ALL</el-radio>
            <el-radio value="AT">AT</el-radio>
            <el-radio value="NONE">NONE</el-radio>
          </el-radio-group>
          <div class="user_info_button_group">
            <el-button
              type="primary"
              size="small"
              :loading="sdkDiagnosticsLoading === 'setGlobalSilentMode'"
              @click="setGlobalSilentMode"
            >
              设置全局免打扰
            </el-button>
            <el-button
              size="small"
              :loading="sdkDiagnosticsLoading === 'getGlobalSilentMode'"
              @click="getGlobalSilentMode"
            >
              查询全局免打扰
            </el-button>
          </div>
        </div>
        <div class="user_info_control">
          <div class="user_info_control_title">批量查询会话免打扰</div>
          <el-input
            v-model="pushConversationListInput"
            type="textarea"
            :rows="3"
            placeholder="每行一个：conversationId:singleChat 或 conversationId:groupChat"
            clearable
            size="small"
          />
          <el-button
            type="primary"
            size="small"
            :loading="sdkDiagnosticsLoading === 'getConversationSilentModes'"
            @click="getConversationSilentModes"
          >
            批量查询
          </el-button>
        </div>
        <div class="user_info_control">
          <div class="user_info_control_title">推送语言</div>
          <el-input
            v-model="pushLanguageInput"
            placeholder="语言，例如 zh-Hans 或 en"
            clearable
            size="small"
          />
          <div class="user_info_button_group">
            <el-button
              type="primary"
              size="small"
              :loading="sdkDiagnosticsLoading === 'setPushLanguage'"
              @click="setPushLanguage"
            >
              设置推送语言
            </el-button>
            <el-button
              size="small"
              :loading="sdkDiagnosticsLoading === 'getPushLanguage'"
              @click="getPushLanguage"
            >
              查询推送语言
            </el-button>
          </div>
        </div>
        <div class="user_info_control">
          <div class="user_info_control_title">按提醒类型分页查询会话</div>
          <el-input-number
            v-model="pushRemindTypePageSize"
            :min="1"
            :max="100"
            size="small"
          />
          <el-input
            v-model="pushRemindTypeCursor"
            placeholder="cursor，首次查询可为空"
            clearable
            size="small"
          />
          <el-button
            type="primary"
            size="small"
            :loading="sdkDiagnosticsLoading === 'getConversationListByRemindType'"
            @click="getConversationListByRemindType"
          >
            查询会话
          </el-button>
        </div>
        <div class="user_info_raw_box">
          <div class="user_info_control_title">SDK 诊断 / Push 真实结果</div>
          <pre>{{ formatRawValue(sdkDiagnosticsRawResult) }}</pre>
        </div>
      </div>
      <div class="presence_section">
        <div class="presence_section_header">
          <span>在线状态订阅列表</span>
          <el-button
            link
            type="primary"
            :icon="RefreshRight"
            :loading="loadingSubscribedPresence"
            @click="refreshSubscribedPresenceList"
          >
            刷新
          </el-button>
        </div>
        <el-scrollbar max-height="220px">
          <div
            v-if="subscribedPresenceList.length > 0"
            class="presence_list"
          >
            <div
              v-for="item in subscribedPresenceList"
              :key="item.userId || item.uid || item"
              class="presence_list_item"
            >
              {{ item.userId || item.uid || item }}
            </div>
          </div>
          <el-empty
            v-else
            :image-size="60"
            description="暂无已订阅用户"
          />
        </el-scrollbar>
      </div>
      <div class="presence_section">
        <div class="presence_section_header">
          <span>黑名单列表</span>
          <el-button
            link
            type="primary"
            :icon="RefreshRight"
            :loading="loadingBlackList"
            @click="refreshBlackList"
          >
            刷新
          </el-button>
        </div>
        <el-scrollbar max-height="220px">
          <div v-if="friendBlackList.length > 0" class="presence_list">
            <div
              v-for="item in friendBlackList"
              :key="item"
              class="presence_list_item"
            >
              {{ item }}
            </div>
          </div>
          <el-empty
            v-else
            :image-size="60"
            description="暂无黑名单用户"
          />
        </el-scrollbar>
      </div>
      <div class="user_info_extension_section">
        <div class="presence_section_header">
          <span>用户资料扩展能力</span>
          <el-button
            link
            type="primary"
            :icon="RefreshRight"
            :loading="userInfoExtendedLoading === 'subscribedUsers'"
            @click="fetchSubscribedUsersInfo"
          >
            刷新已订阅用户
          </el-button>
        </div>
        <div class="user_info_hint">
          属性名使用 SDK 5.0 `UserInfoAttribute`，所有操作只展示 SDK
          真实返回或真实错误。
        </div>
        <div class="user_info_control">
          <div class="user_info_control_title">按属性查询用户资料</div>
          <el-input
            v-model="userInfoQueryUserIdsInput"
            placeholder="用户 ID，多个用逗号或空格分隔"
            clearable
            size="small"
          />
          <el-select
            v-model="userInfoQueryAttributes"
            multiple
            size="small"
            placeholder="选择 SDK 5.0 用户资料属性"
          >
            <el-option
              v-for="attribute in USER_INFO_ATTRIBUTES"
              :key="attribute"
              :label="attribute"
              :value="attribute"
            />
          </el-select>
          <el-button
            type="primary"
            size="small"
            :loading="userInfoExtendedLoading === 'query'"
            @click="fetchUserInfoByAttribute"
          >
            查询
          </el-button>
        </div>
        <div class="user_info_control">
          <div class="user_info_control_title">资料变更订阅</div>
          <el-input
            v-model="userInfoSubscriptionUserIdsInput"
            placeholder="陌生人用户 ID，多个用逗号或空格分隔"
            clearable
            size="small"
          />
          <div class="user_info_button_group">
            <el-button
              type="primary"
              size="small"
              :loading="userInfoExtendedLoading === 'subscribe'"
              @click="subscribeUsersInfo"
            >
              订阅资料变更
            </el-button>
            <el-button
              size="small"
              :loading="userInfoExtendedLoading === 'unsubscribe'"
              @click="unsubscribeUsersInfo"
            >
              取消订阅
            </el-button>
          </div>
        </div>
        <div class="user_info_control">
          <div class="user_info_control_title">按单属性更新当前用户资料</div>
          <el-select
            v-model="userInfoUpdateAttribute"
            size="small"
            placeholder="选择 SDK 5.0 用户资料属性"
          >
            <el-option
              v-for="attribute in USER_INFO_ATTRIBUTES"
              :key="attribute"
              :label="attribute"
              :value="attribute"
            />
          </el-select>
          <el-select
            v-model="userInfoUpdateValueType"
            size="small"
            placeholder="值类型"
          >
            <el-option label="string" value="string" />
            <el-option label="number" value="number" />
            <el-option label="boolean" value="boolean" />
          </el-select>
          <el-input
            v-model="userInfoUpdateValueInput"
            placeholder="属性值，boolean 类型填 true 或 false"
            clearable
            size="small"
          />
          <el-button
            type="primary"
            size="small"
            :loading="userInfoExtendedLoading === 'updateAttribute'"
            @click="updateOwnInfoByAttribute"
          >
            更新
          </el-button>
        </div>
        <div class="user_info_raw_box">
          <div class="user_info_control_title">SDK 真实结果</div>
          <pre>{{ formatRawValue(rawUserInfoResult) }}</pre>
        </div>
        <div class="user_info_raw_box error" v-if="userInfoOperationError">
          <div class="user_info_control_title">SDK 真实错误</div>
          <pre>{{ formatRawValue(userInfoOperationError) }}</pre>
        </div>
      </div>
      <!-- <div>
                <span>新消息系统推送</span>
                <el-switch v-model="" active-text="开启" inactive-text="关闭" />
            </div> -->
    </div>
  </el-dialog>
</template>

<style lang="scss" scoped>
.setting_main {
  width: 100%;
  height: 100%;

  .setting_main_item {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .presence_section,
  .environment_section,
  .sdk_diagnostics_section,
  .user_info_extension_section {
    margin-top: 18px;
    border-top: 1px solid #f0f0f0;
    padding-top: 14px;

    .presence_section_header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 14px;
      font-weight: 500;
    }

    .presence_list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .presence_list_item {
      padding: 8px 10px;
      border-radius: 8px;
      background: #f7f8fa;
      font-size: 13px;
      color: #333;
      word-break: break-all;
    }
  }

  .user_info_hint {
    margin-bottom: 10px;
    color: #7a7f87;
    font-size: 12px;
    line-height: 18px;
  }

  .user_info_control {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .user_info_control_title {
    color: #333;
    font-size: 13px;
    font-weight: 500;
  }

  .user_info_button_group {
    display: flex;
    gap: 8px;
  }

  .user_info_raw_box {
    margin-top: 10px;

    pre {
      max-height: 180px;
      overflow: auto;
      padding: 10px;
      border-radius: 8px;
      background: #f7f8fa;
      color: #333;
      font-size: 12px;
      line-height: 18px;
      white-space: pre-wrap;
      word-break: break-all;
    }

    &.error pre {
      background: #fff3f0;
      color: #d33a2c;
    }
  }

  .environment_info_list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .environment_info_item {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    background: #f7f8fa;
    color: #333;
    font-size: 13px;

    span:last-child {
      min-width: 0;
      word-break: break-all;
    }
  }
}
</style>
