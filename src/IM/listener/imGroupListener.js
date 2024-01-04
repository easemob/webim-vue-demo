import { EMClient } from '../index'
import { informType } from '@/constant'
import store from '@/store'
export const imGroupListener = () => {
    const { INFORM_FROM } = informType
    const submitInformData = (fromType, informContent) => {
        store.dispatch('createNewInform', { fromType, informContent })
    }
    const mountGroupEventListener = () => {
        EMClient.addEventHandler('groupEvent', {
            onGroupEvent: (groupevent) => {
                submitInformData(INFORM_FROM.GROUP, groupevent)
            }
        })
    }
    return {
        mountGroupEventListener
    }
}
