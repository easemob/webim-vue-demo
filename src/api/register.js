import request from '@/utils/request'

//生成图片验证码
export function createImageCode(params){
    return request({
        url:'/inside/app/image',
        method:'get',
        params:params
    })
}  

//发送短信请求
export function fetchAuthCode(params){
    return request({
        url:'/inside/app/sms/send',
        method:'post',
        data:params
    })
}

//注册用户
export function registerUser(params){
    return request({
        url:'/inside/app/user/register',
        method:'post',
        data:params
    })
}
