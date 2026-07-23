import { requireManager } from '../index';
import { INFORM_FROM } from '@/constant';
import store from '@/store';
import { CONTACT_OPERATION_CUSTOM_TYPE } from '../constant';
import { wrapImEventHandler } from '@/utils/safeCall';

export const imContactListener = () => {
  const submitInformData = (fromType, informContent) => {
    Promise.resolve(
      store.dispatch('createNewInform', { fromType, informContent }),
    ).catch((err) => console.error('[imContactListener.createNewInform]', err));
  };
  const onDispatchContactEvent = (eventType, data) => {
    if (data == null || typeof data !== 'object') {
      console.warn('[onDispatchContactEvent] 无效 data', eventType, data);
      return;
    }
    switch (eventType) {
      case CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_INVITED:
        {
          submitInformData(INFORM_FROM.FRIEND, data);
        }
        break;
      case CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_ADDED:
        {
          submitInformData(INFORM_FROM.FRIEND, data);
          store.dispatch('syncContactsFromSdkSnapshot');
        }
        break;
      case CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_AGREED:
        {
          submitInformData(INFORM_FROM.FRIEND, data);
          Promise.resolve(store.dispatch('syncContactsFromSdkSnapshot')).catch(
            (err) => console.error('[CONTACT_AGREED]', err),
          );
        }
        break;
      case CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_REFUSE:
        {
          submitInformData(INFORM_FROM.FRIEND, data);
        }
        break;
      case CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_DELETED: {
        submitInformData(INFORM_FROM.FRIEND, data);
        Promise.resolve(store.dispatch('syncContactsFromSdkSnapshot')).catch((err) =>
          console.error('[CONTACT_DELETED]', err),
        );
      }
      default:
        break;
    }
  };
  const mountContactEventListener = () => {
    requireManager('contactManager').addEventHandler(
      'friendListen',
      wrapImEventHandler({
      // 收到好友邀请触发此方法。
      onContactInvited: (data) => {
        //写入INFORM
        console.log('[IM Contact Event] received', {
          eventType: CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_INVITED,
          from: data?.from,
          to: data?.to,
          rawEvent: data,
        });
        onDispatchContactEvent(
          CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_INVITED,
          data,
        );
      },
      // 联系人被删除时触发此方法。
      onContactDeleted: (data) => {
        //写入INFORM
        console.log('[IM Contact Event] received', {
          eventType: CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_DELETED,
          from: data?.from,
          to: data?.to,
          rawEvent: data,
        });
        onDispatchContactEvent(
          CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_DELETED,
          data,
        );
      },
      // 新增联系人会触发此方法。
      onContactAdded: (data) => {
        console.log('[IM Contact Event] received', {
          eventType: CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_ADDED,
          from: data?.from,
          to: data?.to,
          rawEvent: data,
        });
        onDispatchContactEvent(
          CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_ADDED,
          data,
        );
      },
      // 好友请求被拒绝时触发此方法。
      onContactRefuse: (data) => {
        //写入INFORM
        console.log('[IM Contact Event] received', {
          eventType: CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_REFUSE,
          from: data?.from,
          to: data?.to,
          rawEvent: data,
        });
        onDispatchContactEvent(
          CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_REFUSE,
          data,
        );
      },
      // 好友请求被同意时触发此方法。
      onContactAgreed: (data) => {
        //写入INFORM
        console.log('[IM Contact Event] received', {
          eventType: CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_AGREED,
          from: data?.from,
          to: data?.to,
          rawEvent: data,
        });
        onDispatchContactEvent(
          CONTACT_OPERATION_CUSTOM_TYPE.CONTACT_AGREED,
          data,
        );
      },
    }),
    );
  };
  return {
    mountContactEventListener,
  };
};
