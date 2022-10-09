import { watchEffect } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useLocalStorage } from '@vueuse/core'
import _ from 'lodash'
export default function () {
    console.log('>>>>>>>此方法加载')
    const isOpenPlayRing = useLocalStorage('is_open_play_ring', true)
    watchEffect(isOpenPlayRing, () => {
        console.log('>>>>>>>监听铃声状态')
    })
    //必须在播放铃声之前保证有一次交互
    //触发交互
    const clickRing = () => {
        const ringDom = document.querySelector('#ring')
        console.log('>>>>ring交互执行')
        ringDom.pause()
    }
    //播放铃声
    const playRing = _.throttle(() => {
        const ringDom = document.querySelector('#ring')
        console.log('>>>>铃声播放执行')
        ringDom.play().then(res => console.log('>>>>>成功播放')).catch(() => openRing())
    }, 1000)

    //请求播放权限
    const openRing = () => {
        ElMessageBox.alert('由于浏览器策略限制，需确认后方可播放新消息提示音！', {
            confirmButtonText: 'OK',
            callback: () => {
                clickRing()
            },
        })
    }

    return {
        isOpenPlayRing,
        clickRing,
        playRing,
    }
}