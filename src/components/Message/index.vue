<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
// onMounted(() => {
//   watch(() => route.query, (newVal) => {
//     console.log('newVal', newVal)
//   })
//   console.log('route', route)
// })



</script>
<template>
  <div>消息部分</div>
</template>



<style lang="scss" scoped>
</style>
