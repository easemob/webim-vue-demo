<script setup>
import { ref, reactive, watch, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useStorage } from '@vueuse/core';
import { EMClient } from '@/IM';
import { handleSDKErrorNotifi } from '@/utils/handleSomeData';
import { fetchUserLoginSmsCode, fetchUserLoginToken } from '@/api/login';
import { useStore } from 'vuex';
import { usePlayRing } from '@/hooks';
import EmLoginWithPasswordLogin from './emloginWithPasswordLogin.vue';
import { secret, PREFIX, SCENE_ID } from '@/private-config'
import { encryptAES } from '@/utils/encriptAES';
//判断当前是否为生产环境
const isProd = process.env.NODE_ENV === 'production'
const isDev = !isProd
const store = useStore();
const emits = defineEmits(['changeToLogin']);
const loginValue = reactive({
  phoneNumber: '',
  smsCode: '',
});
const buttonLoading = ref(false);
//根据登陆初始化一部分状态
const loginState = computed(() => store.state.loginState);
watch(loginState, (newVal) => {
  if (newVal) {
    buttonLoading.value = false;
    loginValue.phoneNumber = '';
    loginValue.smsCode = '';
  }
});
const rules = reactive({
  phoneNumber: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号',
      trigger: ['blur', 'change'],
    },
  ],
  smsCode: [
    {
      required: true,
      message: '请输入短信验证码',
      trigger: ['blur', 'change'],
    },
  ],
});
//登陆接口调用
const loginIM = async () => {
  const { clickRing } = usePlayRing();
  clickRing();
  buttonLoading.value = true;
  // SDK登录方式请参考emloginWithPasswordLogin.vue 组件
  // !环信后台接口登陆（仅供环信线上demo使用！）
  const params = {
    phoneNumber: loginValue.phoneNumber.toString(),
    smsCode: loginValue.smsCode.toString(),
  };
  try {
    const res = await fetchUserLoginToken(params);
    if (res?.code === 200) {
      EMClient.open({
        username: res.chatUserName.toLowerCase(),
        accessToken: res.token,
      });
      window.localStorage.setItem(
        'EASEIM_loginUser',
        JSON.stringify({
          user: res.chatUserName.toLowerCase(),
          accessToken: res.token,
        }),
      );
    }
  } catch (error) {
    if (error.response?.data) {
      const { code, errorInfo } = error.response.data;
      if (errorInfo.includes('does not exist.')) {
        ElMessage({
          center: true,
          message: `用户${loginValue.username}不存在！`,
          type: 'error',
        });
      } else {
        handleSDKErrorNotifi(code, errorInfo);
      }
    }
  } finally {
    buttonLoading.value = false;
  }
};
/* 短信验证码相关 */
const isSending = ref(false);
const handleSendCode = (sendStatus) => isSending.value = sendStatus;
const isSenedAuthCode = ref(false);
const authCodeNextCansendTime = ref(60);
onMounted(() => {
  if (window.initAliyunCaptcha && isProd) {
    window.initAliyunCaptcha({
      SceneId: SCENE_ID, // 场景ID。根据步骤二新建验证场景后，您可以在验证码场景列表，获取该场景的场景ID
      prefix: PREFIX, // 身份标。开通阿里云验证码2.0后，您可以在控制台概览页面的实例基本信息卡片区域，获取身份标
      mode: "popup", // 验证码模式。popup表示要集成的验证码模式为弹出式。无需修改
      element: "#captcha-element", // 页面上预留的渲染验证码的元素，与原代码中预留的页面元素保持一致。
      button: "#captcha-button", // 触发验证码弹窗的元素。button表示单击登录按钮后，触发captchaVerifyCallback函数。您可以根据实际使用的元素修改element的值
      captchaVerifyCallback: captchaVerifyCallback, // 业务请求(带验证码校验)回调函数，无需修改
      onBizResultCallback: onBizResultCallback, // 业务请求结果回调函数，无需修改
      getInstance: getInstance, // 绑定验证码实例函数，无需修改
      slideStyle: {
        width: 360,
        height: 40,
      }, // 滑块验证码样式，支持自定义宽度和高度，单位为px。其中，width最小值为320 px
      language: "cn", // 验证码语言类型，支持简体中文（cn）、繁体中文（tw）、英文（en）
    });
  }
})
// 验证通过后调用
const onBizResultCallback = (bizResult) => {
  handleSendCode(bizResult);
  //开启倒计时
  console.log('>>>>>bizResult', bizResult);
};
let captcha;
// 绑定验证码实例函数，无需修改
const getInstance = (instance) => {
  captcha = instance;
};
const captchaVerifyCallback = async (captchaVerifyParam) => {
  // 验证通过后调用
  const data = { captchaResult: false, bizResult: true };
  if (!captchaVerifyParam) {
    ElMessage.error("请先进行安全验证!");
    handleSendCode(false);
    return data;
  }
  //进行验证结果加密
  captchaVerifyParam = await encryptAES(captchaVerifyParam, secret)
  handleSendCode(true);
  data.captchaResult = true;
  await sendMessageAuthCode(captchaVerifyParam);
  return data;
};
onUnmounted(() => {
  // 必须删除相关元素，否则再次mount多次调用 initAliyunCaptcha 会导致多次回调 captchaVerifyCallback
  if (window.initAliyunCaptcha && isProd) {
    document.getElementById("aliyunCaptcha-mask")?.remove();
    document.getElementById("aliyunCaptcha-window-popup")?.remove();
  }
})
const sendMessageAuthCode = async (captchaVerifyParam) => {
  const phoneNumber = loginValue.phoneNumber;
  if (!captchaVerifyParam) {
    ElMessage.error("请先进行安全验证!");
    return;
  }
  const params = {
    phoneNumber: phoneNumber,
    captchaVerifyParam: captchaVerifyParam,
  }
  try {
    const res = await fetchUserLoginSmsCode({ ...params });
    if (res?.code === 200) {
      {
        ElMessage({
          type: 'success',
          message: '验证码获取成功！',
          center: true,
        })
        startCountDown();
        handleSendCode(true);
      }
    } else {
      handleSendCode(false);
    }
  } catch (error) {
    console.log('error.response.data?.error_description', error.response.status);
    if (error.response.status !== "200") {
      if (error.response.data?.error_description == "phone number illegal") {
        ElMessage.error({
          message: '请输入正确的手机号码',
          center: true,
          type: 'error'
        });
      } else if (
        error.response.data?.error_description ==
        "Please wait a moment while trying to send."
      ) {
        ElMessage.error({
          message: '操作过于频繁，请稍后再试',
          center: true,
          type: 'error'
        });
      } else if (
        error.response.data?.error_description.includes("exceed the limit") ||
        error.response.data?.error_description.includes("SMS verification code exceeds the limit") ||
        error.response.data?.error_description.includes("This request has reached api limit.")
      ) {
        ElMessage.error({
          message: '验证码获取已达上限，请明日再试', // 修改提示文案
          center: true,
          type: 'error'
        });
      } else {
        ElMessage.error({
          message: error.response.data?.errorInfo || error.response.data?.error_description || "验证码获取失败",
          center: true,
          type: 'error'
        });
      }
    } else {
      ElMessage.error({
        message: '验证码获取失败',
        center: true,
        type: 'error'
      });
    }
    handleSendCode(false);
  }

};
const startCountDown = () => {
  isSenedAuthCode.value = true;
  let timer = null;
  timer = setInterval(() => {
    if (
      authCodeNextCansendTime.value <= 60 &&
      authCodeNextCansendTime.value > 0
    ) {
      authCodeNextCansendTime.value--;
    } else {
      clearInterval(timer);
      timer = null;
      authCodeNextCansendTime.value = 60;
      isSenedAuthCode.value = false;
    }
  }, 1000);
};
const IM_IS_OPEN_CUSTOM_SERVER_CONFIG = useStorage(
  'IM_IS_OPEN_CUSTOM_SERVER_CONFIG',
  {},
);
</script>

<template>
  <EmLoginWithPasswordLogin v-if="IM_IS_OPEN_CUSTOM_SERVER_CONFIG || isDev" />
  <template v-else>
    <el-form :model="loginValue" :rules="rules">
      <el-form-item prop="phoneNumber">
        <el-input class="login_input_style" v-model="loginValue.phoneNumber" placeholder="手机号" clearable />
      </el-form-item>
      <el-form-item prop="smsCode">
        <el-input class="login_input_style" v-model="loginValue.smsCode" placeholder="请输入短信验证码">
          <template #append>
            <el-button id="captcha-button" type="primary" :disabled="loginValue.phoneNumber && isSenedAuthCode" v-text="isSenedAuthCode ? `${authCodeNextCansendTime}S` : '获取验证码'
              "></el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item>
        <div class="function_button_box">
          <el-button v-if="loginValue.phoneNumber && loginValue.smsCode" class="haveValueBtn" :loading="buttonLoading"
            @click="loginIM">登录</el-button>
          <el-button v-else class="notValueBtn">登录</el-button>
        </div>
      </el-form-item>
    </el-form>
  </template>
  <!-- 验证码渲染元素框 -->
  <div id="captcha-element" :style="{ 'display': isSending ? 'none' : 'initial' }"></div>
</template>

<style lang="scss" scoped>
.login_input_style {
  margin: 10px 0;
  width: 400px;
  height: 50px;
  padding: 0 16px;
}

:deep(.el-input__inner) {
  padding: 0 20px;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 1.75px;
  color: #3a3a3a;

  &::placeholder {
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    /* identical to box height */
    letter-spacing: 1.75px;
    color: #cccccc;
  }
}

:deep(.el-input__suffix-inner) {
  font-size: 20px;
  margin-right: 15px;
}

:deep(.el-form-item__error) {
  margin-left: 16px;
}

:deep(.el-input-group__append) {
  background: linear-gradient(90deg, #04aef0 0%, #5a5dd0 100%);
  width: 60px;
  color: #fff;
  border: none;
  font-weight: 400;

  button {
    font-weight: 300;
  }
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

.function_button_box {
  margin-top: 10px;
  width: 400px;

  button {
    margin: 10px;
    width: 380px;
    height: 50px;
    border-radius: 57px;
  }

  .haveValueBtn {
    background: linear-gradient(90deg, #04aef0 0%, #5a5dd0 100%);
    border: none;
    font-weight: 300;
    font-size: 17px;
    color: #f4f4f4;

    &:active {
      background: linear-gradient(90deg, #0b83b2 0%, #363df4 100%);
    }
  }

  .notValueBtn {
    border: none;
    font-weight: 300;
    font-size: 17px;
    background: #000000;
    mix-blend-mode: normal;
    opacity: 0.3;
    color: #ffffff;
    cursor: not-allowed;
  }
}
</style>
