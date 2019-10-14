<template>
	<a-modal
		title="音视频录制"
		v-model="recModalVisible"
		:footer="null"
	>
		<div>
			<el-checkbox-group v-model="checkList" @change="onChange">
				<el-checkbox label="rec" class="checkbox">启用录制</el-checkbox>
				<el-checkbox label="recMerge" class="checkbox">启用合并</el-checkbox>
			</el-checkbox-group>
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
				recMerge: checkedList.indexOf("recMerge") != -1,
				rec: checkedList.indexOf("rec") != -1,
			};
			localStorage.setItem("videoSetting", JSON.stringify(videoSettingObj));
		},
		show(){
			const videoSetting = JSON.parse(localStorage.getItem("videoSetting"));
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

<style>
	.checkbox{
		display: block;
		margin-top: 6px;
	}
</style>
