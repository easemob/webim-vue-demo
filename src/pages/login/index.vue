
<template>
	<div class="login-panel">
		<div class="logo">Web IM</div>
		<van-cell-group>
			<van-field
				v-model="username"
				required
				clearable
				right-icon="question-o"
				placeholder="用户名"
				@click-right-icon="$toast('question')"
			/>
			<van-field v-model="password" type="password" placeholder="密码" required/>
		</van-cell-group>
		<van-button type="default" @click="handleOk">登录</van-button>
	</div>
</template>

<script>
import "./index.css";
import { mapActions } from 'vuex'
export default {
  data() {
    return {
      username: '',
      password: ''
    };
  },
  components: {},
  methods: {
		...mapActions({
		 
		})
	}
};
</script>
