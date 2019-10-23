<template>
  <el-drawer
    title="群组信息"
    :modal="true"
    :append-to-body="true"
    :visible.sync="showGroupInfoModel"
    lable="rtl"
    size="350px"
    style="margin-top: 95px; list-style-type:none;"
    :wrapperClosable="true"
  >
    <div class="info-modal">
      <div>
        <!-- <span class="groInfoName">群组名称</span> -->
        <div>
          <i class="groInfoName">群组名称</i>
        </div>
        <span class="groupName">{{groupinfoList.name}}</span>
      </div>
      <div class="memberBox">
        <div>
          <span class="groInfoName">群组成员</span>
        </div>
        <div class="info-user">
          <div>
            <div
              class="listItem"
              v-for="(item,index) in groupinfoList.members.filter((i)=>{if(!i.owner){return i}})"
              id="index"
              :key="index"
              @click="select(item)"
            >
              <span v-if="!item.owner" class="info-name">{{item.member}}</span>

              <span v-if="!item.owner&&(adminList.includes(username) || groupinfoList.admin == username)&&username != item.member" class="info-icon">

                <!-- 设置管理员 -->
                <el-tooltip
                  class="item"
                  effect="dark"
                  :content="setAdminIcon"
                  placement="bottom-start"
                  v-show="!adminList.includes(item.member)&&groupinfoList.admin == username"
                >
                  <i class="el-icon-top" @click="openSetAdmin"></i>
                </el-tooltip>

                <!-- 移除管理员 -->
                <el-tooltip
                  class="item"
                  effect="dark"
                  :content="removeAdminIcon"
                  placement="bottom-start"
                  v-show="adminList.includes(item.member)&&groupinfoList.admin == username"
                >
                  <i class="el-icon-bottom" @click="openRemoveAdmin"></i>
                </el-tooltip>

                <!-- 设置禁言 -->
                <el-tooltip
                  class="item"
                  effect="dark"
                  :content="setMute"
                  placement="bottom-start"
                  v-show="muteList.filter((muteItem)=>{ return muteItem.user == item.member }).length == 0"
                >
                  <i class="el-icon-lock" @click="openSetMute"></i>
                </el-tooltip>

                <!-- 移除禁言 -->
                <el-tooltip
                  class="item"
                  effect="dark"
                  :content="removeMute"
                  placement="bottom-start"
                  v-show="muteList.filter((muteItem)=>{ return muteItem.user == item.member }).length != 0"
                >
                  <i class="el-icon-unlock" @click="openRemoveMute"></i>
                </el-tooltip>

                <!-- 加黑名单 -->
                <el-tooltip class="item" effect="dark" :content="setBlack" placement="bottom-start">
                  <i class="el-icon-warning-outline" @click="openGroupBlack"></i>
                </el-tooltip>

                <!-- 移出群 -->
                <el-tooltip
                  class="item"
                  effect="dark"
                  :content="setRemove"
                  placement="bottom-start"
                >
                  <i class="el-icon-circle-close" @click="openRemoveGroupUser"></i>
                </el-tooltip>

              </span>
            </div>

            <div class="listItem">{{groupinfoList.admin}}</div>
          </div>
        </div>
      </div>
    </div>
    <GetGroupSetting ref="groupSettingModel" @closeGroupSet="closeGroupSet"/>
  </el-drawer>
</template>

<script>
import { mapActions } from "vuex";
import GetGroupSetting from "./groupSetting.vue";
import "./group.less";
export default{
	data(){
		return {
			select_id: "",
			select_name: "",
			// 控制群组详情页
			showGroupInfoModel: false,
			// 控制详情页图标
			showInfoIcon: false,
			// 控制setAdmin图标
			// showAdminIcon: false,
			// 控制setMute 图标
			// showMuteIcon: false,

			setAdminIcon: "设为管理员",
			removeAdminIcon: "移除管理员",
			setMute: "禁言",
			removeMute: "移除禁言",
			setBlack: "加入群黑名单",
			setRemove: "从本群移除"
		};
	},
	computed: {
		groupinfoList(){
			return this.$store.state.group.groupInfo;
		},
		username(){
			const username = localStorage.getItem("userInfo") && JSON.parse(localStorage.getItem("userInfo")).userId;
			return username; // this.$store.state.login.username;
		},
		adminList(){
			return this.$store.state.group.adminList;
		},
		muteList(){
			return this.$store.state.group.muteList;
		}
	},
	methods: {
		...mapActions([
			"onGetGroupinfo",
			"onSetAdmin",
			"onRemoveAdmin",
			"getGroupAdmin",
			"getMuted",
			"onAddMute",
			"onRemoveMute",
			"onAddGroupBlack",
			"onRemoveGroupUser"
		]),
		closeGroupSet(){
			this.chengeInfoModel()
			this.$emit("closeGroupMessage");
		},

		chengeInfoModel(){
			this.$data.showGroupInfoModel = !this.$data.showGroupInfoModel;
			if(this.$data.showSettingModel){
				this.chengeSetModel();
			}

			const { name, params } = this.$route;

			setTimeout(()=>{
				this.getGroupAdmin({ select_id: params.id });
				if(this.adminList.includes(this.username) || this.groupinfoList.admin == this.username){
					this.getMuted({ select_id: params.id });
				}
			}, 100);
		},
		chengeSetModel(){
			this.$refs.groupSettingModel.changeSettingModel();
		},
		// chengeAdminIcon() {
		//   this.$data.showAdminIcon = !this.$data.showAdminIcon;
		// },
		// chengeMuteIcon() {
		//   this.$data.showMuteIcon = !this.$data.showMuteIcon;
		// },

		select(key){
			this.$data.select_name = key.member;
		},
		openSetAdmin(){
			const me = this;
			this.$confirm("确认操作: 设为管理员", {
				confirmButtonText: "确定",
				cancelButtonText: "取消",
				type: "warning"
			})
			.then(() => {
				this.onSetAdmin({
					select_id: this.$store.state.group.groupInfo.gid,
					select_name: this.$data.select_name,
					success: function(){
						me.getGroupAdmin({ select_id: me.$store.state.group.groupInfo.gid });
						me.$forceUpdate();
					}
				});
				this.chengeAdminIcon();
				this.$message({
					type: "success",
					message: "设置管理员成功"
				});
			})
			["catch"](() => {});
		},
		openRemoveAdmin(){
			const me = this;
			this.$confirm("确认操作: 移除管理员", {
				confirmButtonText: "确定",
				cancelButtonText: "取消",
				type: "warning"
			})
			.then(() => {
				this.onRemoveAdmin({
					select_id: this.$store.state.group.groupInfo.gid,
					select_name: this.$data.select_name,
					success: function(){
						me.getGroupAdmin({ select_id: me.$store.state.group.groupInfo.gid });
						me.$forceUpdate();
					}
				});
				this.chengeAdminIcon();
				this.$message({
					type: "success",
					message: "移除管理员成功"
				});
			})
			["catch"](() => {});
		},
		openSetMute(){
			const me = this;
			this.$confirm("确认操作: 禁言", {
				confirmButtonText: "确定",
				cancelButtonText: "取消",
				type: "warning"
			})
			.then(() => {
				this.onAddMute({
					select_id: this.$store.state.group.groupInfo.gid,
					select_name: this.$data.select_name,
					success: function(){
						me.getMuted({ select_id: me.$store.state.group.groupInfo.gid });
						me.$forceUpdate();
					}
				});
				// this.chengeMuteIcon();
				this.$message({
					type: "success",
					message: "禁言成功"
				});
			})
			["catch"](() => {});
		},
		openRemoveMute(){
			const me = this;
			this.$confirm("确认操作: 移除禁言", {
				confirmButtonText: "确定",
				cancelButtonText: "取消",
				type: "warning"
			})
			.then(() => {
				this.onRemoveMute({
					select_id: this.$store.state.group.groupInfo.gid,
					select_name: this.$data.select_name,
					success: function(){
						me.getMuted({ select_id: me.$store.state.group.groupInfo.gid });
						me.$forceUpdate();
					}
				});
				// this.chengeMuteIcon();
				this.$message({
					type: "success",
					message: "移除禁言列表成功"
				});
			})
			["catch"](() => {});
		},
		openGroupBlack(){
			this.$confirm("确认操作: 加入群黑名单", {
				confirmButtonText: "确定",
				cancelButtonText: "取消",
				type: "warning"
			})
			.then(() => {
				this.onAddGroupBlack({
					select_id: this.$store.state.group.groupInfo.gid,
					select_name: this.$data.select_name
				});
				this.$message({
					type: "success",
					message: "加入群黑名单成功"
				});
			})
			["catch"](() => {});
		},
		openRemoveGroupUser(){
			this.$confirm("确认操作: 从本群移除", {
				confirmButtonText: "确定",
				cancelButtonText: "取消",
				type: "warning"
			})
			.then(() => {
				this.onRemoveGroupUser({
					select_id: this.$store.state.group.groupInfo.gid,
					select_name: this.$data.select_name
				});
				this.$message({
					type: "success",
					message: "移除成员成功"
				});
			})
			["catch"](() => {});
		}
	},
	components: {
		GetGroupSetting
	}
};
</script>
<style scoped>
.info-modal {
  padding: 0 10px;
  height: 100%;
  /* width: 350px !important; */
  /* cursor: pointer; */
}
.setting-icon {
  position: absolute;
  right: 30px;
}
.info-icon {
  position: absolute;
  right: 30px;
  cursor: pointer;
  overflow: hidden;
}
.info-name ::selection {
  width: 40px;
  background: #00ba6e;
}
.info-setting {
  list-style-type: none;
  text-align: left;
  padding-left: 0;
  /* position: absolute;
  right: 30px; */
}
.info-user {
  overflow-y: auto;
}
.listItem{
  height: 50px;
  border-bottom: 1px solid #ccc;
  line-height: 50px;
  color: #666;
  font-size: 14px;
}
.groupName{
  color: #666;
  font-size: 14px;
  height: 40px;
  line-height: 40px;
}
.memberBox{
  margin-top: 20px;
  height: calc(100% - 100px);
  overflow-y: scroll;
  position: relative;
}
</style>
