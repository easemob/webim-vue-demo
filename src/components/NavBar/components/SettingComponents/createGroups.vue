<script setup>
import { ref, reactive, computed, toRefs, onMounted, watch, defineProps, defineEmits } from 'vue'
import { useStore } from 'vuex'
import _ from 'lodash'
import { ElNotification } from 'element-plus'
import { useSDKErrorNotifi } from '@/hooks'
import EaseIM from '@/IM/initwebsdk'
import {
    Search,
    CircleCheckFilled
} from '@element-plus/icons-vue';
import defaultAvatar from '@/assets/images/avatar/theme2x.png'
const emit = defineEmits(['closeDialogVisible'])
const props = defineProps({
    dialogVisible: {
        type: Boolean,
        default: false
    }
})
const { dialogVisible } = toRefs(props)
const store = useStore()

let nextStep = ref(0) //下一步
let renderFriendList = ref([])
//选中人数统计
const checkedCount = computed(() => {
    return _.sumBy(renderFriendList.value, 'isChecked')
})
//选中人id数组
const checkedUserArr = computed(() => {
    let filtered = _.filter(renderFriendList.value, 'isChecked') //过滤后为选中的user list
    return _.map(filtered, 'name')
})
onMounted(() => {
    handleRenderFiendList()
})
/* 好友数据处理逻辑 */
//处理拉取到的好友列表数据（添加是否选中字段）
const friendList = computed(() => store.state.Contacts.friendList)
const handleRenderFiendList = () => {
    let newFriendList = []
    for (const key in friendList.value) {
        if (Object.hasOwnProperty.call(friendList.value, key)) {
            const v = friendList.value[key];
            newFriendList.push({ name: v.hxId, isChecked: false, keywords: v.hxId })
        }
    }
    return renderFriendList.value = newFriendList
}
/* 搜索逻辑 */
//创建用户搜索部分
let serachInputValue = ref('')
let isShowSearchContent = ref(false) //控制检索内容显隐
let searchResultList = ref([])
const searchFriend = () => {
    console.log('>>>>>serachInputValue.value ', serachInputValue.value === '')
    // if (serachInputValue.value === '') isShowSearchContent.value = false
    if (serachInputValue.value) {
        isShowSearchContent.value = true
        let resultArr = _.filter(renderFriendList.value, (v) => v.keywords.includes(serachInputValue.value))
        searchResultList.value = resultArr
        console.log('>>>>>>>执行搜索', resultArr)
    } else {
        return isShowSearchContent.value = false
    }


}


/* 创建群组form */
//创建群组群组所用参数
let groupCreateForm = reactive({
    groupname: "群名称...",
    desc: "群描述...",
    members: [],
    public: true,
    approval: true,
    allowinvites: true,
    inviteNeedConfirm: true,
    maxusers: 500
})
//监听关闭初始化form内容
watch(dialogVisible, (newVal) => {
    if (!newVal) {
        _.assign(groupCreateForm, sourceForm())
    }
})
const sourceForm = () => {
    return {
        groupname: "群名称...",
        desc: "群描述...",
        members: [],
        public: true,
        approval: true,
        allowinvites: true,
        inviteNeedConfirm: true,
        maxusers: 500
    }
}
//创建群组
const createNewGroups = async () => {
    console.log('checkedUserArrcheckedUserArr', checkedUserArr)
    groupCreateForm.members = checkedUserArr.value
    try {
        await EaseIM.conn.createGroup({ data: { ...groupCreateForm } })
        //更新群组列表
        await store.dispatch('fetchGroupList', {
            pageNum: 1,
            pageSize: 500
        })
        ElNotification({
            title: '群组操作',
            message: `${groupCreateForm.groupname}创建成功！`,
            type: 'success',
        })
        resetTheModalStatus()
    }
    catch (error) {
        if (error && error.type && error.message) {
            let errorDesc = JSON.parse(error.message)
            useSDKErrorNotifi(error.type, errorDesc.error_description)
            console.log('>>>errorDesc>>>', errorDesc)
        } else {
            console.log(error)
            useSDKErrorNotifi(null, '未知错误')
        }
    }

}

//重置创建群Modal
const resetTheModalStatus = () => {
    handleRenderFiendList()
    nextStep.value = 0
    serachInputValue.value = ''
    isShowSearchContent.value = false //控制检索内容显隐
    searchResultList.value = []
    emit('closeDialogVisible')
}
</script>
<template>
    <div class="app_container">
        <el-row v-if="nextStep === 0">
            <el-col class="search_friend_box">
                <el-input v-model="serachInputValue" style="height: 40px;" placeholder="搜索" @input="searchFriend"
                    :prefix-icon="Search">
                </el-input>
                <el-divider style="margin:12px 0;" />
                <div v-if="isShowSearchContent" class="search_friend_box_content">
                    <div v-for="(item, index) in searchResultList">
                        <div class="friend_user_list">
                            <div class="friend_user_list_left">
                                <el-avatar :src="defaultAvatar"></el-avatar>
                                <b class="friend_list_username">{{ item.name }}</b>
                            </div>
                            <el-icon class="checked_btn"
                                @click="searchResultList[index].isChecked = !searchResultList[index].isChecked">
                                <CircleCheckFilled v-if="item.isChecked" class="checked_icon" />
                                <span v-else class="unChecked_icon"></span>
                            </el-icon>
                        </div>
                        <el-divider style="margin:12px 0;" />
                    </div>

                </div>
            </el-col>
            <el-col class="create_modal_main">
                <div v-for="(item, index) in renderFriendList" :key="item.name + index">
                    <div class="friend_user_list">
                        <div class="friend_user_list_left">
                            <el-avatar :src="defaultAvatar"></el-avatar>
                            <b class="friend_list_username">{{ item.name }}</b>
                        </div>
                        <el-icon class="checked_btn"
                            @click="renderFriendList[index].isChecked = !renderFriendList[index].isChecked">
                            <CircleCheckFilled v-if="item.isChecked" class="checked_icon" />
                            <span v-else class="unChecked_icon"></span>
                        </el-icon>
                    </div>
                    <el-divider style="margin:12px 0;" />
                </div>

            </el-col>
            <el-col class="create_friend_footer">
                <span>{{ checkedCount }} 人被选中</span>
                <el-button plain @click="nextStep = 1">下一步</el-button>
            </el-col>
        </el-row>
        <el-row v-else>
            <el-form ref="groupCreate" :mode="groupCreateForm" label-width="100px" label-position="left"
                style="width:100%">
                <el-form-item label="群名称">
                    <el-input v-model="groupCreateForm.groupname" input-style="border-radius: 2px;" size="large" />
                </el-form-item>
                <el-form-item label="群详情">
                    <el-input v-model="groupCreateForm.desc" maxlength="300" :autosize="{ minRows: 1, maxRows: 4 }"
                        resize="none" placeholder="Please input" show-word-limit type="textarea" />
                </el-form-item>
                <el-form-item label="群人数">
                    <el-input v-model="groupCreateForm.maxusers" type="number" min="200" size="large" />
                </el-form-item>
                <el-form-item label="是否为公开群">
                    <el-switch v-model="groupCreateForm.public" active-color="#13ce66" inactive-color="#DCDFE5" />
                </el-form-item>
                <el-form-item label="加群是否需要审批">
                    <el-switch v-model="groupCreateForm.approval" active-color="#13ce66" inactive-color="#DCDFE5" />
                </el-form-item>
                <el-form-item v-if="!groupCreateForm.public" label="成员邀请他人入群">
                    <el-switch :disabled="groupCreateForm.public" v-model="groupCreateForm.allowinvites"
                        active-color="#13ce66" inactive-color="#DCDFE5" active-text="允许群成员邀请" inactive-text="仅限群主" />
                </el-form-item>
                <el-form-item label="被邀请人是否需要同意">
                    <el-switch v-model="groupCreateForm.inviteNeedConfirm" active-color="#13ce66"
                        inactive-color="#DCDFE5" inline-prompt active-text="是" inactive-text="否" />
                </el-form-item>
            </el-form>
            <el-row class="create_groups_btn" justify="space-around" align="middle">
                <el-col class="lastStep" :span="12" style="text-align:left">
                    <el-button @click="nextStep = 0">上一步</el-button>
                </el-col>
                <el-col class="lastStep" :span="12" style="text-align:right">
                    <el-button type="primary" @click="createNewGroups">创建群组</el-button>
                </el-col>
            </el-row>

        </el-row>

    </div>
</template>



<style lang="scss" scoped>
.search_friend_box {
    position: relative;

    .search_friend_box_content {
        position: absolute;
        left: 0;
        top: 50px;
        width: 100%;
        min-height: 290px;
        max-height: 80%;
        overflow-y: auto;
        background: #FFF;
        z-index: 99;
    }
}

.create_modal_main {
    max-height: 270px;
    overflow-y: auto;


}

.friend_user_list {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    .friend_user_list_left {
        display: flex;
        align-items: center;
        justify-content: center;

        .friend_list_username {
            margin-left: 10px;
            font-family: 'PingFang SC';
            font-style: normal;
            font-weight: 500;
            font-size: 14px;
            line-height: 20px;
            color: #333333;
        }
    }

    .checked_btn {
        width: 20px;
        height: 20px;
        cursor: pointer;

        .checked_icon {
            font-size: 20px;
            color: green;
        }

        .unChecked_icon {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #979797;
            border-radius: 50%;
        }

    }
}

.create_friend_footer {
    height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.create_groups_btn {
    width: 100%;
    height: 50px;

    display: flex;
    flex-direction: row;
    justify-content: space-between;

}
</style>