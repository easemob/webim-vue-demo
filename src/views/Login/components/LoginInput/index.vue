<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElNotification } from 'element-plus';
import EaseIM from '@/IM/initwebsdk';
import { handleSDKErrorNotifi } from '@/utils/handleSomeData'
import { fetchUserLoginToken } from '@/api/login';
import { useStore } from 'vuex';
const store = useStore();
const loginValue = reactive({
  username: '',
  password: ''
})
const buttonLoding = ref(false);
//根据登陆初始化一部分状态
const loginState = computed(() => store.state.loginState);
watch(loginState, (newVal) => {
  if (newVal) {
    buttonLoding.value = false;
    loginValue.username = '';
    loginValue.password = '';
  }
});
const rules = reactive({
  username: [
    { required: true, message: '请输入登录ID', trigger: 'blur' },
    { min: 1, max: 20, message: '登陆ID>1,<20', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
  ],
})
//登陆接口调用
const loginIM = async () => {
  buttonLoding.value = true;
  /* SDK 登陆的方式 */
  // try {
  //   let { accessToken } = await EaseIM.conn.open({
  //     user: loginValue.username.toLowerCase(),
  //     pwd: loginValue.password.toLowerCase(),
  //   });
  //   window.localStorage.setItem(`EASEIM_loginUser`, JSON.stringify({ user: loginValue.username, accessToken: accessToken }))
  // } catch (error) {
  //   console.log('>>>>登陆失败', error);
  //   const { data: { extraInfo } } = error
  //   handleSDKErrorNotifi(error.type, extraInfo.errDesc);
  //   loginValue.username = '';
  //   loginValue.username = '';
  // }
  // finally {
  //   buttonLoding.value = false;
  // }
  /* 环信后台接口登陆（仅供环信线上demo使用！） */
  let params = {
    userId: loginValue.username.toLowerCase(),
    userPassword: loginValue.password.toLowerCase(),
  }
  try {
    //phoneNumber 暂时不支持用作user，后续支持手机号登陆
    let { phoneNumber, token } = await fetchUserLoginToken(params)
    console.log('>>>>>>登陆token获取成功', token);
    EaseIM.conn.open({
      user: loginValue.username.toLowerCase(),
      accessToken: token
    })
    window.localStorage.setItem(`EASEIM_loginUser`, JSON.stringify({ user: loginValue.username, accessToken: token }))
  } catch (error) {
    console.log('>>>>登陆失败', error);
    if (error.response.data) {
      const { code, errorInfo } = error.response.data
      handleSDKErrorNotifi(code, errorInfo)
    }
  }
  finally {
    buttonLoding.value = false;
  }

};

</script>

<template>
  <el-form :model="loginValue" :rules="rules">
    <el-form-item prop="username">
      <el-input class="login_input_style" v-model="loginValue.username" placeholder="请输入用户名" />
    </el-form-item>
    <el-form-item prop="password">
      <el-input class="login_input_style" v-model="loginValue.password" placeholder="请输入登录密码" />
    </el-form-item>
    <el-form-item>
      <div class="function_button_box">
        <el-button v-if="loginValue.username && loginValue.password" class="haveValueBtn" :loading="buttonLoding"
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
  font-size: 17px;
  padding: 0 10px;
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
    color: #F4F4F4;

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
    color: #FFFFFF;
    cursor: not-allowed;
  }
}
</style>