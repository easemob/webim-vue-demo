<template>
    <a-modal
		title="免打扰配置"
		v-model="showConfigModal"
		@cancel="handlerClose"
        @ok="handleOk"   
	>
		<div class="push-config">
            <H3>是否设置免打扰</H3><a-switch v-model:checked="isPush" @change="handleChangeChecked" />
        </div>
	</a-modal>
</template>

<script>
import { mapActions,mapGetters } from 'vuex';

export default{
    data(){
        return {
            isPush: this.$store.state.chat.pushConfig,
            showConfigModal: false,
        }
    },
    watch: {
        pushConfig: {
            handler(newVal, oldVal){
                this.isPush = newVal;
            }
        }
    },
    computed: {
		...mapGetters({
			pushConfig: 'onPushConfig'
		}),
    },
    methods: {
        ...mapActions([
			'onSetSilent',
            'onClearSilent',
        ]),
        handleChangeChecked(val){
            this.isPush = val;
        },
        changeModal(){
			this.$data.showConfigModal = !this.$data.showConfigModal;
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