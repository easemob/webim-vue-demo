
<template>
  <a-layout>
		<div class="login">
			<div class="login-panel">
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
			</p>
		</div>
  </a-layout>
</template>

<script>
import './index.less';
import { mapState, mapActions } from 'vuex';
const userInfo = localStorage.getItem('userInfo') && JSON.parse(localStorage.getItem('userInfo'));
export default{
	data(){
		return {
			username: userInfo && userInfo.userId || '',
			password: userInfo && userInfo.password || '',
			nickname: ''
		};
	},
	mounted: function(){
		const path = this.isRegister ? '/register' : '/login';
    
		if(path !== location.pathname){
			this.$router.push(path);
		}
	},
	components: {},
	computed: {
		isRegister(){
			return this.$store.state.login.isRegister;
		},
	},
	methods: {
		...mapActions(['onLogin', 'setRegisterFlag', 'onRegister']),
		toLogin(){
			this.onLogin({
				username: this.username.toLowerCase(),
				password: this.password
			});
		},
		toRegister(){
			this.onRegister({
				username: this.username.toLowerCase(),
				password: this.password,
				nickname: this.nickname.toLowerCase(),
			});
		},
		changeType(){
			this.setRegisterFlag(!this.isRegister);
		}
	}
};
</script>
