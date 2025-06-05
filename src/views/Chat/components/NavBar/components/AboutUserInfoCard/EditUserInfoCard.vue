<script setup>
import { ref, toRaw, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Close, EditPen, Phone, Message, Flag } from '@element-plus/icons-vue';
import _ from 'lodash';
/* store */
import store from '@/store';
/* 头像相关 */
import defaultAvatar from '@/assets/images/loginIcon.png';
const avatarBaseUrl =
  'https://download-sdk.oss-cn-beijing.aliyuncs.com/downloads/IMDemo/avatar/';
/* 性别相关 */
const bodyIcon = require('@/assets/images/gender/Group76.png');
const girlIcon = require('@/assets/images/gender/Group77.png');
const genderIcon = {
  1: bodyIcon,
  2: girlIcon,
};
const loginUserId = computed(() => {
  return store.state.loginUserInfo.hxId;
});
const SEX_TEXT = {
  0: '保密',
  1: '男',
  2: '女',
};
/* 用户属性功能相关 */
const isEdit = ref(false);
const dialogVisible = ref(false);
const userInfos = ref({
  nickname: '',
  avatarurl: '',
  mail: '123@qq.com',
  phone: '16888888888',
  gender: '0', //0 未知 1男 2女
  birth: '2022-02-14',
  sign: '能用JavaScript解决的问题，最后都会用JavaScript实现！',
});
//获取store中的从SDK接口返回的用户属性
const userInfosData = computed(() => {
  return store.state.loginUserInfo;
});

// onMounted(() => {
//
//     _.merge(userInfos.value, userInfosData.value)
// })
const setUserInfos = () => {
  _.merge(userInfos.value, userInfosData.value);
};
//点击待选的用户头像
const chooseAvatar = (avatarNum) => {
  const fullAvatarUrl = `${avatarBaseUrl}Image${avatarNum}.png`;
  userInfos.value.avatarurl = fullAvatarUrl;
};
//完成保存其修改后的用户属性值
const saveEditedUserInfos = async () => {
  //比较源对象与v-model绑定的值是否相同，相同则不执行提交。
  if (_.isEqual(toRaw(userInfos.value), toRaw(userInfosData.value)))
    return (isEdit.value = false);
  const params = toRaw(userInfos.value);
  try {
    await store.dispatch('updateMyUserInfo', params);
    ElMessage({
      type: 'success',
      message: '修改成功~',
    });
  } catch (error) {
    ElMessage({
      type: 'error',
      message: '修改失败，请稍后重试~',
    });
  }

  return (isEdit.value = false);
};
//diglog关闭初始化
const initUserInfosDiglog = () => {
  isEdit.value && (isEdit.value = false);
  //重新将store中的值再赋给userinfos
  _.merge(userInfos.value, userInfosData.value);
};
defineExpose({
  dialogVisible,
});
</script>
<template>
  <el-dialog
    class="edit_userinfo_diglog"
    v-model="dialogVisible"
    width="366px"
    :show-close="false"
    :destroy-on-close="true"
    @close="initUserInfosDiglog"
    @open="setUserInfos"
  >
    <template #header>
      <div class="infor_header">
        <el-icon class="el_icon_right" @click="dialogVisible = false">
          <Close />
        </el-icon>
      </div>
    </template>
    <template #default>
      <div class="infor_main">
        <el-avatar
          class="infor_avatar"
          :size="80"
          :src="userInfos.avatarurl ? userInfos.avatarurl : defaultAvatar"
          fit="fit"
        >
        </el-avatar>
        <div class="infor_edit_text">
          <p v-if="!isEdit" @click="isEdit = true">编辑</p>
          <p v-else @click="saveEditedUserInfos">完成</p>
        </div>
        <div class="infor_content_box">
          <div class="infor_content_header">
            <div class="infor_name">
              <span>{{ userInfos.nickname || '暂无昵称' }}</span>
              <span class="infor_sex" v-if="genderIcon[userInfos.gender]">
                <img :src="genderIcon[userInfos.gender]" />
              </span>
            </div>
            <div class="infor_sign">
              <p>{{ userInfos.sign || '无个性，不签名！' }}</p>
            </div>
            <div v-if="isEdit" class="infor_choose_avatar">
              <template v-for="avatarNum in 9" :key="avatarNum">
                <el-avatar
                  @click="chooseAvatar(avatarNum)"
                  shape="circle"
                  :size="25"
                  :src="`${avatarBaseUrl}Image${avatarNum}.png`"
                />
              </template>
            </div>
          </div>
          <div class="infor_content_main">
            <div class="infor_content_main_item">
              <span class="label">姓名</span>
              <span class="content" v-if="!isEdit">{{
                userInfos.nickname || '暂无昵称'
              }}</span>
              <span class="content" v-else>
                <el-input
                  class="input_style"
                  v-model="userInfos.nickname"
                  placeholder="请输入您的昵称~"
                  :maxlength="10"
                  show-word-limit
                  clearable
                  size="small"
                  :prefix-icon="EditPen"
                />
              </span>
            </div>
            <div class="infor_content_main_item">
              <span class="label">ID</span>
              <span class="content">{{ loginUserId }}</span>
            </div>
            <div class="infor_content_main_item">
              <span class="label">生日</span>
              <span class="content" v-if="!isEdit">{{
                userInfos.birth || '未知'
              }}</span>
              <span class="content" v-else>
                <el-date-picker
                  class="input_style"
                  v-model="userInfos.birth"
                  type="date"
                  placeholder="选择你的生日"
                  size="small"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </span>
            </div>
            <div class="infor_content_main_item">
              <span class="label">性别</span>
              <span class="content" v-if="!isEdit">{{
                SEX_TEXT[userInfos.gender] || '保密'
              }}</span>
              <span class="content" v-else>
                <el-radio-group v-model="userInfos.gender" size="small">
                  <el-radio value="0">保密</el-radio>
                  <el-radio value="1">男</el-radio>
                  <el-radio value="2">女</el-radio>
                </el-radio-group>
              </span>
            </div>
            <div class="infor_content_main_item">
              <span class="label">电话</span>
              <span class="content" v-if="!isEdit">{{
                userInfos.phone || '未知'
              }}</span>
              <span class="content" v-else>
                <el-input
                  class="input_style"
                  v-model="userInfos.phone"
                  placeholder="请输入您的电话~"
                  :maxlength="20"
                  show-word-limit
                  clearable
                  size="small"
                  :prefix-icon="Phone"
                />
              </span>
            </div>
            <div class="infor_content_main_item">
              <span class="label">邮箱</span>
              <span class="content" v-if="!isEdit">{{
                userInfos.mail || '未知'
              }}</span>
              <span class="content" v-else>
                <el-input
                  class="input_style"
                  v-model="userInfos.mail"
                  placeholder="请输入您的邮箱~"
                  :maxlength="50"
                  clearable
                  size="small"
                  :prefix-icon="Message"
                />
              </span>
            </div>
            <!-- 编辑状态下展示签名内容 -->
            <div
              v-if="isEdit"
              class="infor_content_main_item infor_content_main_sign"
            >
              <span class="label">签名</span>
              <span
                class="content"
                v-if="!isEdit"
                style="white-space: break-word"
                >{{ userInfos.sign || '无个性，不签名！' }}</span
              >
              <span class="content" style="border: none" v-else>
                <el-input
                  class="textarea_style"
                  v-model="userInfos.sign"
                  type="textarea"
                  :row="2"
                  placeholder="请输入您的个性签名~"
                  :maxlength="40"
                  show-word-limit
                  clearable
                  size="small"
                  :prefix-icon="Flag"
                  resize="none"
                />
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<style>
.edit_userinfo_diglog {
  padding: 0;
}
</style>
<style lang="scss" scoped>
.infor_header {
  width: 100%;
  height: 138px;
  background-image: url('@/assets/header_bg.jpg');
  background-size: cover;
}

.infor_main {
  position: relative;

  .infor_avatar {
    position: absolute;
    left: 28px;
    top: -50px;
    border: none;
  }

  .infor_edit_text {
    text-align: right;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: #0091ff;

    p {
      cursor: pointer;
      margin-right: 20px;
      margin-top: 7px;
      transition: all 0.3s;

      &:active {
        color: #333;
      }
    }
  }

  .infor_content_box {
    margin-top: 24px;
    width: 100%;
    // height: 400px;
    padding: 0 42px 30px 42px;
    box-sizing: border-box;

    .infor_content_header {
      margin-bottom: 30px;

      .infor_name {
        display: flex;
        align-items: center;
        font-family: 'PingFang SC';
        font-style: normal;
        font-weight: 600;
        font-size: 16px;
        line-height: 22px;
        color: #333333;

        .infor_sex {
          margin-left: 5px;

          img {
            width: 15px;
            height: 15px;
          }
        }
      }

      .infor_sign {
        font-family: 'PingFang SC';
        font-style: normal;
        font-weight: 400;
        font-size: 11px;
        line-height: 18px;
        letter-spacing: 0.229412px;
        color: #a3a3a3;
      }

      .infor_choose_avatar {
        width: 100%;
        height: 35px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #a3a3a3;
        border-bottom: 1px solid #a3a3a3;
        cursor: pointer;
      }
    }

    .infor_content_main {
      width: 100%;

      .infor_content_main_item {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        margin: 20px 0;

        .label {
          display: inline-block;
          width: 15%;
          height: 24px;
          font-family: 'PingFang SC';
          font-style: normal;
          font-weight: 400;
          font-size: 13px;
          line-height: 24px;
          letter-spacing: 0.229412px;
          color: #a3a3a3;
        }

        .content {
          display: inline-block;
          width: 85%;
          // height: 24px;
          border-bottom: 1px solid var(--el-border-color);
          font-family: 'PingFang SC';
          font-style: normal;
          font-weight: 400;
          font-size: 13px;
          line-height: 24px;
          /* identical to box height, or 185% */

          letter-spacing: 0.229412px;

          color: #333333;
        }
      }
    }
  }
}

.el_icon_right {
  color: #fff;
  font-size: 20px;
  float: right;
  margin: 17px 21px 0 0;
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    transform: scale(1.2);
  }
}

:deep(.input_style) > .el-input__wrapper {
  border-radius: 5px;
  box-shadow: none;
}

:deep(.textarea_style) > .el-textarea__inner {
  border-radius: 5px;
  // box-shadow: none;
}
</style>
