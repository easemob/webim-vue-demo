function logSdk5Error(action, error, context = {}) {
  console.error(`[SDK 5.0] ${action} failed`, {
    action,
    context,
    error,
  });
}

function getSdk5ErrorMessage(error) {
  return error?.message || error?.details?.message || String(error);
}

module.exports = { getSdk5ErrorMessage, logSdk5Error };
