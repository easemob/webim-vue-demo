/**
 * git do not control webim.config.js
 * everyone should copy webim.config.js.demo to webim.config.js
 * and have their own configs.
 * In this way , others won't be influenced by this config while git pull.
 *
 */

// for react native
// var location = {
//     protocol: "https"
// }
var config = {
	/*
     * Application AppKey
     */
	// appkey:"gdpwq123#ceshi",
	// appkey: '5101220107132865#test',
	// appkey: 'easemob-demo#chatdemoui',
	appkey: 'easemob#easeim',
	// appkey: 'easemobpush#push1',
	// appkey: '81446724#514456',
	// appkey: '41117440#383391',
	// appkey: 'easemob-demo#eastmd1',
	/*
     * Application Host
     */
	Host: 'easemob.com',
	/*
     * Whether to use HTTPS
     * @parameter {Boolean} true or false
     */
	https: true,


	/*
    * 公有云配置默认为 true，
    * 私有云配置请设置 isHttpDNS = false , 详细文档：http://docs-im.easemob.com/im/web/other/privatedeploy
    */
	isHttpDNS: true,
	/*
    
    /*
     * isMultiLoginSessions
     * true: A visitor can sign in to multiple webpages and receive messages at all the webpages.
     * false: A visitor can sign in to only one webpage and receive messages at the webpage.
     */
	isMultiLoginSessions: true,
	/**
     * Whether to use window.doQuery()
     * @parameter {Boolean} true or false
     */
	isWindowSDK: false,
	/** a
     * @parameter {Boolean} true or false
     */
	isSandBox: false, // 内部测试环境，集成时设为false
	/**
     * Whether to console.log in strophe.log()
     * @parameter {Boolean} true or false
     */
	isDebug: true,
	/**
     * Whether to show logs in strophe
     * @parameter {Boolean} true or false
     */
	isStropheLog: false,
	/**
     * will auto connect the xmpp server autoReconnectNumMax times in background when client is offline.
     * won't auto connect if autoReconnectNumMax=0.
     */
	autoReconnectNumMax: 5,
	/**
     * the interval secons between each atuo reconnectting.
     * works only if autoReconnectMaxNum >= 2.
     */
	autoReconnectInterval: 2,
	/**
     * webrtc supports WebKit and https only
     */
	isWebRTC: true, // window.RTCPeerConnection && /^https\:$/.test(window.location.protocol),
	/**
     *  cn: chinese
     *  us: english
     */
	i18n: 'us',
	/*
     * Set to auto sign-in
     */
	isAutoLogin: true,
	/**
     * Size of message cache for person to person
     */
	p2pMessageCacheSize: 500,
	/**
     * When a message arrived, the receiver send an ack message to the
     * sender, in order to tell the sender the message has delivered.
     * See call back function onReceivedMessage
     */
	delivery: true,
	/**
     * Size of message cache for group chating like group, chatroom etc
     */
	groupMessageCacheSize: 200,
	/**
     * 5 actual logging methods, ordered and available:
     * 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'
     */

	loglevel: 'ERROR',

	/**
     * enable localstorage for history messages
     */
	enableLocalStorage: true,

	AgoraAppId: '15cb0d28b87b425ea613fc46f7c9f974'
	/* 需要替换成自己的声网 appId，此 appId 有限量，仅供参考使用，同时获取声网 token 的接口仅能供此 appId 使用，换成自己的 appId 后需要自己去实现 app server 获取声网token。 */
};
export default config;
