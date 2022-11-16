import { reactive } from 'vue';
const channelEvents = reactive({})

export default function useChannelEvent() {
    const SUB_CHANNEL_EVENT = (eventName = "EASECALLKIT", fn) => {
        if (channelEvents[eventName]) {
            channelEvents[eventName].push(fn)
        } else {
            channelEvents[eventName] = []
            channelEvents[eventName].push(fn)
        }


    }
    const PUB_CHANNEL_ENENT = (eventName = "EASECALLKIT", data) => {
        if (channelEvents[eventName]) {
            channelEvents[eventName].length && channelEvents[eventName].forEach(fn => {
                fn(data)
            })
        }
    }
    const UN_SUB_CHANNEL_ENENT = (eventName = "EASECALLK") => {
        if (channelEvents[eventName]) {
            delete channelEvents[eventName]
        }
    }
    return {
        SUB_CHANNEL_EVENT,
        PUB_CHANNEL_ENENT,
        UN_SUB_CHANNEL_ENENT
    }
}