import { getClient, requireManager } from '@/IM';
import { CALL_ACTIONS_TYPE, MSG_TYPE } from '../constants';

const chatManager = () => requireManager('chatManager');
const currentUserId = () => getClient().getCurrentUserId();
const currentClientResource = () => getClient().getClientResource();

export default class CallKitMessages {
  constructor() {
    this.action = 'rtcCall';
  }

  async sendText(targetId, content, ext) {
    const message = chatManager().createTextMessage({
      conversationId: targetId,
      conversationType: 'singleChat',
      needReadReceipt: true,
      content,
      ext,
    });
    return chatManager().sendMessage(message);
  }

  async sendCommand(targetId, ext) {
    const message = chatManager().createCmdMessage({
      conversationId: targetId,
      conversationType: 'singleChat',
      needReadReceipt: true,
      action: this.action,
      ext,
    });
    return chatManager().sendMessage(message);
  }

  sendInviteMsg(targetId, callType, channelInfos) {
    const { channelName, callId, inviteMsgContent, groupId } = channelInfos;
    const ext = {
      action: CALL_ACTIONS_TYPE.INVITE,
      channelName,
      type: callType,
      callerDevId: currentClientResource(),
      callId,
      ts: Date.now(),
      msgType: MSG_TYPE,
      callerIMName: currentUserId(),
    };
    if (callType === 2 && groupId) ext.ext = { groupId };
    return this.sendText(targetId, inviteMsgContent, ext);
  }

  sendConfirmRing({ status, targetId, sendBody }) {
    return this.sendCommand(targetId, {
      action: CALL_ACTIONS_TYPE.CONFIRM_RING,
      status,
      callerDevId: sendBody.callerDevId,
      calleeDevId: sendBody.calleeDevId,
      callId: sendBody.callId,
      ts: Date.now(),
      msgType: MSG_TYPE,
    });
  }

  sendVideoToVioce(targetId, callId) {
    return this.sendCommand(targetId, {
      action: CALL_ACTIONS_TYPE.VIDEO_TO_VOICE,
      callId,
      ts: Date.now(),
      msgType: MSG_TYPE,
    });
  }

  sendConfirmCallee({ targetId, sendBody }) {
    return this.sendCommand(targetId, {
      action: CALL_ACTIONS_TYPE.CONFIRM_CALLEE,
      result: sendBody.result,
      callerDevId: currentClientResource(),
      calleeDevId: sendBody.calleeDevId,
      callId: sendBody.callId,
      ts: Date.now(),
      msgType: MSG_TYPE,
    });
  }

  sendAlertMsg({ sender, ext }) {
    return this.sendCommand(sender.userId, {
      action: CALL_ACTIONS_TYPE.ALERT,
      calleeDevId: currentClientResource(),
      callerDevId: ext.callerDevId,
      callId: ext.callId,
      ts: Date.now(),
      msgType: MSG_TYPE,
    });
  }

  sendAnswerMsg({ targetId, sendBody }, answerType) {
    return this.sendCommand(targetId, {
      action: CALL_ACTIONS_TYPE.ANSWER,
      result: answerType,
      callerDevId: sendBody.callerDevId,
      calleeDevId: currentClientResource(),
      callId: sendBody.callId,
      ts: Date.now(),
      msgType: MSG_TYPE,
    });
  }

  sendCannelMsg({ targetId, callId }) {
    return this.sendCommand(targetId, {
      action: CALL_ACTIONS_TYPE.CANCEL,
      callerDevId: currentClientResource(),
      callId: callId || '',
      ts: Date.now(),
      msgType: MSG_TYPE,
    });
  }
}
