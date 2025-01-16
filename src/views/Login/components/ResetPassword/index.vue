<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { handleSDKErrorNotifi } from '@/utils/handleSomeData';
import { createImageCode, fetchAuthCode } from '@/api/register';
import { requestModifyPwd, updateNewPasswrod } from '@/api/resetPassword';
/* emits */
const emits = defineEmits(['changeToLogin']);
//下一步
const nextStep = ref(1); //2为下一步
const resetPwdEl = ref(null);
const resetPasswordFrom = reactive({
  username: '',
  password: '',
  confirmPwd: '',
  phoneNumber: '',
  imageCode: '',
  smsCode: '',
});
/* rules */
const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入新密码！'));
  } else {
    if (resetPasswordFrom.confirmPwd !== '') {
      if (!resetPwdEl.value) return;
      resetPwdEl.value.validateField('confirmPwd', () => null);
    }
    callback();
  }
};
const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入您设定的新密码！'));
  } else if (value !== resetPasswordFrom.password) {
    callback(new Error('两次输入的密码不一样啊！'));
  } else {
    callback();
  }
};
const rules = reactive({
  username: [
    { required: true, message: '请输入注册ID', trigger: 'blur' },
    {
      min: 1,
      max: 20,
      message: '注册ID应>1,<20',
      trigger: ['blur', 'change'],
    },
    {
      pattern: /^\w+$/,
      message: '由数字、26个英文字母或者下划线组成的注册ID',
      trigger: ['blur', 'change'],
    },
  ],
  phoneNumber: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号',
      trigger: ['blur', 'change'],
    },
  ],
  imageCode: [
    {
      required: true,
      message: '请输入图片验证码',
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
  password: [{ validator: validatePass, trigger: ['blur'] }],
  confirmPwd: [{ validator: validatePass2, trigger: ['blur'] }],
});

/* 图片验证码相关 */
const imageCodeInfo = reactive({
  imgUrl: '',
  imageId: '',
  imageCode: '',
});

const changeImageCode = () => {
  sendImageCode();
};
//获取图片验证码
const sendImageCode = async () => {
  try {
    const { data } = await createImageCode();
    if (data.image_enabled === 'true') {
      imageCodeInfo.imgUrl = `${window.location.protocol}//a1.easemob.com/inside/app/image/${data.image_id}`;
      imageCodeInfo.imageId = data.image_id;
    }
  } catch (error) {
    ElMessage.error('图片验证码获取失败请稍后重试！');
  }
};
onMounted(() => {
  sendImageCode();
});

/* 短信验证码相关 */
const isSenedAuthCode = ref(false);
const authCodeNextCansendTime = ref(60);
const sendMessageAuthCode = async () => {
  const params = {
    phoneNumber: resetPasswordFrom.phoneNumber,
    imageId: imageCodeInfo.imageId,
    imageCode: resetPasswordFrom.imageCode,
  };
  try {
    await fetchAuthCode({ ...params });
    ElMessage.success('验证码已发送,请注意查收！');
    startCountDown();
  } catch (error) {
    if (error.response.data) {
      const { code, errorInfo } = error.response.data;
      handleSDKErrorNotifi(code, errorInfo);
    }
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
/* 重置密码第一步 */
const resetPwdTheNext = (formEl) => {
  if (!formEl) return;
  formEl.validate(async (valid) => {
    if (valid) {
      const params = {
        userId: resetPasswordFrom.username,
        phoneNumber: resetPasswordFrom.phoneNumber,
        smsCode: resetPasswordFrom.smsCode,
      };
      try {
        const { code } = await requestModifyPwd({ ...params });
        if (code === 200) nextStep.value = 2;
      } catch (error) {
        if (error.response.data) {
          const { code, errorInfo } = error.response.data;
          handleSDKErrorNotifi(code, errorInfo);
        }
      }
    } else {
      return false;
    }
  });
};
/* 重置密码第二步 */
const submitNewPassword = (formEl) => {
  if (!formEl) return;
  formEl.validate(async (valid) => {
    if (valid) {
      const params = {
        userId: resetPasswordFrom.username,
        newPassword: resetPasswordFrom.password,
      };
      try {
        const { code } = await updateNewPasswrod({ ...params });
        if (code === 200) {
          ElMessage({
            type: 'success',
            message: '重置完成！登录试试吧😁',
            center: true,
          });
          emits('changeToLogin');
        }
      } catch (error) {
        ElMessage({
          type: 'error',
          message: '重置失败，请稍后重试！',
          center: true,
        });
      }
    } else {
      return false;
    }
  });
};
</script>
<template>
  <el-form ref="resetPwdEl" :model="resetPasswordFrom" :rules="rules">
    <template v-if="nextStep === 1">
      <el-form-item prop="username">
        <el-input
          class="login_input_style"
          v-model="resetPasswordFrom.username"
          placeholder="请输入用户ID"
          clearable
        />
      </el-form-item>
      <el-form-item prop="phoneNumber">
        <el-input
          class="login_input_style"
          v-model="resetPasswordFrom.phoneNumber"
          placeholder="请输入手机号"
          clearable
        >
          <template #prepend>+86</template>
        </el-input>
      </el-form-item>
      <el-form-item prop="imageCode">
        <el-input
          class="login_input_style"
          v-model="resetPasswordFrom.imageCode"
          placeholder="请输入右侧图片验证码"
        >
          <template #append>
            <el-image
              class="auth_code"
              :src="imageCodeInfo.imgUrl"
              @click="changeImageCode"
            >
              <template #placeholder>
                <span>加载中...</span>
              </template>
            </el-image>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item prop="smsCode">
        <el-input
          class="login_input_style"
          v-model="resetPasswordFrom.smsCode"
          placeholder="请输入短信验证码"
        >
          <template #append>
            <el-button
              type="primary"
              :disabled="isSenedAuthCode"
              @click="sendMessageAuthCode"
              v-text="
                isSenedAuthCode
                  ? `${authCodeNextCansendTime}s后重新获取`
                  : '获取验证码'
              "
            ></el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item>
        <div class="function_button_box">
          <el-button @click="resetPwdTheNext(resetPwdEl)">下一步</el-button>
        </div>
      </el-form-item>
    </template>
    <template v-if="nextStep === 2">
      <el-form-item prop="password">
        <el-input
          class="login_input_style"
          type="password"
          v-model="resetPasswordFrom.password"
          placeholder="请输入新密码"
          show-password
        />
      </el-form-item>
      <el-form-item prop="confirmPwd">
        <el-input
          class="login_input_style"
          type="password"
          v-model="resetPasswordFrom.confirmPwd"
          placeholder="请输入新密码"
          show-password
        />
      </el-form-item>
      <el-form-item>
        <div class="function_button_box">
          <el-button @click="submitNewPassword(resetPwdEl)">完成</el-button>
        </div>
      </el-form-item>
    </template>
    <el-form-item>
      <el-link class="back_login" @click="emits('changeToLogin')">返回</el-link>
    </el-form-item>
  </el-form>
</template>

<style lang="scss" scoped>
.function_button_box {
  margin-top: 10px;
  width: 400px;

  button {
    margin: 10px;
    width: 380px;
    height: 50px;
    border-radius: 57px;
    background: linear-gradient(90deg, #04aef0 0%, #5a5dd0 100%);
    border: none;
    font-weight: 300;
    font-size: 17px;
    color: #f4f4f4;

    &:active {
      background: linear-gradient(90deg, #0b83b2 0%, #363df4 100%);
    }
  }
}

.login_input_style {
  margin: 3px 0;
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
    text-transform: uppercase;
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

.auth_code {
  width: 80px;
  height: 40px;
}

.back_login {
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
</style>
