<script setup>
import { computed, toRefs, defineEmits } from 'vue'
import { ANSWER_TYPE } from './constants'
import CallKitMessages from './utils/callMessages'
/* props */
const props = defineProps({
    callKitStatus: {
        type: Object,
        default: () => ({})
    }
})
const { callKitStatus } = toRefs(props)
console.log('callKitStatuscallKitStatus', callKitStatus)
const channelInfos = computed(() => {
    return callKitStatus.value.channelInfos ?? {}
})
/* emits */
const $emits = defineEmits(['updateLocalStatus', 'handleSendAnswerMsg'])
const agreeJoinChannel = () => {
    console.log('>>>>>接听通话')
    $emits('handleSendAnswerMsg', ANSWER_TYPE.ACCPET)
}
const refuseJoinChannel = () => {
    console.log('>>>>>拒绝接听')
    $emits('handleSendAnswerMsg', ANSWER_TYPE.REFUSE)

}
</script>

<template>
    <div class="container">
        <h3>{{callKitStatus.localClientStatus}}</h3>
        <h4>{{channelInfos.callerIMName}}</h4>
        <button @click="agreeJoinChannel">接听</button>
        <button @click="refuseJoinChannel">挂断</button>
    </div>
</template>

<style lang="scss" scoped>
.container {
    display: flex;
    flex-direction: column;
    // justify-content: center;
    // align-items: center;
    width: 200px;
    height: 150px;
}
</style>