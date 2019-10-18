import { ftruncate } from "fs";

const Group = {
	state: {
		publicGroupList: [],
		groupInviteNotifications: [],
		groupNotifications: [],
		groupInfo: {
			gid: "",
			name: "",
			admin: "",
			desc: "",
			membersonly: "",
			members: []
		},
		groupBlack: [],
		adminList: [],
		muteList: [],
	},
	mutations: {
		updatePublicGroup(state, publicGroup) {
			state.publicGroupList = publicGroup;
		},
		updateGroupInviteNotifications(state, data) {
			console.log("updateGroupInviteNotifications", data)
			state.groupInviteNotifications = data
		},
		updateGroupNotifications(state, data) {
			state.groupNotifications = data;
		},
		getInfo(state, payload) {
			const { gid, name, admin, desc, membersonly, members } = payload;
			state.groupInfo.gid = gid;
			state.groupInfo.name = name;
			state.groupInfo.admin = admin;
			state.groupInfo.desc = desc;
			state.groupInfo.membersonly = membersonly;
			state.groupInfo.members = members
		},
		updateGroupBlack(state, payload) {
			state.groupBlack = payload
		},
		updateAdminList(state, payload) {
			state.adminList = payload
		},
		updateMuteList(state, payload) {
			state.muteList = payload
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
		//获取群组详情
		onGetGroupinfo: function (context, payload) {
			// console.log("onGetGroupinfo", payload)
			// TODO
			let gid = payload.select_id || payload.select_groupid;
			let options = {
				groupId: gid,  //群组id
				success: function (resp) {
					let name = resp.data[0].name;
					let admin = resp.data[0].owner;
					let desc = resp.data[0].description;
					let membersonly = resp.data[0].membersonly;
					let members = resp.data[0].affiliations;
					context.commit("getInfo", {
						gid,
						name,
						admin,
						desc,
						membersonly,
						members
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
					Message({
						type: "success",
						message: "申请加入群组成功，等待群管理员审批"
					});
				},
				error: function (e) {
					if (e.type == 17) {
						Message.error("您已经在这个群组里了");
					}
				}
			};
			WebIM.conn.joinGroup(options);
		},
		//创建群组
		onCreateGroup: function (context, payload) {
			const { groupname, desc, members, pub, approval } = payload
			let options = {
				data: {
					groupname: groupname,                    // 群组名
					desc: desc,                          // 群组描述
					members: members,            // 用户名组成的数组
					public: pub,                         // pub等于true时，创建为公开群
					approval: approval,                  // approval为true，加群需审批，为false时加群无需审批
				},
				success: function (resp) {
					Vue.$store.dispatch('onGetGroupUserList')
					console.log("success", resp)
				},
				error: function () { }
			};
			WebIM.conn.createGroupNew(options);
		},
		//将好友加入群组
		onInviteGroup: function (context, payload) {
			const { select_id, select_name } = payload
			let option = {
				users: [select_name],
				groupId: select_id
			};
			WebIM.conn.inviteToGroup(option);
		},
		//收到群组申请,同意进群
		onAgreeJoinGroup: function (context, payload) {
			const { joinName, joinGroupId } = payload
			let options = {
				applicant: joinName,                          // 申请加群的用户名
				groupId: joinGroupId,                              // 群组ID
				success: function (resp) {
					Vue.$store.dispatch('onGetGroupUserList')
					Message({
						type: "success",
						message: "已同意！"
					});
				},
				error: function (e) { }
			};
			WebIM.conn.agreeJoinGroup(options);
		},
		//收到群组申请，拒绝进群
		onRejectJoinGroup: function (context, payload) {
			const { joinName, joinGroupId } = payload
			let options = {
				applicant: joinName,                // 申请加群的用户名
				groupId: joinGroupId,                    // 群组ID
				success: function (resp) {
					Message({
						type: "success",
						message: "已拒绝！"
					});
				},
				error: function (e) { }
			};
			WebIM.conn.rejectJoinGroup(options);
		},
		//收到邀请进群通知，同意
		onAgreeInviteGroup: function (context, payload) {
			const { inviteGroupId, username } = payload
			let options = {
				groupId: inviteGroupId,
				invitee: username,
				success: function (resp) {
					Message({
						type: "success",
						message: "已同意加入群组！"
					})
					Vue.$store.dispatch('onGetGroupUserList')
					this.$forceUpdate();
				},
				error: function (e) { }
			}
			WebIM.conn.agreeInviteIntoGroup(options)
		},
		//收到邀请进群通知，拒绝
		onRejectInviteGroup: function(context,payload) {
			const { inviteGroupId, username } = payload
			var options = {
				invitee: username,
				groupId: inviteGroupId,
				success: function(resp) {
					Message({
						type: "success",
						message: "已拒绝加入群组！"
					})
				},
				error: function(e) {}
		}
		WebIM.conn.rejectInviteIntoGroup(options)
		},
		//修改群组详情
		onUpdataGroupInfo: function (context, payload) {
			const { select_id, updateName, updateDesc } = payload
			let option = {
				groupId: select_id,
				groupName: updateName,                         // 群组名称
				description: updateDesc,  // 群组简介
				success: function (resp) {
					Vue.$store.dispatch('onGetGroupUserList')
					Vue.$store.dispatch('onGetGroupinfo', { select_id })
					this.$forceUpdate();
				}
			};
			WebIM.conn.modifyGroup(option);
		},
		//设置管理员
		onSetAdmin: function (context, payload) {
			const { select_id, select_name } = payload
			let options = {
				groupId: select_id,            // 群组id
				username: select_name,              // 用户名
				success: function (resp) {
					payload.success && payload.success()
				},
				error: function (e) { }
			};
			WebIM.conn.setAdmin(options);
		},
		//取消管理员
		onRemoveAdmin: function (context, payload) {
			const { select_id, select_name } = payload
			let options = {
				groupId: select_id,             // 群组id
				username: select_name,               // 用户名
				success: function (resp) {
					payload.success && payload.success()
				},
				error: function (e) { }
			};
			WebIM.conn.removeAdmin(options);
		},
		//获取管理员列表
		getGroupAdmin: function (context, payload) {
			const { select_id, select_name } = payload
			var options = {
				groupId: select_id,                 // 群组id
				success: function (resp) {
					context.commit('updateAdminList', resp.data)
				},
				error: function (e) { }
			};
			WebIM.conn.getGroupAdmin(options);
		},
		//添加群组禁言
		onAddMute: function (context, payload) {
			const { select_id, select_name } = payload
			let options = {
				username: select_name,                      // 成员用户名
				muteDuration: 886400000,               // 禁言的时长，单位是毫秒
				groupId: select_id,
				success: function (resp) {
					context.commit('updateMuteList', resp.data)
					payload.success && payload.success()
				},
				error: function (e) { }
			};
			WebIM.conn.mute(options);
		},
		//移除禁言
		onRemoveMute: function (context, payload) {
			const { select_id, select_name } = payload
			let options = {
				groupId: select_id,                  // 群组ID
				username: select_name,                    // 成员用户名
				success: function (resp) {
					context.commit('updateMuteList', resp.data)
					payload.success && payload.success()
				},
				error: function (e) { }
			};
			WebIM.conn.removeMute(options);
		},
		//获取禁言列表
		getMuted: function (context, payload) {
			const { select_id, select_name } = payload
			var options = {
				groupId: select_id,                // 群组ID
				success: function (resp) {
					console.log('禁言列表', resp)
					context.commit('updateMuteList', resp.data)
				},
				error: function (e) { }
			};
			WebIM.conn.getMuted(options);
		},
		//添加群组黑名单
		onAddGroupBlack: function (context, payload) {
			const { select_id, select_name } = payload
			let options = {
				groupId: select_id,                     // 群组ID
				username: select_name,                         // 将要被加入黑名单的用户名
				success: function (resp) {
					Vue.$store.dispatch('onGetGroupinfo', { select_id })
					this.$forceUpdate();
					console.log("添加群组黑名单成功")
				},
				error: function (e) { }
			};
			WebIM.conn.groupBlockSingle(options);
		},
		//移除群组黑名单
		onRemoveGroupBlack: function (context, payload) {
			const { select_id, removeGroupName } = payload
			var options = {
				groupId: select_id,                     // 群组ID              
				username: removeGroupName,                             // 需要移除的用户名
				success: function (resp) {
					console.log("移除成功Response: ", resp)
					Vue.$store.dispatch('onGetGroupBlack', { groupid })
					this.$forceUpdate();
				},
				error: function (e) { }
			}
			WebIM.conn.removeGroupBlockSingle(options);
		},
		//获取群组黑名单
		onGetGroupBlack: function (context, payload) {
			let select_id = payload.groupid
			let option = {
				groupId: select_id,
				success: function (list) {
					let blackName = list.data
					context.commit("updateGroupBlack", blackName)
				},
				error: function () {
					console.log('Get group black list error.');
				}
			};
			WebIM.conn.getGroupBlacklistNew(option);
		},
		//移除群组成员
		onRemoveGroupUser: function (context, payload) {
			const { select_id, select_name } = payload
			let options = {
				groupId: select_id,
				username: select_name,
				success: function (resp) {
				},
				error: {}
			}
			WebIM.conn.removeSingleGroupMember(options);
		},
		//退出群组
		onQuitGroup: function (context, payload) {
			let option = {
				groupId: payload.select_id,
				success: function () {
					Vue.$store.dispatch('onGetGroupUserList')
					this.$forceUpdate();
				},
				error: function () {
					console.log('Leave room faild');
				}
			};
			WebIM.conn.quitGroup(option);
		},
		//解散群组
		onDissolveGroup: function (context, payload) {
			let option = {
				groupId: payload.select_id,
				success: function () {
					Vue.$store.dispatch('onGetGroupUserList')
					this.$forceUpdate();
				}
			};
			WebIM.conn.dissolveGroup(option);
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