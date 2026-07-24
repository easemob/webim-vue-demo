<template>
  <div v-if="quote" class="message_quote_container">
    <span> {{ quote.sender?.userId || '' }}：</span>
    <div class="quote_from_content">
      <template v-if="quote.type === 'image'">
        <el-image
          v-if="quote.body?.thumbnailUrl"
          style="width: 35px; height: 35px"
          :src="quote.body.thumbnailUrl"
          :preview-src-list="[quote.body.thumbnailUrl]"
        />
        <p v-else class="quote_text">{{ JSON.stringify(quote.body) }}</p>
      </template>
      <template v-else>
        <p class="quote_text" :title="quote.type">
          {{ quote.type === 'text' ? quote.body?.content : JSON.stringify(quote.body) }}
        </p>
      </template>
    </div>

    <div class="quote_close_icon" @click="clearQuoteContent">
      <svg
        viewBox="0 0 1024 1024"
        xmlns="http://www.w3.org/2000/svg"
        data-v-ea893728=""
      >
        <path
          fill="currentColor"
          d="m466.752 512-90.496-90.496a32 32 0 0 1 45.248-45.248L512 466.752l90.496-90.496a32 32 0 1 1 45.248 45.248L557.248 512l90.496 90.496a32 32 0 1 1-45.248 45.248L512 557.248l-90.496 90.496a32 32 0 0 1-45.248-45.248L466.752 512z"
        ></path>
        <path
          fill="currentColor"
          d="M512 896a384 384 0 1 0 0-768 384 384 0 0 0 0 768zm0 64a448 448 0 1 1 0-896 448 448 0 0 1 0 896z"
        ></path>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 直接保存 SDK 5.0 原始 Message；不生成旧消息字段或本地展示模型。
const quote = ref(null);

const setQuoteContent = (message) => {
  if (!message) {
    console.error('[Message Quote] SDK 5.0 message is empty', message);
    return;
  }
  quote.value = message;
};

const clearQuoteContent = () => {
  quote.value = null;
};

defineExpose({
  quote,
  setQuoteContent,
  clearQuoteContent,
});
</script>

<style lang="scss" scoped>
.message_quote_container {
  position: absolute;
  left: 15px;
  bottom: 10px;
  min-width: 20%;
  max-width: 45%;
  height: 20%;
  border-radius: 3px;
  background: #e7e7e690;
  color: #8e8e8e;
  padding: 5px;
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 13px;
}
.quote_file_box {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
}
.quote_close_icon {
  position: absolute;
  top: 0;
  bottom: 0;
  right: -8%;
  margin: auto;
  width: 15px;
  height: 15px;
  cursor: pointer;
}
.quote_close_icon:hover {
  transform: scale(1.1);
}
.quote_text {
  width: 100%;
  word-break: break-all;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 17px;
}

.quote_file_icon {
  width: 15px;
  height: 15px;
}
</style>
