export const isThreadRouteQuery = (value) => value === true || value === 'true';

export const getThreadIdFromResponse = (response) => response.chatThreadId;
