// import WebIM from "../utils/WebIM";

const Chat = {
    state: {
        userList: {
            contactUserList: [],
            groupUserList: [],
            chatroomUserList: []
        }
    },
    mutations: {
        updateUserList(state, payload) {
            const { userList, type } = payload;
            state.userList[type] = userList;
        }
    },
    actions: {
        onGetContactUserList: function (context, payload) {
            WebIM.conn.getRoster({
                success: function (roster) {
                    const userList = roster.filter(user => ['both', 'to'].includes(user.subscription));
                    context.commit('updateUserList', {
                        userList,
                        type: "contactUserList"
                    })
                }
            });
        },
        onGetGroupUserList: function (context, payload) {
            console.log('onGetGroupUserList')
            var options = {
                success: function (resp) {
                    let userList = resp.data;
                    userList.forEach((user, index) => {
                        userList[index]["name"] = user.groupname
                    });
                    context.commit('updateUserList', {
                        userList,
                        type: "groupUserList"
                    })
                },
                error: function (e) {},
            }
            WebIM.conn.getGroup(options);
        },
        onGetChatroomUserList: function (context, payload) {
            console.log('onGetChatroomUserList');
            var option = {
                apiUrl: 'https://a1.easemob.com',
                pagenum: 1,                                 // 页数
                pagesize: 20,                               // 每页个数
                success: function (list) {
                    context.commit('updateUserList', {
                        userList: list.data,
                        type: "chatroomUserList"
                    })
                },
                error: function () {
                    console.log('List chat room error');
                }
            };
            WebIM.conn.getChatRooms(option);
        },
    },
    getters: {
        onGetContactUserList(state) {
            return state.userList.contactUserList;
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