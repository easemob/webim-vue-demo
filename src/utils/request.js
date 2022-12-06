import axios from 'axios'
const defaultBaseUrl = '//a1.easemob.com'
// create an axios instance
const service = axios.create({
    withCredentials: false,
    // baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
    baseURL: `${window.location.protocol}${defaultBaseUrl}`,
    // withCredentials: true, // send cookies when cross-domain requests
    timeout: 30000, // request timeout
    headers: { 'Content-Type': 'application/json' }
})
// request interceptor
service.interceptors.request.use(
    (config) => {
        // do something before request is sent
        return config
    },
    (error) => {
        // do something with request error
        console.log('request error', error) // for debug
        return Promise.reject(error)
    }
)

// response interceptor
service.interceptors.response.use(
    /**
     * If you want to get http information such as headers or status
     * Please return  response => response
     */

    /**
     * Determine the request status by custom code
     * Here is just an example
     * You can also judge the status by HTTP Status Code
     */
    (response) => {
        const res = response.data
        const code = response.status
        // if the custom code is not 20000, it is judged as an error.
        if (code >= 400) {
            return Promise.reject(new Error(res.desc || 'Error'))
        } else {
            return res
        }
    },
    (error) => {
        if (error.response) {
            const res = error.response.data // for debug
            if (error.response.status === 401 && res.code !== '001') {
                console.log('>>>>>无权限')
            }
            if (error.response.status === 403) {
                res.desc = '您没有权限进行查询和操作!'
            }
            return Promise.reject(res.desc || error)
        }
        return Promise.reject(error)
    }
)

export default service
