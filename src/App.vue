<script setup>
import { useStore } from 'vuex'
import router from '@/router'
import EaseIM from '@/IM/initwebsdk'
import { handleSDKErrorNotifi, setMessageKey } from '@/utils/handleSomeData'
import { informType } from '@/constant'
import { usePlayRing } from '@/hooks'
import ring from '@/assets/ring.mp3'
/* callkit */
import EaseCallKit from '@/components/EaseCallKit'
import InviteCallMembers from '@/components/InviteCallMembers'
import { ref } from 'vue'
const store = useStore()
const { isOpenPlayRing, clickRing } = usePlayRing()
EaseIM.logger.disableAll()
/* connect 相关监听 */
EaseIM.conn.addEventHandler('connection', {
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
    },                  // 本机网络连接成功。
    onOffline: () => {
        store.commit('CHANGE_NETWORK_STATUS', false)
    },                 // 本机网络掉线。
    onError: (error) => {
        console.log('on error', error)
        handleSDKErrorNotifi(error.type, error.message)
    },
})
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
    const userId = EaseIM.conn.user
    store.dispatch('getMyUserInfo', userId)
}
//获取好友列表
const fetchFriendList = () => {
    // const { value = {} } = useLocalStorage('friendList')
    // if (Object.values(JSON.parse(value)).length > 0) return
    store.dispatch('fetchFriendList')
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
        pageSize: 20,
    }
    store.dispatch('fetchGroupList', pageParams)
}
//在线状态订阅相关
const presenceStatus = (type, user) => {
    type === 'sub' && store.dispatch('subFriendsPresence', [user])
    type === 'unsub' && store.dispatch('unsubFriendsPresence', [user])
}

/* presence 相关监听 */
EaseIM.conn.addEventHandler('presenceStatusChange', {
    onPresenceStatusChange: (status) => {
        console.log('>>>>>presenceStatusChange', status)
        getUserPresence(...status)
    },

})
//处理登陆用户状态的变更
const getUserPresence = (status) => {
    store.dispatch('handlePresenceChanges', status)
}
/* message 相关监听 */
EaseIM.conn.addEventHandler('messageListen', {
    onTextMessage: function (message) {
        console.log('>>>>>>>App mesage', message)
        console.log('setMessageKey', setMessageKey(message))
        pushNewMessage(message)
    },    // 收到文本消息。
    onEmojiMessage: function (message) {
        pushNewMessage(message)
    },   // 收到表情消息。
    onImageMessage: function (message) {
        pushNewMessage(message)
    },   // 收到图片消息。
    onCmdMessage: function (message) {
        console.log('>>>>>收到命令消息', message)
    },     // 收到命令消息。
    onAudioMessage: function (message) {
        pushNewMessage(message)
    },   // 收到音频消息。
    onLocationMessage: function (message) {
        pushNewMessage(message)
    },// 收到位置消息。
    onFileMessage: function (message) {
        pushNewMessage(message)
    },    // 收到文件消息。
    onCustomMessage: function (message) {
        pushNewMessage(message)
    },  // 收到自定义消息。
    onVideoMessage: function (message) {
        pushNewMessage(message)
    },     // 收到视频消息。
    onRecallMessage: function (message) {
        otherRecallMessage(message)
    },    // 收到消息撤回回执。
})
//接收的消息往store中push
const pushNewMessage = (message) => {
    store.dispatch('createNewMessage', message)
}
//收到他人的撤回指令
const otherRecallMessage = (message) => {
    console.log('>>>>>收到他人撤回', message)
    const { from, to, mid } = message
    //单对单的撤回to必然为登陆的用户id，群组发起撤回to必然为群组id 所以key可以这样来区分群组或者单人。
    const key = to === EaseIM.conn.user ? from : to
    console.log('>>>>>收到他人撤回', key)
    store.commit('CHANGE_MESSAGE_BODAY', { type: 'recall', key, mid })
    store.dispatch('gatherConversation', key)
}
/* 好友关系相关监听 */
const { INFORM_FROM } = informType
EaseIM.conn.addEventHandler('friendListen', {
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
        //取消针对好友的在线状态订阅
        presenceStatus('unsub', data.from)
        //好友关系解除重新获取好友列表
        fetchFriendList()
    },
    // 新增联系人会触发此方法。
    onContactAdded: (data) => {
        console.log('>>>>好友新增监听', data)
        submitInformData(INFORM_FROM.FRIEND, data)
        //新增好友重新获取好友列表
        fetchFriendList()

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
        //对方同意后重新获取好友列表
        fetchFriendList()
    }
})
/* 群组相关监听 */
EaseIM.conn.addEventHandler('groupEvent', {
    onGroupEvent: (groupevent) => {
        console.log('>>>>>>>收到群组事件', groupevent)
        submitInformData(INFORM_FROM.GROUP, groupevent)
    }
})

const submitInformData = (fromType, informContent) => {
    console.log('>>>submitInformData>>>', fromType, informContent)
    store.dispatch('createNewInform', { fromType, informContent })

}

/* 重新登陆 */
//读取本地EASEIM_loginUser
const EASEIM_loginUser = window.localStorage.getItem('EASEIM_loginUser')
const loginUserFromStorage = JSON.parse(EASEIM_loginUser) || {}
const handleRelogin = () => {
    console.log('重新登陆')
    EaseIM.conn.open({
        user: loginUserFromStorage.user,
        accessToken: loginUserFromStorage.accessToken
    })

}
if (loginUserFromStorage?.user && loginUserFromStorage?.accessToken) {
    handleRelogin()
}
/* EaseCallKit 相关 */
const easeCallKit = ref(null);
const inviteCallComp = ref(null)

const showModal = ({ groupId }) => {
    console.log('可以弹出邀请框', groupId)
    inviteCallComp.value.alertDialog(groupId)
}
const sendMulitInviteMsg = (targetIMId) => {
    console.log('targetIMIdtargetIMIdtargetIMId', targetIMId);
    const callType = 2
    easeCallKit.value.inMultiChanelSendInviteMsg(targetIMId, callType)
}

</script>
<template>
    <router-view v-slot="{ Component }">
        <transition name="slide-fade" mode="out-in" :duration="{ enter: 500, leave: 300 }">
            <component :is="Component" />
        </transition>
    </router-view>
    <!-- 铃声标签 -->
    <audio id="ring" :src="ring" controls hidden></audio>
    <!-- About EaseCallKit -->
    <EaseCallKit ref="easeCallKit" :EaseIM="EaseIM" :connectionName="'conn'" @onInviteMembers="showModal" />
    <InviteCallMembers ref="inviteCallComp" @sendMulitInviteMsg="sendMulitInviteMsg" />
</template>

<style type="scss">
@import './styles/reset/reset.css';
@import './styles/iconfont/iconfont.css';

/* .slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0.3;
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  opacity: 1;
} */
</style>
