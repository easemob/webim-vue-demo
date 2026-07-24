import { getClient, getCurrentUserId, requireManager } from '@/IM';

const pushManager = () => requireManager('pushManager');

const redactSecret = (value) => {
  if (typeof value !== 'string' || value.length === 0) {
    return value;
  }
  return {
    redacted: true,
    length: value.length,
  };
};

const sanitizeRestContext = (context) => {
  if (!context || typeof context !== 'object') {
    return context;
  }
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      /token|authorization/i.test(key) ? redactSecret(value) : value,
    ]),
  );
};

const summarizeSdkObject = (value) => {
  if (value === null || value === undefined) {
    return value;
  }
  return {
    type: typeof value,
    constructorName: value?.constructor?.name || '',
    ownKeys: Object.keys(value),
  };
};

const buildErrorRecord = (action, context, error) => ({
  action,
  context,
  name: error?.name,
  message: error?.message || String(error),
  statusCode: error?.statusCode,
  code: error?.code,
  rawError: error,
});

const commitSuccess = (commit, action, params, result) => {
  const record = {
    action,
    params,
    currentUser: getCurrentUserId(),
    result,
    receivedAt: Date.now(),
  };
  commit('SET_SDK_DIAGNOSTICS_RESULT', record);
  console.log(`[SDK 5.0 Diagnostics] ${action} success`, record);
  return result;
};

const commitFailure = (commit, action, params, error) => {
  const record = buildErrorRecord(action, params, error);
  commit('SET_SDK_DIAGNOSTICS_ERROR', record);
  console.error(`[SDK 5.0 Diagnostics] ${action} failed`, {
    currentUser: getCurrentUserId(),
    ...record,
  });
  throw error;
};

const SdkDiagnostics = {
  namespaced: true,
  state: () => ({
    sdkDiagnosticsResult: null,
    sdkDiagnosticsError: null,
  }),
  mutations: {
    SET_SDK_DIAGNOSTICS_RESULT: (state, result) => {
      state.sdkDiagnosticsResult = result;
      state.sdkDiagnosticsError = null;
    },
    SET_SDK_DIAGNOSTICS_ERROR: (state, error) => {
      state.sdkDiagnosticsError = error;
    },
  },
  actions: {
    readChatClientRuntimeSnapshot: ({ commit }) => {
      const action = 'readChatClientRuntimeSnapshot';
      try {
        const client = getClient();
        const result = {
          currentUserId: client.getCurrentUserId(),
          connectionState: client.getConnectionState(),
          restContext: sanitizeRestContext(client.getRestContext()),
          cacheManager: summarizeSdkObject(client.getCacheManager()),
          uploadAdapter: summarizeSdkObject(client.getUploadAdapter()),
          contactSnapshot: client.getContactSnapshot(),
        };
        return commitSuccess(commit, action, {}, result);
      } catch (error) {
        return commitFailure(commit, action, {}, error);
      }
    },
    renewChatClientToken: async ({ commit }, { token }) => {
      const action = 'renewChatClientToken';
      const context = {
        tokenLength: typeof token === 'string' ? token.length : 0,
      };
      try {
        if (!token) {
          throw new Error('new SDK 5.0 token is required');
        }
        const client = getClient();
        const result = await client.renewToken(token);
        return commitSuccess(commit, action, context, {
          ...result,
          token: redactSecret(result?.token),
        });
      } catch (error) {
        return commitFailure(commit, action, context, error);
      }
    },
    uploadPushToken: async ({ commit }, { deviceId, deviceToken, notifierName }) => {
      const action = 'uploadPushToken';
      const context = {
        deviceId,
        notifierName,
        deviceTokenLength:
          typeof deviceToken === 'string' ? deviceToken.length : 0,
      };
      try {
        const result = await pushManager().uploadPushToken({
          deviceId,
          deviceToken,
          notifierName,
        });
        return commitSuccess(commit, action, context, result);
      } catch (error) {
        return commitFailure(commit, action, context, error);
      }
    },
    setGlobalSilentMode: async ({ commit }, { rule }) => {
      const action = 'setGlobalSilentMode';
      try {
        const result = await pushManager().setGlobalSilentMode({ rule });
        return commitSuccess(commit, action, { rule }, result);
      } catch (error) {
        return commitFailure(commit, action, { rule }, error);
      }
    },
    getGlobalSilentMode: async ({ commit }) => {
      const action = 'getGlobalSilentMode';
      try {
        const result = await pushManager().getGlobalSilentMode();
        return commitSuccess(commit, action, {}, result);
      } catch (error) {
        return commitFailure(commit, action, {}, error);
      }
    },
    getConversationSilentModes: async ({ commit }, { conversationList }) => {
      const action = 'getConversationSilentModes';
      try {
        const result = await pushManager().getConversationSilentModes({ conversationList });
        return commitSuccess(commit, action, { conversationList }, result);
      } catch (error) {
        return commitFailure(commit, action, { conversationList }, error);
      }
    },
    setPushLanguage: async ({ commit }, { language }) => {
      const action = 'setPushLanguage';
      try {
        const result = await pushManager().setPushLanguage({ language });
        return commitSuccess(commit, action, { language }, result);
      } catch (error) {
        return commitFailure(commit, action, { language }, error);
      }
    },
    getPushLanguage: async ({ commit }) => {
      const action = 'getPushLanguage';
      try {
        const result = await pushManager().getPushLanguage();
        return commitSuccess(commit, action, {}, result);
      } catch (error) {
        return commitFailure(commit, action, {}, error);
      }
    },
    getConversationListByRemindType: async (
      { commit },
      { pageSize, cursor },
    ) => {
      const action = 'getConversationListByRemindType';
      try {
        const result = await pushManager().getConversationListByRemindType({
          pageSize,
          cursor,
        });
        return commitSuccess(commit, action, { pageSize, cursor }, result);
      } catch (error) {
        return commitFailure(commit, action, { pageSize, cursor }, error);
      }
    },
  },
};

export default SdkDiagnostics;
