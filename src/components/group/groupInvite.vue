<template>
  <!-- <el-dialog title="申请入群" :visible="this.isShowGroupInvite.isShow">
    <p>{{this.$store.state.group.updateGroupInviteNotifications.from}}申请入群</p>
    <div slot="footer" class="dialog-footer">
      <el-button @click="RejectJoinGroup">拒绝</el-button>
      <el-button type="primary" @click="AgreeJoinGroup">同意</el-button>
    </div>
  </el-dialog> -->
  <a-modal
    title="加群邀请"
      :visible="this.isShowGroupInvite.isShow"
      :footer="null"
      style="text-align:center"
    >
    <p>{{this.$store.state.group.groupInviteNotifications.from}}邀请您加入群组:{{this.$store.state.group.groupInviteNotifications.gid}}</p>
    <div class="btn">
      <el-button @click="RejectJoinGroup">拒绝</el-button>
      <el-button type="primary" @click="AgreeJoinGroup">同意</el-button>
    </div>
  </a-modal>
</template>
<script>
import { mapActions } from "vuex";
export default{
	data(){
		return {
			showInviteModel: this.$store.state.group.groupInviteNotifications.isShow
		};
	},
	computed: {
		isShowGroupInvite(){
			return this.$store.state.group.groupInviteNotifications;
		}
   
	},
	methods: {
		...mapActions(["onAgreeInviteGroup", "onRejectInviteGroup"]),
		changeGroupInviteModal(){
			this.$store.state.group.groupInviteNotifications.isShow = !this.$store.state
			.group.groupInviteNotifications.isShow;
		},
		AgreeJoinGroup(){
            
			this.onAgreeInviteGroup({
				username: localStorage.getItem("userInfo") &&
        JSON.parse(localStorage.getItem("userInfo")).userId,
				inviteGroupId: this.$store.state.group.groupInviteNotifications.gid
			});
			this.changeGroupInviteModal();
		},
		RejectJoinGroup(){
			this.onRejectInviteGroup({
                username: localStorage.getItem("userInfo") &&
        JSON.parse(localStorage.getItem("userInfo")).userId,
				inviteGroupId: this.$store.state.group.groupInviteNotifications.gid
			});
			this.changeGroupInviteModal();
		}
	}
};
</script>
<style scoped>
p {
  font-size: 18px;
}
.btn{
	margin-top: 20px;
}
</style>>
    
