<template>
	<div id="app">
		<router-view />
	</div>
</template>

<script>
import WebIM from './utils/WebIM';
import { mapState, mapActions } from 'vuex';
    
export default{
	name: 'App',
	beforeMount(){
		const userInfo = localStorage.getItem('userInfo') && JSON.parse(localStorage.getItem('userInfo'));
		if(userInfo){
			const userName = userInfo.userId;
			const accessToken = userInfo.accessToken;
			let options = {
				user: userName,
				accessToken: accessToken,
				appKey: WebIM.config.appkey
			};
			WebIM.conn.open(options);
		}
	}
};
    
</script>

<style>
@import url('./utils/theme/base.css');
#app {
	font-family: 'Avenir', Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #2c3e50;
	margin-top: 60px;
}
</style>
