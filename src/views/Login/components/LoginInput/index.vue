<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { EMClient } from '@/IM'
import { handleSDKErrorNotifi } from '@/utils/handleSomeData'
import { fetchUserLoginSmsCode, fetchUserLoginToken } from '@/api/login'
import { useStore } from 'vuex'
import { usePlayRing } from '@/hooks'
const store = useStore()
const loginValue = reactive({
    phoneNumber: '',
    smsCode: ''
})
const buttonLoading = ref(false)
//根据登陆初始化一部分状态
const loginState = computed(() => store.state.loginState)
watch(loginState, (newVal) => {
    if (newVal) {
        buttonLoading.value = false
        loginValue.phoneNumber = ''
        loginValue.smsCode = ''
    }
})
const rules = reactive({
    phoneNumber: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        {
            pattern: /^1[3-9]\d{9}$/,
            message: '请输入正确的手机号',
            trigger: ['blur', 'change']
        }
    ],
    smsCode: [
        {
            required: true,
            message: '请输入短信验证码',
            trigger: ['blur', 'change']
        }
    ]
})
//登陆接口调用
const loginIM = async () => {
    const { clickRing } = usePlayRing()
    clickRing()
    buttonLoading.value = true
    /* SDK 登陆的方式 */
    // try {
    //   let { accessToken } = await EMClient.open({
    //     user: loginValue.username.toLowerCase(),
    //     pwd: loginValue.password.toLowerCase(),
    //   });
    //   window.localStorage.setItem(`EASEIM_loginUser`, JSON.stringify({ user: loginValue.username, accessToken: accessToken }))
    // } catch (error) {
    //
    //   const { data: { extraInfo } } = error
    //   handleSDKErrorNotifi(error.type, extraInfo.errDesc);
    //   loginValue.username = '';
    //   loginValue.username = '';
    // }
    // finally {
    //   buttonLoading.value = false;
    // }
    /*  !环信后台接口登陆（仅供环信线上demo使用！） */
    const params = {
        phoneNumber: loginValue.phoneNumber.toString(),
        smsCode: loginValue.smsCode.toString()
    }
    try {
        const res = await fetchUserLoginToken(params)
        if (res?.code === 200) {
            EMClient.open({
                username: res.chatUserName.toLowerCase(),
                accessToken: res.token
            })
            window.localStorage.setItem(
                'EASEIM_loginUser',
                JSON.stringify({
                    user: res.chatUserName.toLowerCase(),
                    accessToken: res.token
                })
            )
        }
    } catch (error) {
        if (error.response?.data) {
            const { code, errorInfo } = error.response.data
            if (errorInfo.includes('does not exist.')) {
                ElMessage({
                    center: true,
                    message: `用户${loginValue.username}不存在！`,
                    type: 'error'
                })
            } else {
                handleSDKErrorNotifi(code, errorInfo)
            }
        }
    } finally {
        buttonLoading.value = false
    }
}
/* 短信验证码相关 */
const isSenedAuthCode = ref(false)
const authCodeNextCansendTime = ref(60)
const sendMessageAuthCode = async () => {
    const phoneNumber = loginValue.phoneNumber
    try {
        await fetchUserLoginSmsCode(phoneNumber)
        ElMessage({
            type: 'success',
            message: '验证码获取成功！',
            center: true
        })
        startCountDown()
    } catch (error) {
        ElMessage({ type: 'error', message: '验证码获取失败！', center: true })
    }
}
const startCountDown = () => {
    isSenedAuthCode.value = true
    let timer = null
    timer = setInterval(() => {
        if (
            authCodeNextCansendTime.value <= 60 &&
            authCodeNextCansendTime.value > 0
        ) {
            authCodeNextCansendTime.value--
        } else {
            clearInterval(timer)
            timer = null
            authCodeNextCansendTime.value = 60
            isSenedAuthCode.value = false
        }
    }, 1000)
}
</script>

<template>
    <el-form :model="loginValue" :rules="rules">
        <el-form-item prop="phoneNumber">
            <el-input
                class="login_input_style"
                v-model="loginValue.phoneNumber"
                placeholder="手机号"
                clearable
            />
        </el-form-item>
        <el-form-item prop="smsCode">
            <el-input
                class="login_input_style"
                v-model="loginValue.smsCode"
                placeholder="请输入短信验证码"
            >
                <template #append>
                    <el-button
                        type="primary"
                        :disabled="loginValue.phoneNumber && isSenedAuthCode"
                        @click="sendMessageAuthCode"
                        v-text="
                            isSenedAuthCode
                                ? `${authCodeNextCansendTime}S`
                                : '获取验证码'
                        "
                    ></el-button>
                </template>
            </el-input>
        </el-form-item>
        <el-form-item>
            <div class="function_button_box">
                <el-button
                    v-if="loginValue.phoneNumber && loginValue.smsCode"
                    class="haveValueBtn"
                    :loading="buttonLoading"
                    @click="loginIM"
                    >登录</el-button
                >
                <el-button v-else class="notValueBtn">登录</el-button>
            </div>
        </el-form-item>
    </el-form>
</template>

<style lang="scss" scoped>
.login_input_style {
    margin: 10px 0;
    width: 400px;
    height: 50px;
    padding: 0 16px;
}

::v-deep .el-input__inner {
    padding: 0 20px;
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 1.75px;
    color: #3a3a3a;

    &::placeholder {
        font-family: 'PingFang SC';
        font-style: normal;
        font-weight: 400;
        font-size: 14px;
        line-height: 20px;
        /* identical to box height */
        letter-spacing: 1.75px;
        color: #cccccc;
    }
}

::v-deep .el-input__suffix-inner {
    font-size: 20px;
    margin-right: 15px;
}

::v-deep .el-form-item__error {
    margin-left: 16px;
}

::v-deep .el-input-group__append {
    background: linear-gradient(90deg, #04aef0 0%, #5a5dd0 100%);
    width: 60px;
    color: #fff;
    border: none;
    font-weight: 400;

    button {
        font-weight: 300;
    }
}

.login_text {
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 17px;
    text-align: right;

    .login_text_isuserid {
        display: inline-block;
        // width: 100px;
        color: #f9f9f9;
    }

    .login_text_tologin {
        margin-right: 20px;
        width: 80px;
        color: #05b5f1;
        cursor: pointer;

        &:hover {
            text-decoration: underline;
        }
    }
}

.function_button_box {
    margin-top: 10px;
    width: 400px;

    button {
        margin: 10px;
        width: 380px;
        height: 50px;
        border-radius: 57px;
    }

    .haveValueBtn {
        background: linear-gradient(90deg, #04aef0 0%, #5a5dd0 100%);
        border: none;
        font-weight: 300;
        font-size: 17px;
        color: #f4f4f4;

        &:active {
            background: linear-gradient(90deg, #0b83b2 0%, #363df4 100%);
        }
    }

    .notValueBtn {
        border: none;
        font-weight: 300;
        font-size: 17px;
        background: #000000;
        mix-blend-mode: normal;
        opacity: 0.3;
        color: #ffffff;
        cursor: not-allowed;
    }
}
</style>
