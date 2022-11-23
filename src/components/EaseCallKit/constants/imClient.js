let IMClient = null
let MsgCreateFn = null
const setImClient = (imclient, msgCreateFn) => {
    if (!imclient) throw 'imclient must pass!'
    if (!msgCreateFn) throw 'create message function must pass！'
    IMClient = imclient
    MsgCreateFn = msgCreateFn
}

export { IMClient, MsgCreateFn, setImClient }
