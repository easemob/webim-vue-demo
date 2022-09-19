const mutationsTypes = {
	GET_GROUPMEMBERS: 'GET_GROUPMEMBERS',
	SHOW_MULTIANMODAL: 'SHOW_MULTIANMODAL',
	HIDE_MULTIANMODAL: 'HIDE_MULTIANMODAL',
	SET_CONFR: 'SET_CONFR',
	SET_AVMEMBERMODAL_VISIBLE: 'SET_AVMEMBERMODAL_VISIBLE'
};
const Emedia = {
	state: {
		groupMembers: [],
		multiAVModalVisible: false,
		confr: {},
		addAVMemberModalVisible: false,
	},
	mutations: {
		[mutationsTypes.GET_GROUPMEMBERS](state, payload){
			state.groupMembers = payload.groupMembers;
		},
		[mutationsTypes.SHOW_MULTIANMODAL](state, payload){
			state.multiAVModalVisible = true;
			state.confr = payload.confr;
		},
		[mutationsTypes.HIDE_MULTIANMODAL](state){
			state.multiAVModalVisible = false;
		},
		[mutationsTypes.SET_CONFR](state, payload){
			state.confr = payload.confr;
		},
		[mutationsTypes.SET_AVMEMBERMODAL_VISIBLE](state, payload){
			state.addAVMemberModalVisible = payload.addAVMemberModalVisible;
		},
	},
	actions: {
		getGroupMembers(context, payload){
			var pageNum = 1,
				pageSize = 1000;
			var options = {
				pageNum: pageNum,
				pageSize: pageSize,
				groupId: payload,
				success: function(resp){
					console.log('Response: ', resp);
					context.commit({
						type: mutationsTypes.GET_GROUPMEMBERS,
						groupMembers: resp.data
					});
				},
				error: function(e){
					console.log('error', e);
				}
			};
			WebIM.conn.listGroupMembers(options);
		},
		showMultiAVModal(context, payload){
			console.log('payload>>', payload);
			context.commit({
				type: mutationsTypes.SHOW_MULTIANMODAL,
				confr: payload ? payload : {}
			});
		},
		hideMultiAVModal(context){
			context.commit(mutationsTypes.HIDE_MULTIANMODAL);
		},
		setConfr(context, payload){
			context.commit({
				type: mutationsTypes.SET_CONFR,
				confr: payload.confr
			});
		},
		setAVMemeberModalVisible(context, payload){
			context.commit({
				type: mutationsTypes.SET_AVMEMBERMODAL_VISIBLE,
				addAVMemberModalVisible: payload.addAVMemberModalVisible
			});
		},
	},
	// getters: {

	// }
};

export default Emedia;
