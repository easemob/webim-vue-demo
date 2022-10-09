/* 统一presence 结构体 */
import _ from 'lodash'
//处理statusDetails
const handleStatusDetails = (params) => {
    let resultArr = []
    if (_.isArray(params)) {
        resultArr = _.cloneDeep(params)
    }
    if (params.constructor == Object) {
        for (const key in params) {
            if (Object.hasOwnProperty.call(params, key)) {
                const status = params[key]
                resultArr.push({ device: key, status: status * 1 })
            }
        }
    }
    return resultArr
}
export default function (statusBody) {
    return {
        uid: statusBody.uid || statusBody.userId,
        expiry: statusBody.expiry || statusBody.expire,
        lastTime: statusBody.lastTime || statusBody.last_time,
        statusDetails: handleStatusDetails(
            statusBody.status || statusBody.statusDetails
        ),
        ext: statusBody.ext,
    }
}
