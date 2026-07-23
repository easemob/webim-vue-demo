export const DEFAULT_GROUP_MEMBERS_PAGE_SIZE = 50;

export function normalizeFetchedGroupMembers(members = []) {
  return members.map((item) => ({
    userId: item.user?.userId,
    role: item.role,
    joinedAt: item.joinedAt,
  }));
}

export function buildCreateGroupPayload(form = {}) {
  const maxMembers = Number(form.maxusers);
  const payload = {
    name: form.groupname?.trim(),
    description: form.desc?.trim() || '',
    public: Boolean(form.public),
    joinApprovalRequired: Boolean(form.approval),
    allowInvites: Boolean(form.allowinvites),
    inviteNeedConfirm: Boolean(form.inviteNeedConfirm),
    maxMembers:
      Number.isFinite(maxMembers) && maxMembers > 0
        ? maxMembers
        : 200,
  };

  if (Array.isArray(form.members) && form.members.length > 0) {
    payload.memberIds = form.members;
  }
  if (form.avatar !== undefined) payload.avatar = String(form.avatar).trim();
  if (form.ext !== undefined) payload.ext = String(form.ext);

  return payload;
}

export function getNextJoinedGroupsPage(joinedGroup = {}) {
  const pageNum = Number(joinedGroup?.pagingParams?.pageNum || 0);
  return pageNum > 0 ? pageNum : 0;
}

export function buildModifyGroupPayload(params = {}) {
  const payload = {
    groupId: params.groupId,
  };
  const fieldMap = {
    name: 'name',
    description: 'description',
    avatar: 'avatar',
    ext: 'ext',
  };

  Object.entries(fieldMap).forEach(([sourceKey, targetKey]) => {
    if (Object.prototype.hasOwnProperty.call(params, sourceKey)) {
      payload[targetKey] =
        typeof params[sourceKey] === 'string'
          ? params[sourceKey].trim()
          : params[sourceKey];
    }
  });

  return payload;
}

export function normalizeGroupSharedFileList(response = {}) {
  const source = Array.isArray(response?.items) ? response.items : [];
  return source.map((item) => ({
    fileId: item.fileId,
    fileName: item.fileName,
    fileSize: item.fileSize,
    createdAt: item.createdAt,
    fileOwner: item.fileOwner,
  }));
}
