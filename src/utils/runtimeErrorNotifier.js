import { ElMessage } from 'element-plus';

function stringifyDetails(details) {
  if (details === undefined) return '';
  try {
    return JSON.stringify(details);
  } catch {
    return String(details);
  }
}

function normalizeRuntimeMessage(error, fallbackMessage = '操作失败，请稍后重试') {
  if (!error) return fallbackMessage;
  if (typeof error === 'string') return error || fallbackMessage;
  const message = error.message || stringifyDetails(error.details);
  if (message) return String(message).trim() || fallbackMessage;
  if (error.code !== undefined) return `SDK 5.0 error code: ${error.code}`;
  return fallbackMessage;
}

export function notifyRuntimeError(error, fallbackMessage) {
  const message = normalizeRuntimeMessage(error, fallbackMessage);
  console.error('[SDK 5.0 runtime error]', error);
  try {
    ElMessage({
      message,
      type: 'error',
      center: true,
    });
  } catch (notifyError) {
    console.error('[notifyRuntimeError] ElMessage 失败:', notifyError, message);
  }
}
