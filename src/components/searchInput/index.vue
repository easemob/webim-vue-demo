<script setup>
import { ref, toRaw, watch, defineProps, defineEmits } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { useStore } from "vuex";
import { useLocalStorage } from '@vueuse/core'
import _ from "lodash"
import { onClickOutside } from '@vueuse/core';
import { messageType } from '@/constant'
import dateFormater from '@/utils/dateFormat'
const store = useStore();
const { CHAT_TYPE } = messageType
const props = defineProps({
  searchType: {
    type: String,
    required: true
  },
  searchData: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['toChatMessage'])
//搜索框value
const inputValue = ref('');
//控制搜索结果展示
const isShowResultContent = ref(false)
//搜索本地记录
const searchHistory = useLocalStorage('search_hisory', [])
console.log('searchHistorysearchHistorysearchHistory', toRaw(searchHistory.value))
//点击非搜索部分关闭页面
const searchBox = ref(null)
onClickOutside(searchBox, () => (isShowResultContent.value = false));
//筛选出来的搜索建议
const searchSuggest = ref([])
//搜索相匹配的值
const querySearch = () => {
  if (inputValue.value) {
    //搜索会话 conversation
    //todo 后续计划在会话数据结构中加keywords字段 通过keywords字段实现更多条件的搜索
    if (props.searchType === 'conversation') {
      const resultList = _.filter(props.searchData, (o) => o.conversationInfo.name.includes(inputValue.value))
      searchSuggest.value = resultList
    }
    //搜索联系人 contacts

  }
  //监听输入框为空字符串的时候置空搜索建议
  watch(inputValue, (newVal) => {
    if (newVal === '') searchSuggest.value = []
  })
}
//点击历史记录通知对应类型的不同的组件跳转 例如 通知会话部分 通知联系人部分
const clickHistoryItem = (historyItem) => {
  if (props.searchType === 'conversation') {
    emitConversation(0, historyItem)
  }
  if (props.searchType === 'contacts') {
    console.log('.....')
  }
}
//选中则通知会话组件跳转
const emitConversation = (fromType, item) => {
  console.log('>>>>>>fromType,item', fromType, item)
  // fromType 0 为来自历史 1 为来自搜索
  if (fromType === 0) {
    searchHistory.value.length > 0 && searchHistory.value.forEach((v, index) => {
      if (item.value === v.value) {
        console.log('>> searchHistory.value[index]>>>', searchHistory.value[index])
        searchHistory.value.splice(index, 1)
        searchHistory.value.unshift(item)
      }
    })
    emit('toChatMessage', item.value, item.chatType)
  }
  if (fromType === 1) {
    const searchItem = { label: item.conversationInfo.name, value: item.conversationKey, chatType: item.conversationType }
    const _rawSearchHistory = _.cloneDeep(toRaw(searchHistory.value))
    console.log('searchHistory', _rawSearchHistory)
    if (_rawSearchHistory.length === 0 || _rawSearchHistory === null) {
      console.log('>>>>>>_rawSearchHistory为空是新建一条')
      searchHistory.value.unshift(searchItem)
    }
    if (_rawSearchHistory.length > 0) {
      console.log('>>>>>>_rawSearchHistory不为空时开始筛选')
      let _index = _rawSearchHistory.findIndex((v) => {
        return v.value === item.conversationKey
      })
      if (_index === -1) {
        searchHistory.value.unshift(searchItem)
      } else {
        searchHistory.value.splice(_index, 1)
        searchHistory.value.unshift(searchItem)
      }

      console.log(_index)

    }
    emit('toChatMessage', item.conversationKey, item.conversationType)
  }
  inputValue.value = ''
  searchSuggest.value = []
  isShowResultContent.value = false
}

</script>
<template>
  <div class="search_box" ref="searchBox">
    <div>
      <el-input v-model.trim="inputValue" placeholder="搜索" @focus="isShowResultContent = true"
        @clear="isShowResultContent = false" @input="querySearch" :prefix-icon="Search" clearable />
    </div>

    <div v-if="isShowResultContent" ref="resultContent" class="resultContent">
      <div class="search_history" v-if="inputValue.length <= 0 && searchHistory">
        <div class="title search_history_title">
          <span>搜索历史</span>
          <span class="clear_search_history" @click="searchHistory = null">清空</span>
        </div>
        <ul class="search_history_item">
          <li v-for="(item, index) in searchHistory" :key="item.label + index" @click="clickHistoryItem(item)">
            <span>{{ item.label ? item.label : item.value }}</span>
          </li>
        </ul>
      </div>
      <div v-if="searchType === 'conversation'">
        <div v-for="(item, index) in searchSuggest" :key="index">
          <div class="title" v-if="item.conversationType === CHAT_TYPE.SINGLE">
            联系人
          </div>
          <div class="title" v-if="item.conversationType === CHAT_TYPE.GROUP">
            群组
          </div>
          <div class="search_result_item" @click="emitConversation(1, item)">
            <div class="item_body item_left">
              <div class="session_other_avatar">
                <el-avatar :src="item.conversationInfo.avatarUrl"></el-avatar>
              </div>
            </div>
            <div class="item_body item_main">
              <div class="name">{{ item.conversationInfo.name }}</div>
              <div class="last_msg_body">{{ item.fromInfo.fromId }}：{{ item.latestMessage.msg }}
              </div>
            </div>
            <div class="item_body item_right">
              <span class="time">{{ dateFormater('MM/DD/HH:mm', item.latestSendTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-if="inputValue.length > 0 && searchSuggest.length <= 0" :image-size="200" description="没有找到匹配结果" />
    </div>
  </div>
</template>
<style lang="scss" scoped>
.search_box {
  width: 100%;
  height: 60px;
  background: #F8F8F8;
  padding: 14px 20px;
  box-sizing: border-box;
}

.resultContent {
  position: absolute;
  top: 60px;
  left: 0;
  width: 100%;
  height: calc(100% - 60px);
  background-color: #EDEDED;
  z-index: 888;
  overflow-y: auto;

  .search_history {
    .search_history_item {
      width: 100%;
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 400;
      font-size: 12px;
      line-height: 17px;
      letter-spacing: 0.669643px;
      color: #000000;

      li {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        padding: 0 15px;
        background: #FFF;
        margin: 1px 0;
        height: 32px;
        transition: all .5s;
        cursor: pointer;

        &:hover {
          background: #E5E5E5;
        }

      }
    }
  }

  .title {
    height: 32px;
    line-height: 32px;
    padding: 0 15px;
    background: #f2f2f2;
    font-weight: 400;
    font-size: 12px;
    letter-spacing: 0.342857px;
    color: #333333;
  }

  .search_history_title {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    .clear_search_history:hover {
      color: #00A0FB;
      cursor: pointer;
    }
  }

  .search_result_item {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    height: 66px;
    background: #FFF;
    padding: 0 14px;
    cursor: pointer;

    .item_left {
      padding: 0;
      margin-right: 11px;
    }

    .item_main {
      width: 25%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: space-around;
      height: 40px;
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 500;
      font-size: 14px;


      .last_msg_body {
        max-width: 100px;
        height: 17px;
        font-family: 'PingFang SC';
        font-style: normal;
        font-weight: 400;
        font-size: 12px;
        line-height: 17px;
        letter-spacing: 0.3px;
        color: #A3A3A3;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

      }
    }

    .time {
      position: absolute;
      right: 15px;
      top: 13px;
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 400;
      font-size: 10px;
      line-height: 14px;
      letter-spacing: 0.25px;
      color: #A3A3A3;
    }


  }
}
</style>
