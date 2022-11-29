import { reactive } from 'vue'
import {
    CALLKIT_EVENT_CODE,
    CALLKIT_EVENT_TYPE,
} from '../constants/callKitEvent'
const channelEvents = reactive({})
const EVENT_NAME = 'EASECALLKIT'
const EVENT_LEVEL = {
    0: 'SUCCESS',
    1: 'WARNING',
    2: 'FAIL',
    3: 'INFO',
}
export default function useChannelEvent() {
    const SUB_CHANNEL_EVENT = (eventName = 'EASECALLKIT', fn) => {
        if (channelEvents[eventName]) {
            channelEvents[eventName].push(fn)
        } else {
            channelEvents[eventName] = []
            channelEvents[eventName].push(fn)
        }
    }
    const PUB_CHANNEL_EVENT = (eventName = 'EASECALLKIT', data) => {
    /**
     *  const eventParams = {
     *                  type: Object,对外抛出type类别
     *                  ext: Object,对外抛出事件内容
     *                  callType: number,音视频会话类型
     *                  eventHxId: string 事件定义来源
     *               }
     */
        if (channelEvents[eventName]) {
            channelEvents[eventName].length &&
        channelEvents[eventName].forEach((fn) => {
            fn(data)
        })
        }
    }
    const UN_SUB_CHANNEL_ENENT = (eventName = 'EASECALLK') => {
        if (channelEvents[eventName]) {
            delete channelEvents[eventName]
        }
    }
    return {
        EVENT_NAME,
        EVENT_LEVEL,
        CALLKIT_EVENT_CODE,
        CALLKIT_EVENT_TYPE,
        SUB_CHANNEL_EVENT,
        PUB_CHANNEL_EVENT,
        UN_SUB_CHANNEL_ENENT,
    }
}
