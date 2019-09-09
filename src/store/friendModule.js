const FriendModule = {
    state: {
        friendRequest: [],
    },
    mutations: {
        changeFriendRequestState(state, data) {
            state.friendRequest = data
        },
    },
    actions: {
        addfirend: function (context, payload) {
            const { id, params } = payload
            WebIM.conn.subscribe({
                to: id,
                message: params + '请求添加你为好友'
            });
        },

        // 接受好友请求
        acceptSubscribe: function (context, payload) {
            WebIM.conn.subscribed({
                to: payload,
                message: 'success'
            })
        },

        //拒绝好友请求
        declineSubscribe: function (context, payload) {
            const { id, params } = payload
            WebIM.conn.unsubscribed({
                to: id,
                message: params + '拒绝您的好友请求'
            })
        }
    },
    getters: {
        addfirend(state) {
            return state.firendList.myFirendList;
        }
    }

}
export default FriendModule;