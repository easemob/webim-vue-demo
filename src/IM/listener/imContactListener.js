import { getCurrentUserId, requireManager } from '../index';
import store from '@/store';
import { wrapImEventHandler } from '@/utils/safeCall';

const CONTACT_EVENT_HANDLER_ID = 'friendListen';

export const imContactListener = () => {
  const submitInformData = (eventName, payload) => {
    const receivedAt = Date.now();
    console.log('[SDK 5.0 Contact Event] received', {
      eventName,
      rawEvent: payload,
    });
    Promise.resolve(
      store.dispatch('recordSdkEvent', {
        domain: 'contact',
        eventName,
        payload,
        currentUserId: getCurrentUserId(),
        receivedAt,
      }),
    ).catch((error) =>
      console.error('[imContactListener.recordSdkEvent]', error),
    );
    Promise.resolve(
      store.dispatch('createNewInform', {
        eventName,
        payload,
        domain: 'contact',
        receivedAt,
      }),
    ).catch((error) =>
      console.error('[imContactListener.createNewInform]', error),
    );
  };

  const syncContactsFromSdkSnapshot = (eventName) => {
    Promise.resolve(store.dispatch('syncContactsFromSdkSnapshot')).catch(
      (error) =>
        console.error(
          `[SDK 5.0 Contact Event] ${eventName} snapshot sync failed`,
          error,
        ),
    );
  };

  const mountContactEventListener = () => {
    const manager = requireManager('contactManager');
    manager.removeEventHandler(CONTACT_EVENT_HANDLER_ID);
    manager.addEventHandler(
      CONTACT_EVENT_HANDLER_ID,
      wrapImEventHandler({
        onContactInvited: (payload) => {
          submitInformData('onContactInvited', payload);
        },
        onContactDeleted: (payload) => {
          submitInformData('onContactDeleted', payload);
          syncContactsFromSdkSnapshot('onContactDeleted');
        },
        onContactAdded: (payload) => {
          submitInformData('onContactAdded', payload);
          syncContactsFromSdkSnapshot('onContactAdded');
        },
        onContactRefuse: (payload) => {
          submitInformData('onContactRefuse', payload);
        },
        onContactAgreed: (payload) => {
          submitInformData('onContactAgreed', payload);
          syncContactsFromSdkSnapshot('onContactAgreed');
        },
      }),
    );
  };

  return {
    mountContactEventListener,
  };
};
