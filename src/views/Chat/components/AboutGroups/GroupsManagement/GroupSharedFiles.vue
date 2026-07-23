<script setup>
import { computed, onMounted, ref, toRefs } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Upload, Download, Delete, Refresh } from '@element-plus/icons-vue';
import store from '@/store';
import formatFileSize from '@/utils/fileSizeFormat';

const props = defineProps({
  groupId: {
    type: String,
    required: true,
    default: '',
  },
});
const { groupId } = toRefs(props);
const fileInputRef = ref(null);
const uploading = ref(false);
const uploadProgress = ref(0);
const loading = ref(false);

const sharedFiles = computed(() => {
  return store.getters.getGroupSharedFilesMap.get(groupId.value) || [];
});

const fetchSharedFiles = async () => {
  loading.value = true;
  try {
    await store.dispatch('fetchGroupSharedFilesFromServer', {
      groupId: groupId.value,
    });
  } catch (error) {
    ElMessage.error('获取群共享文件列表失败');
  } finally {
    loading.value = false;
  }
};

const chooseFile = () => {
  fileInputRef.value?.click();
};

const uploadFile = async (event) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  uploading.value = true;
  uploadProgress.value = 0;
  try {
    await store.dispatch('uploadGroupSharedFile', {
      groupId: groupId.value,
      file,
      onFileUploadProgress: (progress) => {
        uploadProgress.value = Math.round(
          Number(progress?.loaded || progress?.percent || 0),
        );
      },
    });
    ElMessage.success('群共享文件上传成功');
  } catch (error) {
    ElMessage.error('群共享文件上传失败');
  } finally {
    uploading.value = false;
  }
};

const downloadSharedFile = async (file) => {
  try {
    const response = await store.dispatch('downloadGroupSharedFile', {
      groupId: groupId.value,
      fileId: file.fileId,
    });
    if (response instanceof Blob) {
      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName || file.fileId;
      link.click();
      window.URL.revokeObjectURL(url);
    }
    ElMessage.success('群共享文件下载成功');
  } catch (error) {
    ElMessage.error('群共享文件下载失败');
  }
};

const deleteSharedFile = async (file) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除共享文件 ${file.fileName || file.fileId} 吗？`,
      '删除群共享文件',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
    await store.dispatch('deleteGroupSharedFile', {
      groupId: groupId.value,
      fileId: file.fileId,
    });
    ElMessage.success('群共享文件删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('群共享文件删除失败');
    }
  }
};

onMounted(fetchSharedFiles);
</script>

<template>
  <div class="shared_file_panel">
    <div class="shared_file_toolbar">
      <input
        ref="fileInputRef"
        class="hidden_file_input"
        type="file"
        @change="uploadFile"
      />
      <el-button
        type="primary"
        :icon="Upload"
        :loading="uploading"
        @click="chooseFile"
      >
        上传
      </el-button>
      <el-button :icon="Refresh" :loading="loading" @click="fetchSharedFiles">
        刷新
      </el-button>
      <span v-if="uploading" class="upload_progress">
        上传进度：{{ uploadProgress }}%
      </span>
    </div>

    <el-table v-loading="loading" :data="sharedFiles" border height="360">
      <el-table-column prop="fileName" label="文件名" min-width="180" />
      <el-table-column label="大小" width="110">
        <template #default="{ row }">
          {{ row.fileSize ? formatFileSize(row.fileSize) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="上传者" width="140">
        <template #default="{ row }">
          {{ row.fileOwner?.userId || '' }}
        </template>
      </el-table-column>
      <el-table-column prop="fileId" label="文件 ID" min-width="180" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            :icon="Download"
            circle
            size="small"
            @click="downloadSharedFile(row)"
          />
          <el-button
            type="danger"
            :icon="Delete"
            circle
            size="small"
            @click="deleteSharedFile(row)"
          />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style lang="scss" scoped>
.shared_file_panel {
  padding: 12px;
}

.shared_file_toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.hidden_file_input {
  display: none;
}

.upload_progress {
  color: #606266;
  font-size: 12px;
}
</style>
