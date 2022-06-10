import { messageType } from '@/constant';
const { ALL_MESSAGE_TYPE } = messageType;
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
  };
  let backMsgOptions = theMessageOptions[msgType];
  return backMsgOptions;
};
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
  };
  return pakerMsgBody[msg.type];
};
export default { createOptions, createMsgBody };
