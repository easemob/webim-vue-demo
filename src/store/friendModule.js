const FriendModule = {
	state: {
		friendRequest: [],
		blackList: {}
	},
	mutations: {
		changeFriendRequestState(state, data) {
			state.friendRequest = data
		},
		updateBlackList(state, blackList) {
			console.log("updateBlackList", blackList)
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
		//添加黑名单-单人
		onAddBlack: function (context, payload) {
			let addName = payload.userId.name
			console.log("onAddBlack", addName)
			WebIM.conn.addToBlackList({
				name: addName,
				success: function () {
					this.$message("已添加黑名单");
					Vue.$store.dispatch('onGetContactUserList')
					this.$forceUpdate();
				},
				error: function () {
					console.log('Add friend to black list error');
				}
			});
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
		},

		//删除好友
		onDelteFirend: function(context,payload){
			console.log("onDelteFirend",payload)
			let deleteName = payload.userId.name
			WebIM.conn.removeRoster({
				to: deleteName,
				success: function () {  // 删除成功
					conn.unsubscribed({
						to: deleteName
					});
					console.log("删除好友成功")
				},
				error: function () {    // 删除失败
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