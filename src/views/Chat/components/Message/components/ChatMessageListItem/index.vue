<script setup>
import { reactive, ref, computed, toRefs, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useClipboard, usePermission } from '@vueuse/core';
import { ElMessage, ElMessageBox } from 'element-plus';
import { EMClient } from '@/IM';
import { CHAT_TYPE, MESSAGE_TYPE } from '@/IM/constant';
import { CUSTOM_MSG_EVENT_TYPE, MESSAGE_STATUS_TYPE } from '@/constant';
import { useGetUserMapInfo } from '@/hooks';
import BenzAMRRecorder from 'benz-amr-recorder';
import fileSizeFormat from '@/utils/fileSizeFormat';
import dateFormat from '@/utils/dateFormater';
import { CUSTOM_MESSAGE_TYPE } from '@/constant';
import { handleSDKErrorNotifi } from '@/utils/handleSomeData';
/* utils */
import paseLink from '@/utils/paseLink';
/* 默认头像 */
import defaultAvatar from '@/assets/images/avatar/theme2x.png';
import ReportMessage from '../suit/reportMessage.vue';
import messageReadedIcon from '@/assets/messages/read@3x.png';
/* components */
import ModifyMessage from '../suit/modifyMessage.vue';
/* vuex store */
const store = useStore();
/* props */
const props = defineProps({
  messageData: {
    type: [Array, Object],
    default: () => [],
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
const { routeQueryData } = toRefs(props);
/* emits */
const emit = defineEmits([
  'scrollMessageList',
  'reEditMessage',
  'messageQuote',
]);
const { messageData } = toRefs(props);

/* login hxId */
const loginUserId = EMClient.user;

/* computed-- 消息来源是否为自己 */
const isMyself = computed(() => {
  return (msgBody) => {
    return msgBody.from === loginUserId;
  };
});
/* 获取消息id集合 */
const getMessageIdsCollectionMap = computed(() => {
  if (routeQueryData.value.id) {
    console.log(routeQueryData.value.id);
    return store.getters.getMessageIdsCollectionMap(routeQueryData.value.id);
  }
});
/* 消息已读未读逻辑 */
//判断消息已读未读状态
const msgReadStatus = computed(() => {
  return (msgBody) => {
    const { id } = msgBody;
    if (
      getMessageIdsCollectionMap.value &&
      getMessageIdsCollectionMap.value.has(id)
    ) {
      return getMessageIdsCollectionMap.value.get(id)[
        MESSAGE_STATUS_TYPE.READ_STATUS
      ];
    }
  };
});
/* 文本中是否包含link */
const isLink = computed(() => {
  return (msg) => {
    return paseLink(msg).isLink;
  };
});
/* 获取自己的用户信息 */
const loginUserInfo = computed(() => store.state.loginUserInfo);

/* 获取他人的用户信息 */
const { getUserDisplayNameById, getUserDisplayAvatarById } =
  useGetUserMapInfo();
//处理他人头像展示
const handleOtherAvatar = computed(() => {
  return (msgBody) => {
    return getUserDisplayAvatarById(msgBody.from);
  };
});
//处理聊天对方昵称展示
const handleNickName = computed(() => {
  const { chatType, id: groupId } = routeQueryData.value;
  return (msgBody) => {
    const userId = msgBody.from;
    if (chatType === CHAT_TYPE.SINGLE) {
      return getUserDisplayNameById(userId);
    }
    if (chatType === CHAT_TYPE.GROUP) {
      return getUserDisplayNameById(userId, groupId);
    }
  };
});
/* 处理时间显示间隔 */
const handleMsgTimeShow = computed(() => {
  const msgList = Array.from(messageData.value);
  return (time, index) => {
    if (index !== 0) {
      const lastTime = msgList[index - 1].time;
      return time - lastTime > 50000 ? dateFormat('MM/DD/HH:mm', time) : false;
    } else {
      return dateFormat('MM/DD/HH:mm', time);
    }
  };
});
//音频播放状态
const audioPlayStatus = reactive({
  isPlaying: false, //是否在播放中
  playMsgId: '', //在播放的音频消息id,
});
//开始播放
const startplayAudio = (msgBody) => {
  const armRec = new BenzAMRRecorder();
  const src = msgBody.url;
  audioPlayStatus.playMsgId = msgBody.id;

  //初始化音频源并调用播放
  armRec.initWithUrl(src).then(() => {
    if (!audioPlayStatus.isPlaying) {
      armRec.play();
    }
  });
  //播放开始监听
  armRec.onPlay(() => {
    audioPlayStatus.isPlaying = true;
    audioPlayStatus.playMsgId = msgBody.id;
  });
  //播放结束监听
  armRec.onStop(() => {
    audioPlayStatus.isPlaying = false;
    audioPlayStatus.playMsgId = '';
  });
};

//复制文本
// const permissionRead = usePermission('clipboard-read') //请求剪切板读的权限
// const permissionWrite = usePermission('clipboard-write') //请求剪切板写的权限
const { copy, copied, isSupported } = useClipboard(); //copy 复制方法 copied 是否已经复制 isSupported 是否支持剪切板
const copyTextMessages = (msg) => {
  copy(msg);
  if (copied) {
    ElMessage({
      type: 'success',
      message: '成功复制到剪切板',
      center: true,
    });
  }
};
//引用消息
const clickQuoteMsgId = ref('');
const clickQuoteMessage = (msgQuote) => {
  const { msgID } = msgQuote;
  nextTick(() => {
    const messageQuery = document.querySelectorAll('.messageList_box');
    const filterQuoteMsg =
      messageQuery.length &&
      Array.from(messageQuery).filter((node) => msgID === node.dataset.mid);
    if (filterQuoteMsg.length) {
      filterQuoteMsg[0].scrollIntoView();
      clickQuoteMsgId.value = msgID;
      setTimeout(() => {
        clickQuoteMsgId.value = '';
      }, 1000);
    } else {
      ElMessage({
        type: 'error',
        message: '无法定位到原消息',
        center: true,
      });
    }
  });
};
//撤回消息
const recallMessage = async ({ id, to, chatType }) => {
  const options = {
    mid: id,
    to: to,
    chatType: chatType,
  };
  try {
    await store.dispatch('recallMessage', options);
  } catch (error) {
    handleSDKErrorNotifi(error.type, error.message);
  }
};
//编辑消息
const modifyMessageRef = ref(null);
const showModifyMsgModal = (msgBody) => {
  nextTick(() => {
    modifyMessageRef.value.initModifyMessage(msgBody);
  });
};
//删除消息
const deleteMessage = async (msgBody) => {
  try {
    await ElMessageBox.confirm(
      '消息删除是从服务端删除，确认要删除吗？',
      '消息删除',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
    await store.dispatch('removeMessage', { ...msgBody });
    ElMessage({
      type: 'success',
      message: '消息已删除',
      center: true,
    });
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage({
        type: 'error',
        message: '删除失败',
        center: true,
      });
    }
  }
};
// 消息举报
const reportMessage = ref(null);
//举报消息
const informOnMessage = (msgBody) => {
  reportMessage.value.alertReportMsgModal(msgBody);
};
//父组件重新编辑方法
const reEdit = (msg) => emit('reEditMessage', msg);
//调用父组件引用消息
const onMsgQuote = (msg) => emit('messageQuote', msg);
</script>
<template>
  <div>
    <div
      class="messageList_box"
      v-for="(msgBody, index) in messageData"
      :key="msgBody.id"
      :data-mid="msgBody.id"
    >
      <!-- 普通消息气泡 -->
      <template
        v-if="!msgBody.isRecall && msgBody.type !== CUSTOM_MESSAGE_TYPE.INFORM"
      >
        <div
          class="message_box_item"
          :style="{
            flexDirection: isMyself(msgBody) ? 'row-reverse' : 'row',
          }"
        >
          <div class="message_item_time">
            {{ handleMsgTimeShow(msgBody.time, index) || '' }}
          </div>
          <el-avatar
            class="message_item_avatar"
            :src="
              isMyself(msgBody)
                ? loginUserInfo.avatarurl
                : handleOtherAvatar(msgBody)
            "
          >
          </el-avatar>
          <!-- 普通消息内容 -->
          <div class="message_box_card">
            <span v-show="!isMyself(msgBody)" class="message_box_nickname">{{
              handleNickName(msgBody)
            }}</span>
            <el-dropdown
              class="message_box_content"
              :class="[
                isMyself(msgBody)
                  ? 'message_box_content_mine'
                  : 'message_box_content_other',
                clickQuoteMsgId === msgBody.id && 'quote_msg_avtive',
              ]"
              trigger="contextmenu"
              placement="bottom-end"
            >
              <!-- 文本类型消息 -->
              <p
                style="padding: 10px; line-height: 20px"
                v-if="msgBody.type === MESSAGE_TYPE.TEXT"
              >
                <template v-if="!isLink(msgBody.msg)">
                  {{ msgBody.msg }}
                  <!-- 已编辑 -->
                  <sup
                    style="font-size: 7px; color: #707784"
                    v-show="msgBody?.modifiedInfo?.operationCount"
                    >（已编辑）</sup
                  >
                </template>
                <template v-else>
                  <span v-html="paseLink(msgBody.msg).msg"> </span
                ></template>
              </p>
              <!-- 图片类型消息 -->
              <el-image
                v-if="msgBody.type === MESSAGE_TYPE.IMAGE"
                style="border-radius: 5px"
                :src="msgBody.thumb"
                :preview-src-list="[msgBody.url]"
                :initial-index="1"
                fit="cover"
              />
              <!-- 视频类型消息 -->
              <video
                v-if="msgBody.type === MESSAGE_TYPE.VIDEO"
                :src="msgBody.url"
                :poster="msgBody.thumb"
                style="height: 100%; width: 100%; border-radius: 5px"
                controls
              ></video>
              <!-- 语音类型消息 -->
              <div
                :class="[
                  'message_box_content_audio',
                  isMyself(msgBody)
                    ? 'message_box_content_audio_mine'
                    : 'message_box_content_audio_other',
                ]"
                v-if="msgBody.type === MESSAGE_TYPE.AUDIO"
                @click="startplayAudio(msgBody)"
                :style="`width:${msgBody.length * 10}px`"
              >
                <span class="audio_length_text"> {{ msgBody.length }}′′ </span>
                <div
                  :class="[
                    isMyself(msgBody)
                      ? 'play_audio_icon_mine'
                      : 'play_audio_icon_other',
                    audioPlayStatus.playMsgId === msgBody.id &&
                      'start_play_audio',
                  ]"
                  style="background-size: 100% 100%"
                ></div>
              </div>
              <div v-if="msgBody.type === MESSAGE_TYPE.LOCAL">
                <p style="padding: 10px">[暂不支持位置消息展示]</p>
              </div>
              <!-- 文件类型消息 -->
              <div
                v-if="msgBody.type === MESSAGE_TYPE.FILE"
                class="message_box_content_file"
              >
                <div class="file_text_box">
                  <div class="file_name">
                    {{ msgBody.filename }}
                  </div>
                  <div class="file_size">
                    {{ fileSizeFormat(msgBody.file_length) }}
                  </div>
                  <a class="file_download" :href="msgBody.url" download
                    >点击下载</a
                  >
                </div>
                <span class="iconfont icon-wenjian"></span>
              </div>
              <!-- 自定义类型消息 -->
              <div
                v-if="msgBody.type === MESSAGE_TYPE.CUSTOM"
                class="message_box_content_custom"
              >
                <template
                  v-if="
                    msgBody.customEvent &&
                    CUSTOM_MSG_EVENT_TYPE[msgBody.customEvent]
                  "
                >
                  <div class="user_card">
                    <div class="user_card_main">
                      <!-- 头像 -->
                      <el-avatar
                        shape="circle"
                        :size="50"
                        :src="
                          (msgBody.customExts &&
                            msgBody.customExts.avatarurl) ||
                          msgBody.customExts.avatar ||
                          defaultAvatar
                        "
                        fit="cover"
                      />
                      <!-- 昵称 -->
                      <span class="nickname">{{
                        (msgBody.customExts && msgBody.customExts.nickname) ||
                        msgBody.customExts.uid
                      }}</span>
                    </div>
                    <el-divider
                      style="margin: 5px 0; border-top: 1px solid black"
                    />
                    <p style="font-size: 8px">个人名片</p>
                  </div>
                </template>
              </div>
              <!-- 右键点击弹起更多功能栏 -->
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-if="msgBody.type === MESSAGE_TYPE.TEXT && isSupported"
                    @click="copyTextMessages(msgBody.msg)"
                  >
                    复制
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="isMyself(msgBody)"
                    @click="recallMessage(msgBody)"
                  >
                    撤回
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="
                      msgBody.type === MESSAGE_TYPE.TEXT && isMyself(msgBody)
                    "
                    @click="showModifyMsgModal(msgBody)"
                  >
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item @click="onMsgQuote(msgBody)">
                    引用
                  </el-dropdown-item>
                  <el-dropdown-item @click="deleteMessage(msgBody)">
                    删除
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="!isMyself(msgBody)"
                    @click="informOnMessage(msgBody)"
                  >
                    举报
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <!-- 引用消息展示框 -->
            <div
              class="message_quote_box"
              v-if="msgBody?.ext?.msgQuote"
              @click="clickQuoteMessage(msgBody.ext.msgQuote)"
            >
              <p>
                {{ msgBody?.ext?.msgQuote?.msgSender }}：{{
                  msgBody?.ext?.msgQuote?.msgPreview
                }}
              </p>
            </div>
          </div>
          <!-- 消息状态展示 -->
          <div class="message_item_status">
            <img
              class="message_item_readed_icon"
              v-if="msgReadStatus(msgBody) && isMyself(msgBody)"
              :src="messageReadedIcon"
              title="消息已读"
            />
          </div>
        </div>
      </template>
      <!-- 撤回消息通知 -->
      <template v-if="msgBody.isRecall">
        <div class="recall_style">
          {{
            isMyself(msgBody)
              ? '你'
              : `${getUserDisplayNameById(msgBody.from)}`
          }}撤回了一条消息<span
            class="reEdit"
            v-show="isMyself(msgBody) && msgBody.type === MESSAGE_TYPE.TEXT"
            @click="reEdit(msgBody.msg)"
            >重新编辑</span
          >
        </div>
      </template>
      <!-- 灰色系统通知 -->
      <template v-if="msgBody.type === CUSTOM_MESSAGE_TYPE.INFORM">
        <div class="inform_style">
          <p>
            {{ msgBody.msg }}
          </p>
        </div>
      </template>
    </div>
    <ReportMessage ref="reportMessage" />
    <ModifyMessage ref="modifyMessageRef" />
  </div>
</template>

<style lang="scss" scoped>
@import './index.scss';
</style>
