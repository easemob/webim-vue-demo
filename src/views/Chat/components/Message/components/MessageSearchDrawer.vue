<script setup>
import { computed, ref, toRefs, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { getCurrentUserId, requireManager } from '@/IM';
import { CHAT_TYPE } from '@/IM/constant';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  routeQueryData: {
    type: Object,
    default: () => ({
      id: '',
      chatType: CHAT_TYPE.SINGLE,
    }),
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);
const { modelValue, routeQueryData } = toRefs(props);

const visible = computed({
  get: () => modelValue.value,
  set: (value) => emit('update:modelValue', value),
});

const messageTypeOptions = [
  { label: '文本 txt', value: 'txt' },
  { label: '图片 img', value: 'img' },
  { label: '视频 video', value: 'video' },
  { label: '位置 loc', value: 'loc' },
  { label: '文件 file', value: 'file' },
  { label: '合并 combine', value: 'combine' },
];

const conversationTypeOptions = [
  { label: '单聊', value: CHAT_TYPE.SINGLE },
  { label: '群聊', value: CHAT_TYPE.GROUP },
  { label: '聊天室', value: CHAT_TYPE.CHATROOM },
];

const form = ref({
  keywordsText: '',
  keywordListMatchType: 'or',
  inConversation: true,
  conversationId: '',
  conversationType: CHAT_TYPE.SINGLE,
  msgTypes: [],
  searchScope: 'none',
  pageNum: 1,
  pageSize: 20,
});
const timeRange = ref([]);
const loading = ref(false);
const searchResult = ref(null);
const searchError = ref('');
const searchErrorType = ref('error');

const currentConversationLabel = computed(() => {
  const id = routeQueryData.value?.id || '';
  const chatType = routeQueryData.value?.chatType || '';
  if (!id || !chatType) return '当前会话';
  const label =
    conversationTypeOptions.find((item) => item.value === chatType)?.label ||
    chatType;
  return `${label} ${id}`;
});

const messages = computed(() => {
  const list = searchResult.value?.messages;
  return Array.isArray(list) ? list : [];
});

const resultMeta = computed(() => ({
  pageNum: searchResult.value?.pageNum ?? form.value.pageNum,
  pageSize: searchResult.value?.pageSize ?? form.value.pageSize,
  totalPages: searchResult.value?.totalPages ?? '-',
  isLast:
    typeof searchResult.value?.isLast === 'boolean'
      ? searchResult.value.isLast
      : '-',
  requestId: searchResult.value?.requestId || '-',
  timestamp: searchResult.value?.timestamp || '-',
}));

const syncConversationDefaults = () => {
  form.value.conversationId = routeQueryData.value?.id || '';
  form.value.conversationType = routeQueryData.value?.chatType || CHAT_TYPE.SINGLE;
  form.value.inConversation = !!routeQueryData.value?.id;
};

const splitKeywords = (rawText) =>
  rawText
    .split(/[\n,，;；]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeSearchResult = (response) => {
  if (response?.messages) return response;
  if (response?.data?.messages) return response.data;
  return response || {};
};

const stringifyJson = (value) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const parseSearchServerErrorData = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (typeof value === 'object') return value;
  return null;
};

const getSearchServerDetailErrorText = (serverErrorData) => {
  const details =
    serverErrorData?.error?.details ||
    serverErrorData?.details ||
    serverErrorData?.data?.error?.details ||
    serverErrorData?.data?.details;
  if (!Array.isArray(details)) return '';
  return details
    .map((detail) => detail?.error)
    .filter(Boolean)
    .join('；');
};

const getErrorMessageText = (error) => {
  if (!error) return '';
  const parsedServerErrorData =
    parseSearchServerErrorData(error?.data) ||
    parseSearchServerErrorData(error?.data?.data) ||
    parseSearchServerErrorData(error);
  const serverDetailErrorText =
    getSearchServerDetailErrorText(parsedServerErrorData);
  if (serverDetailErrorText) return serverDetailErrorText;
  if (typeof error === 'string') return error;
  return [
    parsedServerErrorData?.error?.message,
    parsedServerErrorData?.message,
    parsedServerErrorData?.msg,
    parsedServerErrorData?.reason,
    parsedServerErrorData?.error_description,
    parsedServerErrorData?.error,
    parsedServerErrorData?.data?.error?.message,
    parsedServerErrorData?.data?.message,
    parsedServerErrorData?.data?.msg,
    parsedServerErrorData?.data?.reason,
    parsedServerErrorData?.data?.error_description,
    error.data?.message,
    error.data?.msg,
    error.data?.reason,
    error.data?.error_description,
    error.data?.error,
    error.data?.data?.message,
    error.data?.data?.error_description,
    error.message,
    error.msg,
    error.reason,
    error.error_description,
    error.error,
  ]
    .filter(Boolean)
    .join(' ');
};

const isSearchServiceNotEnabledError = (error) => {
  const text = getErrorMessageText(error).toLowerCase();
  const codeText = [
    error?.type,
    error?.code,
    error?.data?.type,
    error?.data?.code,
    error?.data?.error?.code,
    error?.data?.data?.code,
  ]
    .filter((item) => item !== undefined && item !== null)
    .map(String)
    .join(' ')
    .toLowerCase();

  return (
    text.includes('message search') ||
    text.includes('search service') ||
    text.includes('service not enabled') ||
    text.includes('not enabled') ||
    text.includes('not open') ||
    text.includes('not activated') ||
    (text.includes('permission') && text.includes('search')) ||
    (text.includes('forbidden') && text.includes('search')) ||
    text.includes('未开通') ||
    text.includes('未开启') ||
    text.includes('未启用') ||
    (text.includes('无权限') && text.includes('搜索')) ||
    codeText.includes('4031001') ||
    codeText.includes('service_not_enabled') ||
    codeText.includes('permission_denied')
  );
};

const getSearchErrorTip = (error) => {
  if (isSearchServiceNotEnabledError(error)) {
    return '服务端消息搜索功能未开通，请联系环信商务开通后再试';
  }
  return getErrorMessageText(error) || '未返回错误详情';
};

const formatTime = (timestamp) => {
  const value = Number(timestamp);
  if (!Number.isFinite(value) || value <= 0) return '-';
  return new Date(value).toLocaleString();
};

const getMessageSummary = (message) =>
  message?.text ||
  message?.msg ||
  message?.filename ||
  message?.addr ||
  message?.url ||
  message?.customEvent ||
  '';

const buildSearchParams = () => {
  const keywordList = splitKeywords(form.value.keywordsText);
  if (keywordList.length === 0) {
    throw new Error('请输入搜索关键词');
  }

  const option = {
    keywordList,
    keywordListMatchType: form.value.keywordListMatchType,
    searchScope: form.value.searchScope,
  };

  if (form.value.inConversation) {
    const conversationId = form.value.conversationId.trim();
    if (!conversationId || !form.value.conversationType) {
      throw new Error('指定会话搜索时，会话 ID 和会话类型必须同时选择');
    }
    option.conversationId = conversationId;
    option.conversationType = form.value.conversationType;
  }

  if (form.value.msgTypes.length > 0) {
    option.msgTypes = [...form.value.msgTypes];
  }

  if (timeRange.value?.length === 2) {
    const startTime = Number(timeRange.value[0]);
    const endTime = Number(timeRange.value[1]);
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
      throw new Error('请选择有效的开始时间和结束时间');
    }
    if (endTime < startTime) {
      throw new Error('结束时间不能早于开始时间');
    }
    option.startTime = startTime;
    option.endTime = endTime;
  }

  return {
    option,
    pageNum: Number(form.value.pageNum) || 1,
    pageSize: Number(form.value.pageSize) || 20,
  };
};

const searchMessages = async () => {
  let params;
  try {
    params = buildSearchParams();
  } catch (error) {
    ElMessage.warning(error.message);
    return;
  }

  loading.value = true;
  searchError.value = '';
  searchErrorType.value = 'error';
  try {
    console.log('[Message Search] searchMessages request', {
      user: getCurrentUserId(),
      routeQueryData: routeQueryData.value,
      params,
    });
    const response = await requireManager('chatManager').searchMessages(params);
    searchResult.value = normalizeSearchResult(response);
    console.log('[Message Search] searchMessages success', {
      user: getCurrentUserId(),
      params,
      result: searchResult.value,
    });
    ElMessage.success('服务端消息搜索完成');
  } catch (error) {
    const isSearchServiceNotEnabled = isSearchServiceNotEnabledError(error);
    const errorTip = getSearchErrorTip(error);
    searchError.value = errorTip;
    searchErrorType.value = isSearchServiceNotEnabled ? 'warning' : 'error';
    searchResult.value = null;
    console.error('[Message Search] searchMessages failed', {
      user: getCurrentUserId(),
      routeQueryData: routeQueryData.value,
      params,
      error,
    });
    ElMessage[isSearchServiceNotEnabled ? 'warning' : 'error'](errorTip);
  } finally {
    loading.value = false;
  }
};

watch(
  () => [routeQueryData.value?.id, routeQueryData.value?.chatType],
  syncConversationDefaults,
  { immediate: true },
);
</script>

<template>
  <el-drawer
    v-model="visible"
    class="message_search_drawer"
    title="服务端消息搜索"
    direction="rtl"
    size="520px"
    :destroy-on-close="false"
  >
    <div class="message_search_panel">
      <el-form label-position="top" class="message_search_form">
        <el-form-item label="关键词">
          <el-input
            class="message_search_keywords"
            v-model="form.keywordsText"
            type="textarea"
            :rows="4"
            placeholder="使用换行、逗号或分号分隔；超出服务端限制时展示服务端返回的真实错误"
          />
        </el-form-item>

        <div class="message_search_grid">
          <el-form-item label="关键词关系">
            <el-select v-model="form.keywordListMatchType">
              <el-option label="匹配任一关键词 or" value="or" />
              <el-option label="匹配全部关键词 and" value="and" />
            </el-select>
          </el-form-item>
          <el-form-item label="搜索内容">
            <el-select v-model="form.searchScope">
              <el-option label="仅消息内容 none" value="none" />
              <el-option label="消息内容和扩展 with" value="with" />
              <el-option label="仅扩展字段 only" value="only" />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="会话范围">
          <el-radio-group v-model="form.inConversation">
            <el-radio-button :value="true">
              当前会话
            </el-radio-button>
            <el-radio-button :value="false">
              全部可见会话
            </el-radio-button>
          </el-radio-group>
          <div v-if="form.inConversation" class="message_search_hint">
            {{ currentConversationLabel }}
          </div>
        </el-form-item>

        <div v-if="form.inConversation" class="message_search_grid">
          <el-form-item label="会话 ID">
            <el-input v-model="form.conversationId" />
          </el-form-item>
          <el-form-item label="会话类型">
            <el-select v-model="form.conversationType">
              <el-option
                v-for="item in conversationTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="消息类型">
          <el-select
            v-model="form.msgTypes"
            multiple
            clearable
            placeholder="不选表示不过滤消息类型"
          >
            <el-option
              v-for="item in messageTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="时间范围">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            value-format="x"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            range-separator="至"
            clearable
          />
        </el-form-item>

        <div class="message_search_grid">
          <el-form-item label="页码">
            <el-input-number v-model="form.pageNum" :min="1" :step="1" />
          </el-form-item>
          <el-form-item label="每页条数">
            <el-input-number
              v-model="form.pageSize"
              :min="1"
              :max="100"
              :step="1"
            />
          </el-form-item>
        </div>

        <el-button
          type="primary"
          :loading="loading"
          :icon="Search"
          @click="searchMessages"
        >
          搜索
        </el-button>
      </el-form>

      <el-alert
        v-if="searchError"
        class="message_search_error"
        :type="searchErrorType"
        :title="searchError"
        show-icon
        :closable="false"
      />

      <div v-if="searchResult" class="message_search_result">
        <div class="message_search_meta">
          <span>页码：{{ resultMeta.pageNum }}</span>
          <span>每页：{{ resultMeta.pageSize }}</span>
          <span>总页数：{{ resultMeta.totalPages }}</span>
          <span>最后页：{{ resultMeta.isLast }}</span>
          <span>requestId：{{ resultMeta.requestId }}</span>
          <span>响应时间：{{ formatTime(resultMeta.timestamp) }}</span>
        </div>

        <el-empty
          v-if="messages.length === 0"
          :image-size="80"
          description="服务端返回空结果"
        />

        <div v-else class="message_search_list">
          <div
            v-for="message in messages"
            :key="message.id || `${message.from}-${message.time}`"
            class="message_search_item"
          >
            <div class="message_search_item_header">
              <span>{{ message.type || '-' }}</span>
              <span>{{ message.chatType || '-' }}</span>
              <span>{{ message.conversationId || message.to || '-' }}</span>
            </div>
            <div class="message_search_item_summary">
              {{ getMessageSummary(message) || '无摘要内容' }}
            </div>
            <div
              v-if="message.highlight && message.highlight.length"
              class="message_search_highlight"
            >
              <span
                v-for="(highlight, index) in message.highlight"
                :key="`${message.id}-highlight-${index}`"
              >
                {{ highlight }}
              </span>
            </div>
            <div class="message_search_item_meta">
              <span>ID：{{ message.id || '-' }}</span>
              <span>{{ message.from || '-' }} -> {{ message.to || '-' }}</span>
              <span>{{ formatTime(message.time) }}</span>
            </div>
            <pre>{{ stringifyJson(message) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<style lang="scss" scoped>
.message_search_panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
}

.message_search_form {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.message_search_grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}

.message_search_hint {
  margin-top: 8px;
  color: #666666;
  font-size: 12px;
  word-break: break-all;
}

.message_search_error {
  margin-top: 4px;
}

.message_search_result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message_search_meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding: 10px 12px;
  border: 1px solid #e6e8eb;
  border-radius: 6px;
  color: #555555;
  font-size: 12px;
  background: #fafafa;
}

.message_search_list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message_search_item {
  padding: 12px;
  border: 1px solid #e6e8eb;
  border-radius: 6px;
  background: #ffffff;
}

.message_search_item_header,
.message_search_item_meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  color: #777777;
  font-size: 12px;
}

.message_search_item_summary {
  margin-top: 8px;
  color: #333333;
  line-height: 20px;
  word-break: break-word;
}

.message_search_highlight {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.message_search_highlight span {
  padding: 2px 6px;
  border-radius: 4px;
  color: #8a5a00;
  background: #fff3cd;
  font-size: 12px;
}

.message_search_item pre {
  margin: 10px 0 0;
  max-height: 180px;
  overflow: auto;
  padding: 10px;
  border-radius: 6px;
  color: #333333;
  background: #f7f8fa;
  font-size: 12px;
  line-height: 18px;
  white-space: pre-wrap;
  word-break: break-word;
}

:deep(.el-date-editor.el-input__wrapper) {
  width: 100%;
}

:deep(.el-select),
:deep(.el-input-number) {
  width: 100%;
}

:deep(.message_search_keywords .el-textarea__inner) {
  border-radius: 0;
  border: 1px solid #dcdfe6;
  box-shadow: none;
  min-height: 104px;
  padding: 8px 12px;
}

:deep(.message_search_keywords .el-textarea__inner:hover) {
  border-color: #c0c4cc;
}

:deep(.message_search_keywords .el-textarea__inner:focus) {
  border-color: #409eff;
  box-shadow: none;
}
</style>
