
const FriendModule = {
	state: {
		friendRequest: [],
		blackList: {}
	},
	mutations: {
		changeFriendRequestState(state, data){
			state.friendRequest = data;
		},
		updateBlackList(state, blackList){
			state.blackList = blackList;
		}
	},
	actions: {
		addfirend: function(context, payload){
			const username = localStorage.getItem("userInfo") && JSON.parse(localStorage.getItem("userInfo")).userId;
			const { id } = payload;
			WebIM.conn.subscribe({
				to: id,
				message: username + "请求添加你为好友"
			});
		},

		// 接受好友请求
		acceptSubscribe: function(context, payload){
			WebIM.conn.subscribed({
				to: payload,
				message: "[resp:true]"
			});
		},

		// 拒绝好友请求
		declineSubscribe: function(context, payload){
			const username = localStorage.getItem("userInfo") && JSON.parse(localStorage.getItem("userInfo")).userId;
			const { id } = payload;
			WebIM.conn.unsubscribed({
				to: id,
				message: username + "拒绝您的好友请求"
			});
		},
		// 添加黑名单-单人
		onAddBlack: function(context, payload){
			let addName = payload.userId.name;
			WebIM.conn.addToBlackList({
				name: addName,
			});
			Vue.$store.dispatch("onGetContactUserList", { type: "addBlack", addName });
		},
		// 获取黑名单
		onGetFirendBlack: function(context, payload){
			WebIM.conn.getBlacklist();
		},

		// 移除黑名单
		onRemoveBlack: function(context, payload){
			let blackName = payload.removeName;
			WebIM.conn.removeFromBlackList({
				name: blackName,
				success: function(){
					console.log("Remove from black list success.");
				},
				error: function(){
					console.log("Remove from black list error.");
				}
			});
		},

		// 删除好友
		onDelteFirend: function(context, payload){
			let deleteName = payload.userId.name;
			let option = {
				to: deleteName,
				success: function(){  // 删除成功
					conn.unsubscribed({
						to: deleteName
					});
					console.log("删除好友成功");
				},
				error: function(){    // 删除失败
				}
			}
			payload.callback();
			Vue.$router.push("/contact");
			WebIM.conn.removeRoster(option);
		}
	},
	getters: {
		addfirend(state){
			return state.firendList.myFirendList;
		}
	}

};
export default FriendModule;
