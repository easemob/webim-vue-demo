import { EaseChatClient } from '../initwebsdk'
import { informType } from '@/constant'
import store from '@/store'
export const imContactListener = () => {
    const { INFORM_FROM } = informType
    const mountContactEventListener = () => {
        EaseChatClient.addEventHandler('friendListen', {
            // 收到好友邀请触发此方法。
            onContactInvited: (data) => {
                //写入INFORM
                console.log('>>>>>>收到好友申请', data)
                submitInformData(INFORM_FROM.FRIEND, data)
            },
            // 联系人被删除时触发此方法。
            onContactDeleted: (data) => {
                //写入INFORM
                console.log('>>>>收到好友关系解散', data)
                submitInformData(INFORM_FROM.FRIEND, data)
                store.dispatch('onDeleteFriend', data)
            },
            // 新增联系人会触发此方法。
            onContactAdded: (data) => {
                console.log('>>>>好友新增监听', data)
                submitInformData(INFORM_FROM.FRIEND, data)
                store.dispatch('onAddedNewFriend', data)
            },
            // 好友请求被拒绝时触发此方法。
            onContactRefuse: (data) => {
                //写入INFORM
                console.log('>>>>>>好友申请被拒绝', data)
                data.type = 'other_person_refuse'
                submitInformData(INFORM_FROM.FRIEND, data)
            },
            // 好友请求被同意时触发此方法。
            onContactAgreed: (data) => {
                //写入INFORM
                console.log('>>>>>对方同意了好友申请', data)
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
