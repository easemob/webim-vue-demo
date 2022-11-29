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
			const username =
        localStorage.getItem('userInfo') &&
        JSON.parse(localStorage.getItem('userInfo')).userId;
			const { id } = payload;
			WebIM.conn.addContact(id, username + '请求添加你为好友');
		},

		// 接受好友请求
		acceptSubscribe: function(context, payload){
			WebIM.conn.acceptContactInvite(payload);
		},

		// 拒绝好友请求
		declineSubscribe: function(context, payload){
			const username =
        localStorage.getItem('userInfo') &&
        JSON.parse(localStorage.getItem('userInfo')).userId;
			const { id } = payload;
			WebIM.conn.declineContactInvite(id);
		},
		// 添加黑名单-单人
		onAddBlack: function(context, payload){
			let addName = payload.userId.name;
			WebIM.conn.addUsersToBlocklist({
				name: addName
			});
			Vue.$store.dispatch('onGetContactUserList', {
				type: 'addBlack',
				addName
			});
		},
		// 获取黑名单
		onGetFirendBlack: function(context, payload){
			WebIM.conn.getBlacklist().then(res => {
				let dt = res.data.map(item => {
					return {
						name: item
					};
				});
				Vue.$store.commit('updateBlackList', dt);
			});
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
			payload.callback();
			WebIM.conn.deleteContact(deleteName);
			Vue.$router.push('/contact');
		}
	},
	getters: {
		addfirend(state){
			return state.firendList.myFirendList;
		}
	}
};
export default FriendModule;
