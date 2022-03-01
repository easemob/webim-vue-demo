<template>
  <label for="uploadFile" class="label-class" @click="clickFile">
		<a-icon type="profile" :style="{fontSize: '20px', color: 'rgba(0, 0, 0, 0.65)', marginLeft: '8px'}" />
    <input type="file" class="hide" ref="imgDom" @change="fileChange" />
  </label>
</template>

<script>
import WebIM from '../../utils/WebIM';
import Config from '../../config/index';

import { mapActions } from 'vuex';
export default{
	data(){
		return {
			file: null
		};
	},
	methods: {
		...mapActions(['sendFileMessage']),
		clickFile(){
			let img = this.$refs.imgDom;
			img && img.click();
		},
		inputRef(node){
			this.file = node;
		},
		// TODO 当前username、及type不是从pams里取
		fileChange(e){
			let isRoom = this.type == 'chatroom' || this.type == 'groupchat';
			let file = WebIM.utils.getFileUrl(e.target);
			if(!file.filename){
				this.$refs.imgDom.value = null;
				return false;
			}

			let obj = {
				chatType: this.type,
				chatId: this.chatId, // TODO 这里在群里面应该取的是ID，后期跟进
				file: file,
				roomType: isRoom,
				callback: () => {
					this.$refs.imgDom.value = null;
				}
			};
			this.sendFileMessage(obj);
		}
	},
	props: [
		'type', // 聊天类型 contact, group, chatroom
		'chatId' // 选中的聊天对象
	]
};
</script>
<style scoped>
.label-class {
	cursor: pointer;
}
.hide {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 100%;
  min-height: 100%;
  filter: alpha(opacity=0);
  opacity: 0;
  cursor: inherit;
  display: none;
}
</style>
