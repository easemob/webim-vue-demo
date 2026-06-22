import { watchEffect } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { Logger, LogLevel } from '@easemob-community/callkit-vue3';

const LEVEL_OPTIONS = [
  { label: 'ERROR', value: LogLevel.ERROR },
  { label: 'WARN', value: LogLevel.WARN },
  { label: 'INFO', value: LogLevel.INFO },
  { label: 'DEBUG', value: LogLevel.DEBUG },
  { label: 'VERBOSE', value: LogLevel.VERBOSE },
];

export const useSetCallKitLogConfig = () => {
  // 控制台日志开关
  const isOpenedCallKitLog = useLocalStorage('isOpenedCallKitLog', true);
  // 控制台日志等级
  const callKitLogLevel = useLocalStorage('callKitLogLevel', LogLevel.INFO);
  // IDB 日志写入开关（独立于控制台）
  const isOpenedCallKitIDBLog = useLocalStorage('isOpenedCallKitIDBLog', true);

  const getLevelName = (level) => {
    const opt = LEVEL_OPTIONS.find((o) => o.value === level);
    return opt?.label || 'INFO';
  };

  const applyConfig = () => {
    const logger = Logger.getInstance();
    // 控制台日志
    logger.setConsoleEnabled(!!isOpenedCallKitLog.value);
    if (isOpenedCallKitLog.value) {
      logger.setLevel(Number(callKitLogLevel.value));
    }
    // IDB 日志
    logger.setIDBEnabled(!!isOpenedCallKitIDBLog.value);
  };

  const downloadCallKitLog = async () => {
    try {
      const logger = Logger.getInstance();
      const text = await logger.exportLogsAsText();
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `callkit-logs-${new Date().toLocaleString().replace(/[/:\s]/g, '-')}.log`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载 CallKit 日志失败', error);
    }
  };

  const clearCallKitLog = async () => {
    try {
      const logger = Logger.getInstance();
      const deletedCount = await logger.clearLogs();
      console.info(`[CallKit] 已清理 ${deletedCount} 条日志`);
    } catch (error) {
      console.error('清理 CallKit 日志失败', error);
    }
  };

  watchEffect(() => {
    applyConfig();
  });

  return {
    isOpenedCallKitLog,
    callKitLogLevel,
    isOpenedCallKitIDBLog,
    getLevelName,
    downloadCallKitLog,
    clearCallKitLog,
    LEVEL_OPTIONS,
  };
};
