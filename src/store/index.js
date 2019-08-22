import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const Login = {
    state: {
        
    },
    mutations: {
        onLogin(){
            
        }
    },
    actions: {
        onLogin() {
            var options = {
                apiUrl: WebIM.config.apiURL,
                user: payload.username,
                pwd: payload.password,
                appKey: WebIM.config.appkey
            };
            WebIM.conn.open(options);
        }
    },
    getters: {

    }

}
// const sendMessage = {
//     state: {

//     },
//     mutations: {

//     },
//     actions: {

//     },
//     getters: {

//     }

// }
const store = new Vuex.Store({
    // modules: {
    //     onLogin: Login,
    //     sendMsg: sendMessage
    // }
    actions: {
        onLogin: function (context, payload) {
            var options = {
                apiUrl: WebIM.config.apiURL,
                user: payload.username,
                pwd: payload.password,
                appKey: WebIM.config.appkey
            };
            WebIM.conn.open(options);
        }
    }
})

export default store;