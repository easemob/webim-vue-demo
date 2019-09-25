import config from './WebIMConfig'
import websdk from 'easemob-websdk';
import emedia from 'easemob-emedia';
import webrtc from 'easemob-webrtc'

function ack(message) {
    var bodyId = message.id; // 需要发送已读回执的消息id
    var msg = new WebIM.message('read', WebIM.conn.getUniqueId());
    msg.set({
        id: bodyId,
        to: message.from
    });
    WebIM.conn.send(msg.body);
}

//初始化IM SDK
var WebIM = {};
WebIM = window.WebIM = websdk
WebIM.config = config;
WebIM.conn = new WebIM.connection({
    appKey: WebIM.config.appkey,
    isHttpDNS: WebIM.config.isHttpDNS,
    isMultiLoginSessions: WebIM.config.isMultiLoginSessions,
    https: WebIM.config.https,
    url: WebIM.config.xmppURL,
    apiUrl: WebIM.config.apiURL,
    isAutoLogin: true,
    heartBeatWait: WebIM.config.heartBeatWait,
    autoReconnectNumMax: WebIM.config.autoReconnectNumMax,
    autoReconnectInterval: WebIM.config.autoReconnectInterval,
    isStropheLog: WebIM.config.isStropheLog,
    delivery: WebIM.config.delivery
})
if (!WebIM.conn.apiUrl) {
    WebIM.conn.apiUrl = WebIM.config.apiURL
}


//注册监听回调
WebIM.conn.listen({
    onOpened: function (message) { //连接成功回调
        // 登录或注册成功后 跳转到好友页面
        const username = Vue.$store.state.login.username;
        const path = location.pathname.indexOf("login") !== -1 || location.pathname.indexOf("register") !== -1 ? "/contact" : location.pathname
        const redirectUrl = `${path}?username=${username}`;
        Vue.$router.push({ path: redirectUrl });
    },
    onClosed: function (message) {
        Vue.$router.push({ path: '/login' });
    }, //连接关闭回调
    onTextMessage: function (message) {
        // console.log('onTextMessage', message)
        const { from, to, type } = message
        const chatId = type !== 'chat' ? to :from
        const typeMap = {
            chat: 'contact',
            groupchat: 'group',
            chatroom: 'chatroom'
        }
        Vue.$store.commit('updateMsgList', {
            chatType: typeMap[message.type],
            chatId: chatId,
            msg: message.data,
            bySelf: false,
            from: message.from,
            mid: message.id
        })
        ack(message);
        console.log(12345)
        if(WebIM && WebIM.call && message && message.ext && message.ext.msg_extension){
            var msgExtension = message.ext.msg_extension&&JSON.parse(message.ext.msg_extension)
            var options = {
                confrId: message.ext.conferenceId,
                password: message.ext.password || '',
                gid: msgExtension.group_id,
                inviter: msgExtension.inviter
            }
            WebIM.call.listener.onInvite(message.from, options)
        }
    }, //收到文本消息
    onEmojiMessage: function (message) {
        console.log('onEmojiMessage', message)
        ack(message);
    }, //收到表情消息
    onPictureMessage: function (message) {
        // console.log('onPictureMessage', message)
        const { from, to, type } = message
        const chatId = type !== 'chat' ? to :from
        const typeMap = {
            chat: 'contact',
            groupchat: 'group',
            chatroom: 'chatroom'
        }
        Vue.$store.commit('updateMsgList', {
            chatType: typeMap[message.type],
            chatId: chatId,
            msg: message.url,
            bySelf: false,
            type: 'img',
            from: message.from
        })
        ack(message);
    }, //收到图片消息
    onCmdMessage: function (message) {
        console.log('onCmdMessage', message)
    }, //收到命令消息
    onAudioMessage: function (message) {
        console.log('onAudioMessage', message)
        ack(message);
    }, //收到音频消息
    onLocationMessage: function (message) {
        console.log('onLocationMessage', message)
        ack(message);
    }, //收到位置消息
    onFileMessage: function (message) {
        const { from, to, type } = message
        const chatId = type !== 'chat' ? to :from
        const typeMap = {
            chat: 'contact',
            groupchat: 'group',
            chatroom: 'chatroom'
        }
        Vue.$store.commit('updateMsgList', {
            chatType: typeMap[message.type],
            chatId: chatId,
            msg: message.url,
            bySelf: false,
            type: 'file',
            filename: message.filename,
            file_length: message.file_length,
            from: message.from
        })
        // console.log('onFileMessage', message)
        ack(message);
    }, //收到文件消息
    onVideoMessage: function (message) {
        console.log('onVideoMessage', message)
        ack(message);
    }, //收到视频消息
    onPresence: function (message) {
        // console.log('onPresence', message)
        switch (message.type) {
            case 'subscribe':
                let options = {
                    isShow: true,
                    ...message
                }
                Vue.$store.commit("changeFriendRequestState", options)
                break;
            case 'subscribed':
                Vue.$store.dispatch('onGetContactUserList')
                break;
            case 'unsubscribed':
                Vue.$store.dispatch('onGetContactUserList')
            default:
                break;
        }
    }, //处理“广播”或“发布-订阅”消息，如联系人订阅请求、处理群组、聊天室被踢解散等消息
    onRoster: function (message) {
        console.log('onRoster', message)
    }, //处理好友申请
    onInviteMessage: function (message) {
        console.log('onInviteMessage', message)
    }, //处理群组邀请
    onOnline: function () {
        console.log('onOnline 网络已连接')
    }, //本机网络连接成功
    onOffline: function () {
        console.log('onOffline 网络已断开')
    }, //本机网络掉线
    onError: function (message) {
        console.log('onError', message);
        //报错返回到登录页面
        //Vue.$router.push({ path: '/login' });
    }, //失败回调
    onBlacklistUpdate: function (list) { //黑名单变动
        // 查询黑名单，将好友拉黑，将好友从黑名单移除都会回调这个函数，list则是黑名单现有的所有好友信息
        // console.log('onBlacklistUpdate', list);
        let blackList = list;
        Vue.$store.commit('updateBlackList', blackList)
    },
    onReceivedMessage: function (message) {
        console.log('onReceivedMessage', message);
        Vue.$store.commit('updateMessageMid', message)
        message.status = 'sent'
        Vue.$store.commit('updateMessageStatus', message)
    }, //收到消息送达服务器回执

    onDeliveredMessage: function (message) {
        console.log('onDeliveredMessage', message);
       // Vue.$store.commit('updateMessageStatus', message)
    }, //收到消息送达客户端回执

    onReadMessage: function (message) {
        console.log('onReadMessage', message);
        message.status = 'read'
        Vue.$store.commit('updateMessageStatus', message)
    }, //收到消息已读回执

    onCreateGroup: function (message) {
        console.log('onCreateGroup', message);
    }, //创建群组成功回执（需调用createGroupNew）
    onMutedMessage: function (message) {
        console.log('onMutedMessage', message);
    } //如果用户在A群组被禁言，在A群发消息会走这个回调并且消息不会传递给群其它成员
});

WebIM.WebRTC = webrtc;
WebIM.EMedia = emedia;
export default WebIM;