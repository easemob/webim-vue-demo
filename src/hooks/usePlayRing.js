import { watchEffect } from 'vue';
import { useLocalStorage } from '@vueuse/core'
import _ from 'lodash';
export default function () {
    console.log('>>>>>>>此方法加载');
    const isOpenPlayRing = useLocalStorage('is_open_play_ring', true);
    watchEffect(isOpenPlayRing, () => {
        console.log('>>>>>>>监听铃声状态');
    })
    //必须在播放铃声之前保证有一次交互
    //触发交互
    const clickRing = () => {
        const ringDom = document.querySelector('#ring');
        console.log('>>>>ring交互执行');
        ringDom.pause()
    }
    //播放铃声
    const playRing = _.throttle(() => {
        const ringDom = document.querySelector('#ring');
        console.log('>>>>铃声播放执行');
        ringDom.play()
    }, 1000)
    return {
        isOpenPlayRing,
        clickRing,
        playRing,
    }
}