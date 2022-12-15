<script setup>
import { ref } from 'vue'
import fileSizeFormat from '@/utils/fileSizeFormat'
const emits = defineEmits(['sendImagesMessage'])
let fileObj = null
const imgPaths = ref('')
const imgName = ref('')
const imgSize = ref('')
const dialogTableVisible = ref(false)
const showPreviewImgModal = (imgObj) => {
    imgPaths.value = imgObj.tempFilePath
    imgName.value = imgObj.imgFile.name
    imgSize.value = imgObj.imgFile.size
    fileObj = imgObj.imgFile
    dialogTableVisible.value = true
}
const sendTheImg = () => {
    emits('sendImagesMessage', 'other', fileObj)
    dialogTableVisible.value = false
}
defineExpose({
    showPreviewImgModal,
})
</script>
<template>
  <el-dialog v-model="dialogTableVisible" title="发送图片" width="300px">
    <el-image class="img_box" :src="imgPaths">
      <template #placeholder>
        <div class="image-slot">Loading<span class="dot">...</span></div>
      </template>
    </el-image>
    <div class="img_infos">
      <span class="img_name">{{ imgName }}</span>
      <span class="img_size">{{ fileSizeFormat(imgSize) }}</span>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogTableVisible = false">取消</el-button>
        <el-button type="primary" @click="sendTheImg"> 发送 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.img_box {
  max-width: 500px;
}

.img_infos {
  margin: 7px;
  line-height: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .img_name {
    font-size: 17px;
    font-weight: bold;
  }

  .img_size {
    font-size: 13px;
    font-weight: 400;
  }
}
</style>
