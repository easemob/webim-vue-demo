<template>
	<a-modal
		title="添加好友"
		v-model="showAddFriendModal"
		@ok="submitValue"
		@canca="showAddFriendModal = false"
	>
		<a-form :model="form">
		<a-form-item laba="用户名">
			<a-input v-model="form.name" auto-complete="off"></a-input>
		</a-form-item>
		</a-form>
		<div slot="footer" class="dialog-footer">
			<a-button @click="showAddFriendModal = false">取 消</a-button>
			<a-button type="primary" @click="submitValue">确 定</a-button>
		</div>
	</a-modal>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import Vue from 'vue';

export default{
	data(){
		return {
			form: {
				name: '',
			},
			showAddFriendModal: false
		};
	},
	computed: {
		// ...mapGetters({
		//   contact: "addfirend"
		// }),
	},
	methods: {
		...mapActions(['addfirend']),
		changeModal(){
			this.$data.showAddFriendModal = !this.$data.showAddFriendModal;
		},
		submitValue(){
			const option = {
				id: this.form.name,
				params: this.$route.query.username
			};
			this.changeModal();
			this.addfirend(option);
			this.$message.success('已发送请求');
			this.$data.form.name = ''
		}
	}
};
</script>
