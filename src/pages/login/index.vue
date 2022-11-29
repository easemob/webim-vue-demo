
<template>
  <a-layout>
		<div class="login">
			<!-- <div class="login-panel">
				<div class="logo">Web IM</div>
				<a-input v-model="username" :maxLength="64" placeholder="用户名" />
				<a-input v-model="password" :maxLength="64" v-on:keyup.13="toLogin" type="password" placeholder="密码" />
				<a-input v-model="nickname" :maxLength="64" placeholder="昵称" v-show="isRegister == true" />

				<a-button type="primary" @click="toRegister" v-if="isRegister == true">注册</a-button>
				<a-button type="primary" @click="toLogin" v-else>登录</a-button>
			</div>
			<p class="tip" v-if="isRegister == true">
				已有账号?
				<span class="green" v-on:click="changeType">去登录</span>
			</p>
			<p class="tip" v-else>
				没有账号?
				<span class="green" v-on:click="changeType">注册</span>
			</p> -->

			<div class="login-panel">
			<div class="logo">Web IM</div>
			<a-form :form="form" >
			    <a-form-item has-feedback>
			      <a-input
			      	placeholder="手机号码"
			        v-decorator="[
			          'phone',
			          {
			            rules: [{ required: true, message: 'Please input your phone number!' }],
			          },
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
			      <a-row :gutter="8">
			        <a-col :span="14">
			          <a-input
			          	placeholder="短信验证码"
			            v-decorator="[
			              'captcha',
			              { rules: [{ required: true, message: 'Please input the captcha you got!' }] },
			            ]"
			          />
			        </a-col>
			        <a-col :span="10">
			          <a-button v-on:click="getSmsCode" class="getSmsCodeBtn">{{btnTxt}}</a-button>
			        </a-col>
			      </a-row>
			    </a-form-item>
				<a-button style="width: 100%" type="primary" @click="toLogin" class="login-rigester-btn">登录</a-button>

			</a-form>
			</div>
		</div>
  </a-layout>
</template>

<script>
import './index.less';
import { mapState, mapActions } from 'vuex';
import axios from 'axios'
import { Message } from 'ant-design-vue';
const domain = window.location.protocol+'//a1.easemob.com'
const userInfo = localStorage.getItem('userInfo') && JSON.parse(localStorage.getItem('userInfo'));
let times = 60;
let timer
export default{
	data(){
		return {
			username: userInfo && userInfo.userId || '',
			password: userInfo && userInfo.password || '',
			nickname: '',
			btnTxt: '获取验证码'
		};
	},
	beforeCreate() {
	    this.form = this.$form.createForm(this, { name: 'register' });
	},
	mounted: function(){
		const path = this.isRegister ? '/register' : '/login';
    
		if(path !== location.pathname){
			this.$router.push(path);
		}
		if(this.isRegister){
			this.getImageVerification()
		}
	},
	watch: {
		isRegister(result){
			if(result){
				this.getImageVerification()
			}
		}
	},
	components: {},
	computed: {
		isRegister(){
			return  true//this.$store.state.login.isRegister;
		},
		imageUrl(){
			return this.$store.state.login.imageUrl
		},
		imageId(){
			return this.$store.state.login.imageId
		}
	},
	methods: {
		...mapActions(['onLogin', 'setRegisterFlag', 'onRegister', 'getImageVerification', 'registerUser', 'loginWithToken']),
		toLogin(){
			// this.onLogin({
			// 	username: this.username.toLowerCase(),
			// 	password: this.password
			// });
			const form = this.form;
		    form.validateFields(['phone', 'captcha'], { force: true }, (err, value) => {
		    	if(!err){
		    		const {phone, captcha} = value
		    		this.loginWithToken({phone, captcha})
		    	}
		    });
		},
		toReset(){
			this.$router.push('/resetpassword')
		},
		toRegister(e){
			e.preventDefault(e);
		    this.form.validateFieldsAndScroll((err, values) => {
		        if (!err) {
		        	this.registerUser({
		        		userId: values.username,
		                userPassword: values.password,
		                phoneNumber: values.phone,
		                smsCode: values.captcha,
		        	})
		        }
		    });

			// this.onRegister({
			// 	username: this.username.toLowerCase(),
			// 	password: this.password,
			// 	nickname: this.nickname.toLowerCase(),
			// });
		},
		changeType(){
			this.setRegisterFlag(!this.isRegister);
		},
		getSmsCode(){
			if(this.$data.btnTxt != '获取验证码') return
			const form = this.form;
		    form.validateFields(['phone'], { force: true }, (err, value) => {
		    	if(!err){
		    		const {phone, imageCode} = value
		    		this.getCaptcha({phoneNumber: phone, imageCode})
		    	}
		    });
		},
		getCaptcha(payload){
			const self = this
			const imageId = this.imageId
			axios.post(domain+`/inside/app/sms/send/${payload.phoneNumber}`, {
                phoneNumber: payload.phoneNumber,
            })
            .then(function (response) {
                Message.success('短信已发送')
                self.countDown()
            })
            .catch(function (error) {
                if(error.response && error.response.status == 400){
                	if(error.response.data.errorInfo == 'Image verification code error.'){
                		self.getImageVerification()
                	}
                	if(error.response.data.errorInfo == 'phone number illegal'){
						Message.error('请输入正确的手机号！')
					}else if(error.response.data.errorInfo == 'Please wait a moment while trying to send.'){
						Message.error('你的操作过于频繁，请稍后再试！')
					}else if(error.response.data.errorInfo.includes('exceed the limit')){
						Message.error('获取已达上限！')
					}else{
						Message.error(error.response.data.errorInfo)
					}
                }
            });
		},
		countDown(){
			this.$data.btnTxt = times
			timer = setTimeout(() => {
				this.$data.btnTxt--
				times--
				if(this.$data.btnTxt === 0){
					times = 60
					this.$data.btnTxt = '获取验证码'
					return clearTimeout(timer)
				}
				this.countDown()
			}, 1000)
		}
	}
};
</script>
