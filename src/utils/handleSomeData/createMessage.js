/* 构建消息体 */
import { messageType } from '@/constant'
const { ALL_MESSAGE_TYPE } = messageType
//创建消息options
const createOptions = ({ msgType, msgOptions }, errorCallback) => {
    console.log('>>>msgType, msgOptions', msgType, msgOptions)
    const theMessageOptions = {
        [ALL_MESSAGE_TYPE.TEXT]: {
            chatType: msgOptions.chatType, // 会话类型，设置为单聊。
            type: msgType, // 消息类型。
            to: msgOptions.id, // 消息接收方（用户 ID)。
            msg: msgOptions.msg, // 消息内容。
            ext: msgOptions.ext,
        },
        [ALL_MESSAGE_TYPE.IMAGE]: {
            chatType: msgOptions.chatType, // 会话类型，设置为单聊。
            type: msgType, // 消息类型，设置为图片。
            to: msgOptions.id, // 消息接收方（用户 ID)。
            file: msgOptions.file,
            width: msgOptions.width || 0,
            height: msgOptions.height || 0,
            ext: msgOptions.ext || {},
            url: '',
            thumb: '',
            secret: '',
            onFileUploadError: (error) => {
                // 消息上传失败。
                errorCallback(error)
                console.log('onFileUploadError', error)

                //TO DO 4.10.0版本修复上传文件失败不从error中抛出问题
            },
            onFileUploadProgress: (progress) => {
                // 上传进度的回调。
                console.log(progress)
            },
            onFileUploadComplete: function (res) {
                // 消息上传成功。
                console.log('onFileUploadComplete', res)
            },
        },
        [ALL_MESSAGE_TYPE.FILE]: {
            chatType: msgOptions.chatType, // 会话类型，设置为单聊。
            type: msgType, // 消息类型，设置为文件。
            to: msgOptions.id, // 消息接收方（用户 ID)。
            file: msgOptions.file,
            filename: msgOptions.file && msgOptions.file.filename,
            ext:
        {
            file_length: msgOptions.file && msgOptions.file.size,
            ...msgOptions.ext,
        } || {},
            onFileUploadError: function (error) {
                errorCallback(error)
                console.log('>>>>>onFileUploadError>>>>>')
                // console.log('onFileUploadError');
                // 消息上传失败。

            },
            onFileUploadProgress: function (progress) {
                // 上传进度的回调。
                console.log(progress)
            },
            onFileUploadComplete: function () {
                // 消息上传成功。
                console.log('onFileUploadComplete')
            },
        },
        [ALL_MESSAGE_TYPE.AUDIO]: {
            chatType: msgOptions.chatType, // 会话类型，设置为单聊。
            type: msgType, // 消息类型，设置语音。
            to: msgOptions.id, // 消息接收方（用户 ID)。
            file: msgOptions.file,
            filename: msgOptions.file && msgOptions.file.filename,
            length: msgOptions.length || 0,
            ext:
        {
            ...msgOptions.ext,
        } || {},
            onFileUploadError: function (error) {
                // 消息上传失败。
                errorCallback(error)
                console.log('onFileUploadError')
            },
            onFileUploadProgress: function (progress) {
                // 上传进度的回调。
                console.log(progress)
            },
            onFileUploadComplete: function () {
                // 消息上传成功。
                console.log('onFileUploadComplete')
            },
        },
        [ALL_MESSAGE_TYPE.CUSTOM]: {
            chatType: msgOptions.chatType,
            type: msgType,
            to: msgOptions.id, // 接收消息对象（用户 ID）
            customEvent: msgOptions.customEvent, // 自定义事件。
            customExts: msgOptions.customExts, // 消息内容，key/value 需要 string 类型。
            ext: msgOptions.ext, // 消息扩展。
        },
    }
    const backMsgOptions = theMessageOptions[msgType]
    return backMsgOptions
}
//构建消息发送后的body体
const createMsgBody = (msg) => {
    const pakerMsgBody = {
        [ALL_MESSAGE_TYPE.TEXT]: {
            chatType: msg.chatType,
            type: msg.type,
            ext: msg.ext || {},
            from: msg.from || '',
            id: msg.id,
            msg: msg.msg,
            time: msg.time,
            to: msg.to,
        },
        [ALL_MESSAGE_TYPE.IMAGE]: {
            chatType: msg.chatType,
            type: msg.type,
            file: msg.file,
            secret: msg.secret,
            thumb: msg.thumb,
            url: msg.url,
            ext: msg.ext || {},
            from: msg.from || '',
            to: msg.to,
            id: msg.id,
            height: msg.height,
            width: msg.width,
            time: msg.time,
        },
        [ALL_MESSAGE_TYPE.FILE]: {
            chatType: msg.chatType,
            type: msg.type,
            ext: msg.ext || {},
            from: msg.from || '',
            id: msg.id,
            time: msg.time,
            to: msg.to,
            url: msg.url,
            filename: msg.filename,
            file_length: msg.ext && msg.ext.file_length,
        },
        [ALL_MESSAGE_TYPE.AUDIO]: {
            chatType: msg.chatType,
            type: msg.type,
            ext: msg.ext || {},
            from: msg.from || '',
            id: msg.id,
            time: msg.time,
            to: msg.to,
            url: msg.url,
            length: msg.length,
            filename: msg.filename,
        },
        [ALL_MESSAGE_TYPE.CUSTOM]: {
            chatType: msg.chatType,
            type: msg.type,
            ext: msg.ext || {},
            from: msg.from || '',
            id: msg.id,
            customEvent: msg.customEvent,
            customExts: { ...msg.customExts },
            time: msg.time,
            to: msg.to,
        },
    }
    return pakerMsgBody[msg.type]
}
export default { createOptions, createMsgBody }
