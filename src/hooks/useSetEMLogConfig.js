import { watchEffect } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { EMClient } from '@/IM';
export const useSetEMLogConfig = () => {
  const isOpenedEMLog = useLocalStorage('isOpenedEMLog', false);
  const closeEMLog = () => EMClient.logger.disableAll();
  const openEMLog = () => {
    EMClient.logger.setConfig({
      useCache: true, // 是否缓存
      maxCache: 3 * 1024 * 1024, // 最大缓存字节,
    });
    // 缓存全部等级日志
    EMClient.logger.setLevel(0);
    EMClient.logger.enableAll();
  };
  const donwLoadEMLog = () => EMClient.logger.download();
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
