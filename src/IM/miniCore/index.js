//MiniCore
import MiniCore from 'easemob-websdk/miniCore/miniCore'
import * as contactPlugin from 'easemob-websdk/contact/contact'
import * as groupPlugin from 'easemob-websdk/group/group'
import * as presencePlugin from 'easemob-websdk/presence/presence'
import * as localCachePlugin from 'easemob-websdk/localCache/localCache'
import {
    DEFAULT_EASEMOB_APPKEY,
    DEFAULT_EASEMOB_SOCKET_URL,
    DEFAULT_EASEMOB_REST_URL
} from '../config'
let miniCore = {}
miniCore = new MiniCore({
    appKey: DEFAULT_EASEMOB_APPKEY
})
if (Object.keys(miniCore).length) {
    //注册插件
    miniCore.usePlugin(contactPlugin)
    miniCore.usePlugin(groupPlugin)
    miniCore.usePlugin(presencePlugin)
    miniCore.usePlugin(localCachePlugin)
    console.log('>>>>>IM 插件已注册', miniCore)
}
export default miniCore
