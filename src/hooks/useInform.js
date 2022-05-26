import { informType } from '@/constant';
import EaseIM from '@/IM/initwebsdk';
const { INFORM_FROM, INFORM_TYPE } = informType;
export default function (fromType, informContnet) {
  let informBody = {};
  if (fromType === INFORM_FROM.FRIEND) {
    const { type, from, to, status } = informContnet;
    switch (type) {
      case 'subscribe': //好友申请
        {
          informBody = {
            fromType,
            title: INFORM_TYPE[type],
            from: from,
            to: to,
            time: Date.now(),
            desc: status || INFORM_TYPE[type],
            isOpearationBtn: true, //是否显示操作按钮？
            operationStatus: 0, //0未操作 1同意 2拒绝
          };
        }
        break;
      case 'subscribed': //好友关系建立
        {
          informBody = {
            fromType,
            title: INFORM_TYPE[type],
            from: from,
            to: to,
            time: Date.now(),
            desc: status || INFORM_TYPE[type],
          };
        }
        break;
      case 'unsubscribed': //好友关系解除
        {
          informBody = {
            fromType,
            title: INFORM_TYPE[type],
            from: from,
            to: to,
            time: Date.now(),
            desc: status || INFORM_TYPE[type],
          };
        }
        break;
      case 'other_person_refuse': //对方拒绝好友申请
        {
          informBody = {
            fromType,
            title: INFORM_TYPE[type],
            from: from,
            to: to,
            time: Date.now(),
            desc: status || INFORM_TYPE[type],
          };
        }
        break;
      case 'other_person_agree': //对方同意好友申请
        {
          informBody = {
            title: INFORM_TYPE[type],
            from: from,
            to: to,
            time: Date.now(),
            desc: status || INFORM_TYPE[type],
          };
        }
        break;
      default:
        break;
    }
  }
  if (fromType === INFORM_FROM.GROUP) {
  }
  console.log('>>>>>>>informBody', informBody);
  informBody.from === EaseIM.conn.user
    ? (informBody.untreated = 0)
    : (informBody.untreated = 1);
  return informBody;
}
