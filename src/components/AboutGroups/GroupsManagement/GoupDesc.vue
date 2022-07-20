<script setup>
import { ref } from "vue"

const isEdit = ref(false)
</script>
<template>
    <div class="app_container">
        <p v-if="isEdit">
            这是一条群公告至多展示两行，超过两行展示点点点这是一条群公告至多展示两行超过两行展示点点点这是一条群公告至多展示超过两行展示点点点这是一条群公告至多展示超过两行展示点点点这是一条群公告至多展示</p>
        <el-input v-else ref="introduceRef" :autosize="{ minRows: 2, maxRows: 4 }" type="textarea" class="notice_detail"
            placeholder="Please input" />
    </div>
</template>
<style lang="scss" scoped>
.notice_detail {
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 20px;
    color: #606266;
    width: 440px;
}

::v-deep .el-textarea__inner {
    border-radius: 5px;
}
</style>