<template>
    <a-modal
		title="免打扰配置"
		v-model="showConfigModal"
		@cancel="handlerClose"
        @ok="handleOk"   
	>
		<div class="push-config">
            <H3>是否设置免打扰</H3><a-switch v-model="pushNotify" @change="handleChangeChecked" />
        </div>
	</a-modal>
</template>

<script>
import { mapActions,mapGetters } from 'vuex';
export default{
    data(){
        return {
            pushConfig: this.$store.state.chat.pushConfig,
            showConfigModal: false,
            pushNotify:this.$store.state.chat.pushConfig.length > 0 && this.$store.state.chat.pushConfig[Vue.$route.params.id][type] === 'ALL'
        }
    },
    watch: {
        pushConfigObj: {
            handler(newVal, oldVal){
                this.pushNotify = Object.keys(newVal).length > 0 && newVal[Vue.$route.params.id].type === 'ALL'
            }
        }
    },
    computed: {
		...mapGetters({
			pushConfigObj: 'onPushConfig'
		}),
    },
    methods: {
        ...mapActions([
			'onSetSilent',
            'onClearSilent',
        ]),
        handleChangeChecked(val){
            this.pushNotify = val;
        },
        changeModal(){
			this.$data.showConfigModal = !this.$data.showConfigModal;
		},
        handleOk() {
            if (this.pushNotify) {
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