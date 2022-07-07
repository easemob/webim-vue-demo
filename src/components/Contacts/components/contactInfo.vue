<script setup>
import { ArrowLeft } from '@element-plus/icons-vue'

</script>

<template>
    <div class="app_container">
        <el-header class="contactInfo_header">
            <el-page-header style="margin-top: 12px;" :icon="ArrowLeft" />
            <el-divider />
        </el-header>
        <el-main class="contactInfo_main">
            <div class="contactInfo_main_card"></div>
        </el-main>
    </div>



</template>


<style lang="scss" scoped>
.app_container {
    background: #F1F2F4;
    height: 100%;
    border-radius: 0 5px 5px 0;
    overflow: hidden;

    .contactInfo_header {
        display: flex;
        flex-direction: column;
        height: 60px;
        line-height: 60px;
    }

    .contactInfo_main {
        height: 100%;

        .contactInfo_main_card {
            width: 100%;
            height: 90%;
            margin: 0 auto;
            border-radius: 5px;
            transition: all 0.5s;

            &:hover {
                background: #fff;
                box-shadow: 12px 12px 2px 1px rgba(125, 125, 126, 0.068);

            }
        }
    }
}

::v-deep .el-page-header__left::after {
    width: 0px !important;
}
</style>