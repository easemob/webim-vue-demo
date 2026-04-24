<script setup>
import { ref, watch } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { usePlayRing, useSetEMLogConfig, useSetCallKitLogConfig } from '@/hooks';
import store from '@/store';
const dialogVisible = ref(false);
const { isOpenPlayRing } = usePlayRing();
const { isOpenedEMLog, donwLoadEMLog } = useSetEMLogConfig();
const {
  isOpenedCallKitLog,
  callKitLogLevel,
  isOpenedCallKitIDBLog,
  downloadCallKitLog,
  clearCallKitLog,
  LEVEL_OPTIONS,
} = useSetCallKitLogConfig();
const conversationFromMethod = useLocalStorage(
  'CONVERSATION_FROM_LOCAL',
  false,
);
watch(conversationFromMethod, () => {
  store.commit('GET_CONVERSATION_LIST_FROM');
  store.dispatch('getConversationList');
});
defineExpose({
  dialogVisible,
});
</script>

<template>
  <el-dialog
    custom-class="personal_setting_card"
    v-model="dialogVisible"
    width="366px"
    title="个人设置"
    :show-close="true"
    :destroy-on-close="true"
  >
    <div class="setting_main">
      <div class="setting_main_item">
        <el-tooltip
          class="item"
          effect="dark"
          content="开启后可在收到消息时，播放消息提示音。"
          placement="top"
        >
          <span>新消息提示音</span>
        </el-tooltip>

        <el-switch
          v-model="isOpenPlayRing"
          active-text="开启"
          inactive-text="关闭"
        />
      </div>
      <div class="setting_main_item">
        <el-tooltip
          class="item"
          effect="dark"
          content="开启SDK日志后，会在控制台输出SDK日志,并可下载SDK缓存日志。"
          placement="top"
        >
          <span>开启SDK日志</span></el-tooltip
        >
        <el-switch
          v-model="isOpenedEMLog"
          active-text="开启"
          inactive-text="关闭"
        />
      </div>
      <div class="setting_main_item" v-if="isOpenedEMLog">
        <el-button
          class="download_log"
          type="primary"
          plain
          @click="donwLoadEMLog"
          >下载SDK缓存日志</el-button
        >
      </div>
      <!-- 会话列表获取方式 -->
      <div class="setting_main_item">
        <el-tooltip
          class="item"
          effect="dark"
          content="开启后，本项目优先走本地获取会话列表数据。"
          placement="top"
        >
          <span>会话列表获取方式</span>
        </el-tooltip>
        <el-switch
          v-model="conversationFromMethod"
          active-text="本地获取"
          inactive-text="服务端获取"
        />
      </div>
      <!-- CallKit 日志设置 -->
      <el-divider content-position="left">CallKit 日志</el-divider>
      <div class="setting_main_item">
        <el-tooltip
          class="item"
          effect="dark"
          content="开启后控制台输出 CallKit 日志，可独立设置日志等级。"
          placement="top"
        >
          <span>CallKit 控制台日志</span>
        </el-tooltip>
        <el-switch
          v-model="isOpenedCallKitLog"
          active-text="开启"
          inactive-text="关闭"
        />
      </div>
      <div class="setting_main_item" v-if="isOpenedCallKitLog">
        <span>日志等级</span>
        <el-select v-model="callKitLogLevel" size="small" style="width: 120px">
          <el-option
            v-for="opt in LEVEL_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>
      <div class="setting_main_item">
        <el-tooltip
          class="item"
          effect="dark"
          content="开启后将 CallKit 结构化日志写入 IndexedDB，便于通话结束后导出排查。"
          placement="top"
        >
          <span>CallKit IDB 日志</span>
        </el-tooltip>
        <el-switch
          v-model="isOpenedCallKitIDBLog"
          active-text="开启"
          inactive-text="关闭"
        />
      </div>
      <div class="setting_main_item">
        <el-button
          class="download_log"
          type="primary"
          plain
          @click="downloadCallKitLog"
          >导出 CallKit 日志</el-button
        >
        <el-button
          class="download_log"
          type="danger"
          plain
          @click="clearCallKitLog"
          >清理日志</el-button
        >
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
