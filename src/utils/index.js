export function renderTime(time) {
    var t = new Date(parseInt(time));
    var Y = t.getFullYear();
    var M = t.getMonth() + 1 < 10 ? '0' + (t.getMonth() + 1) : t.getMonth() + 1;
    var D = t.getDate() < 10 ? '0' + t.getDate() : t.getDate();
    var H = t.getHours() < 10 ? '0' + t.getHours() : t.getHours();
    var F = t.getMinutes() < 10 ? '0' + t.getMinutes() : t.getMinutes();
    var S = t.getSeconds() < 10 ? '0' + t.getSeconds() : t.getSeconds();
    return `${M}-${D} ${H}:${F}`;
}

export function readablizeBytes(value) {
    let s = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let e = Math.floor(Math.log(value) / Math.log(1024));
    return (value / Math.pow(1024, Math.floor(e))).toFixed(2) + ' ' + s[e];
}