<script setup>
import { reactive, toRefs, watch } from 'vue';
import { EMClient } from '@/IM';
import { ElNotification } from 'element-plus';
import { handleSDKErrorNotifi } from '@/utils/handleSomeData';
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
//判断是否为公开群
const getTheGroupIsPublic = async (groupId) => {
  try {
    const res = await EMClient.getGroupInfo({ groupId: groupId + '' });

    if (res && res?.data && res.data[0]?.public === false) {
      Promise.resolve(false);
      return ElNotification({
        title: '申请入群',
        message: '该群为私有群不可主动申请！',
        type: 'warning',
      });
    } else {
      return Promise.resolve(true);
    }
  } catch (error) {
    if (error.type === 17) {
      ElNotification({
        title: '申请入群',
        message: '该群为私有群不可主动申请！',
        type: 'warning',
      });
      return Promise.resolve(false);
    } else {
      return Promise.resolve(true);
    }
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
    await EMClient.joinGroup(options);
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
  }
});
const resetTheModalStatus = () => {
  applyJoinGroupsForm.groupId = '';
  applyJoinGroupsForm.applyJoinMessage = '';
  emit('closeDialogVisible');
};
</script>
<template>
  <div class="app_container">
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
