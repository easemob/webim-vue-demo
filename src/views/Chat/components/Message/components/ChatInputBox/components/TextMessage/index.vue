<script setup>
import { ref, toRefs, computed, onMounted, onUpdated } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { MENTION_ALL } from '@/constant';
import { MESSAGE_TYPE, CHAT_TYPE } from '@/IM/constant';
import { useGetUserMapInfo, useUserInfoExt } from '@/hooks';
import store from '@/store';
import { handleSDKErrorNotifi } from '@/utils/handleSomeData';
//vue at
import VueAt from 'vue-at/dist/vue-at-textarea'; // for textarea
import { EMClient } from '@/IM';
const props = defineProps({
  chatType: {
    type: String,
    default: CHAT_TYPE.SINGLE,
    required: true,
  },
  targetId: {
    type: String,
    default: '',
    required: true,
  },
});
const { chatType, targetId } = toRefs(props);
const emit = defineEmits([
  'getImageFileFromClipboard',
  'getMessageQuoteContent',
  'clearQuoteContent',
]);
const editable = ref(null);
onMounted(() => {
  editable.value.focus();
});
onUpdated(() => {
  editable.value.focus();
});
/** /
 * 文本消息相关
 * 包含 @、emoji、引用功能
 */
const { getUserDisplayNameById } = useGetUserMapInfo();
//AT 逻辑
const atMembersList = computed(() => {
  const members = [{ text: MENTION_ALL.TEXT, value: MENTION_ALL.VALUE }];
  const groupId = targetId.value;
  //TODO text部分应为获取群组成员的自定义属性，待后续增加可设置自定在群组当中的自定义属性。
  if (groupId) {
    const sourceMembers =
      store.getters.getGroupMembersMap.get(groupId) ||
      store.dispatch('fetchGroupsMemberFromServer', groupId) ||
      [];
    sourceMembers.length &&
      sourceMembers.forEach((item) => {
        if (item.owner !== EMClient.user && item.member !== EMClient.user) {
          members.push({
            text: getUserDisplayNameById(item.owner || item.member, groupId),
            value: item.owner || item.member,
          });
        }
      });
  }
  return members;
});

const isAtAll = ref(false);
const atMembers = ref([]);
//输入框插入@事件
const onInsert = (target) => {
  // if (!) return false
  if (_.map(atMembers.value, 'value').includes(target.value)) return false;
  if (target.value === MENTION_ALL.VALUE) {
    return (isAtAll.value = true);
  } else {
    atMembers.value.push({ ...target });
  }
};
//校验消息内容中是否包含要@的成员
const checkAtMembers = (text) => {
  if (!text) {
    return false;
  }
  //判断是否文本中是否有@ALL，没有则直接设置为false
  const patternAtAll = new RegExp(`@${MENTION_ALL.TEXT}`);

  if (isAtAll.value && !patternAtAll.test(text)) {
    isAtAll.value = false;
  }
  if (atMembers.value.length !== 0) {
    //循环AT成员数组通过匹配文本内容判断是否存在已经移除@成员
    _.map(atMembers.value, 'text').forEach((item, index) => {
      const pattern = new RegExp(`@${item}`);
      const result = pattern.test(text);
      if (!result) {
        //不包含则从@列表中移除该成员
        atMembers.value.splice(index, 1);
      }
    });
  }
};
//emojis框展开
const isShowEmojisBox = ref(false);
const emojisBox = ref(null);
onClickOutside(emojisBox, () => {
  isShowEmojisBox.value = false;
});
//新增一个emoji
const onAddOneEmoji = (emoji) => {
  textContent.value = textContent.value + emoji;
};
//消息引用
const messageQuoteRef = ref(null);
const handleQuoteMessage = (msgBody) => {
  messageQuoteRef.value && messageQuoteRef.value.setQuoteContent(msgBody);
};
//监听键盘按下事件，如果为enter键则发送文本内容,shift+enter则换行。
const onTextInputKeyDown = (event) => {
  if (event.keyCode === 13 && !event.shiftKey) {
    event.preventDefault();
    // 执行发送操作
    sendTextMessage();
  } else if (event.keyCode === 13 && event.shiftKey) {
    // 换行操作
    insertNewLine();
  }
};
//换行操作
const insertNewLine = () => (textContent.value += '\n');
//发送文本内容
const textContent = ref('');
const { setUserInfoExt } = useUserInfoExt();
const sendTextMessage = _.debounce(async () => {
  //如果输入框全部为空格同样拒绝发送
  if (textContent.value.match(/^\s*$/)) return;
  checkAtMembers(textContent.value);
  const msgOptions = {
    type: MESSAGE_TYPE.TEXT,
    from: EMClient.user,
    to: targetId.value,
    chatType: chatType.value,
    msg: textContent.value,
    ext: {
      em_at_list: isAtAll.value
        ? MENTION_ALL.VALUE
        : _.map(atMembers.value, 'value'),
    },
  };
  //在消息体内携带该用户的昵称头像信息
  setUserInfoExt(msgOptions);
  //引用消息处理
  const callback = (data) => {
    if (Object.values(data).some((item) => item !== '')) {
      msgOptions.ext.msgQuote = Object.assign({}, { ...data });
      emit('clearQuoteContent');
    }
  };
  emit('getMessageQuoteContent', callback);
  textContent.value = '';
  try {
    const msg = EMClient.Message.create(msgOptions);
    const { message } = await EMClient.send(msg);
    console.log('message', message);
    await store.dispatch('senedShowTypeMessage', message);
  } catch (error) {
    console.error('发送文本消息失败', error);
    handleSDKErrorNotifi(error.type, error.message);
  } finally {
    isAtAll.value = false;
    atMembers.value = [];
  }
}, 50);

/* 监听输出面板粘贴事件 */
const dispatchPasteEvent = (event) => {
  const items = (event.clipboardData || window.clipboardData).items;
  const isImage = Array.from(items).some(
    (item) => item.kind === 'file' && item.type.startsWith('image/'),
  );
  if (isImage) {
    console.log('粘贴内容是图片');
    emit('getImageFileFromClipboard', items);
  } else {
    console.log('粘贴内容不是图片');
  }
};
const onEditMessage = (msg) => {
  textContent.value = msg;
};
defineExpose({
  onAddOneEmoji,
  onEditMessage,
  handleQuoteMessage,
});
</script>
<template>
  <template v-if="chatType === CHAT_TYPE.SINGLE">
    <textarea
      ref="editable"
      v-model="textContent"
      class="chat_content_editable"
      spellcheck="false"
      contenteditable="true"
      placeholder="请输入消息内容..."
      @keydown="onTextInputKeyDown"
      @paste="dispatchPasteEvent"
    >
    </textarea>
  </template>
  <template v-else-if="chatType === CHAT_TYPE.GROUP">
    <vue-at :members="atMembersList" name-key="text" @insert="onInsert">
      <textarea
        ref="editable"
        v-model="textContent"
        class="chat_content_editable"
        spellcheck="false"
        contenteditable="true"
        placeholder="请输入消息内容..."
        @keydown="onTextInputKeyDown"
        @paste="dispatchPasteEvent"
      >
      </textarea>
    </vue-at>
  </template>

  <el-button
    :class="[textContent === '' ? 'no_content_send_btn' : 'chat_send_btn']"
    type="primary"
    @click="sendTextMessage"
    >发送</el-button
  >
</template>

<style lang="scss" scoped>
.chat_content_editable {
  font-family: 'PingFang SC';
  width: 100%;
  box-sizing: border-box;
  min-height: 100px;
  border: none;
  background: none;
  letter-spacing: 0.5px;
  resize: none;
  padding: 10px 20px;
  font-size: 14px;
  caret-color: #2454ff;
}
.no_content_send_btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 80px;
  opacity: 0.5;
}

.chat_send_btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 80px;
}
</style>
