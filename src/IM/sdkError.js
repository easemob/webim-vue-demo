export function sdkErrorToError(error) {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  if (error && typeof error === 'object') {
    const msg = error.message || `SDK 5.0 error code: ${error.code ?? 'unknown'}`;
    if (msg) {
      const e = new Error(String(msg));
      e.code = error.code;
      e.details = error.details;
      return e;
    }
  }
  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error(String(error));
  }
}
