import { Toast } from 'vant';
const Login = {
    state: {
        isRegister: false,
        username: ''
    },
    mutations: {
        setUserName(state, username) {
            state.username = username;
        },
        setRegisterFlag(state, flag) {
            state.isRegister = flag
        }
    },
    actions: {
        onLogin: function (context, payload) {
            if (payload.username == '' && payload.password == '') {
                Toast('请输入用户名和密码登陆');
                console.log("请输入用户名和密码登陆");
                return;
            } else if (payload.username == '') {
                this.Toast("请输入用户名");
                // console.log("请输入用户名");
                return;
            } else if (payload.password == '') {
                // console.log("请输入密码");
                this.Toast("请输入用户名");
                return;
            } else {
                context.commit('setUserName', payload.username)
                var options = {
                    apiUrl: WebIM.config.apiURL,
                    user: payload.username,
                    pwd: payload.password,
                    appKey: WebIM.config.appkey
                };
                WebIM.conn.open(options);
            }
        },
        onLogout: function (context) {
            context.commit('setUserName', '')
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
                    Toast.success('注册成功');
                    // _this.dispatch('onLogin', {
                    //     username: payload.username,
                    //     password: payload.password,
                    // })
                }
            };
            WebIM.conn.registerUser(options);
        },
        setRegisterFlag: function (context, flag) {
            const path = flag ? "/register" : "/login";
            Vue.$router.push(path)
            context.commit('setRegisterFlag', flag)
        }


    },
    getters: {

    }
}
export default Login;