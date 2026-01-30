<script setup>
import { ref } from 'vue';
import { EMClient } from '@/IM';
import CustomImConfig from '@/views/Login/components/CustomImConfig';
import LoginInput from './components/LoginInput';
import RegisterInput from './components/RegisterInput';
import ResetPassword from './components/ResetPassword';
//login图
import logo from '@/assets/images/loginIcon.png';

// 登陆注册所用
const showComponent = ref(0);
const componType = {
  0: LoginInput,
  1: RegisterInput,
  2: ResetPassword,
};
const changeToLogin = () => {
  showComponent.value = 0;
};
const toEasemob = () => {
  const linkUrl = 'https://www.easemob.com/?utm_source=baidu-ppwx';
  window.open(linkUrl, 'Easemob');
};

//判断当前环境
const isProd = process.env.NODE_ENV === 'production'

//SDK-Version
const IM_SDK_VERSION = EMClient.version;

// 【隐藏功能】线上测试后门:点击版本号5次弹出自定义配置
let clickCount = 0;
const customImConfig = ref(null);
const onClickVersion = () => {
  clickCount++;
  if (clickCount >= 5) {
    customImConfig.value.centerDialogVisible = true;
    clickCount = 0; // 重置计数器
  }
};
</script>
<template>
  <el-container class="app_container">
    <el-main class="login_box">
      <div>
        <el-row class="login_box_card out-drawer animate__animated animate__slideInLeft">
          <el-col>
            <img class="logo" :src="logo" @click="toEasemob" alt="" />
          </el-col>
          <!-- <component :is="componType[showComponent]" @changeToLogin="changeToLogin"></component> -->
          <component :is="componType[0]" @changeToLogin="changeToLogin"></component>
          <el-col v-show="showComponent !== 2">
            <div class="function_button_extra">
              <!-- <p class="login_text">
                <span class="login_text_isuserid" v-show="showComponent === 0">没有账号？</span>
                <span class="login_text_isuserid" v-show="showComponent === 1">已有账号？</span>
                <span class="login_text_tologin" v-show="showComponent === 0" @click="showComponent = 1">注册</span>
                <span class="login_text_tologin" v-show="showComponent === 1" @click="showComponent = 0">登录</span>
              </p> -->
            </div>
          </el-col>
        </el-row>
      </div>
    </el-main>
    <el-footer>
      <div class="copyright">
        Copyright © easemob Web IM SDK版本号:<span @click="onClickVersion" style="cursor: pointer;">{{ IM_SDK_VERSION ? IM_SDK_VERSION : '4.x' }}</span>
      </div>
      <div v-if="!isProd" class="dev-tip">
        开发环境:请在 src/IM/config/index.js 中配置 AppKey
      </div>
    </el-footer>
    <!-- 隐藏功能:线上测试配置弹窗 -->
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
      width: 700px;
      margin: 15% auto;
      border-radius: 5px;

      .logo {
        width: 100px;
        height: 100px;
        margin-bottom: 36.97px;
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
        }
      }

      .function_button_extra {
        width: 400px;
        // height: 35px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 10px;
      }

      .custom_config,
      .reset_password {
        margin-left: 20px;
        font-family: 'PingFang SC';
        font-style: normal;
        font-weight: 400;
        font-size: 12px;
        line-height: 17px;
        text-align: right;
        color: #fff;
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
          color: #f9f9f9;
        }

        .login_text_tologin {
          margin-right: 20px;
          width: 80px;
          color: #05b5f1;
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
    line-height: 30px;
    text-align: center;
    mix-blend-mode: normal;
    opacity: 0.4;
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 17px;
    color: #ffffff;
  }

  .dev-tip {
    width: 100%;
    text-align: center;
    padding: 8px 0;
    font-size: 13px;
    color: #04aef0;
    background: rgba(4, 174, 240, 0.1);
    border-radius: 4px;
  }
}
</style>
