const MAX_DIRECTED_MESSAGE_RECEIVERS = 21;

function normalizeIds(values = []) {
  return values
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, MAX_DIRECTED_MESSAGE_RECEIVERS);
}

function getMemberUserId(member) {
  if (!member || typeof member !== 'object') return '';
  return String(member.user?.userId || '').trim();
}

function getDefaultDirectedReceivers(options = {}) {
  const {
    currentUserId = '',
    existingReceivers = [],
    members = [],
  } = options;

  const normalizedExisting = normalizeIds(existingReceivers);
  if (normalizedExisting.length > 0) {
    return normalizedExisting;
  }

  const current = String(currentUserId || '').trim();
  const receivers = [];
  const seen = new Set();

  for (const member of members) {
    const userId = getMemberUserId(member);
    if (!userId || userId === current || seen.has(userId)) {
      continue;
    }
    seen.add(userId);
    receivers.push(userId);
    if (receivers.length >= MAX_DIRECTED_MESSAGE_RECEIVERS) {
      break;
    }
  }

  return receivers;
}

module.exports = {
  getDefaultDirectedReceivers,
};

module.exports.default = module.exports;
