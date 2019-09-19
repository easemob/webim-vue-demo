import Vue from 'vue';
import Vuex from 'vuex';
import Login from './login';
import Chat from './chat';
import FriendModule from './friendModule';
import Group from './group';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        login: Login,
        chat: Chat,
        friendModule:FriendModule,
        group: Group
    }
})

export default store;