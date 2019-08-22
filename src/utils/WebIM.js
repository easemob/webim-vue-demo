import config from './WebIMConfig'
import websdk from 'easemob-websdk'

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
    onOpened: function(message) { //连接成功回调
        // 如果isAutoLogin设置为false，那么必须手动设置上线，否则无法收消息
        // 手动上线指的是调用conn.setPresence(); 如果conn初始化时已将isAutoLogin设置为true
        // 则无需调用conn.setPresence(); 
        console.log('onOpened', message);
    },
    onClosed: function(message) {
        console.log('onClosed', message)
    }, //连接关闭回调
    onTextMessage: function(message) {
        console.log('onTextMessage', message)
        ack(message);
    }, //收到文本消息
    onEmojiMessage: function(message) {
        console.log('onEmojiMessage', message)
        ack(message);
    }, //收到表情消息
    onPictureMessage: function(message) {
        console.log('onPictureMessage', message)
        ack(message);
    }, //收到图片消息
    onCmdMessage: function(message) {
        console.log('onCmdMessage', message)
    }, //收到命令消息
    onAudioMessage: function(message) {
        console.log('onAudioMessage', message)
        ack(message);
    }, //收到音频消息
    onLocationMessage: function(message) {
        console.log('onLocationMessage', message)
        ack(message);
    }, //收到位置消息
    onFileMessage: function(message) {
        console.log('onFileMessage', message)
        ack(message);
    }, //收到文件消息
    onVideoMessage: function(message) {
        console.log('onVideoMessage', message)
        ack(message);
    }, //收到视频消息
    onPresence: function(message) {
        console.log('onPresence', message)
    }, //处理“广播”或“发布-订阅”消息，如联系人订阅请求、处理群组、聊天室被踢解散等消息
    onRoster: function(message) {
        console.log('onRoster', message)
    }, //处理好友申请
    onInviteMessage: function(message) {
        console.log('onInviteMessage', message)
    }, //处理群组邀请
    onOnline: function() {
        console.log('onOnline 网络已连接')
    }, //本机网络连接成功
    onOffline: function() {
        console.log('onOffline 网络已断开')
    }, //本机网络掉线
    onError: function(message) {
        console.log('onError', message)
    }, //失败回调
    onBlacklistUpdate: function(list) { //黑名单变动
        // 查询黑名单，将好友拉黑，将好友从黑名单移除都会回调这个函数，list则是黑名单现有的所有好友信息
        console.log('onBlacklistUpdate', list);
    },
    onReceivedMessage: function(message) {
        console.log('onReceivedMessage', message);
    }, //收到消息送达服务器回执
    onDeliveredMessage: function(message) {
        console.log('onDeliveredMessage', message);
    }, //收到消息送达客户端回执
    onReadMessage: function(message) {
        console.log('onReadMessage', message);
    }, //收到消息已读回执
    onCreateGroup: function(message) {
        console.log('onCreateGroup', message);
    }, //创建群组成功回执（需调用createGroupNew）
    onMutedMessage: function(message) {
            console.log('onMutedMessage', message);
        } //如果用户在A群组被禁言，在A群发消息会走这个回调并且消息不会传递给群其它成员
});

export default WebIM;