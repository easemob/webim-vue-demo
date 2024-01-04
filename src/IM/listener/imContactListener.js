import { EMClient } from '../index'
import { informType } from '@/constant'
import store from '@/store'
export const imContactListener = () => {
    const { INFORM_FROM } = informType
    const mountContactEventListener = () => {
        EMClient.addEventHandler('friendListen', {
            // 收到好友邀请触发此方法。
            onContactInvited: (data) => {
                //写入INFORM

                submitInformData(INFORM_FROM.FRIEND, data)
            },
            // 联系人被删除时触发此方法。
            onContactDeleted: (data) => {
                //写入INFORM

                submitInformData(INFORM_FROM.FRIEND, data)
                store.dispatch('onDeleteFriend', data)
            },
            // 新增联系人会触发此方法。
            onContactAdded: (data) => {
                submitInformData(INFORM_FROM.FRIEND, data)
                store.dispatch('onAddedNewFriend', data)
            },
            // 好友请求被拒绝时触发此方法。
            onContactRefuse: (data) => {
                //写入INFORM

                data.type = 'other_person_refuse'
                submitInformData(INFORM_FROM.FRIEND, data)
            },
            // 好友请求被同意时触发此方法。
            onContactAgreed: (data) => {
                //写入INFORM

                //改掉data中的type
                data.type = 'other_person_agree'
                submitInformData(INFORM_FROM.FRIEND, data)
                store.dispatch('onAddedNewFriend', data)
            }
        })
    }
    const submitInformData = (fromType, informContent) => {
        store.dispatch('createNewInform', { fromType, informContent })
    }
    return {
        mountContactEventListener
    }
}
