import { EaseChatClient } from '../initwebsdk'
import store from '@/store'
export const imGroupListener = () => {
    const submitInformData = (fromType, informContent) => {
        console.log('>>>submitInformData>>>', fromType, informContent)
        store.dispatch('createNewInform', { fromType, informContent })
    }
    const mountGroupEventListener = () => {
        EaseChatClient.addEventHandler('groupEvent', {
            onGroupEvent: (groupevent) => {
                console.log('>>>>>>>收到群组事件', groupevent)
                submitInformData(INFORM_FROM.GROUP, groupevent)
            }
        })
    }
    return {
        mountGroupEventListener
    }
}
