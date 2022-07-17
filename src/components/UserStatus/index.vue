<script setup>
import { toRefs, computed } from 'vue'
import { onLineStatus } from '@/constant'
import { useStore } from 'vuex'
/* store */
const store = useStore()
/* props */
const props = defineProps({
    userStatus: {
        type: Object,
        required: true,
        default: () => ({})
    }
})
const { userStatus } = toRefs(props)
/* 单聊用户在线状态 */
const userInfoStatus = computed(() => {
    console.log('userStatususerStatususerStatususerStatus', userStatus.value)
    //定义后续返回的状态对象
    let statusObj = {
        ext: '',
        style: '',
        label: '',
        onlineDeviceCount: 0, //在线设备数
        deviceType: '' //在线设备类型
    }
    let onlineStatus = [];
    let offlineStatus = [];
    if (userStatus.value && userStatus.value.statusDetails && userStatus.value.statusDetails.length > 0) {
        userStatus.value.statusDetails.map(i => {
            if (i.status === 0) {
                return offlineStatus.push(i)
            }
            if (i.status === 1) {
                return onlineStatus.push(i)
            }
        })
    }
    //赋值ext
    userStatus.value.ext && (statusObj.ext = userStatus.value.ext)

    //onlineStatus 有值
    if (onlineStatus.length > 0) {
        console.log('>>>>>>进入值修改阶段')
        //如果ext有自己定义的就尝试匹配自定义的状态，否则就直接判定在线,label同样。
        statusObj.style = userStatus.value.ext ? onLineStatus[userStatus.value.ext].style : onLineStatus['Online'].style
        statusObj.label = userStatus.value.ext ? onLineStatus[userStatus.value.ext].label : onLineStatus['Online'].label
        //赋值在线设备数
        statusObj.onlineDeviceCount = onlineStatus.length
        //如果在线设备为1则赋予设备类型
        onlineStatus.length === 1 && (statusObj.deviceType = onlineStatus[0].device.split('_')[0])
        //如果在此判断中ext设定为Offline,状态应该在线
        if (userStatus.value.ext === 'Offline') {
            statusObj.style = onLineStatus['Online'].style
            statusObj.label = onLineStatus['Online'].label
        }
    }
    //如若offlineStatus里有值,并且onlineStatus无，也说明订阅的目标id，本质也是处于离线状态。
    if (offlineStatus.length > 0 && onlineStatus.length === 0) {
        console.log('>>>>>判定离线')
        statusObj.style = onLineStatus['Offline'].style
        statusObj.label = onLineStatus['Offline'].label
    }
    console.log('onlineStatus&&offlineStatus', onlineStatus, offlineStatus);
    return statusObj
})
</script>
<template>
    <div class="user_status_box">
        <span class="status_icon" :style="userInfoStatus.style"></span>
        <span class="os_type">{{ userInfoStatus.onlineDeviceCount > 1 ? `多设备${userInfoStatus.label}` :
                `${userInfoStatus.deviceType}${userInfoStatus.label}`
        }}</span>
    </div>
</template>



<style lang="scss" scoped>
.user_status_box {
    width: 100px;
    height: 20px;
    font-size: 7px;

    .status_icon {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin: 0 3px;
    }
}
</style>