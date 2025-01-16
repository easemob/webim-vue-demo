<script setup>
import { ref } from 'vue';
import { emojis } from '@/constant';
const emit = defineEmits(['appendEmoji']);
const isShowEmojisBox = ref(false);
const handleShowEmojisBox = ({ isShow }) => {
  if (isShow) {
    isShowEmojisBox.value = true;
  } else {
    isShowEmojisBox.value = false;
  }
};
const onCheckedEmojiItem = (emoji) => emit('appendEmoji', emoji);

defineExpose({
  handleShowEmojisBox,
});
</script>
<template>
  <el-scrollbar
    ref="emojisBox"
    v-if="isShowEmojisBox"
    class="emojis_box"
    tag="div"
  >
    <span
      class="emoji"
      v-for="(emoji, index) in emojis"
      :key="index"
      @click="onCheckedEmojiItem(emoji)"
      >{{ emoji }}</span
    >
  </el-scrollbar>
</template>

<style lang="scss" scoped>
.emojis_box {
  position: absolute;
  left: 15px;
  top: -180px;
  width: 330px;
  height: 150px;
  border-radius: 5px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 15px 5px;

  .emoji {
    display: inline-block;
    width: 25px;
    height: 25px;
    text-align: center;
    line-height: 25px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.2);
    }
  }
}
</style>
