/* 构建error弹出 */
import { errorCode } from '@/constant';
import { ElMessage } from 'element-plus';

export default function (code, errorDesc = '') {
  const message = (errorCode[code] && errorCode[code][errorDesc]) || errorDesc;
  console.log('handleErrorCode', message);
  ElMessage({
    title: 'Easemob SDK Error',
    message: message,
    type: 'error',
    center: true,
  });
}
