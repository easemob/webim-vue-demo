<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { EMClient } from '@/IM';
import { CHAT_TYPE } from '@/IM/constant';
import { useStore } from 'vuex';
import router from '@/router';
import { useRoute } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { useGetUserMapInfo } from '@/hooks';
/* 组件 */
// import UserStatus from '@/components/UserStatus'
import ContactsRemark from './ContactsRemark.vue';
/* store */
const store = useStore();
/* route */
const route = useRoute();

const {
  getContactsAvatarById,
  getGroupNameByGroupId,
  getGroupAvatarByGroupId,
} = useGetUserMapInfo();
const getContactsName = computed(() => {
  const id = route.query.id;
  const chatType = route.query.chatType;
  if (chatType === CHAT_TYPE.SINGLE) {
    return store.getters['UsersProfile/getDisplayContactsNickname'](id);
  }
  if (chatType === CHAT_TYPE.GROUP) {
    return getGroupNameByGroupId(id);
  }
});
const getContactsAvatar = computed(() => {
  const id = route.query.id;
  const chatType = route.query.chatType;
  if (chatType === CHAT_TYPE.SINGLE) {
    return getContactsAvatarById(id);
  }
  //群组暂使用默认群头像
  if (chatType === CHAT_TYPE.GROUP) {
    return getGroupAvatarByGroupId(id);
  }
});
/* 单人黑名单状态的处理 */
const blackStatus = ref(false);
const switchStatus = ref(false);
//判断单聊联系人是否在黑名单
const isInBlackList = computed(() => {
  const result = Array.from(store.state.Contacts.friendBlackList).includes(
    route.query.id,
  );
  return result;
});
//首次onMounted进行黑名单状态的初始赋值
onMounted(() => {
  blackStatus.value = isInBlackList.value;
});
//监听route变化重新赋值switch状态
watch(
  () => route.query.id,
  () => {
    if (route.query.chatType === CHAT_TYPE.SINGLE) {
      blackStatus.value = isInBlackList.value;
    }
  },
);
//执行加入或移出黑名单
const changeBlackStatus = async () => {
  switchStatus.value = true;
  if (blackStatus.value && route.query.id) {
    // 当前 removeUserFromBlackList 以及 addUsersToBlacklist 暂不支持promise 返回所以暂时获取不到其请求状态。
    EMClient.removeUserFromBlocklist({
      name: [route.query.id],
    });
    blackStatus.value = false;
    switchStatus.value = false;
  } else {
    EMClient.addUsersToBlocklist({
      name: [route.query.id],
    });
    blackStatus.value = true;
    switchStatus.value = false;
  }
  setTimeout(() => {
    store.dispatch('fetchBlackList');
  }, 500);
};

/* 单人删除好友 */
const delTheFriend = async () => {
  if (!route.query.id) return;
  const targetId = route.query.id;
  try {
    await EMClient.deleteContact(targetId);
    store.commit('DELETE_CONTACTS_FROM_MAP', targetId);
    router.push('/chat/contacts');
  } catch (error) {
    console.error('>>>>删除失败');
  }
};

/* 进入会话 */
const toChatMessage = () => {
  router.push({
    path: '/chat/conversation/message',
    query: {
      id: route.query.id,
      chatType: route.query.chatType,
    },
  });
};
</script>

<template>
  <div class="app_container">
    <el-header class="contactInfo_header">
      <el-page-header
        style="margin-top: 12px"
        :icon="ArrowLeft"
        @click="$router.back(-1)"
      />
      <el-divider />
    </el-header>
    <el-main class="contactInfo_main">
      <div class="contactInfo_main_card">
        <div class="contactInfo_box">
          <div class="avatar">
            <el-avatar class="avatar_img" :src="getContactsAvatar"> </el-avatar>
          </div>
          <div class="name">
            <p>
              {{ getContactsName }}
            </p>
          </div>
          <div class="contacts_id">
            <p>
              {{
                $route.query.chatType === CHAT_TYPE.GROUP
                  ? '群组ID：'
                  : '好友ID：'
              }}{{ $route.query.id }}
            </p>
          </div>
          <div class="func_box">
            <div
              class="single_func"
              v-if="$route.query.chatType === CHAT_TYPE.SINGLE"
            >
              <ContactsRemark :userId="$route.query.id">
                <el-divider />
              </ContactsRemark>
              <div class="add_black_list">
                <p>加入黑名单</p>
                <el-switch
                  v-model="blackStatus"
                  :loading="switchStatus"
                  :before-change="changeBlackStatus"
                />
              </div>
              <el-divider />
              <div class="del_friend">
                <el-popconfirm title="确认删除此好友?" @confirm="delTheFriend">
                  <template #reference>
                    <span>删除好友</span>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </div>
        </div>
        <div class="contaactInfo_btn">
          <el-button
            v-if="$route.query.chatType === CHAT_TYPE.SINGLE"
            type="primary"
            size="large"
            @click="toChatMessage"
            >发起会话
          </el-button>
          <el-button
            v-if="$route.query.chatType === CHAT_TYPE.GROUP"
            type="primary"
            size="large"
            @click="toChatMessage"
            >进入群聊
          </el-button>
          <!-- todo 待调整为新的获取群组列表接口，直接可以获取当前登陆id所在群组的权限然后添加上该功能 -->
          <!--   <el-button v-if="$route.query.chatType === CHAT_TYPE.GROUP" type="danger" size="large">解散群组
                        </el-button>
                        <el-button v-if="$route.query.chatType === CHAT_TYPE.GROUP" type="danger" size="large">退出群组
                        </el-button> -->
        </div>
      </div>
    </el-main>
  </div>
</template>

<style lang="scss" scoped>
.app_container {
  background: #f1f2f4;
  height: 100%;
  border-radius: 0 5px 5px 0;
  overflow: hidden;

  .contactInfo_header {
    display: flex;
    flex-direction: column;
    height: 60px;
    line-height: 60px;
  }

  .contactInfo_main {
    height: 100%;

    .contactInfo_main_card {
      width: 100%;
      height: 90%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin: 0 auto;
      border-radius: 5px;
      transition: all 0.5s;

      &:hover {
        background: #fff;
        box-shadow: 12px 12px 2px 1px rgba(125, 125, 126, 0.068);
      }

      .contactInfo_box {
        width: 80%;
        min-height: 500px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;

        .avatar > .avatar_img {
          width: 80px;
          height: 80px;
        }

        .name {
          text-align: center;
          margin-top: 15px;
          font-size: 22px;
        }
        .contacts_id {
          text-align: center;
          margin-top: 15px;
          font-size: 13px;
        }
        .func_box {
          width: 100%;

          .single_func {
            height: 100px;
            // background: #000;
            margin-top: 25px;
            cursor: pointer;

            .add_black_list {
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: space-between;
              font-size: 16px;
            }

            .del_friend {
              width: 100%;
              color: red;
              transition: all 0.3s;
            }
          }
        }
      }

      .contaactInfo_btn {
        width: 80%;
        text-align: center;
      }
    }
  }
}

//干掉原有样式里面的横线
:deep(.el-page-header__left)::after {
  width: 0px !important;
}
</style>
