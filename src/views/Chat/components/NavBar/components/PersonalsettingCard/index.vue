<script setup>
import { ref, watch } from 'vue';
import { usePlayRing } from '@/hooks';
import { Close, EditPen, Phone, Message, Flag } from '@element-plus/icons-vue';
const dialogVisible = ref(false)
const { isOpenPlayRing } = usePlayRing()

defineExpose({
    dialogVisible
})
</script>

<template>
    <el-dialog custom-class="personal_setting_card" v-model="dialogVisible" width="366px" title="个人设置"
        :show-close="true" :destroy-on-close="true">
        <div class="setting_main">
            <div class="setting_main_item">
                <span>新消息提示音</span>
                <el-switch v-model="isOpenPlayRing" active-text="开启" inactive-text="关闭" />
            </div>
            <!-- <div>
                <span>新消息系统推送</span>
                <el-switch v-model="" active-text="开启" inactive-text="关闭" />
            </div> -->
        </div>
    </el-dialog>
</template>

<style lang="scss" scoped>
.setting_main {
    width: 100%;
    height: 100%;

    .setting_main_item {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
}
</style>