import { Message } from "element-ui";
const Login = {
	state: {
		isRegister: false,
		username: ""
	},
	mutations: {
		setUserName(state, username) {
			state.username = username;
		},
		setRegisterFlag(state, flag) {
			state.isRegister = flag;
		}
	},
	actions: {
		onLogin: function (context, payload) {
			context.commit("setUserName", payload.username);
			var options = {
				apiUrl: WebIM.config.apiURL,
				user: payload.username,
				pwd: payload.password,
				appKey: WebIM.config.appkey
			};
			WebIM.conn.open(options);
			localStorage.setItem("userInfo", JSON.stringify({ userId: payload.username, password: payload.password }));
		},
		onLogout: function (context) {
			context.commit("setUserName", "");
			localStorage.setItem("userInfo", "");
			WebIM.conn.close();
		},
		onRegister: function (context, payload) {
			const _this = this;
			// context.commit('setUserName', payload.username)
			var options = {
				apiUrl: WebIM.config.apiURL,
				username: payload.username,
				password: payload.password,
				nickname: payload.nickname,
				appKey: WebIM.config.appkey,
				success: () => {
					Message({
						type: "success",
						message: "注册成功"
					});
					context.commit("setRegisterFlag", false);
				},
				error: (err) => {
					if (JSON.parse(err.data).error == "duplicate_unique_property_exists") {
						Message.error("用户已存在！")
					} else if (JSON.parse(err.data).error == "illegal_argument") {
						Message.error("用户名不合法！")
					} else if (JSON.parse(err.data).error == "unauthorized") {
						Message.error("注册失败，无权限！")
					} else if (JSON.parse(err.data).error == "resource_limited") {
						Message.error("您的App用户注册数量已达上限,请升级至企业版！")
					}
				}
			};
			WebIM.conn.registerUser(options);
		},
		setRegisterFlag: function (context, flag) {
			const path = flag ? "/register" : "/login";
			Vue.$router.push(path);
			context.commit("setRegisterFlag", flag);
		}


	},
	getters: {

	}
};
export default Login;
