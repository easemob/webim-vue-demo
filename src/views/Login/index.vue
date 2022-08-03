<script setup>
import { ref, watch, computed } from 'vue';
import { ElNotification } from 'element-plus';
import EaseIM from '@/IM/initwebsdk';
import { useSDKErrorNotifi } from '@/hooks';
import { useStore } from 'vuex';
import CustomImConfig from '@/components/CustomImConfig';
const store = useStore();
//login图
const logo = require('@/assets/images/loginIcon.png');
// 登陆注册所用
const isRegister = ref(false);
const username = ref('hfp');
const password = ref('1');
const confirmPwd = ref('');
const buttonLoding = ref(false);
const loginIM = async () => {
  buttonLoding.value = true;
  let resultStatus = checkParams({ username, password });
  if (resultStatus) {
    try {
      let { accessToken } = await EaseIM.conn.open({
        user: username.value.toLowerCase(),
        pwd: password.value.toLowerCase(),
      });
      window.localStorage.setItem(`EASEIM_loginUser`, JSON.stringify({ user: username.value, accessToken: accessToken }))
    } catch (error) {
      console.log('>>>>登陆失败', error);
      const { data: { extraInfo } } = error
      useSDKErrorNotifi(error.type, extraInfo.errDesc);
      username.value = '';
      password.value = '';
    }
    finally {
      buttonLoding.value = false;
    }

  }
};
//根据登陆初始化一部分状态
const loginState = computed(() => store.state.loginState);
watch(loginState, (newVal) => {
  if (newVal) {
    buttonLoding.value = false;
    username.value = '';
    password.value = '';
  }
});
const registerIM = async () => {
  let resultStatus = checkParams({ username, password, confirmPwd });
  if (resultStatus) {
    console.log('>>>>>>开始注册');
    try {
      await EaseIM.conn.registerUser({
        username: username.value,
        password: password.value,
      });
      ElNotification({
        title: 'Easemob',
        message: '注册成功！',
        type: 'success',
      });
      username.value = '';
      password.value = '';
      confirmPwd.value = '';
      isRegister.value = false;
    } catch (error) {
      console.log('注册error', error);
      const errorMsg = error.data && JSON.parse(error.data);
      console.log('>>>>>>>>>errorMsg', errorMsg);

      errorMsg && useSDKErrorNotifi(error.type, errorMsg.error);
      username.value = '';
      password.value = '';
      confirmPwd.value = '';
    }
  }
};
const checkParams = (params) => {

  if (params['username'] && params['username'].value === '') {
    ElNotification({
      title: 'Easemob',
      message: '环信ID不可为空！',
      type: 'error',
    });
    buttonLoding.value = false;
    return false;
  }
  if (params['password'] && params['password'].value === '') {
    ElNotification({
      title: 'Easemob',
      message: '环信密码不可为空！',
      type: 'error',
    });
    buttonLoding.value = false;
    return false;
  }
  if (params['confirmPwd'] && params['confirmPwd'].value === '') {
    ElNotification({
      title: 'Easemob',
      message: '请再次确认密码！',
      type: 'error',
    });
    buttonLoding.value = false;
    return false;
  }
  if (params['password'] && params['confirmPwd']) {
    if (params['password'].value !== params['confirmPwd'].value) {
      ElNotification({
        title: 'Easemob',
        message: '两次密码输入不一致！',
        type: 'error',
      });
      buttonLoding.value = false;
      return false;
    }
  }
  return true;
};
const toEasemob = () => {
  const linkUrl = 'https://www.easemob.com/?utm_source=baidu-ppwx';
  window.open(linkUrl, 'Easemob');
};

//服务配置
const customImConfig = ref(null);
const showCustomImConfigModal = () => {
  customImConfig.value.centerDialogVisible = true
}

//SDK-Version
const IM_SDK_VERSION = EaseIM.conn.version
</script>
<template>
  <el-container class="app_container">
    <el-main class="login_box">
      <div>
        <el-row class="login_box_card out-drawer animate__animated animate__slideInLeft">
          <el-col>
            <img class="logo" :src="logo" @click="toEasemob" alt="" />
          </el-col>
          <el-col>
            <el-input class="login_input_style" v-model="username" placeholder="请输入用户名..." clearable key="loginUserId"
              maxlength="64" />
          </el-col>

          <el-col>
            <el-input class="login_input_style" v-model="password" type="password" placeholder="请输入密码..." show-password
              key="loginPwd" />
          </el-col>
          <el-col v-if="isRegister">
            <el-input class="login_input_style" v-model="confirmPwd" type="password" placeholder="请再次确认密码..."
              show-password />
          </el-col>
          <el-col>
            <div class="function_button_box">
              <el-button v-if="!isRegister" type="primary" round @click="loginIM" :loading="buttonLoding">登陆</el-button>
              <el-button v-else class="reister_button" type="primary" round @click="registerIM">注册</el-button>
            </div>
          </el-col>
          <el-col>
            <div class="function_button_extra">
              <el-link class="custom_config" @click="showCustomImConfigModal">服务器配置</el-link>
              <p class="login_text">
                <span class="login_text_isuserid" v-text="isRegister ? '没有账号?' : '已有账号？'"></span><span
                  class="login_text_tologin" v-text="isRegister ? '登陆' : '注册'" @click="isRegister = !isRegister"></span>
              </p>
            </div>

          </el-col>
        </el-row>
      </div>
    </el-main>
    <el-footer>
      <div class="copyright">Copyright © easemob Web IM SDK版本号：{{ IM_SDK_VERSION ? IM_SDK_VERSION : '4.x' }}</div>
    </el-footer>
    <CustomImConfig ref="customImConfig" />
  </el-container>
</template>

<style lang="scss" scoped>
.app_container {
  width: 100vw;
  height: 100vh;
  background: url('@/assets/images/web-demo-base.png');
  background-size: cover;

  .login_box {
    display: flex;
    justify-content: center;
    width: 100%;
    height: 800px;

    .login_box_card {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 800px;
      margin: 15% auto;
      border-radius: 5px;

      .logo {
        width: 100px;
        height: 100px;
        margin-bottom: 20px;
        transition: all 0.3s;

        &:hover {
          transform: scale(1.2);
        }
      }

      .login_input_style {
        margin: 10px 0;
        width: 400px;
        height: 50px;
        font-size: 17px;
        padding: 0 10px;
      }

      .function_button_box {
        margin-top: 10px;
        width: 400px;

        button {
          margin: 10px;
          width: 380px;
          height: 50px;
          background: linear-gradient(90deg, #04aef0 0%, #5a5dd0 100%);
          border: none;
          font-weight: 300;
          font-size: 17px;
          border-radius: 57px;

          &:active {
            background: linear-gradient(90deg, #0b83b2 0%, #363df4 100%);
          }

          &:hover {}

          // width: 100%;
        }
      }

      .function_button_extra {
        width: 400px;
        height: 35px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 10px;
      }

      .custom_config {
        margin-left: 20px;
        font-family: 'PingFang SC';
        font-style: normal;
        font-weight: 400;
        font-size: 12px;
        line-height: 17px;
        text-align: right;
        color: #FFF;
        cursor: pointer;
      }

      .login_text {
        font-family: 'PingFang SC';
        font-style: normal;
        font-weight: 400;
        font-size: 12px;
        line-height: 17px;
        text-align: right;

        .login_text_isuserid {
          display: inline-block;
          // width: 100px;
          color: #F9F9F9;
        }

        .login_text_tologin {
          margin-right: 20px;
          width: 80px;
          color: #05B5F1;
          cursor: pointer;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  }

  .copyright {
    width: 100%;
    height: 30px;
    font-size: 13px;
    color: #fff;
    line-height: 30px;
    text-align: center;
  }
}
</style>
