export default (value) => {
  //文件Size转换
  let s = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let e = Math.floor(Math.log(value) / Math.log(1024));
  return (value / Math.pow(1024, Math.floor(e))).toFixed(2) + ' ' + s[e];
};
