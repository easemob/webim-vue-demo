import Vue from 'vue';
import Vuex from 'vuex';
import Login from './login';
import Chat from './chat';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        login: Login,
        chat: Chat
    }
})

export default store;