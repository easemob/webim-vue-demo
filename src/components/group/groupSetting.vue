<template>
  <div>
    <a-popover
      placement="bottomRight"
      :destroyTooltipOnHide="true"
      :arrowPointAtCenter="true"
      v-model="popoverVisible"
      @visibleChange="visibleChange"
      trigger="click" @click="changeSetInfo">
      <template slot="content">
        <ul class="setting">
          <li @click="openInvite">
            <span>
              <a-icon type="user" />邀请群成员
            </span>
          </li>
		 <li @click="changeDisturbModel">
              <a-icon type="sound" theme="filled" />
              <span>免打扰配置</span>
          </li>
          <li v-if="showAdminIcon">
            <p @click="updatedGroupInfo">
              <a-icon type="form" />
              修改群信息
            </p>
            <p @click="changeBlackModel">
              <a-icon type="exclamation-circle" theme="filled" />
              群组黑名单
            </p>
            <p @click="dissolution">
              <a-icon type="poweroff" />
              解散群组
            </p>
          </li>
          <li v-if="showCloseIcon" @click="quitGroup">
            <span>
              <a-icon type="delete" theme="filled" />
              退出群组
            </span>
          </li>
        </ul>
      </template>
      <a-icon type="setting" class="set-icon" :style="{fontSize: '16px'}"/>
    </a-popover>
    <GroupBlack ref="groupBlackModel" />
	<DisturbConfig ref="disturbConfigModel" /> 

    <a-modal
      :title="title"
      :visible="modalVisible"
      :maskClosable="false"
      :keyboard="false"
      :okText="okText"
      cancelText="取消"
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <div v-if="editGroupFlag">群组名</div>
      <a-input :placeholder="placeholder" v-model="username"></a-input>
    </a-modal>
  </div>
</template>
<script>
import { mapActions } from 'vuex';
import './group.less';
import GroupBlack from './groupBlack.vue';
import DisturbConfig from '../pushConfig/index.vue'

export default{
	data(){
		return {
			showGroupSetting: false,
			showAdminIcon: false,
			showCloseIcon: false,
			username: '',
			modalVisible: false,
			title: '邀请群成员',
			popoverVisible: false,
			okText: '确定',
			editGroupFlag: false,
			placeholder: '请输入用户名'
		};
	},
	computed: {
		loginName(){
			const username =
        localStorage.getItem('userInfo') &&
        JSON.parse(localStorage.getItem('userInfo')).userId;
			return username;
		},
		groupAdmin(){
			return this.$store.state.group.groupInfo.admin;
		}
	},
	methods: {
		...mapActions([
			'onInviteGroup',
			'onUpdataGroupInfo',
			'onGetGroupBlack',
			'onDissolveGroup',
			'onQuitGroup',
			'onGetSilentConfig'
		]),
		changeSettingModel(){
			this.showGroupSetting = !this.showGroupSetting;
		},
		changeSetInfo(val){
			this.onGetSilentConfig();
			this.popoverVisible = true
			if(this.loginName == this.groupAdmin){
				this.showAdminIcon = true
			}
			else{
				this.showCloseIcon = true
			}
		},
		changeBlackModel(){
			this.changeSetModel()
			this.onGetGroupBlack({
				select_id: this.$store.state.group.groupInfo.gid
			});
			this.$refs.groupBlackModel.chengeBlackModel();
		},
		openInvite(){
			this.title = '邀请群成员'
			this.okText = '确定'
			this.placeholder = '用户名'
			this.editGroupFlag = false
			this.modalVisible = true
			this.changeSetModel()
		},
		updatedGroupInfo(){
			this.title = '修改群信息'
			this.okText = '修改'
			this.placeholder = '请输入群组名'
			this.editGroupFlag = true
			this.modalVisible = true
			this.changeSetModel()
		},
		quitGroup(){
			this.onQuitGroup({
				select_id: this.$store.state.group.groupInfo.gid,
				callback: () => {
					this.closeModa();
				}
			});
		},
		dissolution(){
			this.onDissolveGroup({
				select_id: this.$store.state.group.groupInfo.gid,
				callback: () => {
					this.closeModa();
				}
			});
		},
		closeModa(){
			// 退出群组 or 解散群组 关闭弹窗
			this.showGroupSetting = false;
			this.changeSetModel();
			this.$emit('closeGroupSet');
			Vue.$router.push('/group');
		},
		changeSetModel(){
			this.popoverVisible = false
			if(this.loginName == this.groupAdmin){
				this.showAdminIcon = false;
			}
			else{
				this.showCloseIcon = false;
			}
		},
		handleOk(){
			if(this.editGroupFlag){
				this.onUpdataGroupInfo({
					select_id: this.$store.state.group.groupInfo.gid,
					updateName: this.username,
					updateDesc: this.$store.state.group.groupInfo.desc
				})
				this.$message.success('修改成功')
			}
			else{
				this.onInviteGroup({
					select_id: this.$store.state.group.groupInfo.gid,
					select_name: this.username
				})
			}
			this.handleCancel()
		},
		handleCancel(){
			this.username = ''
			this.modalVisible = false
		},
		visibleChange(val){
			if(!val){
				this.changeSetModel()
			}
		},
		changeDisturbModel() {
			this.$refs.disturbConfigModel.changeModal()
		}
	},
	components: {
		GroupBlack,
		DisturbConfig
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
  margin: 0;
  padding: 0;
}
.set-icon {
  position: absolute;
  top: 100px;
  right: 20px;
  cursor: pointer;
}
</style>
