/* 构建inform通知 */
import { informType } from '@/constant';
import EaseIM from '@/IM/initwebsdk';
const { INFORM_FROM, INFORM_TYPE } = informType;
export default function (fromType, informContnet) {
  const { type, from, to, status } = informContnet;

  if (fromType === INFORM_FROM.FRIEND) {
    let informBody = {};
    //除 type 为subscribe 需要增加一些特别属性值，其他好友通知均为默认格式
    if (type === 'subscribe') {
      informBody = {
        fromType,
        type: type,
        title: INFORM_TYPE[type],
        from: from,
        to: to,
        time: Date.now(),
        desc: status || INFORM_TYPE[type],
        isOpearationBtn: true, //是否显示操作按钮？
        operationStatus: 0, //0未操作 1同意 2拒绝
      };
    } else {
      informBody = {
        fromType,
        type,
        title: INFORM_TYPE[type],
        from: from,
        to: to,
        time: Date.now(),
        desc: status || INFORM_TYPE[type],
      };
    }
    informBody.from === EaseIM.conn.user
      ? (informBody.untreated = 0)
      : (informBody.untreated = 1);
    return informBody;
  }
  if (fromType === INFORM_FROM.GROUP) {
    let informBody = {};
    console.log('>>>>>收到了群组事件', informContnet);
    const { operation, from, to, id } = informContnet;
    if (operation === 'inviteToJoin') {
      informBody = {
        fromType,
        operation,
        title: '群组通知',
        from: from,
        to: to,
        groupId: id,
        time: Date.now(),
        desc: INFORM_TYPE[operation],
        isOpearationBtn: true, //是否显示操作按钮？
        operationStatus: 0, //0未操作 1同意 2拒绝
      };
    } else {
      informBody = {
        fromType,
        operation,
        title: '群组通知',
        from: from,
        to: to,
        groupId: id,
        time: Date.now(),
        desc: INFORM_TYPE[operation] || operation,
      };
    }

    informBody.from === EaseIM.conn.user
      ? (informBody.untreated = 0)
      : (informBody.untreated = 1);
    return informBody;
  }
  //untreated 0 已阅 1未读
}
