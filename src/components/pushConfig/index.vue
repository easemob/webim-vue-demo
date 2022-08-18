<template>
    <a-modal
		title="免打扰配置"
		v-model="showConfigModal"
		@cancel="handlerClose"
        @ok="handleOk"   
	>
		<div class="push-config">
            <H3>是否设置免打扰</H3><a-switch v-model="isPush" @change="handleChangeChecked" />
        </div>
	</a-modal>
</template>

<script>
import { mapActions,mapGetters } from 'vuex';
export default{
    data(){
        return {
            isPush: false,
            showConfigModal: false,
        }
    },
    computed: {
		...mapGetters({
			pushConfig: 'onPushConfig'
		}),
    },
    props:[
        'userId'
    ],
    methods: {
        ...mapActions([
			'onSetSilent',
            'onClearSilent',
        ]),
        handleChangeChecked(val){
            if (!val) {
                const { params } = Vue.$route;
                Vue.$store.commit('updateMessageStatus', {action: 'updatePushConfig', readUser: params.id});
            }
        },
        changeModal(){
			this.$data.showConfigModal = !this.$data.showConfigModal;
            const { params } = Vue.$route;
            const onPushConfigData = this.pushConfig;
            this.isPush = onPushConfigData.includes(params.id)
		},
        handleOk() {
            if (this.isPush) {
                this.onSetSilent(this.handlerClose)
            }else {
                this.onClearSilent(this.handlerClose)
            }
        },
        handlerClose() {
            this.showConfigModal = false
        }
    },
}
</script>

<style scoped>
.push-config{
    display: flex;
    justify-content: space-between;
}
</style> 