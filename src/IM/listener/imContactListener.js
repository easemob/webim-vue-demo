import { EMClient } from '../index';
import { INFORM_FROM } from '@/constant';
import store from '@/store';
import { CONTACT_OPERATION_CUSTOM_TYPE } from '../constant';
export const imContactListener = () => {
  const submitInformData = (fromType, informContent) => {
    store.dispatch('createNewInform', { fromType, informContent });
  };
  const onDispatchContactEvent = (eventType, data) => {
    console.log('onDispatchContactEvent', data);
    switch (eventType) {
      case CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_INVITED:
        {
          submitInformData(INFORM_FROM.FRIEND, data);
        }
        break;
      case CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_ADDED:
        {
          submitInformData(INFORM_FROM.FRIEND, data);
          store.dispatch('onAddNewContact', data);
        }
        break;
      case CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_AGREED:
        {
          //改掉data中的type
          data.type = 'other_person_agree';
          submitInformData(INFORM_FROM.FRIEND, data);
          store.dispatch('onAddNewContact', data);
        }
        break;
      case CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_REFUSE:
        {
          data.type = 'other_person_refuse';
          submitInformData(INFORM_FROM.FRIEND, data);
        }
        break;
      case CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_DELETED: {
        submitInformData(INFORM_FROM.FRIEND, data);
        store.dispatch('onDeleteContact', data);
      }
      default:
        break;
    }
  };
  const mountContactEventListener = () => {
    EMClient.addEventHandler('friendListen', {
      // 收到好友邀请触发此方法。
      onContactInvited: (data) => {
        //写入INFORM
        console.log('onContactInvited', data);
        onDispatchContactEvent(
          CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_INVITED,
          data,
        );
      },
      // 联系人被删除时触发此方法。
      onContactDeleted: (data) => {
        //写入INFORM
        console.log('onContactDeleted', data);
        onDispatchContactEvent(
          CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_DELETED,
          data,
        );
      },
      // 新增联系人会触发此方法。
      onContactAdded: (data) => {
        console.log('onContactAdded', data);
        onDispatchContactEvent(
          CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_ADDED,
          data,
        );
      },
      // 好友请求被拒绝时触发此方法。
      onContactRefuse: (data) => {
        //写入INFORM
        console.log('onContactRefuse', data);
        onDispatchContactEvent(
          CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_REFUSE,
          data,
        );
      },
      // 好友请求被同意时触发此方法。
      onContactAgreed: (data) => {
        //写入INFORM
        console.log('onContactAgreed', data);
        onDispatchContactEvent(
          CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_AGREED,
          data,
        );
      },
    });
  };
  return {
    mountContactEventListener,
  };
};
