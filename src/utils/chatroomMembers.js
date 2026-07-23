function normalizeChatroomMember(item) {
  if (!item || typeof item !== 'object') return null;
  const userId = String(item.user?.userId || '').trim();
  if (!userId) return null;
  return {
    ...item,
    userId,
    role: item.role,
  };
}

function normalizeChatroomMembers(list = []) {
  return list.map(normalizeChatroomMember).filter(Boolean);
}

module.exports = {
  normalizeChatroomMember,
  normalizeChatroomMembers,
};

module.exports.default = module.exports;
