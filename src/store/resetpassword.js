import { Message } from 'ant-design-vue';
import axios from 'axios'
const domain = window.location.protocol+'//a1.easemob.com'
const Resetpassword = {
	state: {
		imageUrl: '',
		imageId: '',
	},
	mutations: {
		setImageUrl(state, data){
			state.imageUrl = data.url
			state.imageId = data.imageId
		},
	},
	actions: {
	    // 获取图片验证码
	    getResetImageVerification: (context, payload) => {
            axios.get(domain+'/inside/app/image')
            .then(function (response) {
                const url = domain + '/inside/app/image/' + response.data.data.image_id
                context.commit('setImageUrl', {url: url, imageId: response.data.data.image_id});
            })
            .catch(() => {
            	Message.error('获取图片验证码失败，请刷新重试！')
            })
	    },
	},
	getters: {

	}
};
export default Resetpassword;
