<template>
	<a-modal
		title="选择成员"
		:visible="addAVMemberModalVisible"
		@ok="startConference"
		@cancel="onClosed">
		<div>
			<a-checkbox-group v-model="checkList" class="checkboxGroup" :max="6">
				<div style="border-bottom: 1px solid #f2f2f2;padding: 8px 0;"
					v-for="item in groupMembers"
					:key="item.member">
					<a-checkbox
						:value="item.member || item.owner"
						:disabled="(item.member || item.owner) == username"
						class="checkbox">
						{{item.member || item.owner}}
					</a-checkbox>
				</div>
			</a-checkbox-group>
		</div>
		<span slot="footer" class="dialog-footer">
			<a-button type="primary" @click="startConference">开始</a-button>
		</span>
	</a-modal>
</template>

<style>
    .checkboxGroup{
				width: 100%;
        overflow: scroll;
        height: 150px;
    }
    .checkbox{
        display: block;
    }
</style>

<script>
import { mapActions, mapGetters } from 'vuex';
const username = localStorage.getItem('userInfo') && JSON.parse(localStorage.getItem('userInfo')).userId;
export default{
	data(){
		return {
			dialogVisible: false,
			checkList: [username],
			username,
		};
	},
	props: [
		'to',
		'type'
	],
	computed: {
		groupMembers(){
			return this.$store.state.emedia.groupMembers;
		},
		multiAVModalVisible(){
			return this.$store.state.emedia.multiAVModalVisible;
		},
		confr(){
			return this.$store.state.emedia.confr;
		},
		addAVMemberModalVisible(){
			return this.$store.state.emedia.addAVMemberModalVisible;
		}
	},
        
	methods: {
		...mapActions([
			'showMultiAVModal',
			'hideMultiAVModal',
			'setConfr',
			'setAVMemeberModalVisible',
			'setInvitedMembers',
			'updateConfr'
		]),
		show(){
			this.$data.checkList = [username];
			// this.$data.dialogVisible = true
			this.setAVMemeberModalVisible({ addAVMemberModalVisible: true });
		},
		hide(){
			// this.$data.dialogVisible = false
			this.setAVMemeberModalVisible({ addAVMemberModalVisible: false });
		},
		onClosed(){
			this.$data.checkList = [username];
			this.hide();
		},
		startConference(){
			let invitees = this.$data.checkList.filter(item => item != this.$data.username)
			this.handleSubmit(invitees)
			this.hide();
		},

		handleSubmit(selected){
			const { confr, joinedMembers } = this.$store.state.agora;
			const gid = this.$route.params.id
			if(selected.length + joinedMembers.length < 1){
				this.$message.error('没邀请任何人员');
				return;
			}

			const callId = confr.callId || WebIM.conn.getUniqueId().toString();
			const channelName = confr.channel || Math.uuid(8);
			const confrObj = {
				channelName: channelName,
				type: 2,
				callerDevId: WebIM.conn.context.jid.clientResource,
				callId: callId,
			};
			this.updateConfr({
				ext: confrObj,
				to: gid,
			});

			selected.forEach((item) => {
				this.sendInviteMsg(item, confrObj, gid);
			});

			this.setInvitedMembers(selected);

			setTimeout(() => {
				this.setInvitedMembers([]);
			}, 60000);
		},

		sendInviteMsg(to, confr, gid){
			let id = WebIM.conn.getUniqueId();
			let msg = new WebIM.message('txt', id);
			const { channel } = this.$store.state.agora.confr;
			let set_options = {
				msg: this.type === 'singleChat' ? '邀请您进行视频通话' : '邀请您进行多人视频通话',
				to: to,
				chatType: this.type,
				ext: {
					action: 'invite',
					channelName: channel,
					type: 2, // 0为1v1音频，1为1v1视频，2为多人通话
					callerDevId: confr.callerDevId, // 主叫方设备Id
					callId: confr.callId, // 随机uuid，每次呼叫都不同，代表一次呼叫
					ts: Date.now(),
					msgType: 'rtcCallWithAgora',
					ext: { groupId: gid },
				},
			};
			msg.set(set_options);
			WebIM.conn.send(msg.body);
		},
	},
};
</script>
