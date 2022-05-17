<template>
	<a-modal
		class="setting-video"
		title="音视频录制"
		v-model="recModalVisible"
		:footer="null"
	>
		<div>
			<a-checkbox-group v-model="checkList" @change="onChange">
				<a-checkbox value="rec" class="checkbox">启用录制</a-checkbox>
				<a-checkbox value="recMerge" class="checkbox">启用合并</a-checkbox>
			</a-checkbox-group>
		</div>
	</a-modal>
</template>

<script>
export default{
	data(){
		return {
			recModalVisible: false,
			checkList: []
		};
	},
	methods: {
		onChange(checkedList){
			this.$data.checkList = checkedList;
			const videoSettingObj = {
				recMerge: checkedList.indexOf('recMerge') != -1,
				rec: checkedList.indexOf('rec') != -1,
			};
			localStorage.setItem('videoSetting', JSON.stringify(videoSettingObj));
		},
		show(){
			const videoSetting = JSON.parse(localStorage.getItem('videoSetting'));
			let checkedList = [];
			if(videoSetting){
				checkedList = Object.keys(videoSetting).filter((key) => {
					if(videoSetting[key]){
						return key;
					}
				});
			}
			this.$data.checkList = checkedList;
			this.$data.recModalVisible = true;
		},
		hide(){
			this.$data.recModalVisible = false;
		},
	}
};
</script>

<style lang="less">
.setting-video {
	.checkbox{
		display: block;
		margin-top: 6px;
		margin-left: 0px !important
	}
}
</style>
