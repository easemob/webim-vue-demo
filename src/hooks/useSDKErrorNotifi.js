import { handleErrorCode } from '@/constant';
import { ElNotification } from 'element-plus';

export default function (errorCode, errorDesc = '') {
  console.log('进入查询》》》》》', errorCode, errorDesc);
  const message = handleErrorCode[errorCode][errorDesc] || errorDesc;
  console.log('handleErrorCode', message);
  ElNotification({
    title: 'Easemob SDK Error',
    message: message,
    type: 'error',
  });
}
