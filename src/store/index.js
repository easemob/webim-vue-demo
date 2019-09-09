import Vue from 'vue';
import Vuex from 'vuex';
import Login from './login';
import Chat from './chat';
import FriendModule from './friendModule'

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        login: Login,
        chat: Chat,
        friendModule:FriendModule
    }
})

export default store;