<script setup>
import { ref, toRefs, toRaw } from 'vue'
import { CircleClose } from '@element-plus/icons-vue';
import defaultAvatar from '@/assets/images/avatar/theme2x.png'
const props = defineProps({
    groupModalTitle: {
        type: Object,
        default: () => ({ title: '', type: 0 })
    }
})
const { groupModalTitle } = toRefs(props)
const groupDetail = ref(
    {
        notice: "这是一条群公告至多展示两行，超过两行展示点点点这是一条群公告至多展示两行超过两行展示点点点这是一条群公告至多展示超过两行展示点点点这是一条群公告至多展示超过两行展示点点点这是一条群公告至多展示",
        groupName: "群名称aaaaa",
        introduce: "暂时没有群介绍",
        service: {
            labelName: ["购车人姓名", "购车人手机号", "城市", "订单号", "车辆VIN码"],
            labelValue: { "购车人姓名": "carName", "购车人手机号": "carPhone", "城市": "address", "订单号": "number", "车辆VIN码": "carNumber" },
            data: { carName: "孙XX", carPhone: "18888888888", address: "上海", number: "1234567890", carNumber: "1234567890" },
            remarks: "服务备注"
        },
        notDisturb: false
    }
)

const groupList = ref([
    { name: "小丽", avatr: "", customer: null, id: 1, disabled: false },
    { name: "小红", avatr: "", customer: null, id: 2, disabled: false },
    { name: "小明", avatr: "", customer: null, id: 3, disabled: false },
    { name: "小花", avatr: "", customer: null, id: 4, disabled: false },
    { name: "小黄", avatr: "", customer: null, id: 5, disabled: false },
    { name: "小绿", avatr: "", customer: null, id: 6, disabled: false },
    { name: "嗯呢", avatr: "", customer: null, id: 6, disabled: false },
    { name: "侧测", avatr: "", customer: null, id: 6, disabled: false },
    { name: "小绿", avatr: "", customer: null, id: 6, disabled: false },
    { name: "小绿", avatr: "", customer: null, id: 6, disabled: false },
    { name: "小绿", avatr: "", customer: null, id: 6, disabled: false },
    { name: "小绿", avatr: "", customer: null, id: 6, disabled: false },
    { name: "小绿", avatr: "", customer: null, id: 6, disabled: false },
    { name: "小绿", avatr: "", customer: null, id: 6, disabled: false },
    { name: "小绿", avatr: "", customer: null, id: 6, disabled: false },
    { name: "小绿", avatr: "", customer: null, id: 6, disabled: false },
    { name: "小绿", avatr: "", customer: null, id: 6, disabled: false },
    { name: "小绿", avatr: "", customer: null, id: 6, disabled: false },
    { name: "小蓝", avatr: "", customer: null, id: 7, disabled: false }
])
const tabooList = ref([])
// 禁言
const tabooOpen = () => {
    tabooDialog.value = true;
}
const chooseTaboo = (val) => {
    let obj = { ...toRaw(val) };
    // 置灰单选框
    groupList.value[_.findIndex(groupList.value, { 'id': obj.id })].disabled = true;
    if (tabooList.value.some(item => item.id == obj.id)) {
        let findIndex = _.findIndex(tabooList.value, { 'id': obj.id });
        tabooList.value[findIndex] = obj;
    }
    else {
        tabooList.value.push(obj)
    }
}
const delChoose = (val) => {
    let obj = { ...toRaw(val) };
    // 删除选中的项
    tabooList.value.splice(_.findIndex(tabooList.value, { 'id': obj.id }), 1);
    // 恢复置灰的单选框
    groupList.value[_.findIndex(groupList.value, { 'id': obj.id })].disabled = false;
}
const cancelTaboo = (val) => {
    tabooDialog.value = false;
}
const saveTaboo = (val) => {
    tabooDialog.value = false;
    console.log(tabooList)
}
</script>
<template>
    <div class="taboo_box">
        <div class="taboo_left">
            <div class="taboo_title">所有群成员({{ groupList.length }})</div>
            <div class="group_list_box">
                <div class="list_item" v-for="(item, index) in groupList" :key="index">
                    <el-checkbox @change="chooseTaboo(item)" v-model="item.disabled" :disabled="item.disabled">
                    </el-checkbox>
                    <el-avatar class="avatr" :src="defaultAvatar"></el-avatar>
                    <div class="text">
                        <span class="top">{{ item.name }}</span>
                        <span class="bottom">{{ item.customer == "1" ? "服务人员" : "客户" }}</span>
                    </div>
                    <!-- <div class="operation">
                    <el-radio-group @change="chooseTaboo(item)" v-model="item.customer" class="ml-4">
                      <el-radio :disabled="item.disabled" label="1" size="small"></el-radio>
                    </el-radio-group>
                </div> -->
                </div>
            </div>
        </div>
        <div class="taboo_right">
            <p class="taboo_title">已禁言({{ tabooList.length }})位成员</p>
            <div class="result_list_box">
                <div class="result_item" v-for="(item, index) in tabooList" :key="index">
                    <el-avatar class="avatr" :src="defaultAvatar"></el-avatar>
                    <div class="text">
                        <span class="top">{{ item.name }}</span>
                        <span class="bottom">{{ item.customer == "1" ? "服务人员" : "客户" }}</span>
                    </div>
                    <span @click="delChoose(item)" class="icon_close">
                        <CircleClose />
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>


<style lang="scss" scoped>
// 禁言
.taboo_box {
    // padding-top: 20px;
    // padding-bottom: 0;
    display: flex;
}

.taboo_title {
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: -0.01px;
    color: #303133;
    margin-bottom: 26px;
}

.taboo_left {
    flex: 5;
    max-height: 466px;
    min-height: 266px;
    overflow: auto;
    border-right: 1px solid #DCDFE6;

    .tip {
        font-family: 'PingFang SC';
        font-style: normal;
        font-weight: 400;
        font-size: 12px;
        line-height: 20px;
        color: #3488FF;
        margin-top: 8px;
        margin-bottom: 23px;
    }

    .list_item {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        margin-bottom: 14px;

        .text {
            display: flex;
            flex-direction: column;
            margin-left: 14px;
            width: 70%;

            .top {
                font-family: 'PingFang SC';
                font-style: normal;
                font-weight: 500;
                font-size: 14px;
                line-height: 22px;
                color: #303133;
            }

            .bottom {
                font-family: 'PingFang SC';
                font-style: normal;
                font-weight: 400;
                font-size: 12px;
                line-height: 18px;
                color: #606266;
            }
        }

        .avatr {
            width: 40px;
        }

        .el-checkbox {
            margin-right: 12px;
        }
    }

    .content {
        margin-bottom: 8px;

        >span {
            vertical-align: middle;
            margin-right: 12px;
        }

        .name {
            font-family: 'PingFang SC';
            font-style: normal;
            font-weight: 500;
            font-size: 14px;
            line-height: 22px;
            color: #303133;
        }
    }
}

.taboo_right {
    flex: 4;
    max-height: 466px;
    min-height: 266px;
    overflow: auto;
    padding-left: 16px;

    .result_list_box {
        // margin-top: 25px;
    }

    .result_item {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        margin-bottom: 14px;

        .text {
            display: flex;
            flex-direction: column;
            margin-left: 14px;
            width: 70%;

            .top {
                font-family: 'PingFang SC';
                font-style: normal;
                font-weight: 500;
                font-size: 14px;
                line-height: 22px;
                color: #303133;
            }

            .bottom {
                font-family: 'PingFang SC';
                font-style: normal;
                font-weight: 400;
                font-size: 12px;
                line-height: 18px;
                color: #606266;
            }
        }

        .avatr {
            width: 40px;
        }

        .icon_close {
            width: 20px;
        }
    }
}
</style>