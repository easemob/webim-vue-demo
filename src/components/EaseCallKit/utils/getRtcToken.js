export default function (EaseIMConn, payload) {
    const { username, channelName } = payload
    const myHeaders = new Headers()
    myHeaders.append('authorization', `Bearer ${EaseIMConn.context.accessToken}`)
    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    }
    return new Promise(function (resolve, reject) {
        fetch(`${EaseIMConn.apiUrl}/token/rtcToken/v1?userAccount=${username}&channelName=${channelName}&appkey=${window.encodeURIComponent(EaseIMConn.appKey)}`, requestOptions)
            .then(response => response.text())
            .then(result => {
                console.log('result', JSON.parse(result))
                resolve(JSON.parse(result))
            })
            .catch(error => {
                reject(error)
                console.log('error', error)
            })
    })

}