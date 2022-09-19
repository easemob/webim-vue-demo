
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
			const username = localStorage.getItem('userInfo') && JSON.parse(localStorage.getItem('userInfo')).userId;
			const { id } = payload;
			WebIM.conn.addContact({
				to: id,
				message: username + '请求添加你为好友'
			});
		},

		// 接受好友请求
		acceptSubscribe: function(context, payload){
			WebIM.conn.acceptContactInvite({
				to: payload
			});
		},

		// 拒绝好友请求
		declineSubscribe: function(context, payload){
			const username = localStorage.getItem('userInfo') && JSON.parse(localStorage.getItem('userInfo')).userId;
			const { id } = payload;
			WebIM.conn.declineContactInvite({
				to: id
			});
		},
		// 添加黑名单-单人
		onAddBlack: function(context, payload){
			let addName = payload.userId.name;
			WebIM.conn.addUsersToBlocklist({
				name: addName,
			});
			Vue.$store.dispatch('onGetContactUserList', { type: 'addBlack', addName });
		},
		// 获取黑名单
		onGetFirendBlack: function(context, payload){
			WebIM.conn.getBlocklist();
		},

		// 移除黑名单
		onRemoveBlack: function(context, payload){
			let blackName = payload.removeName;
			WebIM.conn.removeUserFromBlocklist({
				name: blackName,
				success: function(){
					console.log('Remove from black list success.');
				},
				error: function(){
					console.log('Remove from black list error.');
				}
			});
		},

		// 删除好友
		onDelteFirend: function(context, payload){
			let deleteName = payload.userId.name;
			let option = {
				to: deleteName,
			};
			payload.callback();
			Vue.$router.push('/contact');
			WebIM.conn.deleteContact(option);
		}
	},
	getters: {
		addfirend(state){
			return state.firendList.myFirendList;
		}
	}

};
export default FriendModule;
