<template>
  <a-modal
    title="创建群组"
      v-model="showCreateGroupModel"
      :footer="null"
    >
      <a-form :model="form" v-if="showCreateModel == true">
      <div>
        <a-input v-model="form.groName" placeholder="群组名称"></a-input>
      </div>
      <div class="groDesc">
        <a-input type="textarea" :rows="2" placeholder="简介" v-model="form.desc"></a-input>
      </div>
      <div class="groPub">
        <p>群组类型</p>
        <a-radio-group v-model="form.radio">
          <a-radio :value="1">私有群</a-radio>
          <a-radio :value="2">公有群</a-radio>
        </a-radio-group>
      </div>
      <div class="groPub">
        <p>加群权限</p>
        <a-radio-group v-model="form.radiopom">
          <a-radio :value="1">审批</a-radio>
          <a-radio :value="2">随便加</a-radio>
        </a-radio-group>
      </div>
      <div class="groPost">
        <a-button type="primary" @click="chenageCreateModel">下一步</a-button>
      </div>
    </a-form>
    <div v-if="showFriendListModel == true">
      <div class="groPub">
        <a-checkbox-group v-model="form.membersList">
          <li v-for="item in firendList" :key="item.name" class="friendItem">
            <a-checkbox :value="item.name">
              {{item.name}}
            </a-checkbox>
          </li>
        </a-checkbox-group>
      </div>
      <div>
        <div class="groBack" @click="chenageCreateModel">
          <a-icon type="left" />
          返回
        </div>
        <div class="groCreate">
          <a-button type="primary" @click="postCreateGroup">创建群组</a-button>
        </div>
      </div>
    </div>
    </a-modal>
</template>
<script>
import './group.less';
import { mapActions } from 'vuex';
export default{
	data(){
		return {
			showCreateGroupModel: false,
			showCreateModel: true,
			showFriendListModel: false,

			form: {
				groName: '',
				desc: '',
				radio: 2,
				radiopom: 2,
				membersList: []
			}
		};
	},
	computed: {
		firendList(){
			return this.$store.state.chat.userList.contactUserList || [];
		}
	},
	methods: {
		...mapActions(['onCreateGroup']),
		changeCreateModel(){
			this.$data.showCreateGroupModel = !this.$data.showCreateGroupModel;
			if(!this.$data.showCreateModel){
				this.chenageCreateModel();
			}
			this.$data.form.groName = '';
			this.$data.form.desc = '';
		},
		chenageCreateModel(){
			this.$data.showCreateModel = !this.$data.showCreateModel;
			this.$data.showFriendListModel = !this.$data.showFriendListModel;
		},
		postCreateGroup(){
			if(!this.form.groName){
				this.$message.warning('群名称不能为空')
				return
			}
			this.onCreateGroup({
				groupname: this.$data.form.groName,
				desc: this.$data.form.desc,
				members: this.$data.form.membersList,
				approval: this.$data.form.radiopom != 2,
				pub: this.$data.form.radio == 2
			});
			this.changeCreateModel();
		}
	}
};
</script>
<style scoped>
.friendItem {
  white-space: nowrap;
}
</style>
