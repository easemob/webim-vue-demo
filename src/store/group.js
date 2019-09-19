
const Group = {
	state: {
		publicGroupList: [],
		groupInfo: {
			gid: "",
			name: "",
			admin: "",
			desc: "",
			membersonly: ""
		}
	},
	mutations: {
		updatePublicGroup(state, publicGroup) {
			state.publicGroupList = publicGroup;
		},
		getInfo(state, payload) {
			const { gid, name, admin, desc, membersonly } = payload;
			state.groupInfo.gid = gid;
			state.groupInfo.name = name;
			state.groupInfo.admin = admin;
			state.groupInfo.desc = desc;
			state.groupInfo.membersonly = membersonly
		}
	},
	actions: {
		//获取公开群组
		onGetPublicGroup: function (context, payload) {
			let limit = 50;
			let options = {
				limit: limit,// 预期每页获取的记录数
				success: function (resp) {
					let publicGroup = resp.data
					// console.log("Response: ", publicGroup);
					// let globalCursor = resp.cursor;
					context.commit("updatePublicGroup", publicGroup)
				},
				error: function (e) {
					console.log("获取群组失败", e)
				}
			};
			WebIM.conn.listGroups(options);
		},
		//获取选中的群组详情
		onGetGroupinfo: function (context, payload) {
			let gid = payload.select_groupid;
			let options = {
				groupId: gid,                                //群组id
				success: function (resp) {
					// console.log("Response: ", resp);
					let name = resp.data[0].name;
					let admin = resp.data[0].owner;
					let desc = resp.data[0].description;
					let membersonly = resp.data[0].membersonly;
					context.commit("getInfo", {
						gid,
						name,
						admin,
						desc,
						membersonly
					})
				},
				error: function () { }
			};
			WebIM.conn.getGroupInfo(options)
		},
		//申请加入群组
		onJoinGroup: function (context, payload) {
			let options = {
				groupId: payload.select_groupid,                              // 群组ID
				success: function (resp) {
					console.log("Response: ", resp);
				},
				error: function (e) {
					if (e.type == 17) {
						console.log("您已经在这个群组里了");
					}
				}
			};
			WebIM.conn.joinGroup(options);
		},
		//创建群组
		onCreateGroup: function (context, payload) {
			console.log("onCreateGroup", payload)
			const {groupname,desc,members,pub,approval} = payload
			let options = {
				data: {
					groupname: groupname,                    // 群组名
					desc: desc,                          // 群组描述
					members: members,            // 用户名组成的数组
					public: pub,                         // pub等于true时，创建为公开群
					approval: approval,                  // approval为true，加群需审批，为false时加群无需审批
				},
				success: function (resp) { 
					console.log("success",resp)
				 },
				error: function () { }
			};
			WebIM.conn.createGroupNew(options);
		}
	},
	getters: {
		onGetPublicGroup(state) {
			return state.publicGroupList;
		},
		onGetGroupinfo(state) {
			return state.groupInfo[item];
		}
	}

}
export default Group;