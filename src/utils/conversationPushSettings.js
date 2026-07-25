export const CONVERSATION_PUSH_REMIND_TYPES = [
  { label: '接收所有离线推送', value: 'ALL' },
  { label: '仅 @ 消息推送', value: 'AT' },
  { label: '不接收离线推送', value: 'NONE' },
];

export function isPushSettingSupportedConversation(conversationType) {
  return (
    conversationType === 'singleChat' ||
    conversationType === 'groupChat'
  );
}

export function buildConversationPushSettingParams(conversation, remindType) {
  const conversationId = conversation?.conversationId;
  const type = conversation?.conversationType;

  if (!conversationId || !type) {
    throw new Error('缺少会话 ID 或会话类型');
  }

  if (!isPushSettingSupportedConversation(type)) {
    throw new Error('SDK 5.0 conversation push settings only support singleChat and groupChat');
  }

  return {
    conversationId,
    conversationType: type,
    rule: {
      mode: 'REMIND_TYPE',
      remindType,
    },
  };
}

export function buildConversationDndDurationParams(
  conversation,
  durationMinutes,
) {
  const conversationId = conversation?.conversationId;
  const type = conversation?.conversationType;
  const duration = Number(durationMinutes);

  if (!conversationId || !type) {
    throw new Error('缺少会话 ID 或会话类型');
  }

  if (!Number.isInteger(duration) || duration < 1 || duration > 10080) {
    throw new Error('免打扰时长必须为 1 到 10080 分钟');
  }

  if (!isPushSettingSupportedConversation(type)) {
    throw new Error('SDK 5.0 conversation push settings only support singleChat and groupChat');
  }

  return {
    conversationId,
    conversationType: type,
    rule: {
      mode: 'DURATION',
      duration,
    },
  };
}

export function buildConversationPushQueryParams(conversation) {
  const conversationId = conversation?.conversationId;
  const type = conversation?.conversationType;

  if (!conversationId || !type) {
    throw new Error('缺少会话 ID 或会话类型');
  }

  if (!isPushSettingSupportedConversation(type)) {
    throw new Error('SDK 5.0 conversation push settings only support singleChat and groupChat');
  }

  return {
    conversationId,
    conversationType: type,
  };
}

export function getConversationPushRemindType(response) {
  const remindType = response?.rule?.remindType || '';

  return remindType === 'DEFAULT' ? '' : remindType;
}
