<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { EMClient } from '@/IM';
import { CHAT_TYPE } from '@/IM/constant';
import { useStore } from 'vuex';
import router from '@/router';
import { useRoute } from 'vue-router';
import { ArrowLeft, MoreFilled } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useGetUserMapInfo } from '@/hooks';
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
const getUserRemark = computed(() => {
  if (route.query.chatType !== CHAT_TYPE.SINGLE) return '';
  return store.getters['UsersProfile/getDisplayRemark'](route.query.id);
});
/* 单人黑名单状态的处理 */
const blackStatus = ref(false);
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
  if (blackStatus.value && route.query.id) {
    EMClient.removeUserFromBlocklist({
      name: [route.query.id],
    });
    blackStatus.value = false;
  } else {
    EMClient.addUsersToBlocklist({
      name: [route.query.id],
    });
    blackStatus.value = true;
  }
  setTimeout(() => {
    store.dispatch('fetchBlackList');
  }, 500);
};

/* 黑名单操作弹窗 */
const handleBlackListAction = () => {
  const actionText = isInBlackList.value ? '移出黑名单' : '加入黑名单';
  ElMessageBox.confirm(`确认${actionText}该好友？`, '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    changeBlackStatus();
    ElMessage({
      message: `${actionText}成功`,
      type: 'success',
      center: true,
    });
  }).catch(() => {});
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
    ElMessage({
      message: '删除失败',
      type: 'error',
      center: true,
    });
  }
};

/* 删除好友弹窗 */
const handleDeleteFriend = () => {
  ElMessageBox.confirm(
    '删除好友后将清空聊天记录，确认删除？',
    '删除好友',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger',
    },
  ).then(() => {
    delTheFriend();
  }).catch(() => {});
};

/* 备注编辑弹窗 */
const remarkDialogVisible = ref(false);
const remarkInput = ref('');
const openRemarkDialog = () => {
  remarkInput.value =
    store.getters['UsersProfile/getDisplayRemark'](route.query.id) || '';
  remarkDialogVisible.value = true;
};
const saveRemark = async () => {
  if (remarkInput.value === store.getters['UsersProfile/getDisplayRemark'](route.query.id)) {
    remarkDialogVisible.value = false;
    return;
  }
  try {
    await store.dispatch('setContactsRemark', {
      userId: route.query.id,
      remark: remarkInput.value,
    });
    ElMessage({
      message: '备注保存成功',
      type: 'success',
      center: true,
    });
    remarkDialogVisible.value = false;
  } catch (error) {
    ElMessage({
      message: '保存失败',
      type: 'error',
      center: true,
    });
  }
};

/* 复制ID到剪贴板 */
const copyId = async () => {
  const id = route.query.id;
  if (!id) return;
  try {
    await navigator.clipboard.writeText(id);
    ElMessage({
      message: '已复制到剪贴板',
      type: 'success',
      center: true,
    });
  } catch (err) {
    ElMessage({
      message: '复制失败',
      type: 'error',
      center: true,
    });
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
      <div class="header_inner">
        <el-page-header :icon="ArrowLeft" @click="$router.back(-1)" />
        <el-dropdown
          v-if="$route.query.chatType === CHAT_TYPE.SINGLE"
          trigger="click"
        >
          <el-icon class="more-icon"><MoreFilled /></el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="openRemarkDialog">
                设置备注
              </el-dropdown-item>
              <el-dropdown-item @click="handleBlackListAction">
                {{ isInBlackList ? '移出黑名单' : '加入黑名单' }}
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleDeleteFriend">
                <span style="color: #f56c6c">删除好友</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
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
          <div v-if="$route.query.chatType === CHAT_TYPE.SINGLE" class="remark">
            <p>
              备注：{{ getUserRemark || '暂无备注' }}
            </p>
          </div>
          <div class="contacts_id" title="点击复制" @click="copyId">
            <p>
              {{
                $route.query.chatType === CHAT_TYPE.GROUP
                  ? '群组ID：'
                  : '好友ID：'
              }}{{ $route.query.id }}
            </p>
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
    <el-dialog v-model="remarkDialogVisible" title="设置备注" width="400px">
      <el-input
        v-model.trim="remarkInput"
        maxlength="15"
        placeholder="请输入备注名"
      />
      <template #footer>
        <el-button @click="remarkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRemark">保存</el-button>
      </template>
    </el-dialog>
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

    .header_inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      margin-top: 12px;
    }

    .more-icon {
      font-size: 20px;
      cursor: pointer;
      color: #606266;
      transition: color 0.3s;

      &:hover {
        color: #409eff;
      }
    }
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

      // &:hover {
      //   background: #fff;
      //   box-shadow: 12px 12px 2px 1px rgba(125, 125, 126, 0.068);
      // }

      .contactInfo_box {
        width: 80%;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        padding-bottom: 60px;

        .avatar > .avatar_img {
          width: 80px;
          height: 80px;
        }

        .name {
          text-align: center;
          margin-top: 15px;
          font-size: 22px;
          color: #333;
        }
        .remark {
          text-align: center;
          margin-top: 8px;
          font-size: 14px;
          color: #888;
        }
        .contacts_id {
          text-align: center;
          margin-top: 10px;
          font-size: 13px;
          color: #666;
          cursor: pointer;
          user-select: none;
          transition: color 0.3s;

          &:hover {
            color: #409eff;
          }
        }
        .func_box {
          width: 100%;
        }
      }

      .contaactInfo_btn {
        width: 80%;
        text-align: center;
        margin-top: auto;
        padding-bottom: 60px;
      }
    }
  }
}

//干掉原有样式里面的横线
:deep(.el-page-header__left)::after {
  width: 0px !important;
}
</style>
