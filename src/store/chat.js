// import WebIM from "../utils/WebIM";

const Chat = {
    state: {
        userList: {
            chatUserList: [],
            groupUserList: [],
            chatroomUserList: []
        }
    },
    mutations: {
        // update() {

        // }
    },
    actions: {
        // onGetUserList: function (context, payload) {
        //    const a = WebIM.getUserList();
        //    commit('update', '');
        // }
    },
    getters: {
        onGetChatUserList(state) {
            return state.userList.chatUserList;
        },
        onGetGroupUserList(state) {
            return state.userList.groupUserList;
        },
        onGetChatroomUserList(state) {
            return state.userList.chatroomUserList;
        }
    }

}
export default Chat;