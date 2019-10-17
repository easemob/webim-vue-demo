<template>
	<a-modal
      title="选择成员"
      :visible="addAVMemberModalVisible"
      @ok="startConference"
      @cancel="onClosed"
    >
        <div>
            <el-checkbox-group v-model="checkList" class="checkboxGroup" :max="6">
				<div style="border-bottom: 1px solid #f2f2f2; height: 30px" v-for="item in groupMembers"
						:key="item.member">
					<el-checkbox
						:label="item.member||item.owner"
						:disabled="item.member == username || item.owner == username?true:false"
						class="checkbox"
					/>
				</div>
            </el-checkbox-group>
        </div>
        <span slot="footer" class="dialog-footer">
            <el-button type="primary" @click="startConference">开始</el-button>
        </span>
    </a-modal>
</template>

<style>
    .checkboxGroup{
        overflow: scroll;
        height: 150px;
    }
    .checkbox{
        display: block;
    }
</style>

<script>
import { mapActions, mapGetters } from "vuex";
const username = localStorage.getItem("userInfo") && JSON.parse(localStorage.getItem("userInfo")).userId;
export default{
	data(){
		return {
			dialogVisible: false,
			checkList: [username],
			username,
		};
	},
	props: [
		"to"
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
			"showMultiAVModal",
			"hideMultiAVModal",
			"setConfr",
			"setAVMemeberModalVisible"
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
			const me = this;
			let pwd = Math.random().toString(36).substr(2);
			if(me.multiAVModalVisible){
				// 发送邀请
				const appkey = WebIM.config.appkey;
				const spHost = WebIM.config.Host;
				const { confrId, password } = me.confr;
				const gid = me.to.groupid;
				let jids = [];

				for(let elem of me.$data.checkList){
					if(elem != me.$data.username){
						jids.push(appkey + "_" + elem + "@" + spHost);
					}
				}
				for(let jid of jids){
					WebIM.call.inviteConference(confrId, password, jid, gid);
				}

				return this.hide();
			}
			this.showMultiAVModal();
			
			pwd = "";
			const videoSetting = JSON.parse(localStorage.getItem("videoSetting"));
			const recMerge = videoSetting && videoSetting.recMerge || false;
			const rec = (videoSetting && videoSetting.rec) || false;
			emedia.mgr.createConference(emedia.mgr.ConfrType.COMMUNICATION_MIX, pwd, rec, recMerge).then(function(confr){
				console.log("%c会议的信息", "color: red", confr); // 可以在这里拿到会议id confrId 来查服务端录制
				me.setConfr({ confr });
				const tkt = confr.ticket;
				WebIM.EMService.joined(confr.confrId) || WebIM.EMService.joinConferenceWithTicket(confr.confrId, tkt, "user ext field").then(function(){
					WebIM.EMService.publish({ audio: true, video: true }, "user ext field")["catch"](function(e){
						console.error(e);
					});
				})["catch"](function(e){
					console.error(e);
				});

				// 发送邀请
				const appkey = WebIM.config.appkey;
				const spHost = WebIM.config.Host;
				const { confrId, password } = confr;
				const gid = me.to.groupid;
				let jids = [];

				for(let elem of me.$data.checkList){
					if(elem != me.$data.username){
						jids.push(appkey + "_" + elem + "@" + spHost);
					}
				}
				for(let jid of jids){
					WebIM.call.inviteConference(confrId, password, jid, gid);
				}
			});
			return this.hide();
		}
	},
};
</script>
