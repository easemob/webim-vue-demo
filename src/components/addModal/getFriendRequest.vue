<template>
  <div>
    <a-modal title="请求添加好友" :visible="this.isShowFriendRequest">
      <p :class="$style.p">{{this.$store.state.friendModule.friendRequest.status}}</p>
      <div slot="footer" class="dialog-footer">
        <a-button @click="refusedClick">拒绝</a-button>
        <a-button type="primary" @click="acceptSubmit">接受</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import Vue from 'vue';

export default{
	data(){
		return {
			showRequestFriendModal: this.$store.state.friendModule.friendRequest
			.isShow
		};
	},
	computed: {
		// ...mapGetters({

		// }),
		isShowFriendRequest(){
			return this.$store.state.friendModule.friendRequest.isShow;
		}
	},

	methods: {
		...mapActions(['acceptSubscribe', 'declineSubscribe']),
		changeModal(){
			this.$store.state.friendModule.friendRequest.isShow = !this.$store.state
			.friendModule.friendRequest.isShow;
		},
		acceptSubmit(){
			const id = this.$store.state.friendModule.friendRequest.from;
			this.acceptSubscribe(id);
			this.changeModal();
		},
		refusedClick(){
			const options = {
				id: this.$store.state.friendModule.friendRequest.from,
				params: this.$route.query.username
			};
			this.declineSubscribe(options);
			this.changeModal();
		}
	}
};
</script>
<style module>
.p {
  text-align: center;
}
</style>
