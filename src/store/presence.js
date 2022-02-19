import { Message } from 'ant-design-vue'
import WebIM from '../utils/WebIM'
const Presence = {
  state: {
    statusList: [],
    ext: '',
    userPresenceList: [],
    statusIndex: 0
  },
  mutations: {
    getFriendsStatus (state, data) {
      state.statusList = data.list
    },
    refreshUserPresence (state, data) {
      state.userPresenceList = data.result
    },
    updateUserPresenceStatus (state, ext) {
      console.log(ext,' ext')
      switch (ext) {
        case 'Offline':
          state.statusIndex = 5
          break
        case 'Online':
          state.statusIndex = 0
          break
        case 'Busy':
          state.statusIndex = 1
          break
        case 'Do not Disturb':
          state.statusIndex = 2
          break
        case 'Leave':
          state.statusIndex = 3
          break
        default:
          state.statusIndex = 4
      }
    }
  },
  actions: {
    publishNewPresence ({ commit }, payload) {
      console.log(payload)
      WebIM.conn.publishPresence(payload)
      .then(res => {
        console.log(res)
      })
    },
    getAllFriendsStatus ({ commit }, payload) {
      // const { id } = payload
      // console.log('%c我我我我我我我我我我', 'color:red;font-size:20px;')
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
      return new Promise((resolve, reject) => {
        WebIM.conn.fetchPresenceStatus(payload).then(res => {
          resolve(res)
          // commit('refreshUserPresence', res)
        })
      })
    }
  },
  getters: {

  }
}

export default Presence