import { createStore } from 'vuex';

export default createStore({
  state: {
    loginState: false,
  },
  getters: {},
  mutations: {
    CHANGE_LOGIN_STATUS: (state, status) => {
      state.loginState = status;
    },
  },
  actions: {},
  modules: {},
});
