export function logChatroomActionResult(scope, action, params, result) {
  console.groupCollapsed(`[ChatroomAction:${scope}] SDK 5.0 request completed: ${action}`);
  console.log('params:', params);
  console.log('result:', result);
  console.groupEnd();
}
