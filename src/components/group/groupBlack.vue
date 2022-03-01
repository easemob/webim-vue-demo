<template>
  <a-modal title="群组黑名单" :footer="null" :visible.sync="showGroupBlackModel" @cancel="chengeBlackModel">
    <div>
      <ul v-for="item in groupBlackList" :key="item">
        {{item}}
        <label class="delete-icon">
					<a-icon type="minus-circle" @click="select(item)" />
        </label>
      </ul>
    </div>
  </a-modal>
</template>
<script>
import { mapActions } from 'vuex';
export default{
	data(){
		return {
			showGroupBlackModel: false
		};
	},
	computed: {
		groupBlackList(){
			return this.$store.state.group.groupBlack;
		}
	},
	methods: {
		...mapActions(['onRemoveGroupBlack']),
		chengeBlackModel(){
			this.$data.showGroupBlackModel = !this.$data.showGroupBlackModel;
		},
		select(key){
			let removeGroupBlackName = key;
			this.onRemoveGroupBlack({
				select_id: this.$store.state.group.groupInfo.gid,
				removeGroupName: removeGroupBlackName
			});
		}
	}
};
</script>
<style scoped>
.delete-icon {
  position: absolute;
  right: 40px;
}
</style>
