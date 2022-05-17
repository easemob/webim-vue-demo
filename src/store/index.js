import Vue from 'vue';
import Vuex from 'vuex';
import Login from './login';
import Chat from './chat';
import FriendModule from './friendModule';
import Group from './group';
import Emedia from './emedia';
import Agora from './agora';
import Presence from './presence';

Vue.use(Vuex);

const store = new Vuex.Store({
	modules: {
		login: Login,
		chat: Chat,
		friendModule: FriendModule,
		group: Group,
		emedia: Emedia,
		agora: Agora,
		presence: Presence
	}
});

export default store;
