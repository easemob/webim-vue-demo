//MiniCore
// 必须在加载环信 SDK 之前注册全局捕获，否则 dev overlay / 未处理拒绝会先处理异常
import '@/utils/globalErrorHandler';
import MiniCore from 'easemob-websdk/miniCore/miniCore';
import * as contactPlugin from 'easemob-websdk/contact/contact';
import * as groupPlugin from 'easemob-websdk/group/group';
import * as presencePlugin from 'easemob-websdk/presence/presence';
import * as chatroomPlugin from 'easemob-websdk/chatroom/chatroom';
import * as silentPlugin from 'easemob-websdk/silent/silent';
import * as localCachePlugin from 'easemob-websdk/localCache/localCache';
import * as threadPlugin from 'easemob-websdk/thread/thread';
import {
  DEFAULT_EASEMOB_APPKEY,
  DEFAULT_EASEMOB_SOCKET_URL,
  DEFAULT_EASEMOB_REST_URL,
  fixSocketUrl,
  fixRestUrl,
} from '../config';
import { sdkErrorToError } from '../sdkError';
import { safeSync } from '@/utils/safeCall';
import {
  isImAuthFailedReason,
  redirectToLoginClearImSession,
} from '@/utils/imAuthRedirect';

function parseJSONSafe(raw, fallback) {
  if (raw == null || raw === '') return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function cloneCreateOptions(options) {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(options);
    } catch {
      /* ignore */
    }
  }
  try {
    return JSON.parse(JSON.stringify(options));
  } catch {
    return options;
  }
}

function getRequestLogContext(payload) {
  if (!payload || typeof payload !== 'object') return {};
  return {
    from: payload.from || '',
    to: payload.to || '',
    chatType: payload.chatType || '',
    roomId: payload.roomId || payload.chatRoomId || '',
    groupId: payload.groupId || '',
    messageId: payload.id || payload.mid || '',
  };
}

function getMessageLogContext(message) {
  if (!message || typeof message !== 'object') return {};
  return {
    messageId: message.id || message.mid || message.messageId || '',
    from: message.from || '',
    to: message.to || message.conversationId || '',
    chatType: message.chatType || message.conversationType || '',
    messageType: message.type || '',
  };
}

function getMsyncPacketLogContext(packet) {
  const data = packet?.data || packet;
  const byteLength =
    data?.byteLength ??
    data?.length ??
    (typeof data === 'string' ? data.length : 0);
  return {
    user: getSdkUser(miniCore),
    packetType: packet?.type || '',
    dataConstructor: data?.constructor?.name || typeof data,
    byteLength,
  };
}

function summarizeMsyncDecodeResult(result) {
  if (!result || typeof result !== 'object') {
    return {
      resultType: typeof result,
      result,
    };
  }
  return {
    resultType: typeof result,
    constructorName: result?.constructor?.name || '',
    ownKeys: Object.keys(result),
    command: result.command,
    compressAlgorimth: result.compressAlgorimth,
    compressAlgorithm: result.compressAlgorithm,
    rawResult: result,
  };
}

function wrapMsyncDecodeLogger(client) {
  const originalDecodeMSync = client?.mSync?.decodeMSync;
  if (typeof originalDecodeMSync !== 'function') return;

  client.mSync.decodeMSync = function wrappedDecodeMSync(packet, ...rest) {
    const startTime = Date.now();
    const context = getMsyncPacketLogContext(packet);
    console.log('[LZ4 / MSync Decode] decodeMSync request', {
      ...context,
      extraArgsCount: rest.length,
    });
    try {
      const result = originalDecodeMSync.call(this, packet, ...rest);
      console.log('[LZ4 / MSync Decode] decodeMSync success', {
        ...context,
        durationMs: Date.now() - startTime,
        result: summarizeMsyncDecodeResult(result),
      });
      return result;
    } catch (error) {
      console.error('[LZ4 / MSync Decode] decodeMSync failed', {
        ...context,
        durationMs: Date.now() - startTime,
        errorSummary: summarizeSdkError(error),
        error,
      });
      throw error;
    }
  };
}

function logImSdkEvent(eventName, payload = {}) {
  console.log(`[IM SDK Event] ${eventName}`, payload);
}

function logAppEventDispatch(eventName, payload = {}) {
  console.log(`[App Event Dispatch] ${eventName}`, payload);
}

function logEmClientSdkCall(methodName, payload = {}) {
  console.log(`[EMClient SDK] ${methodName}`, payload);
}

function getSdkUser(client) {
  return client?.user || miniCore?.user || '';
}

function logSdkRequest(client, methodName, params) {
  console.log(`[EMClient request] ${methodName} -> 请求开始`, {
    methodName,
    user: getSdkUser(client),
    params,
    context: getRequestLogContext(params),
  });
}

function logSdkResponse(client, methodName, params, result, startTime) {
  console.log(`[EMClient request] ${methodName} -> 请求成功`, {
    methodName,
    user: getSdkUser(client),
    durationMs: Date.now() - startTime,
    params,
    context: getRequestLogContext(params),
    result,
  });
}

function summarizeSdkError(error) {
  if (!error) return {};
  const rawError = error.originalError || error;
  const summary = {
    message:
      error.message ||
      rawError.message ||
      rawError.msg ||
      rawError.error_description ||
      rawError.error ||
      '',
    type: rawError.type ?? rawError.code ?? error.type ?? error.code ?? '',
    data: rawError.data ?? '',
    name: error.name || rawError.name || '',
  };

  if (error.stack || rawError.stack) {
    summary.stack = error.stack || rawError.stack;
  }

  return summary;
}

function logSdkRequestError(client, methodName, params, error, startTime) {
  console.error(`[EMClient request] ${methodName} -> 请求失败`, {
    methodName,
    user: getSdkUser(client),
    durationMs: Date.now() - startTime,
    params,
    context: getRequestLogContext(params),
    errorSummary: summarizeSdkError(error),
    error,
  });
}

function wrapRequest(methodName, originalMethod) {
  return function wrappedRequest(params) {
    const startTime = Date.now();
    logSdkRequest(this, methodName, params);
    try {
      const result = originalMethod.call(this, params);
      if (result && typeof result.then === 'function') {
        return result
          .then((response) => {
            logSdkResponse(this, methodName, params, response, startTime);
            return response;
          })
          .catch((error) => {
            logSdkRequestError(this, methodName, params, error, startTime);
            throw error;
          });
      }
      logSdkResponse(this, methodName, params, result, startTime);
      return result;
    } catch (error) {
      logSdkRequestError(this, methodName, params, error, startTime);
      throw error;
    }
  };
}

function getLoginSessionFromStorage() {
  if (typeof window === 'undefined') return null;
  return parseJSONSafe(window.localStorage.getItem('EASEIM_loginUser'), null);
}

let miniCore = {};
const IM_IS_OPEN_CUSTOM_SERVER_CONFIG =
  parseJSONSafe(
    window.localStorage.getItem('IM_IS_OPEN_CUSTOM_SERVER_CONFIG'),
    false,
  ) || false;
const webimConfig = window.localStorage.getItem('webimConfig');
const CUSTOM_CONFIG = webimConfig ? parseJSONSafe(webimConfig, {}) : {};
const initEMClient = () => {
  // 读取自定义配置（因demo需要自定义配置，非必须）
  const configOptions = {};

  if (IM_IS_OPEN_CUSTOM_SERVER_CONFIG) {
    Object.assign(configOptions, {
      appKey: CUSTOM_CONFIG.appKey
        ? CUSTOM_CONFIG.appKey
        : DEFAULT_EASEMOB_APPKEY,
      isHttpDNS: !CUSTOM_CONFIG.isPrivate, //取反isPrivate
      url: CUSTOM_CONFIG.imServer
        ? fixSocketUrl(CUSTOM_CONFIG.imServer)
        : fixSocketUrl(DEFAULT_EASEMOB_SOCKET_URL),
      apiUrl: CUSTOM_CONFIG.restServer
        ? fixRestUrl(CUSTOM_CONFIG.restServer)
        : fixRestUrl(DEFAULT_EASEMOB_REST_URL),
      delivery: true, // 启用消息送达回执
      multiDevice: true, // 启用多设备登录
    });
  } else {
    Object.assign(configOptions, {
      appKey: DEFAULT_EASEMOB_APPKEY,
      isHttpDNS: true,
      url: fixSocketUrl(DEFAULT_EASEMOB_SOCKET_URL),
      apiUrl: fixRestUrl(DEFAULT_EASEMOB_REST_URL),
      delivery: true, // 启用消息送达回执
      multiDevice: true, // 启用多设备登录
    });
  }
  
  // 打印配置信息
  console.log('IM SDK 初始化配置:', {
    appKey: configOptions.appKey,
    isHttpDNS: configOptions.isHttpDNS,
    url: configOptions.url,
    apiUrl: configOptions.apiUrl,
    delivery: configOptions.delivery,
    multiDevice: configOptions.multiDevice,
  });
  miniCore = new MiniCore({ ...configOptions });
  wrapMsyncDecodeLogger(miniCore);

  if (typeof miniCore.open === 'function') {
    const originalOpen = miniCore.open;
    miniCore.open = wrapRequest('open', originalOpen);
  }

  if (typeof miniCore.close === 'function') {
    const originalClose = miniCore.close;
    miniCore.close = wrapRequest('close', originalClose);
  }

  // 添加连接错误处理
  miniCore.addEventHandler('connectionError', {
    onConnected: () => {
      console.log('IM SDK 连接成功');
    },
    onDisconnected: () => {
      console.log('IM SDK 断开连接');
    },
    onConnectError: (error) => {
      safeSync('connectionError.onConnectError', () => {
        console.error('IM SDK 连接错误:', error);

        // 本地已有 token 只说明业务侧已登录；长连仍可能因首包网络抖动失败，由 SDK 自动重连。
        // 不再直接 return，避免吞掉首次连接阶段的错误信息。
        if (localStorage.getItem('EASEIM_loginUser')) {
          console.warn(
            '[IM] 已存在本地登录缓存，当前为连接层错误（常见为网络波动，可等待自动重连或刷新）:',
            error?.message || error,
          );
        }

        if (isImAuthFailedReason(error)) {
          console.warn(
            '[IM] 连接错误: 鉴权失败或未登录，将清除本地登录状态并返回登录页。',
            error?.message || error,
          );
          redirectToLoginClearImSession();
          return;
        }
      });
    },
    onWillReconnect: (retryTimes) => {
      console.log(`IM SDK 即将重试连接，第${retryTimes}次`);
    },
    onReconnected: () => {
      console.log('IM SDK 重新连接成功');
    },
  });
  
  // 添加消息拉取错误处理
  miniCore.addEventHandler('messagePullError', {
    onMessagePullError: (error) => {
      safeSync('messagePullError.onMessagePullError', () => {
        console.error('IM SDK 消息拉取错误:', error);
        if (error?.message?.includes('pullCount')) {
          console.error(
            '消息拉取 pullCount 相关错误，可尝试清除 EASEIM_loginUser 后重新登录；未自动跳转。',
          );
        }
      });
    },
  });

  // 添加消息撤回监听
  miniCore.addEventHandler('messageRecall', {
    onRecallMessage: (msg) => {
      if (msg == null || typeof msg !== 'object') {
        console.warn('[IM SDK] onRecallMessage 收到无效消息体，已忽略', msg);
        return;
      }
      logImSdkEvent('onRecallMessage', {
        ...getMessageLogContext(msg),
        ext: msg.ext,
        rawEvent: msg,
      });
      safeSync('messageRecall.dispatch hx:messageRecall', () => {
        window.dispatchEvent(new CustomEvent('hx:messageRecall', { detail: msg }));
      });
      logAppEventDispatch('hx:messageRecall', {
        ...getMessageLogContext(msg),
      });
    },
  });

  // 添加各种插件
  miniCore.usePlugin(contactPlugin);
  miniCore.usePlugin(groupPlugin);
  miniCore.usePlugin(presencePlugin);
  miniCore.usePlugin(chatroomPlugin);
  miniCore.usePlugin(silentPlugin);
  miniCore.usePlugin(localCachePlugin, 'localCache');
  miniCore.usePlugin(threadPlugin);

  return miniCore;
};
initEMClient();

// 包装 Message.create 方法，添加参数验证
if (Object.keys(miniCore).length) {
  // 保存原始方法
  const originalCreateMessage = miniCore.Message.create;

  // 包装方法
  miniCore.Message.create = function (options) {
    logEmClientSdkCall('Message.create request', {
      user: getSdkUser(this),
      options,
      context: getRequestLogContext(options),
    });
    // 验证参数
    if (!options) {
      console.error('EMClient.Message.create: 缺少options参数');
      throw new Error('EMClient.Message.create: 缺少options参数');
    }

    if (!options.to || options.to === '') {
      console.error('EMClient.Message.create: options.to 为空', options);
      throw new Error('EMClient.Message.create: options.to 为空');
    }

    // 调用原始方法
    try {
      const message = originalCreateMessage.call(this, options);
      if (message && typeof message === 'object') {
        Object.defineProperty(message, '__createOptions', {
          value: cloneCreateOptions(options),
          enumerable: false,
          configurable: true,
          writable: true,
        });
      }
      logEmClientSdkCall('Message.create success', {
        user: getSdkUser(this),
        options,
        context: getRequestLogContext(message),
        message,
      });
      return message;
    } catch (error) {
      console.error('EMClient.Message.create 内部错误:', error);
      // 确保抛出的是字符串错误，避免 [object Object] 错误
      throw new Error(typeof error === 'string' ? error : JSON.stringify(error));
    }
  };

  // 包装 send 方法，添加参数验证
  const originalSendMessage = miniCore.send;
  miniCore.send = async function (message) {
    const startTime = Date.now();
    logEmClientSdkCall('send request', {
      user: getSdkUser(this),
      context: getRequestLogContext(message),
      message,
    });
    // 验证参数
    if (!message) {
      console.error('EMClient.send: 缺少message参数');
      throw new Error('EMClient.send: 缺少message参数');
    }

    if (!message.to || message.to === '') {
      console.error('EMClient.send: message.to 为空', message);
      throw new Error('EMClient.send: message.to 为空');
    }

    // 调用原始方法
    try {
      const result = await originalSendMessage.call(this, message);
      logEmClientSdkCall('send success', {
        user: getSdkUser(this),
        durationMs: Date.now() - startTime,
        context: getRequestLogContext(message),
        result,
      });
      return result;
    } catch (error) {
      console.error('EMClient.send 内部错误:', error);
      // 确保抛出的是字符串错误，避免 [object Object] 错误
      throw new Error(typeof error === 'string' ? error : JSON.stringify(error));
    }
  };

  // 添加或包装 reportMessage 方法
  if (typeof miniCore.reportMessage === 'function') {
    const originalReportMessage = miniCore.reportMessage;
    miniCore.reportMessage = function (params) {
      logEmClientSdkCall('reportMessage request', {
        user: getSdkUser(this),
        params,
        context: getRequestLogContext(params),
      });
      // 验证参数
      if (!params) {
        console.error('EMClient.reportMessage: 缺少参数');
        throw new Error('EMClient.reportMessage: 缺少参数');
      }

      if (!params.messageId) {
        console.error('EMClient.reportMessage: 缺少messageId参数', params);
        throw new Error('EMClient.reportMessage: 缺少messageId参数');
      }

      if (!params.reportType) {
        console.error('EMClient.reportMessage: 缺少reportType参数', params);
        throw new Error('EMClient.reportMessage: 缺少reportType参数');
      }

      if (!params.reportReason) {
        console.error('EMClient.reportMessage: 缺少reportReason参数', params);
        throw new Error('EMClient.reportMessage: 缺少reportReason参数');
      }

      // 调用原始方法
      try {
        const result = originalReportMessage.call(this, params);
        logEmClientSdkCall('reportMessage success', {
          user: getSdkUser(this),
          params,
          context: getRequestLogContext(params),
          result,
        });
        return result;
      } catch (error) {
        console.error('EMClient.reportMessage 内部错误:', error);
        // 确保抛出的是字符串错误，避免 [object Object] 错误
        throw new Error(typeof error === 'string' ? error : JSON.stringify(error));
      }
    };
  }

  if (typeof miniCore.joinChatRoom === 'function') {
    const originalJoinChatRoom = miniCore.joinChatRoom;
    miniCore.joinChatRoom = wrapRequest('joinChatRoom', originalJoinChatRoom);
  }

  if (typeof miniCore.leaveChatRoom === 'function') {
    const originalLeaveChatRoom = miniCore.leaveChatRoom;
    miniCore.leaveChatRoom = wrapRequest('leaveChatRoom', originalLeaveChatRoom);
  }

  if (typeof miniCore.destroyChatRoom === 'function') {
    const originalDestroyChatRoom = miniCore.destroyChatRoom;
    miniCore.destroyChatRoom = wrapRequest(
      'destroyChatRoom',
      originalDestroyChatRoom,
    );
  }

  if (typeof miniCore.getChatRooms === 'function') {
    const originalGetChatRooms = miniCore.getChatRooms;
    miniCore.getChatRooms = wrapRequest('getChatRooms', originalGetChatRooms);
  }

  if (typeof miniCore.getJoinedChatRooms === 'function') {
    const originalGetJoinedChatRooms = miniCore.getJoinedChatRooms;
    miniCore.getJoinedChatRooms = wrapRequest(
      'getJoinedChatRooms',
      originalGetJoinedChatRooms,
    );
  }

  if (typeof miniCore.getChatRoomDetails === 'function') {
    const originalGetChatRoomDetails = miniCore.getChatRoomDetails;
    miniCore.getChatRoomDetails = wrapRequest(
      'getChatRoomDetails',
      originalGetChatRoomDetails,
    );
  }

  if (typeof miniCore.getChatRoomMembers === 'function') {
    const originalGetChatRoomMembers = miniCore.getChatRoomMembers;
    miniCore.getChatRoomMembers = wrapRequest(
      'getChatRoomMembers',
      originalGetChatRoomMembers,
    );
  }

  // 添加或包装 pinMessage 方法（置顶消息）
  if (typeof miniCore.pinMessage === 'function') {
    const originalPinMessage = miniCore.pinMessage;
    miniCore.pinMessage = function (options) {
      logEmClientSdkCall('pinMessage request', {
        user: getSdkUser(this),
        options,
        context: getRequestLogContext(options),
      });
      // 验证参数
      if (!options) {
        console.error('EMClient.pinMessage: 缺少参数');
        throw new Error('EMClient.pinMessage: 缺少参数');
      }

      if (!options.conversationType) {
        console.error('EMClient.pinMessage: 缺少conversationType参数', options);
        throw new Error('EMClient.pinMessage: 缺少conversationType参数');
      }

      if (!options.conversationId) {
        console.error('EMClient.pinMessage: 缺少conversationId参数', options);
        throw new Error('EMClient.pinMessage: 缺少conversationId参数');
      }

      if (!options.messageId) {
        console.error('EMClient.pinMessage: 缺少messageId参数', options);
        throw new Error('EMClient.pinMessage: 缺少messageId参数');
      }

      // 调用原始方法
      try {
        const result = originalPinMessage.call(this, options);
        logEmClientSdkCall('pinMessage success', {
          user: getSdkUser(this),
          options,
          context: getRequestLogContext(options),
          result,
        });
        return result;
      } catch (error) {
        console.error('EMClient.pinMessage 内部错误:', error);
        // 确保抛出的是字符串错误，避免 [object Object] 错误
        throw new Error(typeof error === 'string' ? error : JSON.stringify(error));
      }
    };
  }

  // 添加或包装 unpinMessage 方法（取消置顶消息）
  if (typeof miniCore.unpinMessage === 'function') {
    const originalUnpinMessage = miniCore.unpinMessage;
    miniCore.unpinMessage = function (options) {
      logEmClientSdkCall('unpinMessage request', {
        user: getSdkUser(this),
        options,
        context: getRequestLogContext(options),
      });
      // 验证参数
      if (!options) {
        console.error('EMClient.unpinMessage: 缺少参数');
        throw new Error('EMClient.unpinMessage: 缺少参数');
      }

      if (!options.conversationType) {
        console.error('EMClient.unpinMessage: 缺少conversationType参数', options);
        throw new Error('EMClient.unpinMessage: 缺少conversationType参数');
      }

      if (!options.conversationId) {
        console.error('EMClient.unpinMessage: 缺少conversationId参数', options);
        throw new Error('EMClient.unpinMessage: 缺少conversationId参数');
      }

      if (!options.messageId) {
        console.error('EMClient.unpinMessage: 缺少messageId参数', options);
        throw new Error('EMClient.unpinMessage: 缺少messageId参数');
      }

      // 调用原始方法
      try {
        const result = originalUnpinMessage.call(this, options);
        logEmClientSdkCall('unpinMessage success', {
          user: getSdkUser(this),
          options,
          context: getRequestLogContext(options),
          result,
        });
        return result;
      } catch (error) {
        console.error('EMClient.unpinMessage 内部错误:', error);
        throw sdkErrorToError(error);
      }
    };
  }

  // 添加或包装 getServerPinnedMessages 方法（获取置顶消息）
  if (typeof miniCore.getServerPinnedMessages === 'function') {
    const originalGetServerPinnedMessages = miniCore.getServerPinnedMessages;
    miniCore.getServerPinnedMessages = function (options) {
      logEmClientSdkCall('getServerPinnedMessages request', {
        user: getSdkUser(this),
        options,
        context: getRequestLogContext(options),
      });
      // 验证参数
      if (!options) {
        console.error('EMClient.getServerPinnedMessages: 缺少参数');
        throw new Error('EMClient.getServerPinnedMessages: 缺少参数');
      }

      if (!options.conversationId) {
        console.error('EMClient.getServerPinnedMessages: 缺少conversationId参数', options);
        throw new Error('EMClient.getServerPinnedMessages: 缺少conversationId参数');
      }

      if (!options.conversationType) {
        console.error('EMClient.getServerPinnedMessages: 缺少conversationType参数', options);
        throw new Error('EMClient.getServerPinnedMessages: 缺少conversationType参数');
      }

      // 调用原始方法
      try {
        const result = originalGetServerPinnedMessages.call(this, options);
        logEmClientSdkCall('getServerPinnedMessages success', {
          user: getSdkUser(this),
          options,
          context: getRequestLogContext(options),
          result,
        });
        return result;
      } catch (error) {
        console.error('EMClient.getServerPinnedMessages 内部错误:', error);
        throw sdkErrorToError(error);
      }
    };
  }

  // 添加消息置顶事件监听
  miniCore.addEventHandler('messagePin', {
    onMessagePinEvent: (event) => {
      logImSdkEvent('onMessagePinEvent', {
        operation: event.operation,
        conversationType: event.conversationType,
        conversationId: event.conversationId,
        messageId: event.messageId,
        pinTime: event.pinTime,
        operator: event.operator,
        rawEvent: event
      });
      // 发送自定义事件，让Vue应用能够监听并更新状态
      const customEvent = new CustomEvent('hx:messagePin', { detail: event });
      window.dispatchEvent(customEvent);
      logAppEventDispatch('hx:messagePin', {
        messageId: event.messageId,
        conversationId: event.conversationId,
        conversationType: event.conversationType,
        operation: event.operation,
      });
    }
  });

  // 添加消息回执事件监听
  miniCore.addEventHandler('messageReceipt', {
    // 收到消息送达服务器回执
    onReceivedMessage: (message) => {
      logImSdkEvent('onReceivedMessage', {
        ...getMessageLogContext(message),
        rawEvent: message,
      });
      // 发送自定义事件，让Vue应用能够监听并更新状态
      const customEvent = new CustomEvent('hx:messageReceived', { detail: message });
      window.dispatchEvent(customEvent);
      logAppEventDispatch('hx:messageReceived', {
        ...getMessageLogContext(message),
      });
    },
    // 收到消息送达客户端回执
    onDeliveredMessage: (message) => {
      logImSdkEvent('onDeliveredMessage', {
        ...getMessageLogContext(message),
        rawEvent: message,
      });
      // 发送自定义事件，让Vue应用能够监听并更新状态
      const customEvent = new CustomEvent('hx:messageDelivered', { detail: message });
      window.dispatchEvent(customEvent);
      logAppEventDispatch('hx:messageDelivered', {
        ...getMessageLogContext(message),
      });
    },
    // 收到消息已读回执
    onReadMessage: (message) => {
      logImSdkEvent('onReadMessage', {
        ...getMessageLogContext(message),
        groupReadCount: message.groupReadCount,
        rawEvent: message,
      });
      // 发送自定义事件，让Vue应用能够监听并更新状态
      const customEvent = new CustomEvent('hx:messageRead', { detail: message });
      window.dispatchEvent(customEvent);
      logAppEventDispatch('hx:messageRead', {
        ...getMessageLogContext(message),
        groupReadCount: message.groupReadCount,
      });
    },
    // 收到会话已读回执
    onChannelMessage: (message) => {
      logImSdkEvent('onChannelMessage', {
        ...getMessageLogContext(message),
        rawEvent: message,
      });
      const customEvent = new CustomEvent('hx:channelMessage', {
        detail: message,
      });
      window.dispatchEvent(customEvent);
      logAppEventDispatch('hx:channelMessage', {
        ...getMessageLogContext(message),
      });
    },
    // 收到统计消息（离线时收到的回执）
    onStatisticMessage: (message) => {
      let groupAck = [];
      let parseError = null;
      if (message.location) {
        try {
          const statisticMsg = JSON.parse(message.location);
          groupAck = statisticMsg.group_ack || [];
        } catch (error) {
          parseError = error;
          console.error('Failed to parse statistic message location:', error);
        }
      }
      logImSdkEvent('onStatisticMessage', {
        ...getMessageLogContext(message),
        location: message.location,
        groupAck,
        parseError,
        rawEvent: message,
      });
      // 发送自定义事件，让Vue应用能够监听并更新状态
      const customEvent = new CustomEvent('hx:statisticMessage', { detail: message });
      window.dispatchEvent(customEvent);
      logAppEventDispatch('hx:statisticMessage', {
        ...getMessageLogContext(message),
        groupAckCount: groupAck.length,
      });
    }
  });

  // 添加或包装 getGroupMsgReadUser 方法（获取群消息已读用户）
  if (typeof miniCore.getGroupMsgReadUser === 'function') {
    const originalGetGroupMsgReadUser = miniCore.getGroupMsgReadUser;
    miniCore.getGroupMsgReadUser = function (params) {
      logEmClientSdkCall('getGroupMsgReadUser request', {
        user: getSdkUser(this),
        params,
        context: getRequestLogContext(params),
      });
      // 验证参数
      if (!params) {
        console.error('EMClient.getGroupMsgReadUser: 缺少参数');
        throw new Error('EMClient.getGroupMsgReadUser: 缺少参数');
      }

      if (!params.msgId) {
        console.error('EMClient.getGroupMsgReadUser: 缺少msgId参数', params);
        throw new Error('EMClient.getGroupMsgReadUser: 缺少msgId参数');
      }

      if (!params.groupId) {
        console.error('EMClient.getGroupMsgReadUser: 缺少groupId参数', params);
        throw new Error('EMClient.getGroupMsgReadUser: 缺少groupId参数');
      }

      // 调用原始方法
      try {
        const result = originalGetGroupMsgReadUser.call(this, params);
        logEmClientSdkCall('getGroupMsgReadUser success', {
          user: getSdkUser(this),
          params,
          context: getRequestLogContext(params),
          result,
        });
        return result;
      } catch (error) {
        console.error('EMClient.getGroupMsgReadUser 内部错误:', error);
        throw sdkErrorToError(error);
      }
    };
  }

  // 添加或包装 getGroupInfo 方法（获取群组信息）
  // 保存原始方法引用（如果存在）
  let originalGetGroupInfo = miniCore.getGroupInfo;
  
  // 定义包装后的方法
  const wrappedGetGroupInfo = function (params) {
    logEmClientSdkCall('getGroupInfo request', {
      user: getSdkUser(miniCore),
      params,
      context: getRequestLogContext(params),
    });
    // 验证参数
    if (!params) {
      console.error('EMClient.getGroupInfo: 缺少参数');
      return Promise.reject(new Error('EMClient.getGroupInfo: 缺少参数'));
    }

    if (!params.groupId) {
      console.error('EMClient.getGroupInfo: 缺少groupId参数', params);
      return Promise.reject(new Error('EMClient.getGroupInfo: 缺少groupId参数'));
    }

    // 动态检查原始方法是否存在
    const currentOriginalMethod = originalGetGroupInfo || miniCore.getGroupInfo;

    if (typeof currentOriginalMethod === 'function' && currentOriginalMethod !== wrappedGetGroupInfo) {
      // 调用原始方法，确保不传递 chatType 参数
      const cleanParams = { groupId: params.groupId };
      try {
        const result = currentOriginalMethod.call(miniCore, cleanParams);
        logEmClientSdkCall('getGroupInfo success', {
          user: getSdkUser(miniCore),
          params: cleanParams,
          context: getRequestLogContext(cleanParams),
          result,
        });
        return result;
      } catch (error) {
        console.error('EMClient.getGroupInfo 内部错误:', error);
        // 确保返回的是字符串错误，避免 [object Object] 错误
        return Promise.reject(new Error(typeof error === 'string' ? error : JSON.stringify(error)));
      }
    }
    return Promise.reject(new Error('EMClient.getGroupInfo: SDK 未提供该方法'));
  };
  
  // 将包装后的方法赋值给 miniCore
  miniCore.getGroupInfo = wrappedGetGroupInfo;

  // 添加或包装 recallMessage 方法（撤回消息）
  // 保存原始方法引用（如果存在）
  let originalRecallMessage = miniCore.recallMessage;
  
  // 定义包装后的方法
  const wrappedRecallMessage = function (params) {
    logEmClientSdkCall('recallMessage request', {
      user: getSdkUser(miniCore),
      params,
      context: getRequestLogContext(params),
    });
    // 验证参数
    if (!params) {
      console.error('EMClient.recallMessage: 缺少参数');
      return Promise.reject(new Error('EMClient.recallMessage: 缺少参数'));
    }

    if (!params.mid) {
      console.error('EMClient.recallMessage: 缺少mid参数', params);
      return Promise.reject(new Error('EMClient.recallMessage: 缺少mid参数'));
    }

    if (!params.to) {
      console.error('EMClient.recallMessage: 缺少to参数', params);
      return Promise.reject(new Error('EMClient.recallMessage: 缺少to参数'));
    }

    if (!params.chatType) {
      console.error('EMClient.recallMessage: 缺少chatType参数', params);
      return Promise.reject(new Error('EMClient.recallMessage: 缺少chatType参数'));
    }

    // 动态检查原始方法是否存在（可能在登录后才被添加）
    const currentOriginalMethod = originalRecallMessage || miniCore.recallMessage;
    
    if (typeof currentOriginalMethod === 'function' && currentOriginalMethod !== wrappedRecallMessage) {
            // 调用原始方法
            try {
              const result = currentOriginalMethod.call(miniCore, params);
              logEmClientSdkCall('recallMessage invoked', {
                user: getSdkUser(miniCore),
                params,
                context: getRequestLogContext(params),
                result,
              });
              return result;
            } catch (error) {
              console.error('EMClient.recallMessage 内部错误:', error);
              // 确保返回的是字符串错误，避免 [object Object] 错误
              return Promise.reject(new Error(typeof error === 'string' ? error : JSON.stringify(error)));
            }
          }
    return Promise.reject(new Error('EMClient.recallMessage: SDK 未提供该方法'));
  };
  
  // 将包装后的方法赋值给 miniCore
  miniCore.recallMessage = wrappedRecallMessage;

  // 编辑消息：SDK 内部会读 modifiedMessage.to，缺省时会在 miniCore 内抛 TypeError
  if (typeof miniCore.modifyMessage === 'function') {
    const originalModifyMessage = miniCore.modifyMessage.bind(miniCore);
    miniCore.modifyMessage = function (opts) {
      const mid = opts && opts.messageId;
      const mod = opts && opts.modifiedMessage;
      if (!mid) {
        return Promise.reject(
          new Error('EMClient.modifyMessage: 缺少 messageId'),
        );
      }
      if (!mod || mod.to == null || mod.to === '') {
        return Promise.reject(
          new Error(
            'EMClient.modifyMessage: modifiedMessage 无效（需为 Message.create 返回值且含 to）',
          ),
        );
      }
      try {
        return originalModifyMessage(opts);
      } catch (e) {
        return Promise.reject(sdkErrorToError(e));
      }
    };
  }

  // 添加或包装 getServerConversations 方法（获取服务端会话列表）
  if (typeof miniCore.getServerConversations === 'function') {
    const originalGetServerConversations = miniCore.getServerConversations;
    miniCore.getServerConversations = function (params) {
      logEmClientSdkCall('getServerConversations request', {
        user: getSdkUser(this),
        params,
        context: getRequestLogContext(params),
      });
      // 验证参数
      if (!params) {
        console.error('EMClient.getServerConversations: 缺少参数');
        return Promise.reject(new Error('EMClient.getServerConversations: 缺少参数'));
      }

      // 调用原始方法（返回Promise）
      const result = originalGetServerConversations.call(this, params);
      
      // 确保返回的是Promise
      if (!result || typeof result.then !== 'function') {
        console.error('EMClient.getServerConversations 返回的不是Promise:', result);
        return Promise.reject(new Error('EMClient.getServerConversations 返回的不是Promise'));
      }
      
      // 使用.catch()处理Promise错误
      return result
        .then((response) => {
          logEmClientSdkCall('getServerConversations success', {
            user: getSdkUser(this),
            params,
            context: getRequestLogContext(params),
            result: response,
          });
          return response;
        })
        .catch(error => {
        console.error('EMClient.getServerConversations 内部错误:', error);
        // 处理网络超时错误
        if (error && error.errorType === 'timeout_error') {
          const timeoutError = new Error('获取会话列表失败: 网络超时，请检查网络连接');
          timeoutError.originalError = error;
          throw timeoutError;
        }
        // 确保错误对象有内容
        if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
          const enhancedError = new Error('获取会话列表失败: 未知错误');
          enhancedError.originalError = error;
          throw enhancedError;
        }
        throw sdkErrorToError(error);
      });
    };
  }

}
export default miniCore;
