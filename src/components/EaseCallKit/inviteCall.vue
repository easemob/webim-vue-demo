<script setup>
//发送邀请信息
const handleInviteMessage = (targetIMId, callType) => {
    if (!targetIMId) throw 'targetIMId must pass！'
    if (callType === undefined || callType === null || callType < 0) throw 'callType must pass！'
    console.log('>>>>>>发送邀请信息', targetIMId, callType);
    if (Array.isArray(targetIMId) && targetIMId.length > 15 < 1) throw 'targetIMId length  > 15 or length < 1'
    switch (callType) {
        case 0: {
            console.log('>>>>>发起单人音频呼叫');
        }

            break;
        case 1: {
            console.log('>>>>>发起单人视频呼叫');
        }
            break;
        case 2: {
            console.log('>>>>发起多人音视频呼叫');
        }
            break;
        default:
            console.log('>>>未知错误类型');
            break;
    }
}

defineExpose({
    handleInviteMessage
})
</script>
<template>
    <div></div>
</template>
<style lang="scss" scoped>

</style>