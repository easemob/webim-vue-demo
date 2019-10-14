<template>
  <div>
    <el-popover placement="bottom" width="60" trigger="click" :visible.sync="showGroupSetting" @hide="changeSetModel">
      <div class="setting" v-show="setInfo">
        <li @click="openInvite">
          <i class="el-icon-user">邀请群成员</i>
        </li>
        <li  v-show="showAdminIcon">
          <i class="el-icon-edit-outline" @click="updatedGroupInfo">修改群信息</i>
          <i class="el-icon-warning" @click="changeBlackModel">群组黑名单</i>
          <i class="el-icon-switch-button" @click="dissolution">解散群组</i>
        </li>

        <li v-show="showCloseIcon" @click="quitGroup">
          <i class="el-icon-delete-solid">退出群组</i>
        </li>
      </div>
      <van-icon
        name="setting-o"
        size="16"
        slot="reference"
        @click="changeSetInfo"
        class="set-icon"
      />
    </el-popover>
    <GroupBlack ref="groupBlackModel" />
  </div>
</template>
<script>
import { mapActions } from "vuex";
import "./group.less";
import GroupBlack from "./groupBlack.vue";
export default{
	data(){
		return {
			showGroupSetting: false,
			setInfo: false,
			showAdminIcon: false,
			showCloseIcon: false,
		};
	},
	computed: {
		loginName(){
			return this.$store.state.login.username;
		},
		groupAdmin(){
			return this.$store.state.group.groupInfo.admin;
		}
	},
	methods: {
		...mapActions([
			"onInviteGroup",
			"onUpdataGroupInfo",
			"onGetGroupBlack",
			"onDissolveGroup",
			"onQuitGroup"
		]),
		changeSettingModel(){
			this.$data.showGroupSetting = !this.$data.showGroupSetting;
		},
		changeSetInfo(){
			this.$data.setInfo = !this.$data.setInfo;
			if(this.loginName == this.groupAdmin){
				this.$data.showAdminIcon = !this.$data.showAdminIcon;
				console.log("111", this.$data.showAdminIcon);
			}
			else{
				this.$data.showCloseIcon = !this.$data.showCloseIcon;
				console.log("2222", this.$data.showCloseIcon);
			}
		},
		changeBlackModel(){
			this.onGetGroupBlack({
				select_id: this.$store.state.group.groupInfo.gid
			});
			this.$refs.groupBlackModel.chengeBlackModel();
		},
		openInvite(){
			this.$prompt("邀请群成员", {
				confirmButtonText: "确定",
				cancelButtonText: "取消",
				inputPlaceholder: "用户名"
			})
			.then(({ value }) => {
				this.onInviteGroup({
					select_id: this.$store.state.group.groupInfo.gid,
					select_name: value
				}),
				this.$message({
					type: "success",
					message: "邀请成功，等待用户同意"
				});
			})
			["catch"](() => {});
		},
		updatedGroupInfo(){
			this.$prompt("群组名", "修改群信息", {
				confirmButtonText: "修改",
				cancelButtonText: "取消"
			})
			.then(({ value }) => {
				this.onUpdataGroupInfo({
					select_id: this.$store.state.group.groupInfo.gid,
					updateName: value,
					updateDesc: this.$store.state.group.groupInfo.desc
				}),
				this.$message({
					type: "success",
					message: "修改成功"
				});
			})
			["catch"](() => {});
		},
		quitGroup(){
			this.onQuitGroup({
				select_id: this.$store.state.group.groupInfo.gid
			});
		},
		dissolution(){
			this.onDissolveGroup({
				select_id: this.$store.state.group.groupInfo.gid
			});
		},
		changeSetModel(){
			this.$data.setInfo = false;
			if(this.loginName == this.groupAdmin){
				this.$data.showAdminIcon = false;
				console.log("111", this.$data.showAdminIcon);
			}
			else{
				this.$data.showCloseIcon = false;
				console.log("2222", this.$data.showCloseIcon);
			}
		}
	},
	components: {
		GroupBlack
	}
};
</script>
<style scoped>
.set .dialog {
  position: absolute;
  right: 40px;
  width: 300px;
}
.setting {
  list-style-type: none;
  cursor: pointer;
}
.set-icon {
  position: absolute;
  top: 100px;
  right: 20px;
  cursor: pointer;
}
</style>
