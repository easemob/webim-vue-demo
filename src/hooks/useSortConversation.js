import EaseIM from '@/IM/initwebsdk';
import _ from 'lodash';
import { messageType } from '@/constant';
const { CHAT_TYPE } = messageType;
export default function (conversationList) {
  const loginUserId = EaseIM.conn.user;
  let newConversationObj = {};
  let toBeUpdateData = _.values(conversationList);
  let sortedArr = _.sortBy(toBeUpdateData, function (o) {
    return -o.latestSendTime;
  });

  sortedArr.forEach((item) => {
    console.log(item);
    const key = item.conversationKey;

    return (newConversationObj[key] = item);
  });
  return newConversationObj;
  console.log('>>>newConversationObj>>', newConversationObj);
}
