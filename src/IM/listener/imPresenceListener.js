import { EaseChatClient } from '../initwebsdk'
import store from '@/store'
export const imPresenceListener = () => {
    //处理登陆用户状态的变更
    const getUserPresence = (status) => {
        store.dispatch('handlePresenceChanges', status)
    }
    const mountPresenceEventListener = () => {
        EaseChatClient.addEventHandler('presenceStatusChange', {
            onPresenceStatusChange: (status) => {
                console.log('>>>>>presenceStatusChange', status)
                getUserPresence(...status)
            }
        })
    }
    return {
        mountPresenceEventListener
    }
}
