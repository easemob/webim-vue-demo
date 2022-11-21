<script setup>
import { computed, toRefs, defineEmits } from 'vue'
import { ANSWER_TYPE, CALL_INVITE_TEXT } from './constants'
/* images */
import avatarIcon from '@/assets/callkit/avatar-big@2x.png'
import acceptIcon from '@/assets/callkit/acceptCall@2x.png'
import refuseIcon from '@/assets/callkit/hangupCall@2x.png'
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
        <div class="alert_header">
            <div class="avatar"><img :src="avatarIcon" alt="呼叫人头像"></div>
            <div class="name">{{ channelInfos.callerIMName || '未知呼叫' }}</div>
        </div>
        <div class="alert_footer">
            <p>{{ CALL_INVITE_TEXT[channelInfos.callType] || '未知类型呼叫' }}</p>
            <div class="alert_btns">
                <img :src="acceptIcon" @click="agreeJoinChannel" alt="接听">
                <img :src="refuseIcon" @click="refuseJoinChannel" alt="挂断">
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.container {
    position: fixed;
    right: 10px;
    top: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 300px;
    height: 120px;
    background: #FFF;
    border-radius: 3px;
    box-shadow: 0px 0px 20px 10px rgba(0, 0, 0, 0.127);
    padding: 8px 15px;
    box-sizing: border-box;
}

.alert_header {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
}

.avatar>img {
    width: 50px;
    height: 50px;
}

.name {
    max-width: 150px;
    margin-left: 15px;
}

.alert_footer {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
}

.alert_btns>img {
    width: 40px;
    height: 40px;
    margin: 0 5px;
    transition: all 0.3s;
}

.alert_btns>img:hover {
    transform: scale(1.1);
}
</style>