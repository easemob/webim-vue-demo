import request from '@/utils/request'

//重置密码第一步（请求修改密码权限权限）
export function requestModifyPwd(params) {
    return request({
        url: '/inside/app/user/reset/password',
        method: 'post',
        data: params
    })
}

//重置密码第二步（上传修改后的新密码）
export function updateNewPasswrod(params) {
    const { userId, newPassword } = params
    return request({
        url: `/inside/app/user/${userId}/password`,
        method: 'put',
        data: {newPassword}
    })
}