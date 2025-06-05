export default function parseDownloadResponse(response) {
  return (response && response.type && response.type === 'application/json') ||
    0 > Object.prototype.toString.call(response).indexOf('Blob')
    ? this.url + '?token='
    : window.URL.createObjectURL(response);
}
