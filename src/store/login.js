import { Message } from 'ant-design-vue';
import axios from 'axios'
const domain = 'http://a1.easemob.com'
const Login = {
	state: {
		isRegister: false,
		username: '',
		userDetail: {},
		imageUrl: '',
		imageId: '',
		phoneNumber: '',
	},
	mutations: {
		setUserName(state, username){
			state.username = username;
		},
		setRegisterFlag(state, flag){
			state.isRegister = flag;
		},
		setUserDetaild(state, user_detail){
			state.userDetail = user_detail;
		},
		setImageUrl(state, data){
			state.imageUrl = data.url
			state.imageId = data.imageId
		},
		setPhoneNumber(state, data){
			state.phoneNumber = data.phoneNumber
		}
	},
	actions: {
		onLogin: function(context, payload){
			context.commit('setUserName', payload.username);
			let options = {
				user: payload.username,
				pwd: payload.password,
				appKey: WebIM.config.appkey,
				apiUrl: 'https://a1.easecdn.com'
			};
			WebIM.conn.open(options);
			localStorage.setItem('userInfo', JSON.stringify({ userId: payload.username, password: payload.password }));
		},
		onLogout: function(context){
			context.commit('setUserName', '');
			localStorage.setItem('userInfo', '');
			WebIM.conn.close();
		},
		onRegister: function(context, payload){
			const _this = this;
			// context.commit('setUserName', payload.username)
			var options = {
				username: payload.username,
				password: payload.password,
				nickname: payload.nickname,
				appKey: WebIM.config.appkey,
				success: () => {
					Message.success('注册成功');
					context.commit('setRegisterFlag', false);
				},
				error: (err) => {
					if(JSON.parse(err.data).error == 'duplicate_unique_property_exists'){
						Message.error('用户已存在！');
					}
					else if(JSON.parse(err.data).error == 'illegal_argument'){
						if(JSON.parse(err.data).error_description === 'USERNAME_TOO_LONG'){
							return message.error('用户名超过64个字节！');
						}
						Message.error('用户名不合法！');
					}
					else if(JSON.parse(err.data).error == 'unauthorized'){
						Message.error('注册失败，无权限！');
					}
					else if(JSON.parse(err.data).error == 'resource_limited'){
						Message.error('您的App用户注册数量已达上限,请升级至企业版！');
					}
				}
			};
			WebIM.conn.registerUser(options);
		},
		getLoginUserInfo: (context, payload)=>{
			const { userId } = payload;
			WebIM.conn.fetchUserInfoById(userId).then((res) => {
				let user_detail = res.data[userId];
				res.data[userId] && context.commit('setUserDetaild', user_detail);
			})['catch'](err => {
				context.commit('setUserDetaild', {})
			})
		},
		updateOwnUserInfo: ({ commit }, payload)=>{
			const { infoValue, type } = payload;
			WebIM.conn.updateOwnUserInfo(type, infoValue).then((res) => {
				res.data && commit('setUserDetaild', res.data);
			});
		},
		setRegisterFlag: function(context, flag){
			const path = flag ? '/register' : '/login';
			Vue.$router.push(path);
			context.commit('setRegisterFlag', flag);
		},

		// 发短信获取验证码
	    getCaptcha: (context, payload) => {
            axios.post(domain+'/inside/app/sms/send', {
                phoneNumber: payload.phoneNumber,
                imageId: context.rootState.login.imageId,
                imageCode: payload.imageCode
            })
            .then(function (response) {
                Message.success('短信已发送')
            })
            .catch(function (error) {
                console.log('error', error.response);
                if(error.response.status == 400){
                    Message.error(error.response.data.errorInfo)
                }
            });
	    },
	    // 获取图片验证码
	    getImageVerification: (context, payload) => {
            axios.get(domain+'/inside/app/image')
            .then(function (response) {
                const url = domain + '/inside/app/image/' + response.data.data.image_id
                context.commit('setImageUrl', {url: url, imageId: response.data.data.image_id});
            })
	    },
	    // 在 appserver 注册用户
	    registerUser: (context, payload) => {
            const registerState = context.rootState.login
            const {imageId, imageCode} = registerState
            const {userId, userPassword, phoneNumber, smsCode} = payload
            axios.post(domain+'/inside/app/user/register', {
                userId,
                userPassword,
                phoneNumber,
                smsCode,
                imageId,
                imageCode
            })
            .then(function (response) {
                Message.success('注册成功');
				context.commit('setRegisterFlag', false);
            })
            .catch(function (error) {
                if(error.response.status == '400'){
                    Message.error(error.response.data.errorInfo)
                }
                console.log(error.response);
            });
	    },
	    // 使用 token 登录
	    loginWithToken: (context, payload) => {
	    	axios.post(domain+'/inside/app/user/login', {
                userId: payload.username,
                userPassword: payload.password
            })
            .then(function (response) {
                const {phoneNumber, token} = response.data
                context.commit('setPhoneNumber', phoneNumber)

                context.commit('setUserName', payload.username);

				let options = {
					user: payload.username,
					accessToken: token,
                	appKey: WebIM.config.appkey
				};
				WebIM.conn.open(options);
				localStorage.setItem('userInfo', JSON.stringify({ userId: payload.username, password: payload.password }));
            })
            .catch(function (error) {
                console.log(error);
            });
	    }
	},
	getters: {

	}
};
export default Login;
