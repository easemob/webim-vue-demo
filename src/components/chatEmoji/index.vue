<template>
  <span>
    <a-popover placement="top" trigger="click" :visible="showPopover">
      <template slot="content">
        <div class="emoji-box">
          <img
            v-for="(v,i) in emojiList"
            :src="require(`../../../static/faces/${v}`)"
            :key="i"
            @click="selectEmoji(i)"
            class="img-style"
          />
        </div>
      </template>
      <a-icon type="smile" :style="{ fontSize: '20px', color: 'rgba(0, 0, 0, 0.65)' }" @click="showPopover = !showPopover" />
    </a-popover>
  </span>
</template>

<script>
import emoji from '../../config/emoji';

export default{
	data(){
		return {
			emojiList: emoji.obj,
			showPopover: false
		};
	},
	methods: {
		selectEmoji(e){
			let value = (this.inpMessage || '') + e;
			this.showPopover = false
			this.$emit('selectEmoji', value);
		}
	},
	props: {
		inpMessage: String
	}
};
</script>
<style scoped>
.emoji-box {
  width: 360px;
}
.img-style {
  width: 22px;
  margin: 5px;
  cursor: pointer;
}
.img-style:hover {
  background-color: aquamarine;
}
</style>
