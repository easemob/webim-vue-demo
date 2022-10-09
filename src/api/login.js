import request from '@/utils/request'

//获取用户登陆token
export function fetchUserLoginToken(params){
    return request({
        url:'/inside/app/user/login',
        method:'post',
        data:params
    })
} 