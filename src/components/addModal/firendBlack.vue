<template>
	<a-modal
		title="黑名单"
		v-model="showBlackModel"
		:footer="null"
	>
		<ul class="black-name">
				<li v-for="item in fidendList" :key="item.name">
				{{item.name}}
				<label class="icon-x" @click="select(item)" >
					<a-icon type="minus-circle" />
				</label>
			</li>
		</ul>
	</a-modal>
</template>
<script>
import { mapActions } from 'vuex';
import './firend.less';
export default{
	data(){
		return {
			showBlackModel: false
		};
	},
	computed: {
		fidendList(){
			return this.$store.state.friendModule.blackList;
		}
	},
	methods: {
		...mapActions(['onGetFirendBlack', 'onRemoveBlack']),
		changModel(){
			this.$data.showBlackModel = !this.$data.showBlackModel;
		},
		select(key){
			let removeName = key.name;
			this.onRemoveBlack({ removeName: removeName });
			this.onGetFirendBlack();
		}
	}
};
</script>
<style scoped>
</style>
