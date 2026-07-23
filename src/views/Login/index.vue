<script setup>
import { ref, onMounted } from 'vue';
import { useStorage } from '@vueuse/core';
import CustomImConfig from '@/views/Login/components/CustomImConfig';
import {
  IM_ENVIRONMENTS,
  IM_ENV_OPTIONS,
} from '@/views/Login/components/CustomImConfig/imEnvPresets';
import LoginInput from './components/LoginInput';
import RegisterInput from './components/RegisterInput';
import ResetPassword from './components/ResetPassword';
import { ElMessage } from 'element-plus';
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

//服务配置
const isProd = process.env.NODE_ENV === 'production';
const isShowDevWarning = ref(false);
const isShowCustomServerConfig = useStorage(
  'IM_IS_OPEN_CUSTOM_SERVER_CONFIG',
  false,
);
const CUSTOM_CONFIG = JSON.parse(localStorage.getItem('webimConfig')) || {};
const selectedEnvironment = useStorage(
  'IM_LOGIN_ENVIRONMENT',
  CUSTOM_CONFIG.environment || IM_ENVIRONMENTS.NGI,
);
const customImConfig = ref(null);
onMounted(() => {
  if (!isProd && !CUSTOM_CONFIG?.appKey) {
    //非生产环境下，默认开启自定义服务器配置
    isShowCustomServerConfig.value = true;
    isShowDevWarning.value = true;
  }
});
const goToCustomImConfig = () => {
  isShowDevWarning.value = false;
  customImConfig.value.centerDialogVisible = true;
};
const handleEnvironmentSelect = (environment) => {
  selectedEnvironment.value = environment;
  isShowDevWarning.value = false;
  customImConfig.value.openWithEnvironment(environment);
};
let clickCount = 0; // 计数器，记录点击次数

const triggeredMethod = () => {
  isShowCustomServerConfig.value = !isShowCustomServerConfig.value;
  window.localStorage.setItem(
    'IM_IS_OPEN_CUSTOM_SERVER_CONFIG',
    isShowCustomServerConfig.value,
  );
};

const onClickVersion = () => {
  clickCount++; // 增加点击次数
  // 如果累计点击了5次，则触发方法
  if (clickCount >= 5) {
    triggeredMethod(); // 触发方法
    resetCounter(); // 重置计数器
    // 浏览器主动刷新
    window.location.reload();
  }
};

const resetCounter = () => (clickCount = 0);

//SDK-Version
const IM_SDK_VERSION = '5.0.0';
</script>
<template>
  <el-container class="app_container">
    <el-main class="login_box">
      <div>
        <el-row
          class="login_box_card out-drawer animate__animated animate__slideInLeft"
        >
          <el-col>
            <img class="logo" :src="logo" @click="toEasemob" alt="" />
          </el-col>
          <!-- <component :is="componType[showComponent]" @changeToLogin="changeToLogin"></component> -->
          <component
            :is="componType[0]"
            @changeToLogin="changeToLogin"
          ></component>
          <div class="environment_selector">
            <span class="environment_label">服务配置</span>
            <el-select
              v-model="selectedEnvironment"
              class="environment_select"
              placeholder="请选择服务配置"
              @change="handleEnvironmentSelect"
            >
              <el-option
                v-for="item in IM_ENV_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
                @click="handleEnvironmentSelect(item.value)"
              />
            </el-select>
          </div>
          <el-col v-show="showComponent !== 2">
            <div class="function_button_extra">
              <!-- <el-link class="reset_password" @click="showComponent = 2">重置密码</el-link> -->
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
        Copyright © easemob Web IM SDK版本号：<span @click="onClickVersion">
          {{ IM_SDK_VERSION ? IM_SDK_VERSION : '4.x' }}</span
        >
      </div>
    </el-footer>
    <el-dialog
      v-model="isShowDevWarning"
      title="配置提示"
      width="500"
      align-center
    >
      <span>当前为开发环境，如需登录点击服务器配置，配置对应appKey！</span>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="isShowDevWarning = false">已配置</el-button>
          <el-button type="primary" @click="goToCustomImConfig">
            去配置
          </el-button>
        </div>
      </template>
    </el-dialog>
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

      .environment_selector {
        width: 400px;
        margin: 2px 0 8px;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 0 10px;
        box-sizing: border-box;

        .environment_label {
          color: #ffffff;
          min-width: 76px;
          font-size: 16px;
          font-weight: 500;
          opacity: 0.92;
        }

        .environment_select {
          flex: 1;
        }

        :deep(.el-input__wrapper) {
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.92);
        }
      }

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
}
</style>
