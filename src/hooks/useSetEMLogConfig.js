import { watchEffect } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { setLogLevel } from 'easemob-websdk';
export const useSetEMLogConfig = () => {
  const isOpenedEMLog = useLocalStorage('isOpenedEMLog', false);
  const closeEMLog = () => setLogLevel('error');
  const openEMLog = () => {
    setLogLevel('debug');
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
  };
};
