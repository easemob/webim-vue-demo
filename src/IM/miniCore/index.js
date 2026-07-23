import { sdk5Config } from '../initwebsdk';
import {
  getClient,
  getCurrentUserId,
  initializeClient,
  login,
  logout,
  requireManager,
  toConversationLocator,
} from '../sdk5/client';

initializeClient(sdk5Config);

export const imClient = {
  get client() {
    return getClient();
  },
  get userId() {
    return getCurrentUserId();
  },
  login,
  logout,
  requireManager,
  toConversationLocator,
};

export { getClient, getCurrentUserId, login, logout, requireManager, toConversationLocator };
