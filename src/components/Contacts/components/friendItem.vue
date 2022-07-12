<script setup>
import { ref, toRaw, toRefs, computed } from 'vue'
import { useStore } from "vuex"
import router from '@/router'
import { messageType } from '@/constant'
/* 默认头像 */
import defaultAvatar from '@/assets/images/avatar/theme2x.png'
/* store */
const store = useStore()

//处理friendList进行分类处理
const classifyFriendList = computed(() => store.state.Contacts.sortedFriendList)
//点击对应联系人跳转至用户详情页
const { CHAT_TYPE } = messageType
const toContacts = ({ id, chatType }) => {
    router.push({ path: '/chat/contacts/contactInfo', query: { id: id, chatType: chatType } })
}
</script>

<template>
    <div class="friendItem_container">
        <div v-for="(friendName, friendItemKey, index) in  classifyFriendList" :key="friendItemKey">
            <el-collapse class="friendItem_container_list" accordion>
                <el-collapse-item :title="friendItemKey === ' ' ? '#' : friendItemKey.toUpperCase()">
                    <el-row>
                        <el-col class="friendItem_box" :span="24" v-for="item in friendName" :key="item.hxId"
                            @click="toContacts({ id: item.hxId, chatType: CHAT_TYPE.SINGLE })">
                            <el-avatar style="margin-right: 10px;"
                                :src="item.avatarurl ? item.avatarurl : defaultAvatar"></el-avatar>
                            {{ item.nickname ? item.nickname : item.hxId }}
                        </el-col>
                    </el-row>
                </el-collapse-item>
            </el-collapse>
        </div>
    </div>
</template>



<style lang="scss" scoped>
::v-deep .el-collapse {
    border: none;
    padding: 0 15px;
}

.friendItem_box {
    height: 80px;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    // background: #000;
    padding: 0 15px;
    background: #EFEFEF;

    &:active {
        background: #DCDCDC;
    }
}
</style>