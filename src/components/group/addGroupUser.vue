<template>
  <a-modal title="申请入群" v-model="showGroupModel" :footer="null">
    <div>
      <a-input-search
        placeholder="请输入群组ID"
        v-model="select_groupid"
        @search="getGroupinfo"
        enterButton="搜索"
      />
    </div>
    <div class="pubGroup" v-if="showGroupListModel == true">
      <ul
        class="groupList"
        v-for="item in publicGroupList"
        :key="item.groupid"
        :title="item.groupid"
        @click="select(item)"
      >{{item.groupname}}</ul>
    </div>
    <div v-if="showGroupInfoModel == true" class="info">
      <div>
        <span class="infoTitle">群组名称</span>
        <span class="infoContent">{{publicGroupInfo.name}}</span>
      </div>
      <div>
        <span class="infoTitle">管理员</span>
        <span class="infoContent">{{publicGroupInfo.admin}}</span>
      </div>
      <div>
        <span class="infoTitle">简介</span>
        <span class="infoContent">{{publicGroupInfo.desc || '空'}}</span>
      </div>
      <div>
        <span class="infoTitle">审批</span>
        <span class="infoContent">{{publicGroupInfo.membersonly ? '[Y]' : '[N]'}}</span>
      </div>
      <div>
        <div class="groBack" @click="changeGroupListModel">
          <!-- <i class="a-arrow-left"></i> -->
          <a-icon type="arrow-left" />
          <i>返回</i>
        </div>
        <div class="groCreate">
          <a-button @click="postJoinGroup" type="primary">申请加群</a-button>
        </div>
      </div>
    </div>
  </a-modal>
</template>
<script>
import './group.less';
import { mapActions, mapGetters } from 'vuex';
import Vue from 'vue';
export default{
	data(){
		return {
			select_groupid: '',
			showGroupModel: false,
			showGroupInfoModel: false,
			showGroupListModel: true
		};
	},
	computed: {
		publicGroupList(){
			return this.$store.state.group.publicGroupList;
		},
		publicGroupInfo(){
			return this.$store.state.group.groupInfo;
		}
	},
	methods: {
		...mapActions([
			'onGetGroupUserList',
			'onGetPublicGroup',
			'onGetGroupinfo',
			'onJoinGroup'
		]),
		changeGroupModel(){
			this.$data.showGroupModel = !this.$data.showGroupModel;
			if(!this.$data.showGroupListModel){
				this.changeGroupListModel();
			}
			this.$data.select_groupid = '';
			this.getPublicGroup();
		},
		changeGroupListModel(){
			this.$data.showGroupListModel = !this.$data.showGroupListModel;
			this.$data.showGroupInfoModel = !this.$data.showGroupInfoModel;
		},
		// chanegGroupInfoModel(){
		//   this.$data.showGroupInfoModel = !this.$data.showGroupInfoModel
		// },
		getPublicGroup(){
			this.onGetPublicGroup();
		},
		getGroupinfo(){
			this.onGetGroupinfo({
				select_groupid: this.$data.select_groupid,
				callback: () => {
					this.$data.showGroupListModel = false;
					this.$data.showGroupInfoModel = true;
				}
			});

			// this.chanegGroupInfoModel()
		},
		postJoinGroup(){
			this.onJoinGroup({
				select_groupid: this.$data.select_groupid
			});
			this.changeGroupModel();
		},
		select(key){
			this.$data.select_groupid = key.groupid;
			// console.log(this.$data.elect_groupid);
			this.getGroupinfo();
		}
	}
};
</script>
<style>
</style>
