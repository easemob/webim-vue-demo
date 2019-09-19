const FriendModule = {
    state: {
        friendRequest: [],
        blackList:{}
    },
    mutations: {
        changeFriendRequestState(state, data) {
            state.friendRequest = data
        },
        updateBlackList(state,blackList) {
            console.log("updateBlackList",blackList)
            state.blackList = blackList
        }
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
        },
        //获取黑名单
        onGetFirendBlack: function (context, payload) {
            WebIM.conn.getBlacklist();
        },

        //移除黑名单
        onRemoveBlack: function (context, payload) {
            let blackName = payload.removeName
            WebIM.conn.removeFromBlackList({
                name: blackName,
                success: function () {
                    console.log('Remove from black list success.');
                },
                error: function () {
                    console.log('Remove from black list error.')
                }
            });
        }
    },
    getters: {
        addfirend(state) {
            return state.firendList.myFirendList;
        }
    }

}
export default FriendModule;