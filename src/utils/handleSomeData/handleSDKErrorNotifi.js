/* 构建error弹出 */
import { errorCode } from '@/constant'
import { ElMessage } from 'element-plus'

export default function (code, errorDesc = '') {
    //针对触发Moderation的消息做特别处理
    if (code === 508) {
        errorDesc = 'moderation'
    } if (code === 507) {
        errorDesc = 'muted'
    }
    const message = (errorCode[code] && errorCode[code][errorDesc]) || errorDesc
    console.log('handleErrorCode', message)
    ElMessage({
        title: 'Easemob SDK Error',
        message: message,
        type: 'error',
        center: true,
    })
}
