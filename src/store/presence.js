import { Message } from 'ant-design-vue'
import WebIM from '../utils/WebIM'
const Presence = {
  state: {
    statusList: [],
    ext: ''
  },
  mutations: {
    getFriendsStatus (state, data) {
      state.statusList = data.list
    }
  },
  actions: {
    publishNewPresence ({ commit }, payload) {
      console.log(payload)
      WebIM.conn.publishPresence(payload)
      // .then(res => {
      //   console.log(res)
      // })
    },
    getAllFriendsStatus ({ commit }, payload) {
      // const { id } = payload
      console.log('%c我我我我我我我我我我', 'color:red;font-size:20px;')
      WebIM.conn.fetchSubscribedListWithCompletion().then(res => {

        console.log(res, 'getAllFriendsStatus')
        res.data && commit('getFriendsStatus', res.data)
      })
    },
    subFriendStatus ({ commit }, payload) {
      WebIM.conn.subscribePresence(payload).then(res => {
        console.log(res)
      })
    },
    unsubFriendStatus ({ commit }, payload) {
      WebIM.conn.unsubscribePresence(payload).then(res => {
        console.log(res)
      })
    },
    getSubPresence ({ commit }, payload) {
      WebIM.conn.fetchPresenceStatus(payload).then(res => {
        console.log(res)
      })
    }
  },
  getters: {

  }
}

export default Presence