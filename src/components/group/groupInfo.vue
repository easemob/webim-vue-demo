<template>
  <a-drawer
    title="群组信息"
    :modal="true"
    :append-to-body="true"
    :visible.sync="showGroupInfoModel"
    lable="rtl"
    size="350px"
    style="margin-top: 95px; list-style-type:none;"
    :wrapperClosable="true"
		@close="chengeInfoModel"
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
              <span v-if="!item.owner" class="info-name" :class="(!item.owner&&(adminList.includes(username) || groupinfoList.admin == username)&&username != item.member) ? 'info-name-width' : ''">{{item.member}}</span>

              <span v-if="!item.owner&&(adminList.includes(username) || groupinfoList.admin == username)&&username != item.member" class="info-icon">

                <!-- 设置管理员 -->
                <a-tooltip
                  class="item"
                  effect="dark"
                  :title="setAdminIcon"
                  placement="bottom"
                  v-show="!adminList.includes(item.member)&&groupinfoList.admin == username"
                >
									<a-icon type="arrow-up" @click="openSetAdmin" />
                </a-tooltip>

                <!-- 移除管理员 -->
                <a-tooltip
                  class="item"
                  effect="dark"
                  :title="removeAdminIcon"
                  placement="bottom"
                  v-show="adminList.includes(item.member)&&groupinfoList.admin == username"
                >
									<a-icon type="arrow-down" @click="openRemoveAdmin" />
                </a-tooltip>

                <!-- 设置禁言 -->
                <a-tooltip
                  class="item"
                  effect="dark"
                  :title="setMute"
                  placement="bottom"
                  v-show="muteList.filter((muteItem)=>{ return muteItem.user == item.member }).length == 0"
                >
									<a-icon type="lock" @click="openSetMute" />
                </a-tooltip>

                <!-- 移除禁言 -->
                <a-tooltip
                  class="item"
                  effect="dark"
                  :title="removeMute"
                  placement="bottom"
                  v-show="muteList.filter((muteItem)=>{ return muteItem.user == item.member }).length != 0"
                >
									<a-icon type="unlock" @click="openRemoveMute" />
                </a-tooltip>

                <!-- 加黑名单 -->
                <a-tooltip class="item" effect="dark" :title="setBlack" placement="bottom">
									<a-icon type="exclamation-circle" @click="openGroupBlack" />
                </a-tooltip>

                <!-- 移出群 -->
                <a-tooltip
                  class="item"
                  effect="dark"
                  :title="setRemove"
                  placement="bottom"
                >
									<a-icon type="close-circle" @click="openRemoveGroupUser" />
                </a-tooltip>

              </span>
            </div>

            <div class="listItem">{{groupinfoList.admin}}</div>
          </div>
        </div>
      </div>
    </div>
    <GetGroupSetting ref="groupSettingModel" @closeGroupSet="closeGroupSet"/>
  </a-drawer>
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
			this.$confirm({
				title: '确认操作: 设为管理员',
				okText: "确定",
				cancelText: "取消",
				icon: 'exclamation-circle',
				centered: true,
				onOk: () => {
					this.onSetAdmin({
					select_id: this.$store.state.group.groupInfo.gid,
					select_name: this.$data.select_name,
						success: function(){
							me.getGroupAdmin({ select_id: me.$store.state.group.groupInfo.gid });
							me.$forceUpdate();
						}
					});
					// this.chengeAdminIcon();
					this.$message.success('设置管理员成功')
				}
			})
		},
		openRemoveAdmin(){
			const me = this;
			this.$confirm({
				title: '确认操作: 移除管理员',
				okText: "确定",
				cancelText: "取消",
				icon: 'exclamation-circle',
				centered: true,
				onOk: () => {
					this.onRemoveAdmin({
					select_id: this.$store.state.group.groupInfo.gid,
					select_name: this.$data.select_name,
						success: function(){
							me.getGroupAdmin({ select_id: me.$store.state.group.groupInfo.gid });
							me.$forceUpdate();
						}
					});
					// this.chengeAdminIcon();
					this.$message.success('移除管理员成功')
				}
			})
		},
		openSetMute(){
			const me = this;
			this.$confirm({
				title: '确认操作: 禁言',
				okText: "确定",
				cancelText: "取消",
				icon: 'exclamation-circle',
				centered: true,
				onOk: () => {
					this.onAddMute({
					select_id: this.$store.state.group.groupInfo.gid,
					select_name: this.$data.select_name,
						success: function(){
							me.getMuted({ select_id: me.$store.state.group.groupInfo.gid });
							me.$forceUpdate();
						}
					});
					// this.chengeMuteIcon();
					this.$message.success('禁言成功')
				}
			})
		},
		openRemoveMute(){
			const me = this;
			this.$confirm({
				title: '确认操作: 移除禁言',
				okText: "确定",
				cancelText: "取消",
				icon: 'exclamation-circle',
				centered: true,
				onOk: () => {
					this.onRemoveMute({
					select_id: this.$store.state.group.groupInfo.gid,
					select_name: this.$data.select_name,
					success: function(){
							me.getMuted({ select_id: me.$store.state.group.groupInfo.gid });
							me.$forceUpdate();
						}
					});
					// this.chengeMuteIcon();
					this.$message.success('移除禁言列表成功')
				}
			})
		},
		openGroupBlack(){
			this.$confirm({
				title: '确认操作: 加入群黑名单',
				okText: "确定",
				cancelText: "取消",
				icon: 'exclamation-circle',
				centered: true,
				onOk: () => {
					this.onAddGroupBlack({
						select_id: this.$store.state.group.groupInfo.gid,
						select_name: this.$data.select_name
					});
					this.$message.success('加入群黑名单成功')
				}
			})
		},
		openRemoveGroupUser(){
			this.$confirm({
				title: '确认操作: 从本群移除',
				okText: "确定",
				cancelText: "取消",
				icon: 'exclamation-circle',
				centered: true,
				onOk: () => {
					this.onRemoveGroupUser({
						select_id: this.$store.state.group.groupInfo.gid,
						select_name: this.$data.select_name
					});
					this.$message.success('移除成员成功')
				}
			})
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
.info-name {
	display: inline-block;
	width: 190px;
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
}
.info-name-width {
	width: 80px;
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
