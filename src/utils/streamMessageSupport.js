const STREAM_STATUS_TEXT_MAP = {
  STREAM_START: '生成开始',
  STREAM_IN_PROGRESS: '生成中',
  STREAM_COMPLETED: '已完成',
  STREAM_FULL: '单片完成',
  STREAM_ERROR: '异常结束',
};

export const isStreamMessage = (message) =>
  !!(message && message.stream && typeof message.stream === 'object');

export const getStreamStatusText = (message) => {
  const status = message?.stream?.status;
  return STREAM_STATUS_TEXT_MAP[status] || '流式消息';
};

export const getStreamStatusDetailText = (message) => {
  if (!isStreamMessage(message)) return '';

  const status = message?.stream?.status;
  const errorType = message?.stream?.errorType;
  const finishReason = message?.stream?.finishReason;

  if (status !== 'STREAM_ERROR') return '';

  const details = [];

  if (errorType !== undefined && errorType !== null && Number(errorType) !== 0) {
    details.push(`errorType: ${errorType}`);
  }
  if (
    finishReason !== undefined &&
    finishReason !== null &&
    Number(finishReason) !== 0
  ) {
    details.push(`finishReason: ${finishReason}`);
  }

  return details.join(' | ');
};

export const shouldTriggerIncomingMessageEffects = ({
  message,
  existedBefore = false,
}) => {
  if (!isStreamMessage(message)) return true;
  return !existedBefore;
};
