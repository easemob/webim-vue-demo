<script setup>
/**
 * 此组件为使用SDK username & password 或者使用username 以及token实现登录。
 * index.vue是根据环信内部封装的通过短信验证码形式实现的username & token 实现的登录IM。
 * 如需要参考基础username & password 登录可参考该组件。
 */
import { ref, reactive, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { EMClient } from '@/IM';
import { useStore } from 'vuex';
import { usePlayRing } from '@/hooks';
const store = useStore();
const loginValue = reactive({
  username: '',
  password: '',
});
const buttonLoading = ref(false);
//根据登陆初始化一部分状态
const loginState = computed(() => store.state.loginState);
watch(loginState, (newVal) => {
  if (newVal) {
    buttonLoading.value = false;
    loginValue.username = '';
    loginValue.password = '';
  }
});
const rules = reactive({
  username: [{ required: true, message: '请输入环信ID', trigger: 'blur' }],
  password: [
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
  try {
    let { accessToken } = await EMClient.open({
      username: loginValue.username.toLowerCase(),
      password: loginValue.password.toLowerCase(),
    });
    window.localStorage.setItem(
      `EASEIM_loginUser`,
      JSON.stringify({
        user: loginValue.username,
        accessToken: accessToken,
      }),
    );
  } catch (error) {
    console.log(error);
    ElMessage({
      message: `${error?.data?.message}`,
      type: 'error',
      center: true,
    });
  } finally {
    buttonLoading.value = false;
  }
};
</script>
<template>
  <el-form :model="loginValue" :rules="rules">
    <el-form-item prop="phoneNumber">
      <el-input class="login_input_style" v-model="loginValue.username" placeholder="环信ID" clearable />
    </el-form-item>
    <el-form-item prop="smsCode">
      <el-input type="password" class="login_input_style" v-model="loginValue.password" placeholder="密码" clearable
        show-password />
    </el-form-item>
    <el-form-item>
      <div class="function_button_box">
        <el-button v-if="loginValue.username && loginValue.password" class="haveValueBtn" :loading="buttonLoading"
          @click="loginIM">登录</el-button>
        <el-button v-else class="notValueBtn">登录</el-button>
      </div>
    </el-form-item>
  </el-form>
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
