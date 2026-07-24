import { ElMessage } from 'element-plus';

function stringifyValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function resolveSdkErrorMessage(error) {
  if (!error || typeof error !== 'object') return stringifyValue(error);
  if (typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }
  if (error.details !== undefined) return stringifyValue(error.details);
  if (error.code !== undefined) return `SDK 5.0 error code: ${error.code}`;
  return '';
}

export function notifySdkSendError(error) {
  console.error('[SDK 5.0 send failed]', error);
  handleSDKErrorNotifi(error?.code, resolveSdkErrorMessage(error), error);
}

export default function handleSDKErrorNotifi(code, errorDesc = '', sourceError) {
  const message = stringifyValue(errorDesc) || resolveSdkErrorMessage(sourceError);
  console.error('[SDK 5.0 operation failed]', {
    code,
    message,
    error: sourceError,
  });
  try {
    ElMessage({
      title: 'Easemob SDK 5.0 Error',
      message: message || 'SDK 5.0 operation failed',
      type: 'error',
      center: true,
    });
  } catch (error) {
    console.error('[handleSDKErrorNotifi] ElMessage failed:', error, message);
  }
}
