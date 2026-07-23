import { watchEffect } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { setLogLevel } from 'easemob-websdk';
export const useSetEMLogConfig = () => {
  const isOpenedEMLog = useLocalStorage('isOpenedEMLog', false);
  const closeEMLog = () => setLogLevel('error');
  const openEMLog = () => {
    setLogLevel('debug');
  };
  const donwLoadEMLog = () => {
    throw new Error(
      'SDK 5.0 current package does not expose log download; no fallback is configured.',
    );
  };
  watchEffect(() => {
    if (isOpenedEMLog.value) {
      openEMLog();
    } else {
      closeEMLog();
    }
  });

  return {
    isOpenedEMLog,
    donwLoadEMLog,
  };
};
