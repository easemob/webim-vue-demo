export function getSdk5ErrorInfo(error) {
  if (!error || typeof error !== 'object') {
    return {
      message: typeof error === 'string' ? error : '',
      code: undefined,
      details: undefined,
    };
  }

  return {
    message: typeof error?.message === 'string' ? error.message : '',
    code: error?.code,
    details: error?.details,
  };
}

export function getSdk5ErrorMessage(error, fallbackMessage = '') {
  const { message, code, details } = getSdk5ErrorInfo(error);
  if (message) return message;
  if (details !== undefined) {
    try {
      return JSON.stringify(details);
    } catch {
      return String(details);
    }
  }
  if (code !== undefined) return `SDK 5.0 error code: ${code}`;
  return fallbackMessage;
}

function hasBusinessRejectionReason(details) {
  const reason = typeof details?.reason === 'string' ? details.reason : '';
  return reason.toLowerCase().includes('blacklist');
}

export function isSdk5AuthenticationError(error) {
  const { message, code, details } = getSdk5ErrorInfo(error);
  if (hasBusinessRejectionReason(details)) return false;
  if ([108, 201, 202].includes(code)) return true;
  const normalizedMessage = message.toLowerCase();
  return (
    normalizedMessage.includes('auth') ||
    normalizedMessage.includes('invalid token') ||
    normalizedMessage.includes('unauthorized') ||
    normalizedMessage.includes('not login')
  );
}
