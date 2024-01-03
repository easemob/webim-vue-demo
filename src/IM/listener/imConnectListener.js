import router from '@/router'
import store from '@/store'
import { handleSDKErrorNotifi } from '@/utils/handleSomeData'
import { EMClient } from '../index'
import { usePlayRing } from '@/hooks'
export const imConnectListener = () => {
    const mountConnectEventListener = () => {
        const { isOpenPlayRing, clickRing } = usePlayRing()
        EMClient.addEventHandler('connection', {
            onConnected: () => {
                console.log('>>>>>环信连接成功')
                store.commit('CHANGE_LOGIN_STATUS', true)
                if (isOpenPlayRing.value) clickRing()
                fetchLoginUsersInitData()
                router.replace('/chat')
            },
            onDisconnected: () => {
                router.push('/login')
                store.commit('CHANGE_LOGIN_STATUS', false)
            },
            onOnline: () => {
                store.commit('CHANGE_NETWORK_STATUS', true)
            }, // 本机网络连接成功。
            onOffline: () => {
                store.commit('CHANGE_NETWORK_STATUS', false)
            }, // 本机网络掉线。
            onError: (error) => {
                console.log('on error', error)
                handleSDKErrorNotifi(error.type, error.message)
            }
        })
    }

    //fetch 登陆用户的初始数据
    const fetchLoginUsersInitData = () => {
        getMyUserInfos()
        fetchFriendList()
        fetchTheLoginUserBlickList()
        fetchGroupList()
        //初始化vuex中的会话列表相关数据
        store.commit('INIT_CONVERSATION_STATE')
    }
    //获取登陆用户属性
    const getMyUserInfos = () => {
        const userId = EMClient.user
        store.dispatch('getMyUserInfo', userId)
    }
    //获取好友列表
    const fetchFriendList = () => {
        // const { value = {} } = useLocalStorage('friendList')
        // if (Object.values(JSON.parse(value)).length > 0) return
        store.dispatch('fetchAllFriendListFromServer')
    }
    //获取黑名单列表
    const fetchTheLoginUserBlickList = () => store.dispatch('fetchBlackList')
    //获取加入的群组列表
    const fetchGroupList = () => {
        //如果本地存储里不存在群组列表则调用获取群组列表
        // const { value = {} } = useLocalStorage('groupList')
        // if (Object.values(JSON.parse(value)).length > 0) return
        const pageParams = {
            pageNum: 1,
            pageSize: 20
        }
        store.dispatch('fetchGroupList', pageParams)
    }
    return {
        mountConnectEventListener,
        fetchLoginUsersInitData,
        getMyUserInfos,
        fetchFriendList,
        fetchTheLoginUserBlickList,
        fetchGroupList
    }
}
