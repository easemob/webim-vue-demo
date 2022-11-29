<script setup>
import { ref, toRefs } from 'vue'
import { useDraggable, useWindowSize } from '@vueuse/core'
const props = defineProps({
    showType: {
        type: Number,
        default: 0, //0 待接听 1为通话中
        required: true,
    },
    callTime: {
        type: String,
        default: '00:00',
        required: true,
    },
})
const { showType, callTime } = toRefs(props)

/* emit */
const $emit = defineEmits(['changeMiniSize'])
const { width, height } = useWindowSize()
const miniStreamContainer = ref(null)
const { style } = useDraggable(miniStreamContainer, {
    initialValue: { x: width.value - 136, y: 0 },
    onMove: (position) => {
        if (position.x > width.value - 136) {
            position.x = width.value - 136
        }
        if (position.x < 0) {
            position.x = 0
        }
        if (position.y > height.value - 116) {
            position.y = height.value - 116
        }
        if (position.y < 0) {
            position.y = 0
        }
    },
    preventDefault: true,
    stopPropagation: true,
})
const clickChanageMiniSizeModal = () => {
    $emit('changeMiniSize', false)
}
</script>

<template>
  <div class="mini_stream_container" ref="miniStreamContainer" :style="style" style="position: fixed">
    <div class="minimodal" @click.prevent.stop="clickChanageMiniSizeModal"></div>
    <div>
      <span class="mini_stream_text" style="margin-left: 5px;" v-show="showType === 0">等待接听中<span
          class="dot">...</span></span>
      <span class="mini_stream_text" v-show="showType === 1">{{ callTime }}</span>
    </div>
  </div>
</template>
<style scoped>
.mini_stream_container {
  position: absolute;
  right: 0;
  top: 50px;
  z-index: 999;
  width: 136px;
  height: 116px;
  cursor: move;
  background: #fff;
  border-radius: 5px;
  box-shadow: 0px 0px 20px 10px rgba(0, 0, 0, 0.127);
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 5px;
}

.minimodal {
  width: 100px;
  height: 100px;
  background: url('../../../assets/callkit/minimodal@2x.png') no-repeat;
  background-size: contain;
  cursor: pointer;
}

.mini_stream_text {
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: flex-end;
  color: #5DB47F;
}

.dot {
  font-family: simsun;
  animation: dot 1s infinite step-start;
  display: inline-block;
  width: 1.5em;
  vertical-align: bottom;
  overflow: hidden;
}

@keyframes dot {
  0% {
    width: 0;
    margin-right: 1.5em;
  }

  33% {
    width: 0.5em;
    margin-right: 1em;
  }

  66% {
    width: 1em;
    margin-right: 0.5em;
  }

  100% {
    width: 1.5em;
    margin-right: 0;
  }
}
</style>
