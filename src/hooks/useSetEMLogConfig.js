import { watchEffect } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { EaseChatSDK } from '@/IM/initwebsdk'
export const useSetEMLogConfig = () => {
    const isOpenedEMLog = useLocalStorage('isOpenedEMLog', false)
    const closeEMLog = () => EaseChatSDK.logger.disableAll()
    const openEMLog = () => {
        EaseChatSDK.logger.setConfig({
            useCache: true, // 是否缓存
            maxCache: 3 * 1024 * 1024 // 最大缓存字节,
        })
        // 缓存全部等级日志
        EaseChatSDK.logger.setLevel(0)
        EaseChatSDK.logger.enableAll()
    }
    const donwLoadEMLog = () => EaseChatSDK.logger.download()
    watchEffect(() => {
        console.log('>>>>isOpenedEMLog', isOpenedEMLog.value)
        if (isOpenedEMLog.value) {
            openEMLog()
        } else {
            closeEMLog()
        }
    })

    return {
        isOpenedEMLog,
        donwLoadEMLog
    }
}
