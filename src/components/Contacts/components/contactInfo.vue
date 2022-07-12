<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import router from '@/router'
import { useRoute } from "vue-router"
import { ArrowLeft } from '@element-plus/icons-vue'
import { messageType } from '@/constant'
/* 单人头像 */
import defaultSingleAvatar from '@/assets/images/avatar/theme2x.png'
import defaultGroupAvatarUrl from '@/assets/images/avatar/jiaqun2x.png';
/* store */
const store = useStore()
/* router */

/* route */
const route = useRoute()

const { CHAT_TYPE } = messageType
console.log('route', route.query)

const nowContactInfo = computed(() => {
    if (route.query.chatType === CHAT_TYPE.SINGLE) {
        return store.state.Contacts.friendList[route.query.id]
    }
    if (route.query.chatType === CHAT_TYPE.GROUP) {
        return store.state.Contacts.groupList[route.query.id]
    }
})
console.log('>>>>nowContactInfo', nowContactInfo.value)
</script>

<template>
    <div class="app_container">
        <el-header class="contactInfo_header">
            <el-page-header style="margin-top: 12px;" :icon="ArrowLeft" @click="$router.back(-1)" />
            <el-divider />
        </el-header>
        <el-main class="contactInfo_main">
            <div class="contactInfo_main_card">
                <div class="contactInfo_box">
                    <div class="avatar">
                        <el-avatar class="avatar_img" v-if="$route.query.chatType === CHAT_TYPE.SINGLE"
                            :src="nowContactInfo.avatarurl ? nowContactInfo.avatarurl : defaultSingleAvatar">
                        </el-avatar>
                        <el-avatar v-if="$route.query.chatType === CHAT_TYPE.GROUP" :src="defaultGroupAvatarUrl">
                        </el-avatar>
                    </div>
                    <div class="name">
                        <p v-if="$route.query.chatType === CHAT_TYPE.SINGLE">
                            {{ nowContactInfo.nickname ? nowContactInfo.nickname : nowContactInfo.hxId }}</p>
                    </div>
                    <div class="func_box">
                        <div class="single_func">
                            <div class="add_black_list">
                                <p>加入黑名单</p>
                                <el-switch />
                            </div>
                            <el-divider />
                            <div class="del_friend">
                                <span>删除好友</span>
                            </div>
                        </div>

                    </div>

                </div>
                <div class="contaactInfo_btn">
                    <el-button type="primary" size="large">发起会话</el-button>
                </div>
            </div>
        </el-main>
    </div>



</template>


<style lang="scss" scoped>
.app_container {
    background: #F1F2F4;
    height: 100%;
    border-radius: 0 5px 5px 0;
    overflow: hidden;

    .contactInfo_header {
        display: flex;
        flex-direction: column;
        height: 60px;
        line-height: 60px;
    }

    .contactInfo_main {
        height: 100%;

        .contactInfo_main_card {
            width: 100%;
            height: 90%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            margin: 0 auto;
            border-radius: 5px;
            transition: all 0.5s;

            &:hover {
                background: #fff;
                box-shadow: 12px 12px 2px 1px rgba(125, 125, 126, 0.068);

            }

            .contactInfo_box {
                width: 80%;
                min-height: 500px;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                align-items: center;

                .avatar>.avatar_img {
                    width: 80px;
                    height: 80px;
                }

                .name {
                    margin-top: 15px;
                    font-size: 22px;
                }

                .func_box {
                    width: 100%;

                    .single_func {
                        height: 100px;
                        // background: #000;
                        margin-top: 25px;
                        cursor: pointer;

                        .add_black_list {
                            display: flex;
                            flex-direction: row;
                            align-items: center;
                            justify-content: space-between;
                            font-size: 16px;
                        }

                        .del_friend {

                            color: red;
                            transition: all 0.3s;

                            p {
                                font-size: 16px;

                            }


                        }
                    }
                }

            }

            .contaactInfo_btn {

                width: 80%;
                text-align: center;
            }
        }
    }
}

//干掉原有样式里面的竖线
::v-deep .el-page-header__left::after {
    width: 0px !important;
}
</style>