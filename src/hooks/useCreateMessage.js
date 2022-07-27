/* 构建消息体 */
import { messageType } from '@/constant';
const { ALL_MESSAGE_TYPE } = messageType;
//创建消息options
const createOptions = ({ msgType, msgOptions }) => {
  console.log('>>>msgType, msgOptions', msgType, msgOptions);
  let theMessageOptions = {
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
        console.log('onFileUploadError', error);
      },
      onFileUploadProgress: (progress) => {
        // 上传进度的回调。
        console.log(progress);
      },
      onFileUploadComplete: function (res) {
        // 消息上传成功。
        console.log('onFileUploadComplete', res);
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
      onFileUploadError: function () {
        // 消息上传失败。
        console.log('onFileUploadError');
      },
      onFileUploadProgress: function (progress) {
        // 上传进度的回调。
        console.log(progress);
      },
      onFileUploadComplete: function () {
        // 消息上传成功。
        console.log('onFileUploadComplete');
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
      onFileUploadError: function () {
        // 消息上传失败。
        console.log('onFileUploadError');
      },
      onFileUploadProgress: function (progress) {
        // 上传进度的回调。
        console.log(progress);
      },
      onFileUploadComplete: function () {
        // 消息上传成功。
        console.log('onFileUploadComplete');
      },
    },
  };
  let backMsgOptions = theMessageOptions[msgType];
  return backMsgOptions;
};
//构建消息发送后的body体
const createMsgBody = (msg) => {
  let pakerMsgBody = {
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
  };
  return pakerMsgBody[msg.type];
};
export default { createOptions, createMsgBody };
