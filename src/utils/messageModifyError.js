function getModifyMessageErrorText(error) {
  if (error instanceof Error) {
    return error.message || '';
  }
  if (typeof error?.message === 'string') {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '';
}

function resolveModifyMessageErrorMessage(error) {
  const rawMessage = getModifyMessageErrorText(error);

  if (rawMessage.includes('The message modify function is not activated')) {
    return '聊天室消息编辑当前不可用，请先确认该环境/AppKey已开通消息编辑能力';
  }

  if (rawMessage) {
    return `消息编辑失败：${rawMessage}`;
  }

  return '消息编辑失败请稍后重试';
}

module.exports = {
  getModifyMessageErrorText,
  resolveModifyMessageErrorMessage,
};
