import { imConnectListener } from './imConnectListener'
import { imReviceMessageListener } from './imReciveMessageListener'
import { imPresenceListener } from './imPresenceListener'
import { imContactListener } from './imContactListener'
import { imGroupListener } from './imGroupListener'
/* mount all listener */
export const mountAllEMListener = () => {
    const { mountConnectEventListener } = imConnectListener()
    mountConnectEventListener()
    const { mountPresenceEventListener } = imPresenceListener()
    mountPresenceEventListener()
    const { mountReviceMessageEventListener } = imReviceMessageListener()
    mountReviceMessageEventListener()
    const { mountContactEventListener } = imContactListener()
    mountContactEventListener()
    const { mountGroupEventListener } = imGroupListener()
    mountGroupEventListener()
}
export {
    imConnectListener,
    imPresenceListener,
    imReviceMessageListener,
    imContactListener,
    imGroupListener
}
