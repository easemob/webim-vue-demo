import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useLocalStorage } from '@vueuse/core'
import _ from 'lodash'
const is_need_open_ring = ref(false)
export default function () {
    console.log('>>>>>>>此方法加载')
    const isOpenPlayRing = useLocalStorage('is_open_play_ring', true)
    //必须在播放铃声之前保证有一次交互
    //触发交互
    const clickRing = () => {
        const ringDom = document.querySelector('#ring')
        console.log('>>>>ring交互执行')
        ringDom.pause()
    }
    //播放铃声
    const playRing = _.throttle(async () => {
        const ringDom = document.querySelector('#ring')
        console.log('>>>>铃声播放执行')
        try {
            await ringDom.play()
        } catch (error) {
            console.log('铃声播放error', error)
            if (!is_need_open_ring.value) {
                openRing()
            }
        }
    }, 3000)

    //请求播放权限
    const openRing = () => {
        is_need_open_ring.value = true
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
