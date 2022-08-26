<template>
  <a-layout>
    <div class="reset">
      <div class="reset-panel">
        <div class="logo">Web IM</div>
        <a-form v-if="!isNext" :form="form">
          <a-form-item has-feedback>
            <a-input
              placeholder="用户名"
              v-decorator="[
                'username',
                {
                  rules: [
                    {
                      required: true,
                      message: 'Please input your username!',
                      whitespace: true
                    }
                  ]
                }
              ]"
            />
          </a-form-item>
          <a-form-item has-feedback>
            <a-input
              placeholder="手机号码"
              v-decorator="[
                'phone',
                {
                  rules: [
                    {
                      required: true,
                      message: 'Please input your phone number!'
                    }
                  ]
                }
              ]"
              style="width: 100%"
            >
              <a-select
                initialValue="86"
                slot="addonBefore"
                v-decorator="['prefix', { initialValue: '86' }]"
                style="width: 70px"
              >
                <a-select-option value="86">
                  +86
                </a-select-option>
              </a-select>
            </a-input>
          </a-form-item>
          <a-form-item>
            <a-row :gutter="8" style="margin: 0px;">
              <a-col :span="16">
                <a-input
                  placeholder="图片验证码"
                  v-decorator="[
                    'imageCode',
                    {
                      rules: [
                        {
                          required: true,
                          message: 'Please input the image code!'
                        }
                      ]
                    }
                  ]"
                />
              </a-col>
              <a-col :span="8" style="height: 40px;">
                <img
                  :src="imageUrl"
                  class="image-code"
                  v-on:click="getResetImageVerification"
                />
              </a-col>
            </a-row>
          </a-form-item>
          <a-form-item>
            <a-row :gutter="8">
              <a-col :span="14">
                <a-input
                  placeholder="短信验证码"
                  v-decorator="[
                    'captcha',
                    {
                      rules: [
                        {
                          required: true,
                          message: 'Please input the captcha you got!'
                        }
                      ]
                    }
                  ]"
                />
              </a-col>
              <a-col :span="10">
                <a-button v-on:click="getSmsCode" class="getSmsCodeBtn">{{
                  btnTxt
                }}</a-button>
              </a-col>
            </a-row>
          </a-form-item>
          <a-button
            type="primary"
            @click="checkUserInfo"
            class="reset-rigester-btn"
            >下一步</a-button
          >
          <p class="tip">
            已有账号?
            <span class="green" v-on:click="toLogin">去登录</span>
          </p>
        </a-form>

        <a-form v-else :form="confirmForm">
          <a-form-item has-feedback>
            <a-input
              placeholder="请输入密码"
              type="password"
              v-decorator="[
                'password',
                {
                  rules: [
                    {
                      required: true,
                      message: 'Please input your password!',
                      whitespace: true
                    }
                  ]
                }
              ]"
            />
          </a-form-item>

          <a-form-item has-feedback>
            <a-input
              placeholder="请在再次输入密码"
              type="password"
              v-decorator="[
                'newPassword',
                {
                  rules: [
                    {
                      required: true,
                      message: 'Please input your password!',
                      whitespace: true
                    }
                  ]
                }
              ]"
            />
          </a-form-item>

          <a-button
            type="primary"
            @click="resetPassword"
            class="reset-rigester-btn"
            >完成</a-button
          >
          <p class="tip">
            已有账号?
            <span class="green" v-on:click="toLogin">去登录</span>
          </p>
        </a-form>
      </div>
    </div>
  </a-layout>
</template>

<script>
import "./index.less";
import { mapActions } from "vuex";
import axios from "axios";
import { Message } from "ant-design-vue";
const domain = window.location.protocol + "//a1.easemob.com";
let times = 50;
let timer;
let ResetUserId = "";
export default {
  data() {
    return {
      username: "",
      password: "",
      btnTxt: "获取验证码",
      isNext: false
    };
  },
  beforeCreate() {
    this.form = this.$form.createForm(this, { name: "reset" });
    this.confirmForm = this.$form.createForm(this, { name: "confirm" });
  },
  mounted: function() {
    this.getResetImageVerification();
  },
  components: {},
  computed: {
    imageUrl() {
      return this.$store.state.resetpassword.imageUrl;
    },
    imageId() {
      return this.$store.state.resetpassword.imageId;
    }
  },
  methods: {
    ...mapActions(["getResetImageVerification"]),

    toLogin() {
      this.$router.push("/login");
    },

    checkUserInfo() {
      let self = this;
      this.form.validateFields(
        ["username", "phone", "imageCode", "captcha"],
        { force: true },
        (err, value) => {
          if (!err) {
            const { username, phone, captcha } = value;
            axios
              .post(domain + "/inside/app/user/reset/password", {
                userId: username,
                phoneNumber: phone,
                smsCode: captcha
              })
              .then(function() {
                ResetUserId = username;
                self.isNext = true;
              })
              .catch(e => {
                switch (e.response.data.errorInfo) {
                  case "Please send SMS to get mobile phone verification code.":
                    Message.info("请发送短信验证码！");
                    break;
                  case "SMS verification code error..":
                    Message.error("短信验证码错误！");
                    break;
                  case "The phone number does not match the userId.":
                    Message.error("用户ID和手机号不匹配");
                    break;
                  case "phone number illegal":
                    Message.error("手机号不合法");
                    break;
                  default:
                    Message.error("用户信息校验失败，请重试！");
                    break;
                }
              });
          }
        }
      );
    },
    resetPassword() {
      let self = this;
      this.confirmForm.validateFields(
        ["password", "newPassword"],
        { force: true },
        (err, value) => {
          if (!err) {
            axios
              .put(`${domain}/inside/app/user/${ResetUserId}/password`, {
                newPassword: value.newPassword
              })
              .then(function() {
                Message.success("重置密码成功");
                self.$router.push("/login");
              })
              .catch(e => {
                console.log(e);
                Message.error("重置密码失败,请重试！");
              });
          }
        }
      );
    },
    getSmsCode() {
      if (this.$data.btnTxt != "获取验证码") return;
      const form = this.form;
      form.validateFields(
        ["imageCode", "phone"],
        { force: true },
        (err, value) => {
          if (!err) {
            const { phone, imageCode } = value;
            this.getCaptcha({ phoneNumber: phone, imageCode });
          }
        }
      );
    },
    getCaptcha(payload) {
      const self = this;
      const imageId = this.imageId;
      axios
        .post(domain + "/inside/app/sms/send", {
          phoneNumber: payload.phoneNumber,
          imageId: imageId,
          imageCode: payload.imageCode
        })
        .then(function(response) {
          Message.success("短信已发送");
          self.countDown();
        })
        .catch(function(error) {
          if (error.response && error.response.status == 400) {
            if (
              error.response.data.errorInfo == "Image verification code error."
            ) {
              self.getResetImageVerification();
            }
            Message.error(error.response.data.errorInfo);
          }
        });
    },
    countDown() {
      this.$data.btnTxt = times;
      timer = setTimeout(() => {
        this.$data.btnTxt--;
        times--;
        if (this.$data.btnTxt === 0) {
          times = 50;
          this.$data.btnTxt = "获取验证码";
          return clearTimeout(timer);
        }
        this.countDown();
      }, 1000);
    }
  }
};
</script>
