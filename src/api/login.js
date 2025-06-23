import request from '@/utils/request';

//获取用户登陆token
// export function fetchUserLoginToken(params) {
//     return request({
//         url: '/inside/app/user/login',
//         method: 'post',
//         data: params
//     })
// }

//新获取用户登录token
// export function fetchUserLoginToken(params) {
//     return request({
//         url: '/inside/app/user/login/V1',
//         method: 'post',
//         data: params
//     })
// }
//新获取用户登录token v2
export function fetchUserLoginToken(params) {
  return request({
    url: '/inside/app/user/login/V2',
    method: 'post',
    data: params,
  });
}
//新获取短信验证码
export function fetchUserLoginSmsCode(params) {
  const { phoneNumber, captchaVerifyParam } = params;
  return request({
    //http://a1-hsb.easemob.com/inside/app/sms/send/v2
    url: `/inside/app/sms/send/v2`,
    method: 'post',
    data: {
      phoneNumber,
      captchaVerifyParam,
    },
  });
}
