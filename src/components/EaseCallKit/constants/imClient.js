/**
 * 该常量实为暂存外层传入的实力化后的SDK客户端，以及msg 构建方法，供callkit内部进行调用。
 *  */
let IMClient = null
let MsgCreateFn = null
const _setImClient = (imclient, msgCreateFn) => {
    if (!imclient) throw 'imclient must pass!'
    if (!msgCreateFn) throw 'create message function must pass！'
    IMClient = imclient
    MsgCreateFn = msgCreateFn
}

export { IMClient, MsgCreateFn, _setImClient }
