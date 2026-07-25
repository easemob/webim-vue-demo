import { sdk5Config } from './initwebsdk';
import { initializeClient } from './sdk5/client';

initializeClient(sdk5Config);

export {
  getClient,
  getCurrentUserId,
  login,
  logout,
  requireManager,
  toConversationLocator,
} from './sdk5/client';
