<script setup>
import { computed, onMounted, reactive, ref, toRefs, watch } from 'vue';
import { useStore } from 'vuex';
import { requireManager } from '@/IM';
import { ElNotification } from 'element-plus';
import { RefreshRight } from '@element-plus/icons-vue';
import { handleSDKErrorNotifi } from '@/utils/handleSomeData';
const store = useStore();
const props = defineProps({
  dialogVisible: {
    type: Boolean,
    default: false,
  },
});
const { dialogVisible } = toRefs(props);
const emit = defineEmits(['closeDialogVisible']);
const applyJoinGroupsForm = reactive({
  groupId: '',
  applyJoinMessage: '',
});
const loadingPublicGroups = ref(false);
const publicGroupList = computed(() => store.getters.getPublicGroupList || []);
const loadPublicGroups = async (reset = false) => {
  loadingPublicGroups.value = true;
  try {
    await store.dispatch('fetchPublicGroupListFromServer', {
      limit: 20,
      reset,
    });
  } catch (error) {
    console.error('公开群列表获取失败', error);
  } finally {
    loadingPublicGroups.value = false;
  }
};
const selectPublicGroup = (group) => {
  applyJoinGroupsForm.groupId = group?.groupid || '';
};
//判断是否为公开群
const getTheGroupIsPublic = async (groupId) => {
  try {
    const res = await requireManager('groupManager').getGroupInfo({ groupId: groupId + '' });

    if (res?.isPublic === false) {
      return ElNotification({
        title: '申请入群',
        message: '该群为私有群不可主动申请！',
        type: 'warning',
      });
    } else {
      return true;
    }
  } catch (error) {
    if (error.type === 17) {
      ElNotification({
        title: '申请入群',
        message: '该群为私有群不可主动申请！',
        type: 'warning',
      });
      return false;
    }
    throw error;
  }
};
const joinGroups = async () => {
  if (!applyJoinGroupsForm.groupId)
    return ElNotification({
      title: '申请入群',
      message: '群组ID不可为空',
      type: 'warning',
    });
  //如果获取到期群组详情中的public为false代表为私有群（私有群不可主动申请加入）
  const isPublic = await getTheGroupIsPublic(applyJoinGroupsForm.groupId);

  if (!isPublic) return;
  const options = {
    groupId: applyJoinGroupsForm.groupId + '', // 群组ID
    message: applyJoinGroupsForm.applyJoinMessage, // 请求信息
  };
  try {
    await requireManager('groupManager').joinGroup({
      groupId: options.groupId,
      reason: options.message,
    });
    ElNotification({
      title: '群组操作',
      message: '群申请已发送！',
      type: 'success',
    });
  } catch (error) {
    const { type, data, message } = error;

    if (error.data) {
      if (JSON.parse(data).error_description.includes('blacklist')) {
        handleSDKErrorNotifi(type, 'blacklist');
      } else if (JSON.parse(data).error_description.includes('already')) {
        handleSDKErrorNotifi(type, 'already');
      } else {
        handleSDKErrorNotifi(type, message);
      }
    } else {
      handleSDKErrorNotifi(null, '未知错误！');
    }
  } finally {
    resetTheModalStatus();
  }
};
//监听关闭初始化form内容
watch(dialogVisible, (newVal) => {
  if (!newVal) {
    resetTheModalStatus();
  } else if (!publicGroupList.value.length) {
    loadPublicGroups(true);
  }
});
const resetTheModalStatus = () => {
  applyJoinGroupsForm.groupId = '';
  applyJoinGroupsForm.applyJoinMessage = '';
  emit('closeDialogVisible');
};
onMounted(() => {
  if (!publicGroupList.value.length) {
    loadPublicGroups(true);
  }
});
</script>
<template>
  <div class="app_container">
    <div class="public_groups_panel">
      <div class="public_groups_header">
        <span>公开群列表</span>
        <el-button
          link
          type="primary"
          :icon="RefreshRight"
          :loading="loadingPublicGroups"
          @click="loadPublicGroups(true)"
        >
          刷新
        </el-button>
      </div>
      <el-scrollbar max-height="160px">
        <div
          v-for="group in publicGroupList"
          :key="group.groupid"
          class="public_group_item"
          @click="selectPublicGroup(group)"
        >
          <div class="public_group_name">{{ group.groupname }}</div>
          <div class="public_group_id">{{ group.groupid }}</div>
        </div>
        <el-empty
          v-if="!loadingPublicGroups && publicGroupList.length === 0"
          description="暂无公开群"
        />
      </el-scrollbar>
    </div>
    <el-form label-position="top" label-width="100px">
      <el-form-item label="群组ID" style="margin-bottom: 20px">
        <el-input
          class="applyJoinGroups_input"
          style="height: 40px"
          v-model.number="applyJoinGroupsForm.groupId"
        />
      </el-form-item>
      <el-form-item label="验证信息" style="margin-bottom: 28px">
        <el-input
          class="applyJoinGroups_input"
          style="height: 40px"
          v-model="applyJoinGroupsForm.applyJoinMessage"
          maxlength="150"
          show-word-limit
        />
      </el-form-item>
      <el-form-item>
        <div class="apply_groups_btn_box">
          <el-button
            type="primary"
            color="#0091FF"
            class="apply_groups_btn"
            @click="joinGroups"
            >申请加入
          </el-button>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>
<style lang="scss" scoped>
.public_groups_panel {
  margin-bottom: 20px;
}

.public_groups_header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
}

.public_group_item {
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: #f5f7fa;
  }
}

.public_group_name {
  font-size: 13px;
  color: #303133;
}

.public_group_id {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.apply_groups_btn_box {
  width: 100%;
  height: 50px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  .apply_groups_btn {
    width: 212px;
    height: 40px;
  }
}

.applyJoinGroups_input {
  height: 40px;
}

:deep(.applyJoinGroups_input) > .el-input__wrapper {
  border-radius: 5px;
}
</style>
