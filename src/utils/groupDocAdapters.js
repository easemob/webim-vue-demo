export const DEFAULT_GROUP_MEMBERS_PAGE_SIZE = 50;

export function normalizeFetchedGroupMembers(members = []) {
  return members.map((item) => {
    const normalized = {
      userId: item.user?.userId,
      role: item.role,
      joinedTime: item.joinedAt,
    };

    if (item.role === 'owner') {
      normalized.owner = item.user?.userId;
    } else {
      normalized.member = item.user?.userId;
    }

    return normalized;
  });
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
  const source = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.entities)
    ? response.entities
    : [];

  return source.map((item) => {
    const fileId = item.fileId || item.file_id || item.id || '';
    return {
      fileId,
      fileName: item.fileName || item.filename || item.name || fileId,
      fileSize: item.fileSize ?? item.file_size ?? item.size ?? 0,
      created: item.created ?? item.createdAt ?? item.create_time ?? '',
      owner: item.owner || item.uploader || item.user || '',
      secret: item.secret || item.fileSecret || item.secretKey || '',
      raw: item,
    };
  });
}
