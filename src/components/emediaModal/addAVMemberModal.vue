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
            let invitees = this.$data.checkList.filter(item => item != this.$data.username)
            this.$emit('EmediaModalFun', invitees, 2) // 点击开始后的 开启多人会议
            
            this.hide();
		}
	},
};
</script>
